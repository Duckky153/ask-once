/*
 * Ask Once rules: pure functions, no DOM, no network, no storage, no clock.
 * The same input always gives the same output.
 *
 * This file has no imports or exports on purpose: browsers refuse to load ES
 * modules from a page opened straight from disk, so both pages load it as a
 * plain script, and Node loads it as a module for the tests. Either way it
 * registers one object, globalThis.AskOnce.
 */
(function (root) {
  'use strict';

  // ------------------------------------------------------------------ settings
  // Every number here is a guess that real inbox history would replace.
  const SETTINGS = Object.freeze({
    minPageScore: 2,       // a help page needs at least this many matched phrases...
    minLead: 1,            // ...and at least this many more than the next-best page
    minTopicScore: 2,      // an email joins a watched question at this many phrases
    minRepeatAccounts: 3,  // a watched question becomes a repeat at this many accounts
    callNowMaxMinutes: 60, // "in N minutes" counts as urgent up to this N
  });

  // Lanes in the order they are checked. The first one that fires decides.
  const LANES = Object.freeze([
    { id: 'call_now', label: 'Call now', person: true, hold: true,
      rule: `If the email says a proceeding is live now, starts within ${SETTINGS.callNowMaxMinutes} minutes, or is this morning and something has failed, a person calls instead of emailing.` },
    { id: 'money', label: 'Person: money', person: true, hold: true,
      rule: 'Refunds, charges, cancellations and double billing go to the person who handles billing.' },
    { id: 'confidential', label: 'Person: confidential', person: true, hold: true,
      rule: 'Sealed or confidential proceedings, and requests to delete audio or data, always get a person.' },
    { id: 'record', label: 'Person: record', person: true, hold: true,
      rule: 'Anything about a certified or filed transcript, missing audio or a deleted job goes to a person.' },
    { id: 'trust', label: 'Person: trust', person: true, hold: true,
      rule: 'An upset customer, such as one who lost a client or is thinking of switching, gets a reply a person writes.' },
    { id: 'draft', label: 'Draft ready', person: false, hold: false,
      rule: `If no hold rule fired and one help page matches at least ${SETTINGS.minPageScore} phrases and beats every other page by at least ${SETTINGS.minLead}, it drafts a reply from that page.` },
    { id: 'repeat', label: 'Repeat, no page yet', person: false, hold: false,
      rule: `If no page matches well enough but ${SETTINGS.minRepeatAccounts} or more different accounts asked the same watched question, it is flagged as a page worth writing.` },
    { id: 'unclear', label: 'Person: unclear', person: true, hold: false,
      rule: 'Everything else goes to a person, including ties and weak matches.' },
  ]);
  const LANE_BY_ID = Object.freeze(Object.fromEntries(LANES.map((l) => [l.id, l])));
  const HOLD_ORDER = Object.freeze(LANES.filter((l) => l.hold).map((l) => l.id));

  // Phrase lists for the four "Person" hold rules. Matched as whole words.
  const HOLD_PHRASES = Object.freeze({
    money: Object.freeze(['refund', 'refunded', 'chargeback', 'charge on our card', 'charge on my card', 'dispute it', 'dispute the charge', 'cancel', 'cancelled', 'canceled', 'cancellation', 'billed twice', 'charged twice', 'double billed', 'double charged', 'overcharged', 'invoice dispute']),
    confidential: Object.freeze(['sealed', 'under seal', 'confidential hearing', 'confidential proceeding', 'hipaa', 'protective order', 'delete my audio', 'delete the audio', 'delete my data', 'delete our data', 'delete all audio']),
    record: Object.freeze(['certified transcript', 'certified copy', 'filed with the court', 'audio is missing', 'missing audio', 'audio is gone', 'was deleted', 'got deleted', 'job deleted', 'deleted job', 'wrong in the final', 'final transcript is wrong']),
    trust: Object.freeze(['thinking of switching', 'switching to something else', 'switching to another', 'unacceptable', 'not acceptable', 'lost a client', 'losing clients', 'cancel everything', 'fed up', 'last straw']),
  });

  // Signals for "Call now".
  const CALL_NOW = Object.freeze({
    livePhrases: Object.freeze(['on the record now', 'on the record right now', 'witness is on the stand', 'witness is waiting', 'judge is waiting']),
    proceedings: Object.freeze(['deposition', 'depo', 'hearing', 'trial', 'session', 'proceeding', 'arbitration']),
    failures: Object.freeze(['crashed', 'crashes', 'won\'t start', 'won\'t open', 'won\'t load', 'not working', 'isn\'t working', 'stopped', 'froze', 'frozen', 'dropped', 'error', 'can\'t connect', 'failed', 'keeps closing']),
  });
  const NUMBER_WORDS = Object.freeze({
    'a few': 5, five: 5, ten: 10, fifteen: 15, twenty: 20, 'twenty five': 25,
    thirty: 30, 'forty five': 45, forty: 40, fifty: 50, sixty: 60,
  });
  const MINUTES_RE = /\bin (\d{1,3}|a few|five|ten|fifteen|twenty five|twenty|thirty|forty five|forty|fifty|sixty) (minutes|minute|mins|min)\b/g;
  // "in an hour" and "in half an hour" count as 60 and 30 minutes.
  const HOUR_RE = /\bin (half an|an|one|1) hour\b/;

  // ------------------------------------------------------------------ text

  // Lowercase, straighten quotes, turn punctuation and hyphens into spaces,
  // keep apostrophes inside words ("won't"), and pad with spaces so phrases
  // can be matched as whole words.
  function normalize(text) {
    const cleaned = String(text == null ? '' : text)
      .toLowerCase()
      .replace(/[‘’ʼ]/g, '\'')
      .replace(/[^a-z0-9']+/g, ' ')
      .replace(/(^|\s)'+|'+(?=\s|$)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned ? ' ' + cleaned + ' ' : ' ';
  }

  function findPhrases(normText, phrases) {
    const found = [];
    for (const phrase of phrases) {
      const p = normalize(phrase);
      if (p.trim() && normText.includes(p) && !found.includes(phrase)) found.push(phrase);
    }
    return found;
  }

  // First "in N minutes" with N up to the limit, or null.
  function minutesAway(normText, maxMinutes = SETTINGS.callNowMaxMinutes) {
    MINUTES_RE.lastIndex = 0;
    let match;
    while ((match = MINUTES_RE.exec(normText)) !== null) {
      const raw = match[1];
      const minutes = /^\d+$/.test(raw) ? Number(raw) : NUMBER_WORDS[raw];
      if (minutes <= maxMinutes) return { phrase: match[0].trim(), minutes };
    }
    const hour = HOUR_RE.exec(normText);
    if (hour) {
      const minutes = hour[1] === 'half an' ? 30 : 60;
      if (minutes <= maxMinutes) return { phrase: hour[0].trim(), minutes };
    }
    return null;
  }

  function callNowSignals(normText, settings = SETTINGS) {
    const signals = [];
    const soon = minutesAway(normText, settings.callNowMaxMinutes);
    if (soon) signals.push(soon.phrase);
    signals.push(...findPhrases(normText, CALL_NOW.livePhrases));
    if (normText.includes(' this morning ')) {
      const proceeding = findPhrases(normText, CALL_NOW.proceedings)[0];
      const failure = findPhrases(normText, CALL_NOW.failures)[0];
      if (proceeding && failure) signals.push(`this morning + ${proceeding} + ${failure}`);
    }
    return signals;
  }

  function holdSignals(normText, settings = SETTINGS) {
    return {
      call_now: callNowSignals(normText, settings),
      money: findPhrases(normText, HOLD_PHRASES.money),
      confidential: findPhrases(normText, HOLD_PHRASES.confidential),
      record: findPhrases(normText, HOLD_PHRASES.record),
      trust: findPhrases(normText, HOLD_PHRASES.trust),
    };
  }

  // Every page with its matched phrases, best first. Ties keep page order.
  function scorePages(normText, pages) {
    return pages
      .map((page, index) => {
        const phrases = findPhrases(normText, page.phrases);
        return { id: page.id, title: page.title, score: phrases.length, phrases, index };
      })
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(({ index, ...rest }) => rest);
  }

  function topicTags(normText, topics, settings = SETTINGS) {
    return topics
      .map((topic) => ({ id: topic.id, title: topic.title, phrases: findPhrases(normText, topic.phrases) }))
      .filter((t) => t.phrases.length >= settings.minTopicScore);
  }

  function emailText(email) {
    return normalize(`${email.subject}. ${email.body}`);
  }

  const plural = (n, word, many = word + 's') => `${n} ${n === 1 ? word : many}`;

  // ------------------------------------------------------------------ classify

  // Classifies a whole inbox. Repeats need the inbox, because they count how
  // many different accounts asked the same watched question.
  function classifyInbox(emails, pages, topics, settings = SETTINGS) {
    const prepared = emails.map((email) => {
      const text = emailText(email);
      return { email, text, tags: topicTags(text, topics, settings) };
    });

    const accountsByTopic = new Map(topics.map((t) => [t.id, new Set()]));
    for (const p of prepared) for (const tag of p.tags) accountsByTopic.get(tag.id).add(p.email.account);

    return prepared.map((p) => classifyPrepared(p, accountsByTopic, pages, settings));
  }

  function classifyPrepared({ email, text, tags }, accountsByTopic, pages, settings) {
    const holds = holdSignals(text, settings);
    const scores = scorePages(text, pages);
    const first = scores[0] || { id: null, title: '', score: 0, phrases: [] };
    const second = scores[1] || { id: null, title: '', score: 0, phrases: [] };
    const lead = first.score - second.score;
    const pageStrong = first.score >= settings.minPageScore && lead >= settings.minLead;

    const watched = tags
      .map((t) => ({ ...t, accounts: accountsByTopic.get(t.id).size }))
      .sort((a, b) => b.accounts - a.accounts || a.title.localeCompare(b.title));
    const repeatTopic = watched.find((t) => t.accounts >= settings.minRepeatAccounts) || null;

    // Every rule that fired, in check order.
    const fired = [];
    for (const lane of HOLD_ORDER) {
      if (holds[lane].length) fired.push({ lane, text: `${LANE_BY_ID[lane].label}: ${holds[lane].map((x) => `"${x}"`).join(', ')}` });
    }
    if (pageStrong) {
      fired.push({ lane: 'draft', text: `Help page "${first.title}": ${plural(first.score, 'phrase')} (next best ${second.score})` });
    } else if (first.score >= settings.minPageScore) {
      fired.push({ lane: 'unclear', text: `Help pages too close: "${first.title}" ${first.score}, "${second.title}" ${second.score}` });
    }
    for (const t of watched) {
      fired.push({
        lane: t.accounts >= settings.minRepeatAccounts ? 'repeat' : 'watch',
        text: `Watched question "${t.title}": asked by ${plural(t.accounts, 'account')}`,
      });
    }

    const holdLane = HOLD_ORDER.find((lane) => holds[lane].length) || null;
    let lane;
    let reason;
    let unclearKind = null;

    if (holdLane) {
      lane = holdLane;
      reason = holdReason(holdLane, holds[holdLane][0]);
    } else if (pageStrong) {
      lane = 'draft';
      reason = `The help page "${first.title}" matched ${plural(first.score, 'phrase')} and no other page matched more than ${second.score}, so it drafts a reply from that page.`;
    } else if (first.score < settings.minPageScore && repeatTopic) {
      lane = 'repeat';
      const others = repeatTopic.accounts - 1;
      reason = `No help page matched well enough, and ${plural(others, 'other account')} asked about "${repeatTopic.title}" in this period, so it's a page worth writing.`;
    } else {
      lane = 'unclear';
      if (first.score >= settings.minPageScore && lead === 0) {
        unclearKind = 'tie';
        reason = `Two help pages, "${first.title}" and "${second.title}", matched ${first.score} phrases each, so a person picks the right answer.`;
      } else if (first.score >= settings.minPageScore) {
        unclearKind = 'narrow';
        reason = `"${first.title}" led the next page by only ${plural(lead, 'phrase')}, less than the ${settings.minLead} needed, so a person decides.`;
      } else if (watched.length) {
        unclearKind = 'watched';
        const t = watched[0];
        reason = `It matches the watched question "${t.title}", but only ${plural(t.accounts, 'account')} asked it, so it isn't a repeat yet.`;
      } else if (first.score > 0) {
        unclearKind = 'weak';
        reason = `The best help page matched only ${plural(first.score, 'phrase')}, below the minimum of ${settings.minPageScore}, so a person reads it.`;
      } else {
        unclearKind = 'none';
        reason = 'No help page or watched question matched, so a person reads it.';
      }
    }

    // Put the deciding rule first in the fired list.
    const decidingIndex = fired.findIndex((f) => f.lane === lane);
    if (decidingIndex > 0) fired.unshift(fired.splice(decidingIndex, 1)[0]);

    const matched = [];
    for (const l of HOLD_ORDER) for (const x of holds[l]) matched.push(x);
    for (const x of first.phrases) matched.push(x);
    for (const t of watched) for (const x of t.phrases) matched.push(x);

    return {
      id: email.id,
      account: email.account,
      lane,
      laneLabel: LANE_BY_ID[lane].label,
      person: LANE_BY_ID[lane].person,
      reason,
      unclearKind,
      fired,
      holds,
      matched: Array.from(new Set(matched)),
      topScores: [first, second].map((s) => ({ id: s.id, title: s.title, score: s.score, phrases: s.phrases.slice() })),
      page: lane === 'draft' ? first.id : null,
      topic: lane === 'repeat' ? { id: repeatTopic.id, title: repeatTopic.title, accounts: repeatTopic.accounts } : null,
      watched: watched.map((t) => ({ id: t.id, title: t.title, accounts: t.accounts, phrases: t.phrases.slice() })),
    };
  }

  function holdReason(lane, phrase) {
    switch (lane) {
      case 'call_now': return `It says "${phrase}", so the reporter may be in the middle of a proceeding and needs a phone call, not an email.`;
      case 'money': return `It mentions "${phrase}", and anything about money goes to the person who handles billing.`;
      case 'confidential': return `It mentions "${phrase}", and confidential proceedings and deletion requests always get a person.`;
      case 'record': return `It mentions "${phrase}", and anything touching a filed or final record goes to a person.`;
      case 'trust': return `It mentions "${phrase}", so a person writes this reply instead of a template.`;
      default: throw new Error(`Unknown hold lane ${lane}`);
    }
  }

  // ------------------------------------------------------------------ replies

  const SIGN_OFF = 'Thanks,\nSupport team';

  const ACKS = Object.freeze({
    call_now: 'Calling you at the number on your account now; if you miss us, reply with the best number.',
    money: 'I\'ve passed this to the person who handles billing, and they\'ll reply to you directly.',
    confidential: 'A person, not an automated reply, will confirm this in writing.',
    record: 'A person is looking into this. So they can go straight to the right spot, could you reply with the job name, and the page and line if it\'s about a specific passage?',
    repeat: 'We don\'t have a written guide for this yet, so a person will reply to you directly.',
    unclear: 'A person will read this and reply to you directly.',
  });

  function wordCount(text) {
    return String(text).split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  }

  // What goes back to the customer. Nothing is ever sent by this code.
  function buildReply(email, result, pages) {
    const greeting = `Hi ${email.from_first_name},`;
    if (result.lane === 'draft') {
      const page = pages.find((p) => p.id === result.page);
      if (!page) throw new Error(`No page ${result.page}`);
      const steps = page.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
      const text = [
        greeting,
        page.answer,
        steps,
        `Full guide: ${page.title} (#${page.id})`,
        'If step 2 doesn\'t match what you see, reply here and a person will take it.',
        SIGN_OFF,
      ].join('\n\n');
      return { kind: 'draft', heading: 'Drafted reply for a person to check and send', text, words: wordCount(text) };
    }
    if (result.lane === 'trust') {
      return { kind: 'person', heading: 'A person writes this one.', text: '', words: 0 };
    }
    const text = [greeting, ACKS[result.lane], SIGN_OFF].join('\n\n');
    const heading = result.lane === 'call_now'
      ? 'Holding note, sent while a person calls'
      : 'Holding note, so the customer knows a person has it';
    return { kind: 'ack', heading, text, words: wordCount(text) };
  }

  // ------------------------------------------------------------------ summaries

  function summarize(results) {
    const counts = Object.fromEntries(LANES.map((l) => [l.id, 0]));
    for (const r of results) counts[r.lane] += 1;
    const person = LANES.filter((l) => l.person).reduce((sum, l) => sum + counts[l.id], 0);
    return { total: results.length, counts, draft: counts.draft, repeat: counts.repeat, callNow: counts.call_now, person };
  }

  function resultSentence(summary) {
    const s = summary;
    return `Of ${s.total} emails, ${s.draft} get a drafted reply from an existing help page, ${s.person} go to a person (${s.callNow} need a call now), and ${s.repeat} repeat a question no page answers yet.`;
  }

  function agreement(emails, results) {
    const disagreements = [];
    emails.forEach((email, i) => {
      const r = results[i];
      if (r.id !== email.id) throw new Error('results are not in email order');
      if (email.hand_label !== r.lane) {
        disagreements.push({
          id: email.id,
          hand: email.hand_label,
          computed: r.lane,
          saferDirection: LANE_BY_ID[r.lane].person && !LANE_BY_ID[email.hand_label].person,
        });
      }
    });
    return { total: emails.length, agree: emails.length - disagreements.length, disagreements };
  }

  // Watched questions with the emails that matched them, repeats first,
  // ranked by the number of different accounts asking (not raw emails).
  function findClusters(emails, results, topics, settings = SETTINGS) {
    const byId = new Map(emails.map((e) => [e.id, e]));
    const all = topics.map((topic) => {
      const matches = results.filter((r) => r.watched.some((w) => w.id === topic.id)).map((r) => byId.get(r.id));
      const accounts = Array.from(new Set(matches.map((e) => e.account))).sort();
      const roles = Array.from(new Set(matches.map((e) => e.role))).sort();
      // Two examples from different accounts where possible, earliest first.
      const examples = [];
      for (const e of matches) {
        if (examples.length < 2 && !examples.some((x) => x.account === e.account)) examples.push(e);
      }
      for (const e of matches) if (examples.length < 2 && !examples.includes(e)) examples.push(e);
      return {
        topic,
        emailIds: matches.map((e) => e.id),
        accounts,
        roles,
        examples,
        isRepeat: accounts.length >= settings.minRepeatAccounts,
      };
    }).filter((c) => c.emailIds.length > 0);

    const rank = (a, b) => b.accounts.length - a.accounts.length || b.emailIds.length - a.emailIds.length || a.topic.title.localeCompare(b.topic.title);
    return {
      repeats: all.filter((c) => c.isRepeat).sort(rank),
      watching: all.filter((c) => !c.isRepeat).sort(rank),
    };
  }

  // A watched question's outline, treated as if it were a published help page.
  function pageFromTopic(topic) {
    if (!topic.outline) throw new Error(`${topic.id} has no outline`);
    return {
      id: 'new-' + topic.id.replace(/^topic-/, ''),
      title: topic.outline.title,
      audience: topic.outline.audience,
      answer: topic.outline.answer,
      steps: topic.outline.steps.slice(),
      phrases: topic.phrases.slice(),
      proposed: true,
    };
  }

  // Reruns the rules as if the chosen outlines were real pages.
  function whatIf(emails, pages, topics, enabledTopicIds, settings = SETTINGS) {
    const base = classifyInbox(emails, pages, topics, settings);
    const added = topics.filter((t) => t.outline && enabledTopicIds.includes(t.id)).map(pageFromTopic);
    const next = classifyInbox(emails, pages.concat(added), topics, settings);
    const moved = [];
    const lost = [];
    next.forEach((r, i) => {
      if (r.lane === 'draft' && base[i].lane !== 'draft') moved.push({ id: r.id, from: base[i].lane, page: r.page });
      if (base[i].lane === 'draft' && r.lane !== 'draft') lost.push({ id: r.id, to: r.lane });
    });
    let sentence;
    if (!added.length) {
      sentence = 'Turn on "Pretend this page exists" for a question to see how many emails would get a drafted reply.';
    } else {
      const which = added.length === 1 ? 'this page' : `these ${added.length} pages`;
      sentence = `With ${which}, ${moved.length} more of the ${emails.length} emails get a drafted reply.`;
    }
    return { added, base, next, moved, lost, sentence };
  }

  // ------------------------------------------------------------------ edge cases

  // Six named checks on hand-made emails, run against the real pages and topics.
  function edgeCases(data, settings = SETTINGS) {
    const { helpPages: pages, watchTopics: topics } = data;
    const mk = (id, account, subject, body) => ({ id, account, from_first_name: 'Test', role: 'reporter', received: '2026-09-25T12:00', subject, body, hand_label: 'unclear' });
    const one = (email) => classifyInbox([email], pages, topics, settings)[0];
    const out = [];

    {
      const r = one(mk('t1', 'T01', 'Plan change', 'I moved to the hourly plan last week. Where do I see my audio hours, and can I get a refund for the monthly days I didn\'t use?'));
      const pageMatched = r.topScores[0].score >= settings.minPageScore;
      out.push({
        id: 'refund-with-page',
        name: 'A refund request that also matches a help page still goes to a person',
        pass: r.lane === 'money' && pageMatched,
        detail: `"${r.topScores[0].title}" matched ${plural(r.topScores[0].score, 'phrase')}, but the lane is ${r.laneLabel}.`,
      });
    }
    {
      const later = one(mk('t2a', 'T02', 'Tomorrow', 'My deposition is tomorrow at 9 and capture won\'t start in the test run.'));
      const soon = one(mk('t2b', 'T02', 'Soon', 'My deposition starts in 20 minutes and capture won\'t start.'));
      out.push({
        id: 'tomorrow-vs-minutes',
        name: '"Tomorrow" is not Call now, but "in 20 minutes" is',
        pass: later.lane !== 'call_now' && soon.lane === 'call_now',
        detail: `"Tomorrow at 9" went to ${later.laneLabel}; "starts in 20 minutes" went to ${soon.laneLabel}.`,
      });
    }
    {
      const r = one(mk('t3', 'T03', 'Offline after update', 'After I installed the update, offline mode is greyed out. Did the new version reset virtualization?'));
      const [a, b] = r.topScores;
      out.push({
        id: 'two-page-tie',
        name: 'A tie between two help pages goes to a person',
        pass: r.lane === 'unclear' && a.score === b.score && a.score >= settings.minPageScore,
        detail: `"${a.title}" ${a.score} and "${b.title}" ${b.score}; lane ${r.laneLabel}.`,
      });
    }
    {
      const body = 'Does the app work with a foot pedal for playback?';
      const same = [mk('t4a', 'T04', 'Pedal', body), mk('t4b', 'T04', 'Pedal again', body), mk('t4c', 'T04', 'Pedal, third time', body)];
      const alone = classifyInbox(same, pages, topics, settings);
      const withOthers = classifyInbox(same.concat([mk('t4d', 'T05', 'Pedal', body), mk('t4e', 'T06', 'Pedal', body)]), pages, topics, settings);
      out.push({
        id: 'one-account-three-times',
        name: 'One account asking the same question 3 times does not make a repeat',
        pass: alone.every((r) => r.lane === 'unclear') && withOthers[0].lane === 'repeat',
        detail: `3 emails from one account: ${alone.map((r) => r.laneLabel).join(', ')}. Add 2 other accounts and it becomes ${withOthers[0].laneLabel}.`,
      });
    }
    {
      const r = one(mk('t5', 'T07', 'Sealed hearing export', 'This was a sealed hearing. Can I export the transcript to RTF without anything leaving my laptop?'));
      out.push({
        id: 'confidential-with-export',
        name: 'A confidential request that matches the export page still goes to a person',
        pass: r.lane === 'confidential' && r.topScores[0].id === 'page-5' && r.topScores[0].score >= settings.minPageScore,
        detail: `"${r.topScores[0].title}" matched ${plural(r.topScores[0].score, 'phrase')}, but the lane is ${r.laneLabel}.`,
      });
    }
    {
      const r = one(mk('t6', 'T08', 'Colors', 'Is there a dark theme for late nights?'));
      out.push({
        id: 'no-match-no-repeat',
        name: 'An email with no page match and no repeat goes to unclear',
        pass: r.lane === 'unclear' && r.unclearKind === 'none',
        detail: `Lane ${r.laneLabel}: ${r.reason}`,
      });
    }
    return out;
  }

  // ------------------------------------------------------------------ dates

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // "2026-09-14T08:12" -> "Mon 14 Sep, 8:12 AM". No time zones involved.
  function formatReceived(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(iso);
    if (!m) throw new Error(`Bad timestamp ${iso}`);
    const [, y, mo, d, h, mi] = m.map(Number);
    const day = DAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
    const hour12 = ((h + 11) % 12) + 1;
    return `${day} ${d} ${MONTHS[mo - 1]}, ${hour12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  }

  root.AskOnce = Object.freeze({
    SETTINGS,
    LANES,
    LANE_BY_ID,
    HOLD_ORDER,
    HOLD_PHRASES,
    CALL_NOW,
    ACKS,
    normalize,
    findPhrases,
    minutesAway,
    callNowSignals,
    holdSignals,
    scorePages,
    topicTags,
    classifyInbox,
    buildReply,
    wordCount,
    summarize,
    resultSentence,
    agreement,
    findClusters,
    pageFromTopic,
    whatIf,
    edgeCases,
    formatReceived,
  });
})(globalThis);
