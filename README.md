# Ask Once

A small static site that sorts a support inbox for a legal-transcription app into lanes and drafts what it safely can. If one help page clearly answers an email, it drafts a reply for a person to check and send. It holds anything time-critical, about money, confidential, about a filed record, or from an upset customer for a person. It flags questions that several accounts keep asking when no help page answers them. It never sends anything.

The data is synthetic: 60 emails from 20 fictional accounts over two weeks (14 to 25 September 2026), plus 8 help pages, all written for this demo. The product is called "the app". The decisions come from short, fixed rules in `rules.mjs`, not a live model, so each one can be explained in a sentence.

Built with AI assistance (Claude Code / Codex).

## What the pages show

**`index.html`: the inbox**

1. A banner: "Synthetic data. Fictional customers and help pages written for this demo. Nothing here sends email."
2. One result sentence, computed from the data: "Of 60 emails, 23 get a drafted reply from an existing help page, 23 go to a person (6 need a call now), and 14 repeat a question no page answers yet."
3. Lane chips with counts. Clicking one filters the list.
4. The email list: time, role, subject and lane.
5. The detail panel for the selected email: the original email, its lane, the rule that decided it (one sentence), any other rules that fired, the matched phrases, the top two help-page scores, and the drafted reply or holding note with a word count and a Copy button.
6. "How I checked it": the eight lanes in the order they're checked with their counts, agreement with my hand labels (59 of 60), and six named edge cases that run live on the page and show Pass or Fail.
7. Assumptions, with every phrase list available under "See every phrase list".
8. Questions I'd want answered about how the real team works.

**`gaps.html`: what to write next (the second page)**

- The repeat questions, ranked by the number of different accounts asking (not raw emails). Each one shows the accounts and roles affected, two example emails (linked back to the inbox), a draft help-page outline with "[check in the app]" wherever the product's behavior is unknown, and a 5-shot video plan (screen, action, caption).
- A "Pretend this page exists" switch on each. It adds the outline as a help page, reruns the same rules, and shows which emails move to a drafted reply, plus a sample of the reply it would draft. With all three on: "With these 3 pages, 14 more of the 60 emails get a drafted reply."
- A "Still watching" note for the foot-pedal question: one account asked three times, so it stays off the list.
- Three closing questions.

The inbox footer has a link to `gaps.html` (`id="gaps-link"`) that starts hidden, so the second page can be shared later as something new. Remove the link's `hidden` attribute to show it. `gaps.html` works on its own either way.

## How it works, one sentence per rule

The rules are checked in this order, and the first one that fires decides. The five hold rules always run before any help page is matched.

1. **Call now:** if the email says a proceeding is live now ("on the record now", "witness is on the stand"), starts within 60 minutes ("in 15 minutes", "in an hour"), or is this morning and something has failed, a person calls instead of emailing. "Tomorrow" or a date never triggers it.
2. **Person: money:** refunds, charges, cancellations and double billing go to the person who handles billing.
3. **Person: confidential:** sealed or confidential proceedings, HIPAA, and requests to delete audio or data always get a person.
4. **Person: record:** anything about a certified or filed transcript, missing audio or a deleted job goes to a person.
5. **Person: trust:** an upset customer, such as one who lost a client or is thinking of switching, gets a reply a person writes.
6. **Draft ready:** if one help page matches at least 2 of its phrases and beats every other page by at least 1, it drafts a reply from that page.
7. **Repeat, no page yet:** if no page matches well enough but 3 or more different accounts asked the same watched question, it's flagged as a page worth writing.
8. **Person: unclear:** everything else goes to a person, including ties between two pages and weak matches.

Supporting details:

- **Matching:** the subject and body are lowercased and matched against phrase lists as whole words, so "rtf" doesn't match inside "artful".
- **Scores:** a help page's score is how many of its phrases appear in the email; the page shows the top two so you can see why one won.
- **Repeats count accounts, not emails:** one customer asking three times is one person waiting, so it never makes a cluster alone.
- **Watched questions:** each is a phrase list someone sets up after noticing a pattern, and an email joins one when it matches at least 2 of its phrases.
- **Drafted reply:** greeting with the first name, a one-sentence answer, the page's numbered steps, the page title with a link placeholder like `#page-4`, and "If step 2 doesn't match what you see, reply here and a person will take it." It never promises refunds, dates or outcomes.
- **Holding notes:** held emails get a short note that keeps the customer informed without answering. Call now: "Calling you at the number on your account now; if you miss us, reply with the best number." Money: "I've passed this to the person who handles billing, and they'll reply to you directly." Confidential: "A person, not an automated reply, will confirm this in writing." Record: asks for the job name and the page and line. Trust: no template, labelled "A person writes this one."
- **Pretend this page exists:** the outline becomes a help page whose phrases are the watched question's phrases, then the whole inbox is classified again; a held email never moves.

All thresholds are in one `SETTINGS` block at the top of `rules.mjs`, and the rule sentences on the page are built from it.

## How I checked it

- **Agreement:** 59 of 60 lanes match the labels I wrote by hand. I wrote the labels and the rules together, so this checks that the rules do what I meant, not accuracy on a real inbox.
- **The one disagreement:** "Wrong attorney" asks how to "cancel or revoke" a live link. I labelled it Draft ready, but "cancel" is on the money list, so it goes to billing. That errs toward a person, and I left it to show the trade-off.
- **Six edge cases (live on the page):** a refund request that matches a help page goes to a person; "tomorrow" isn't Call now but "in 20 minutes" is; a two-page tie goes to a person; one account asking 3 times makes no repeat; a confidential request that matches the export page goes to a person; an email with no match and no repeat goes to unclear.

## Assumptions

- The phrase lists, the thresholds (2 phrases, a lead of 1, 3 accounts, 60 minutes) and the hold categories are guesses. Real inbox history would replace them.
- "Cancel" anywhere holds an email for billing. A wrong hold costs a person a minute; a wrong automated answer about money costs trust.
- Call now assumes the account has a phone number on file and someone is free to call.
- Typos and unusual wording are missed and fall to a person, which is the safe direction.
- Watched questions don't appear on their own; someone writes the phrase list after noticing a pattern.
- The emails, accounts, help pages, hand labels, page outlines and video plans were written with AI tools for this demo. No real company, customer, court or case appears.
- Times are shown as written, with no time zones.

## How it would run for real

On a shared inbox, the same rules would save drafts or apply labels for a person to review and send. Nothing would send on its own, and the rules file is short enough for anyone on the team to read and change.

## How to run

- Open `index.html` in a browser, straight from disk or from any static host such as GitHub Pages. No build step, server, account or network connection is needed.
- Tests (Node 18 or newer, no packages), from this folder:

```
node tests/run-tests.mjs
```

The tests cover the data shape and intended mix, the computed lane counts and result sentence, hand-label agreement, the six edge cases, Call now timing, hold order, whole-word matching, ties and weak matches, repeat counting by account, the clusters and their outlines, the what-if reruns, the reply templates, and that both pages load only local files with no network calls.

## Files

- `index.html`, `gaps.html`: the two pages.
- `data.js`: all synthetic data on one global, `ASK_ONCE_DATA`.
- `rules.mjs`: the rules, replies, summaries, clusters, what-if and edge cases. Pure functions with no page code. It has no import or export lines on purpose: browsers load it as an ordinary script, so the pages work when opened straight from disk, and Node loads it as a module for the tests. Either way it sets one global, `AskOnce`.
- `app.js`, `gaps.js`: draw each page from the data and the rules.
- `styles.css`: light and dark themes; works down to 400px wide, with wide tables scrolling inside their own box.
- `tests/run-tests.mjs`: plain Node tests.

## Limits

- Synthetic data only. Nothing here was run on a real inbox, and the 59 of 60 agreement measures consistency with my own labels, not accuracy.
- Phrase matching is brittle: paraphrases, typos and other languages are missed (they go to a person).
- Repeat detection only finds questions someone has already written a phrase list for.
- One email gets one lane; an email that asks two things is treated by its strongest signal.
- No real send, inbox connection, phone system or help-page site behind it.
