/*
 * Ask Once, inbox page. Draws index.html from data.js and rules.mjs.
 * All decisions come from rules.mjs; this file only renders them.
 */
(function () {
  'use strict';

  const A = window.AskOnce;
  const D = window.ASK_ONCE_DATA;
  if (!A || !D) return;

  // ------------------------------------------------------------ helpers

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

  const badge = (laneId) => el('span', { class: `badge lane-${laneId}`, text: A.LANE_BY_ID[laneId].label });
  const plural = (n, word) => `${n} ${n === 1 ? word : word + 's'}`;
  const narrow = () => window.matchMedia('(max-width: 899px)').matches;

  function selectText(node) {
    try {
      const range = document.createRange();
      range.selectNodeContents(node);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) { /* nothing else to try */ }
  }

  // ------------------------------------------------------------ data

  const results = A.classifyInbox(D.emails, D.helpPages, D.watchTopics);
  const summary = A.summarize(results);
  const emailById = new Map(D.emails.map((e) => [e.id, e]));
  const resultById = new Map(results.map((r) => [r.id, r]));
  const accountById = new Map(D.accounts.map((a) => [a.id, a]));

  const state = { lane: 'all', selected: null };

  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------ top

  $('headline').textContent = A.resultSentence(summary);
  document.querySelectorAll('[data-setting]').forEach((node) => {
    const value = A.SETTINGS[node.getAttribute('data-setting')];
    if (value != null) node.textContent = String(value);
  });

  // ------------------------------------------------------------ chips

  function renderChips() {
    const chips = $('chips');
    chips.replaceChildren();
    const options = [{ id: 'all', label: 'All', count: summary.total }]
      .concat(A.LANES.map((l) => ({ id: l.id, label: l.label, count: summary.counts[l.id] })));
    for (const o of options) {
      chips.append(el('li', null, el('button', {
        type: 'button',
        class: 'chip',
        'aria-pressed': String(state.lane === o.id),
        onclick: () => setLane(o.id),
      },
      o.id === 'all' ? null : el('span', { class: `dot lane-${o.id}`, 'aria-hidden': 'true' }),
      el('span', { text: o.label }),
      el('span', { class: 'count', text: String(o.count) }))));
    }
  }

  function visibleResults() {
    return state.lane === 'all' ? results : results.filter((r) => r.lane === state.lane);
  }

  function setLane(laneId) {
    state.lane = laneId;
    renderChips();
    renderList();
    const visible = visibleResults();
    if (visible.length && !visible.some((r) => r.id === state.selected)) select(visible[0].id, { scroll: false });
  }

  // ------------------------------------------------------------ list

  function renderList() {
    const list = $('list');
    list.replaceChildren();
    const visible = visibleResults();
    if (!visible.length) {
      list.append(el('li', { class: 'list-empty', text: 'No emails in this lane.' }));
      return;
    }
    for (const r of visible) {
      const e = emailById.get(r.id);
      list.append(el('li', null, el('button', {
        type: 'button',
        class: 'mail',
        'data-id': r.id,
        'aria-current': String(r.id === state.selected),
        onclick: () => select(r.id, { scroll: narrow() }),
      },
      el('span', { class: 'meta', text: `${A.formatReceived(e.received)} · ${e.role}` }),
      el('span', { class: 'subject', text: e.subject }),
      badge(r.lane))));
    }
  }

  // ------------------------------------------------------------ detail

  function select(id, opts) {
    if (!resultById.has(id)) return;
    state.selected = id;
    document.querySelectorAll('.mail').forEach((b) => b.setAttribute('aria-current', String(b.getAttribute('data-id') === id)));
    renderDetail(id);
    if (!opts || opts.updateHash !== false) {
      try { history.replaceState(null, '', '#' + id); } catch (e) { /* some browsers refuse this on file:// */ }
    }
    if (opts && opts.scroll) $('detail').scrollIntoView({ block: 'start' });
  }

  function renderDetail(id) {
    const e = emailById.get(id);
    const r = resultById.get(id);
    const acct = accountById.get(e.account);
    const detail = $('detail');
    detail.replaceChildren();

    detail.append(
      el('h3', { text: e.subject }),
      el('p', { class: 'who', text: `${e.from_first_name}, ${e.role} · ${acct.name} (${acct.type}, ${acct.plan} plan) · ${A.formatReceived(e.received)}` }),
      el('blockquote', { class: 'email-body', text: e.body }),
    );

    const agrees = e.hand_label === r.lane;
    detail.append(
      el('h4', { text: 'Lane' }),
      el('div', { class: 'decision' },
        badge(r.lane),
        el('span', { class: 'muted small', text: agrees ? `My hand label agrees.` : `My hand label said ${A.LANE_BY_ID[e.hand_label].label}.` })),
      el('p', { class: 'reason', text: r.reason }),
    );

    const others = r.fired.slice(r.fired.length && r.fired[0].lane === r.lane ? 1 : 0);
    detail.append(el('h4', { text: 'Other rules that fired' }));
    detail.append(others.length
      ? el('ul', { class: 'fired small' }, others.map((f) => el('li', { text: f.text })))
      : el('p', { class: 'muted small', text: 'None.' }));

    detail.append(el('h4', { text: 'Matched phrases' }));
    detail.append(r.matched.length
      ? el('div', null, r.matched.map((p) => el('span', { class: 'phrase', text: p })))
      : el('p', { class: 'muted small', text: 'None.' }));

    detail.append(
      el('h4', { text: 'Top two help pages' }),
      el('ul', { class: 'scores small' }, r.topScores.map((s) => el('li', null,
        el('span', { text: s.title || 'No page' }),
        el('span', { class: 'score', text: plural(s.score, 'phrase') })))),
    );

    const reply = A.buildReply(e, r, D.helpPages);
    detail.append(el('h4', { text: 'Reply' }));
    const box = el('div', { class: 'reply' });
    if (reply.kind === 'person') {
      box.append(
        el('div', { class: 'reply-head' }, el('span', { class: 'title', text: reply.heading })),
        el('p', { class: 'person-note', text: 'No template for an upset customer. A person reads the whole thread and writes back.' }),
      );
    } else {
      const pre = el('pre', { text: reply.text });
      const copy = el('button', { type: 'button', class: 'btn btn-quiet', text: 'Copy' });
      copy.addEventListener('click', () => {
        const done = () => { copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy'; }, 1600); };
        const fallback = () => { selectText(pre); copy.textContent = 'Selected, press copy'; setTimeout(() => { copy.textContent = 'Copy'; }, 2400); };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(reply.text).then(done, fallback);
          else fallback();
        } catch (err) { fallback(); }
      });
      box.append(
        el('div', { class: 'reply-head' },
          el('span', { class: 'title', text: reply.heading }),
          el('span', { class: 'muted', text: plural(reply.words, 'word') }),
          copy),
        pre,
      );
    }
    detail.append(box);
  }

  // ------------------------------------------------------------ checks

  function renderChecks() {
    const hand = Object.fromEntries(A.LANES.map((l) => [l.id, 0]));
    for (const e of D.emails) hand[e.hand_label] += 1;
    $('lane-table').replaceChildren(...A.LANES.map((l) => el('tr', null,
      el('td', null, badge(l.id)),
      el('td', { text: l.rule }),
      el('td', { class: 'num', text: String(summary.counts[l.id]) }),
      el('td', { class: 'num', text: String(hand[l.id]) }))));

    const ag = A.agreement(D.emails, results);
    $('agreement').textContent = `${ag.agree} of ${ag.total} lanes match the labels I wrote by hand.`;
    $('disagreements').replaceChildren(...ag.disagreements.map((d) => {
      const e = emailById.get(d.id);
      const r = resultById.get(d.id);
      return el('li', null,
        el('a', { href: '#' + d.id, text: `"${e.subject}"`, onclick: (ev) => { ev.preventDefault(); goTo(d.id, true); } }),
        `: my label was ${A.LANE_BY_ID[d.hand].label}, the rules gave ${A.LANE_BY_ID[d.computed].label}. ${r.reason}`,
        d.saferDirection ? ' This errs toward a person, the safe direction.' : ' This is the risky direction and would need a rule change.');
    }));

    $('edge-cases').replaceChildren(...A.edgeCases(D).map((c) => el('li', null,
      el('span', { class: `pf ${c.pass ? 'pass' : 'fail'}`, text: c.pass ? 'Pass' : 'Fail' }),
      el('span', { text: c.name }),
      el('span', { class: 'detail-line', text: c.detail }))));
  }

  function renderPhraseLists() {
    const box = $('phrase-lists');
    const group = (title, phrases, note) => el('div', { class: 'phrase-group' },
      el('h4', { text: title }),
      note ? el('p', { class: 'small muted', text: note }) : null,
      el('div', null, phrases.map((p) => el('span', { class: 'phrase', text: p }))));

    box.append(el('h3', { text: 'Hold rules' }));
    box.append(group('Call now', A.CALL_NOW.livePhrases.concat([`in N minutes (N up to ${A.SETTINGS.callNowMaxMinutes})`, 'in an hour', 'in half an hour']),
      `Also fires for "this morning" plus a proceeding word (${A.CALL_NOW.proceedings.join(', ')}) plus a failure word (${A.CALL_NOW.failures.join(', ')}).`));
    for (const lane of ['money', 'confidential', 'record', 'trust']) {
      box.append(group(A.LANE_BY_ID[lane].label, A.HOLD_PHRASES[lane]));
    }
    box.append(el('h3', { text: 'Help pages' }));
    for (const p of D.helpPages) box.append(group(`${p.number}. ${p.title}`, p.phrases));
    box.append(el('h3', { text: 'Watched questions (no page yet)' }));
    box.append(el('p', { class: 'small muted', text: `An email joins a watched question when it matches at least ${A.SETTINGS.minTopicScore} of its phrases.` }));
    for (const t of D.watchTopics) box.append(group(t.title, t.phrases));
  }

  // ------------------------------------------------------------ start

  renderChips();
  renderList();
  renderChecks();
  renderPhraseLists();

  function fromHash(scroll) {
    return goTo(decodeURIComponent(location.hash.slice(1)), scroll);
  }

  function goTo(id, scroll) {
    if (!resultById.has(id)) return false;
    if (state.lane !== 'all' && resultById.get(id).lane !== state.lane) {
      state.lane = 'all';
      renderChips();
      renderList();
    }
    select(id, { scroll });
    const btn = document.querySelector(`.mail[data-id="${id}"]`);
    if (btn && !narrow()) {
      const wrap = btn.closest('.list-wrap');
      if (wrap) wrap.scrollTop = btn.offsetTop - wrap.offsetTop - 8;
    }
    return true;
  }

  if (!fromHash(true)) select(results[0].id, { scroll: false, updateHash: false });
  window.addEventListener('hashchange', () => fromHash(true));
})();
