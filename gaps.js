/*
 * Ask Once, page 2: "What to write next". Draws gaps.html from data.js and
 * rules.mjs. The clusters and the what-if numbers all come from rules.mjs.
 */
(function () {
  'use strict';

  const A = window.AskOnce;
  const D = window.ASK_ONCE_DATA;
  if (!A || !D) return;

  function el(tag, props, ...kids) {
    const node = document.createElement(tag);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (value == null || value === false) continue;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
        else node.setAttribute(key, value === true ? '' : value);
      }
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
    return node;
  }

  const $ = (id) => document.getElementById(id);
  const plural = (n, word) => `${n} ${n === 1 ? word : word + 's'}`;
  const listText = (items) => items.length <= 2 ? items.join(' and ') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

  // Wraps every "[check in the app...]" in a highlight.
  function withChecks(text) {
    const parts = [];
    const re = /\[check in the app[^\]]*\]/g;
    let last = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      parts.push(el('mark', { class: 'check', text: m[0] }));
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  }

  const results = A.classifyInbox(D.emails, D.helpPages, D.watchTopics);
  const { repeats, watching } = A.findClusters(D.emails, results, D.watchTopics);
  const accountById = new Map(D.accounts.map((a) => [a.id, a]));
  const emailById = new Map(D.emails.map((e) => [e.id, e]));
  const enabled = new Set();

  document.querySelectorAll('[data-setting]').forEach((node) => {
    const value = A.SETTINGS[node.getAttribute('data-setting')];
    if (value != null) node.textContent = String(value);
  });

  // ------------------------------------------------------------ result

  const repeatEmails = results.filter((r) => r.lane === 'repeat');
  const repeatAccounts = new Set(repeatEmails.map((r) => r.account));
  if (repeats.length) {
    const top = repeats[0];
    $('headline').textContent = `${plural(repeats.length, 'question')} with no help page came from ${repeatAccounts.size} different accounts in ${repeatEmails.length} emails. The most asked: "${top.topic.title}" (${plural(top.accounts.length, 'account')}).`;
  } else {
    $('headline').textContent = 'No question was asked by enough different accounts to count as a repeat.';
  }

  // ------------------------------------------------------------ clusters

  const effects = new Map();
  const replies = new Map();

  repeats.forEach((c, i) => {
    const t = c.topic;
    const o = t.outline;
    const accountsText = c.accounts.map((id) => {
      const a = accountById.get(id);
      return `${a.name} (${a.type})`;
    }).join(', ');

    const examples = c.examples.map((e) => {
      const a = accountById.get(e.account);
      return el('div', { class: 'example' },
        el('blockquote', { class: 'email-body', text: e.body }),
        el('p', { class: 'src' },
          `${e.from_first_name}, ${e.role}, ${a.name} · ${A.formatReceived(e.received)} · `,
          el('a', { href: `index.html#${e.id}`, text: 'Open in the inbox' })));
    });

    const outline = o ? el('dl', { class: 'outline' },
      el('dt', { text: 'Title' }), el('dd', { text: o.title }),
      el('dt', { text: 'Who it\'s for' }), el('dd', { text: o.audience }),
      el('dt', { text: 'One-line answer' }), el('dd', { text: o.answer }),
      el('dt', { text: 'Steps' }), el('dd', null, el('ol', null, o.steps.map((s) => el('li', null, withChecks(s)))))) : el('p', { class: 'muted', text: 'No outline written yet.' });

    const shots = t.shots && t.shots.length ? el('div', { class: 'table-scroll' },
      el('table', { class: 'shots' },
        el('thead', null, el('tr', null, el('th', { class: 'num', text: 'Shot' }), el('th', { text: 'Screen' }), el('th', { text: 'Action' }), el('th', { text: 'Caption' }))),
        el('tbody', null, t.shots.map((s, n) => el('tr', null,
          el('td', { class: 'num', text: String(n + 1) }),
          el('td', null, withChecks(s.screen)),
          el('td', null, withChecks(s.action)),
          el('td', null, withChecks(s.caption))))))) : null;

    const effect = el('p', { class: 'effect' });
    effects.set(t.id, effect);
    const replyBox = el('details', { hidden: true });
    replies.set(t.id, replyBox);

    const toggle = o ? el('label', { class: 'toggle' },
      el('input', {
        type: 'checkbox',
        onchange: (ev) => {
          if (ev.target.checked) enabled.add(t.id); else enabled.delete(t.id);
          update();
        },
      }),
      'Pretend this page exists') : null;

    $('clusters').append(el('article', { class: 'card cluster', id: t.id.replace(/^topic-/, '') },
      el('header', { class: 'cluster-head' },
        el('span', { class: 'rank', 'aria-hidden': 'true', text: String(i + 1) }),
        el('h2', { text: t.title }),
        el('p', { class: 'meta', text: `Asked by ${plural(c.accounts.length, 'account')} in ${plural(c.emailIds.length, 'email')} · ${listText(c.roles)}` })),
      el('p', { class: 'small muted', text: `Accounts: ${accountsText}.` }),
      el('div', { class: 'cluster-cols' },
        el('div', null, el('h3', { text: 'Two of the emails' }), examples),
        el('div', null, el('h3', { text: 'Draft help page' }), outline)),
      shots ? el('h3', { text: 'Video shot list (60 to 90 seconds, 5 shots)' }) : null,
      shots,
      el('div', { class: 'toggle-row' }, toggle, effect),
      replyBox));
  });

  // ------------------------------------------------------------ watching

  if (watching.length) {
    $('watching-list').append(...watching.map((c) => {
      const accts = c.accounts.map((id) => accountById.get(id).name);
      const who = c.accounts.length === 1 ? `all from ${accts[0]}` : `from ${listText(accts)}`;
      return el('div', { class: 'card', style: 'margin-top: 12px' },
        el('h3', { style: 'margin-top: 0', text: c.topic.title }),
        el('p', { text: `${plural(c.emailIds.length, 'email')}, ${who}.` }),
        el('p', { class: 'small muted', text: c.accounts.length === 1
          ? `One account asking ${c.emailIds.length === 1 ? 'once' : `${c.emailIds.length} times`} is one customer waiting for an answer, so a person replies to them and it stays off this list. It becomes a repeat once ${A.SETTINGS.minRepeatAccounts} different accounts ask.`
          : `It becomes a repeat once ${A.SETTINGS.minRepeatAccounts} different accounts ask.` }));
    }));
  } else {
    $('watching').hidden = true;
  }

  // ------------------------------------------------------------ what if

  const baseDrafts = results.filter((r) => r.lane === 'draft').length;

  function update() {
    const w = A.whatIf(D.emails, D.helpPages, D.watchTopics, Array.from(enabled));
    const nextDrafts = w.next.filter((r) => r.lane === 'draft').length;
    $('whatif-sentence').textContent = w.sentence;
    let tally = `Drafted replies: ${baseDrafts} of ${D.emails.length} today`;
    if (w.added.length) tally += `, ${nextDrafts} with ${w.added.length === 1 ? 'this page' : 'these pages'}`;
    tally += '.';
    if (w.lost.length) tally += ` ${plural(w.lost.length, 'email')} that had a drafted reply would now tie and go to a person.`;
    $('whatif-tally').textContent = tally;

    const pagesNow = D.helpPages.concat(w.added);
    for (const c of repeats) {
      const t = c.topic;
      const effect = effects.get(t.id);
      const replyBox = replies.get(t.id);
      if (!t.outline) continue;
      if (!enabled.has(t.id)) {
        effect.className = 'effect';
        effect.textContent = 'Off. Turn it on to rerun the rules with this outline as a help page.';
        replyBox.hidden = true;
        replyBox.replaceChildren();
        continue;
      }
      const pageId = A.pageFromTopic(t).id;
      const moved = w.moved.filter((m) => m.page === pageId);
      effect.className = 'effect on';
      effect.textContent = `On. ${plural(moved.length, 'email')} move from "Repeat, no page yet", where a person answers by hand, to "Draft ready": ${moved.map((m) => `"${emailById.get(m.id).subject}"`).join(', ')}.`;
      replyBox.replaceChildren();
      if (moved.length) {
        const first = moved[0];
        const e = emailById.get(first.id);
        const r = w.next.find((x) => x.id === first.id);
        const reply = A.buildReply(e, r, pagesNow);
        replyBox.append(
          el('summary', { text: `See the reply it would draft for ${e.from_first_name} (${plural(reply.words, 'word')})` }),
          el('div', { class: 'reply' }, el('pre', { text: reply.text })));
        replyBox.hidden = false;
      } else {
        replyBox.hidden = true;
      }
    }
  }

  update();
})();
