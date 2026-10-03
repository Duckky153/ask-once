// Plain Node tests for Ask Once. Run from the sample folder:
//   node tests/run-tests.mjs
// No packages needed (Node 18 or newer).
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
await import(new URL('../data.js', import.meta.url).href);
await import(new URL('../rules.mjs', import.meta.url).href);

const A = globalThis.AskOnce;
const D = globalThis.ASK_ONCE_DATA;
const clone = (x) => JSON.parse(JSON.stringify(x));
const run = (emails = D.emails, pages = D.helpPages, topics = D.watchTopics) => A.classifyInbox(emails, pages, topics);
const mk = (id, account, body, subject = 'Question') => ({
  id, account, from_first_name: 'Test', role: 'reporter', received: '2026-09-20T12:00', subject, body, hand_label: 'unclear',
});
const one = (body, subject) => run([mk('x1', 'X01', body, subject)])[0];
const LANE_IDS = A.LANES.map((l) => l.id);
const sentences = (text) => text.split(/(?<=[.?!])\s+(?=[A-Z])/).filter(Boolean);

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// ------------------------------------------------------------ data shape

test('8 help pages with the fields the spec asks for', () => {
  assert.equal(D.helpPages.length, 8);
  const audiences = new Set(['reporter', 'transcriber', 'agency admin', 'attorney viewer']);
  D.helpPages.forEach((p, i) => {
    assert.equal(p.id, `page-${i + 1}`);
    assert.ok(p.title && p.answer, p.id);
    assert.equal(sentences(p.summary).length, 2, `${p.id} summary should be two sentences`);
    assert.equal(sentences(p.answer).length, 1, `${p.id} answer should be one sentence`);
    assert.ok(p.steps.length >= 3 && p.steps.length <= 5, `${p.id} steps`);
    assert.ok(p.phrases.length >= 3, `${p.id} phrases`);
    for (const a of p.audience) assert.ok(audiences.has(a), `${p.id} audience ${a}`);
  });
});

test('20 accounts named Account 01 to Account 20 with a type and a plan', () => {
  assert.equal(D.accounts.length, 20);
  D.accounts.forEach((a, i) => {
    assert.equal(a.name, `Account ${String(i + 1).padStart(2, '0')}`);
    assert.ok(['freelance reporter', 'transcriber', 'agency'].includes(a.type), a.id);
    assert.ok(['monthly', 'hourly'].includes(a.plan), a.id);
  });
});

test('60 emails, unique ids, known accounts, in time order inside the period', () => {
  assert.equal(D.emails.length, 60);
  assert.equal(new Set(D.emails.map((e) => e.id)).size, 60);
  const accounts = new Set(D.accounts.map((a) => a.id));
  let last = '';
  for (const e of D.emails) {
    for (const f of ['id', 'account', 'from_first_name', 'role', 'received', 'subject', 'body', 'hand_label']) assert.ok(e[f], `${e.id} ${f}`);
    assert.ok(accounts.has(e.account), `${e.id} account`);
    assert.ok(LANE_IDS.includes(e.hand_label), `${e.id} hand_label`);
    const day = e.received.slice(0, 10);
    assert.ok(day >= D.period.start && day <= D.period.end, `${e.id} date`);
    assert.ok(e.received > last, `${e.id} order`);
    last = e.received;
    const n = sentences(e.body).length;
    assert.ok(n >= 2 && n <= 4, `${e.id} body has ${n} sentences`);
  }
});

test('hand labels follow the intended mix', () => {
  const count = (lane) => D.emails.filter((e) => e.hand_label === lane).length;
  assert.deepEqual(
    Object.fromEntries(LANE_IDS.map((l) => [l, count(l)])),
    { call_now: 6, money: 4, confidential: 2, record: 3, trust: 2, draft: 24, repeat: 14, unclear: 5 },
  );
});

test('one account sends the same unanswered question three times', () => {
  const pedal = D.emails.filter((e) => /pedal/i.test(e.body));
  assert.equal(pedal.length, 3);
  assert.equal(new Set(pedal.map((e) => e.account)).size, 1);
});

// ------------------------------------------------------------ whole inbox

const results = run();
const summary = A.summarize(results);

test('computed lane counts', () => {
  assert.deepEqual(summary.counts, { call_now: 6, money: 5, confidential: 2, record: 3, trust: 2, draft: 23, repeat: 14, unclear: 5 });
  assert.equal(summary.person, 23);
  assert.equal(summary.draft + summary.person + summary.repeat, 60);
});

test('the result sentence is computed from the data', () => {
  assert.equal(
    A.resultSentence(summary),
    'Of 60 emails, 23 get a drafted reply from an existing help page, 23 go to a person (6 need a call now), and 14 repeat a question no page answers yet.',
  );
  const changed = A.summarize(run(D.emails.slice(0, 30)));
  assert.match(A.resultSentence(changed), /^Of 30 emails, /);
});

test('59 of 60 agree with the hand labels, and the one miss errs toward a person', () => {
  const ag = A.agreement(D.emails, results);
  assert.equal(ag.agree, 59);
  assert.deepEqual(ag.disagreements, [{ id: 'm41', hand: 'draft', computed: 'money', saferDirection: true }]);
});

test('all six named edge cases pass', () => {
  const cases = A.edgeCases(D);
  assert.equal(cases.length, 6);
  for (const c of cases) assert.equal(c.pass, true, `${c.id}: ${c.detail}`);
  assert.deepEqual(cases.map((c) => c.id), [
    'refund-with-page', 'tomorrow-vs-minutes', 'two-page-tie', 'one-account-three-times', 'confidential-with-export', 'no-match-no-repeat',
  ]);
});

test('every result explains itself: one-sentence reason, rules fired, two page scores', () => {
  for (const r of results) {
    assert.ok(LANE_IDS.includes(r.lane), r.id);
    assert.equal(sentences(r.reason).length, 1, `${r.id}: ${r.reason}`);
    assert.ok(r.reason.endsWith('.'), r.id);
    assert.equal(r.topScores.length, 2, r.id);
    assert.ok(r.topScores[0].score >= r.topScores[1].score, r.id);
    const deciding = r.fired.findIndex((f) => f.lane === r.lane);
    if (deciding !== -1) assert.equal(deciding, 0, `${r.id}: deciding rule should be listed first`);
    if (r.lane !== 'unclear') assert.equal(r.fired[0].lane, r.lane, r.id);
  }
});

test('an email that hits a hold rule never gets a drafted reply, even with a strong page match', () => {
  let held = 0;
  for (const r of results) {
    const anyHold = A.HOLD_ORDER.some((l) => r.holds[l].length > 0);
    if (anyHold) {
      held += 1;
      assert.ok(A.HOLD_ORDER.includes(r.lane), r.id);
      assert.equal(r.page, null, r.id);
    }
  }
  assert.equal(held, 18);
  const r = results.find((x) => x.id === 'm41');
  assert.ok(r.topScores[0].score >= A.SETTINGS.minPageScore);
  assert.equal(r.lane, 'money');
});

test('classification is deterministic and does not change its input', () => {
  const before = clone(D);
  const again = run();
  assert.deepEqual(again, results);
  assert.deepEqual(clone(D), before);
});

// ------------------------------------------------------------ Call now

test('"in N minutes" counts up to 60, hours only as "an hour" or "half an hour"', () => {
  const m = (t) => A.minutesAway(A.normalize(t));
  assert.equal(m('my depo starts in 15 minutes').minutes, 15);
  assert.equal(m('hearing in fifteen min').minutes, 15);
  assert.equal(m('starts in 60 minutes').minutes, 60);
  assert.equal(m('starts in 61 minutes'), null);
  assert.equal(m('starts in 90 minutes'), null);
  assert.equal(m('in an hour').minutes, 60);
  assert.equal(m('in half an hour').minutes, 30);
  assert.equal(m('in 2 hours'), null);
  assert.equal(m('my deposition is tomorrow at 9'), null);
});

test('"tomorrow" or a date is not Call now; live and soon are', () => {
  assert.notEqual(one('My deposition is tomorrow and capture won\'t start in the test run.').lane, 'call_now');
  assert.notEqual(one('The hearing on 9/30 needs a live link. How do I send it?').lane, 'call_now');
  assert.equal(one('Deposition starts in 20 minutes and the app crashed.').lane, 'call_now');
  assert.equal(one('We are on the record now and the meter is flat.').lane, 'call_now');
  assert.equal(one('The witness is waiting and nothing records.').lane, 'call_now');
});

test('"this morning" needs a proceeding and a failure word to be Call now', () => {
  assert.equal(one('My hearing this morning and the app crashed twice.').lane, 'call_now');
  assert.notEqual(one('I installed the update this morning. Where is the version number?').lane, 'call_now');
  assert.notEqual(one('I have a hearing this morning. Can I export to RTF afterwards?').lane, 'call_now');
});

// ------------------------------------------------------------ hold order

test('hold rules are checked in order: call now, money, confidential, record, trust', () => {
  assert.equal(one('Depo starts in 10 minutes, and also I want a refund.').lane, 'call_now');
  assert.equal(one('Refund please, and this was a sealed hearing.').lane, 'money');
  assert.equal(one('The sealed hearing audio is missing.').lane, 'confidential');
  assert.equal(one('The certified transcript is late and I lost a client.').lane, 'record');
  assert.equal(one('This is unacceptable. How do I export to RTF?').lane, 'trust');
});

test('each hold category catches its own examples', () => {
  const cases = {
    money: ['I was billed twice this month.', 'Please cancel our plan.', 'I cancelled last week and was still charged.', 'We will file a chargeback.'],
    confidential: ['This is a sealed proceeding.', 'It falls under HIPAA.', 'Please delete my audio from your servers.', 'There is a protective order on this case.'],
    record: ['The certified transcript has the wrong date.', 'The audio is missing from Monday.', 'My job was deleted overnight.'],
    trust: ['I am thinking of switching to another tool.', 'I lost a client over this.', 'This is unacceptable.'],
  };
  for (const [lane, list] of Object.entries(cases)) {
    for (const body of list) assert.equal(one(body).lane, lane, body);
  }
});

test('phrases match whole words only', () => {
  const n = A.normalize('The ARTFUL export, re-exported; won’t Wi-Fi.');
  assert.equal(n, ' the artful export re exported won\'t wi fi ');
  assert.deepEqual(A.findPhrases(n, ['rtf', 'export', 'won\'t', 'wi fi']), ['export', 'won\'t', 'wi fi']);
  assert.notEqual(one('I am switching laptops this weekend. Do I turn on virtualization in the BIOS again?').lane, 'trust');
});

// ------------------------------------------------------------ matching

test('a clear single page match drafts a reply from that page', () => {
  const r = one('How do I rename the speaker labels? It says Speaker 1 everywhere.');
  assert.equal(r.lane, 'draft');
  assert.equal(r.page, 'page-7');
  assert.ok(r.topScores[0].score >= A.SETTINGS.minPageScore);
  assert.ok(r.topScores[0].score - r.topScores[1].score >= A.SETTINGS.minLead);
});

test('a tie between two pages goes to a person', () => {
  const r = one('I installed the update and now virtualization is greyed out. Is the new version the problem?');
  assert.equal(r.lane, 'unclear');
  assert.equal(r.unclearKind, 'tie');
  assert.equal(r.topScores[0].score, r.topScores[1].score);
});

test('a weak match (below the minimum) goes to a person', () => {
  const r = one('Can I change the export font?');
  assert.equal(r.topScores[0].score, 1);
  assert.equal(r.lane, 'unclear');
  assert.equal(r.unclearKind, 'weak');
});

test('nothing matched goes to a person', () => {
  const r = one('Is there a dark theme for late nights?');
  assert.equal(r.lane, 'unclear');
  assert.equal(r.unclearKind, 'none');
  assert.deepEqual(r.matched, []);
});

// ------------------------------------------------------------ repeats

test('repeats count different accounts, not emails', () => {
  const body = 'Does the app work with a foot pedal for playback?';
  const same = [mk('a', 'X01', body), mk('b', 'X01', body), mk('c', 'X01', body)];
  assert.ok(run(same).every((r) => r.lane === 'unclear' && r.unclearKind === 'watched'));
  const two = same.concat([mk('d', 'X02', body)]);
  assert.ok(run(two).every((r) => r.lane === 'unclear'));
  const three = two.concat([mk('e', 'X03', body)]);
  assert.ok(run(three).every((r) => r.lane === 'repeat'));
});

test('a repeat email with a hold phrase is still held', () => {
  const body = 'The live link won\'t load on the hotel wifi.';
  const emails = [mk('a', 'X01', body), mk('b', 'X02', body), mk('c', 'X03', body + ' I want a refund.')];
  const r = run(emails);
  assert.deepEqual(r.map((x) => x.lane), ['repeat', 'repeat', 'money']);
});

test('three repeat clusters, ranked by accounts asking', () => {
  const { repeats, watching } = A.findClusters(D.emails, results, D.watchTopics);
  assert.deepEqual(repeats.map((c) => [c.topic.id, c.accounts.length, c.emailIds.length]), [
    ['topic-list-after', 5, 5],
    ['topic-venue-wifi', 4, 5],
    ['topic-second-mic', 4, 4],
  ]);
  assert.deepEqual(watching.map((c) => [c.topic.id, c.accounts.length, c.emailIds.length]), [['topic-foot-pedal', 1, 3]]);
  for (const c of repeats) {
    assert.equal(c.examples.length, 2);
    assert.notEqual(c.examples[0].account, c.examples[1].account);
    assert.ok(c.roles.length >= 1);
  }
  const repeatEmails = results.filter((r) => r.lane === 'repeat').map((r) => r.id).sort();
  const clustered = repeats.flatMap((c) => c.emailIds).sort();
  assert.deepEqual(repeatEmails, clustered);
});

test('each repeat has a page outline with [check in the app] and a five-shot video list', () => {
  for (const t of D.watchTopics.filter((x) => x.outline)) {
    const o = t.outline;
    assert.ok(o.title && o.audience && o.answer, t.id);
    assert.ok(o.steps.length >= 4 && o.steps.length <= 5, t.id);
    assert.ok(o.steps.some((s) => s.includes('[check in the app')), t.id);
    assert.equal(t.shots.length, 5, t.id);
    for (const s of t.shots) assert.ok(s.screen && s.action && s.caption, t.id);
  }
});

// ------------------------------------------------------------ what if

test('pretending pages exist moves repeat emails to drafted replies', () => {
  const ids = (list) => list.map((m) => m.id);
  const none = A.whatIf(D.emails, D.helpPages, D.watchTopics, []);
  assert.equal(none.moved.length, 0);
  assert.match(none.sentence, /^Turn on/);

  const all = A.whatIf(D.emails, D.helpPages, D.watchTopics, D.watchTopics.map((t) => t.id));
  assert.equal(all.added.length, 3);
  assert.equal(all.moved.length, 14);
  assert.deepEqual(all.lost, []);
  assert.equal(all.sentence, 'With these 3 pages, 14 more of the 60 emails get a drafted reply.');
  assert.ok(all.moved.every((m) => m.from === 'repeat'));

  const wifi = A.whatIf(D.emails, D.helpPages, D.watchTopics, ['topic-venue-wifi']);
  assert.equal(wifi.sentence, 'With this page, 5 more of the 60 emails get a drafted reply.');
  assert.deepEqual(ids(wifi.moved), ['m09', 'm17', 'm28', 'm39', 'm51']);
  assert.equal(A.whatIf(D.emails, D.helpPages, D.watchTopics, ['topic-second-mic']).moved.length, 4);
  assert.equal(A.whatIf(D.emails, D.helpPages, D.watchTopics, ['topic-list-after']).moved.length, 5);
});

test('a pretend page never unlocks a held email', () => {
  const all = A.whatIf(D.emails, D.helpPages, D.watchTopics, D.watchTopics.map((t) => t.id));
  all.next.forEach((r, i) => {
    if (A.HOLD_ORDER.includes(all.base[i].lane)) assert.equal(r.lane, all.base[i].lane, r.id);
  });
});

// ------------------------------------------------------------ replies

const pageOf = (id) => D.helpPages.find((p) => p.id === id);
const emailOf = (id) => D.emails.find((e) => e.id === id);
const resultOf = (id) => results.find((r) => r.id === id);

test('a drafted reply has the name, one answer, the steps, the page link and the hand-off line', () => {
  for (const r of results.filter((x) => x.lane === 'draft')) {
    const e = emailOf(r.id);
    const page = pageOf(r.page);
    const reply = A.buildReply(e, r, D.helpPages);
    assert.equal(reply.kind, 'draft');
    assert.ok(reply.text.startsWith(`Hi ${e.from_first_name},\n\n${page.answer}\n\n1. `), r.id);
    page.steps.forEach((s, i) => assert.ok(reply.text.includes(`${i + 1}. ${s}`), `${r.id} step ${i + 1}`));
    assert.ok(reply.text.includes(`(#${page.id})`), r.id);
    assert.ok(reply.text.includes('If step 2 doesn\'t match what you see, reply here and a person will take it.'), r.id);
    assert.doesNotMatch(reply.text, /\brefund|guarantee|by tomorrow|we will fix\b/i, r.id);
    assert.equal(reply.words, A.wordCount(reply.text));
  }
});

test('held lanes get a holding note that answers nothing; trust gets no template', () => {
  const expect = {
    call_now: 'Calling you at the number on your account now; if you miss us, reply with the best number.',
    money: 'I\'ve passed this to the person who handles billing, and they\'ll reply to you directly.',
    confidential: 'A person, not an automated reply, will confirm this in writing.',
  };
  for (const [lane, line] of Object.entries(expect)) {
    const r = results.find((x) => x.lane === lane);
    const reply = A.buildReply(emailOf(r.id), r, D.helpPages);
    assert.equal(reply.kind, 'ack');
    assert.ok(reply.text.includes(line), lane);
  }
  const rec = results.find((x) => x.lane === 'record');
  assert.match(A.buildReply(emailOf(rec.id), rec, D.helpPages).text, /job name.*page and line/s);
  const trust = results.find((x) => x.lane === 'trust');
  const t = A.buildReply(emailOf(trust.id), trust, D.helpPages);
  assert.equal(t.kind, 'person');
  assert.equal(t.heading, 'A person writes this one.');
  assert.equal(t.text, '');
  for (const r of results.filter((x) => x.lane !== 'draft')) {
    const reply = A.buildReply(emailOf(r.id), r, D.helpPages);
    for (const p of D.helpPages) for (const s of p.steps) assert.ok(!reply.text.includes(s), `${r.id} leaks a step`);
  }
});

test('word count counts words, not symbols', () => {
  // "1." counts as a word; a lone dash does not.
  assert.equal(A.wordCount('Hi Dana,\n\n1. Open it - now.'), 6);
});

test('timestamps format without time zones', () => {
  assert.equal(A.formatReceived('2026-09-14T08:12'), 'Mon 14 Sep, 8:12 AM');
  assert.equal(A.formatReceived('2026-09-25T16:12'), 'Fri 25 Sep, 4:12 PM');
  assert.equal(A.formatReceived('2026-09-21T12:05'), 'Mon 21 Sep, 12:05 PM');
  assert.equal(A.formatReceived('2026-09-21T00:05'), 'Mon 21 Sep, 12:05 AM');
});

test('the rule sentences quote the live settings', () => {
  const rule = (id) => A.LANE_BY_ID[id].rule;
  assert.ok(rule('call_now').includes(`${A.SETTINGS.callNowMaxMinutes} minutes`));
  assert.ok(rule('draft').includes(`at least ${A.SETTINGS.minPageScore} phrases`));
  assert.ok(rule('repeat').includes(`${A.SETTINGS.minRepeatAccounts} or more different accounts`));
  for (const l of A.LANES) assert.equal(sentences(l.rule).length, 1, l.id);
});

// ------------------------------------------------------------ static site

const read = (f) => readFileSync(join(root, f), 'utf8');
const siteFiles = ['index.html', 'gaps.html', 'styles.css', 'data.js', 'rules.mjs', 'app.js', 'gaps.js'];

test('every site file exists and every script the pages load is local', () => {
  for (const f of siteFiles.concat(['README.md'])) assert.ok(existsSync(join(root, f)), f);
  for (const page of ['index.html', 'gaps.html']) {
    const html = read(page);
    const srcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(srcs.slice(0, 2), ['data.js', 'rules.mjs'], page);
    for (const s of srcs) assert.ok(existsSync(join(root, s)), `${page} loads missing ${s}`);
    assert.doesNotMatch(html, /type="module"/, page);
    const hrefs = [...html.matchAll(/<link[^>]*\shref="([^"]+)"/g)].map((m) => m[1]);
    for (const h of hrefs) assert.ok(existsSync(join(root, h)), `${page} links missing ${h}`);
  }
});

const LONG_DASH = new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']');

test('no network calls, no external URLs, no long dashes', () => {
  for (const f of siteFiles) {
    const src = read(f);
    assert.doesNotMatch(src, /https?:\/\//, f);
    assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|import\(/, f);
    assert.doesNotMatch(src, LONG_DASH, `${f} has a long dash`);
  }
});

test('both pages carry the synthetic-data banner, the footer and their sections', () => {
  const banner = 'Synthetic data. Fictional customers and help pages written for this demo. Nothing here sends email.';
  for (const page of ['index.html', 'gaps.html']) {
    const html = read(page);
    assert.ok(html.replace(/<[^>]+>/g, '').includes(banner), page);
    assert.match(html, /<footer[^>]*>\s*<span>Built by [A-Z][a-z]+ [A-Z][a-z]+<\/span>/, page);
    assert.match(html, /<meta name="viewport"/, page);
  }
  const index = read('index.html');
  for (const id of ['result', 'chips', 'list', 'detail', 'checks', 'assumptions', 'questions']) assert.ok(index.includes(`id="${id}"`), id);
  assert.ok(index.includes('href="gaps.html"'));
  for (const q of [
    'Which questions fill the inbox most, and which come by phone instead?',
    'When a reporter writes during a live proceeding, what is the fastest path to a person today?',
    'Which replies must a person always send, and is anything missing from money, confidential hearings and filed transcripts?',
    'Do agency admins and freelance reporters ask different things, and should they get different replies?',
    'Where do the answers live today: the docs site, saved replies, or someone\'s memory?',
  ]) assert.ok(index.includes(q), q);
  const gaps = read('gaps.html');
  for (const q of [
    'Who writes help pages today, and how often do they change?',
    'Do customers watch the videos, or skim the steps?',
    'Which reply does someone retype every week?',
  ]) assert.ok(gaps.includes(q), q);
  assert.ok(gaps.includes('href="index.html"'));
});

test('page scripts compile', () => {
  for (const f of ['app.js', 'gaps.js']) assert.doesNotThrow(() => new vm.Script(read(f), { filename: f }), f);
});

// ------------------------------------------------------------ runner

let failed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`ok    ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL  ${name}\n      ${String(err && err.message).split('\n').join('\n      ')}`);
  }
}
console.log(`\n${tests.length - failed} of ${tests.length} tests passed.`);
process.exitCode = failed ? 1 : 0;
