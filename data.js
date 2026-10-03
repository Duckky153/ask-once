/*
 * Synthetic data for Ask Once: two weeks of support email (2026-09-14 to
 * 2026-09-25) for a fictional legal-transcription app called "the app".
 *
 * Every account, person, email and help page here was written for this demo.
 * None of it comes from a real company, customer, court or case.
 *
 * Plain script, no imports or exports, so the page also works when opened
 * straight from disk. It puts one object on globalThis.ASK_ONCE_DATA.
 */
(function (root) {
  'use strict';

  const period = { start: '2026-09-14', end: '2026-09-25' };

  // Eight help pages. "phrases" are what the matcher looks for in an email.
  // A phrase counts once per email; phrases are matched as whole words.
  const helpPages = [
    {
      id: 'page-1',
      number: 1,
      title: 'Install the desktop app update',
      audience: ['reporter', 'transcriber'],
      summary: 'New versions of the desktop app arrive as an update banner at the top of the window. Installing takes a few minutes and keeps your jobs and settings.',
      answer: 'The update installs from inside the app in a few minutes and keeps your jobs and settings.',
      steps: [
        'Finish or pause any open job and save your work.',
        'Open the Help menu and choose Check for updates.',
        'Click Install update and let the app restart.',
        'Confirm the new version number under Help, then About.',
      ],
      phrases: ['install the update', 'installed the update', 'new version', 'latest version', 'older version', 'out of date', 'version number', 'check for updates', 'update banner'],
    },
    {
      id: 'page-2',
      number: 2,
      title: 'One-time offline setup: turn on virtualization',
      audience: ['reporter'],
      summary: 'Offline capture runs in a protected workspace on your computer, which needs virtualization turned on once. After that, offline sessions start with no extra steps.',
      answer: 'Offline mode needs virtualization turned on once in your computer\'s startup settings.',
      steps: [
        'Restart the computer and open its BIOS or UEFI settings (often F2, F10 or Delete during startup).',
        'Find the virtualization setting (Intel VT-x or AMD SVM) and set it to Enabled.',
        'Save, exit and let the computer start normally.',
        'Open the app, go to Settings, then Offline, and click Run setup check.',
      ],
      phrases: ['virtualization', 'bios', 'uefi', 'vt x', 'greyed out', 'setup check', 'one time setup', 'offline setup'],
    },
    {
      id: 'page-3',
      number: 3,
      title: 'Checklist before each offline session',
      audience: ['reporter'],
      summary: 'Offline sessions record and transcribe with no internet connection. A short check while you still have internet avoids surprises in the room.',
      answer: 'A five-minute check while you still have internet gets the job ready to record offline.',
      steps: [
        'Open the app while you still have internet so your jobs and spelling lists sync.',
        'Open the job and choose Prepare for offline.',
        'Plug in your microphone and run the 10-second sound test.',
        'Start a 30-second practice capture, play it back, then delete it.',
      ],
      phrases: ['offline session', 'prepare for offline', 'no wi fi', 'no wifi', 'no internet', 'what should i check', 'night before', 'sound test', 'practice capture', 'checklist'],
    },
    {
      id: 'page-4',
      number: 4,
      title: 'Add names to the spelling list before a job',
      audience: ['reporter', 'transcriber'],
      summary: 'The spelling list teaches the app the names and terms in a job before it starts. Names added before capture come out spelled correctly in the transcript.',
      answer: 'Add the names to the job\'s spelling list before capture starts, and the transcript will spell them that way.',
      steps: [
        'Open the job and select Spelling list.',
        'Add each name or term on its own line, the way it should appear (for example, Dr. Adeyemi).',
        'For unusual names, add a sounds-like hint next to the name.',
        'Save the list before you start capture.',
      ],
      phrases: ['spelling list', 'add names', 'proper names', 'word list', 'spelled right', 'before the job', 'before capture'],
    },
    {
      id: 'page-5',
      number: 5,
      title: 'Export a transcript to Word, RTF or CAT software',
      audience: ['reporter', 'transcriber', 'agency admin'],
      summary: 'Finished transcripts export as a Word document, an RTF file or a file your CAT software can open. Speaker labels and timestamps carry over.',
      answer: 'Open the finished job, click Export and pick Word, RTF or your CAT software.',
      steps: [
        'Open the finished job and click Export.',
        'Pick Word (.docx), RTF, or CAT software.',
        'For CAT software, choose your program from the list so the file opens with the right settings.',
        'Click Export, then open the file and check the page and line numbers.',
      ],
      phrases: ['export', 'rtf', 'word document', 'docx', 'cat software', 'eclipse', 'casecat', 'stenocat'],
    },
    {
      id: 'page-6',
      number: 6,
      title: 'Share a live transcript link and revoke it',
      audience: ['reporter', 'agency admin', 'attorney viewer'],
      summary: 'A live link lets counsel follow the transcript in a browser while you capture. You can turn a link off at any time, and it stops working right away.',
      answer: 'You can send a live link from the job\'s Share menu and revoke it there at any time.',
      steps: [
        'In a live job, click Share and choose Live link.',
        'Enter the viewer\'s email address and send the link. Viewers open it in a browser and need no account.',
        'To end access, open Share, find the viewer and click Revoke.',
        'A revoked link shows "This link is no longer active" to the viewer.',
      ],
      phrases: ['live link', 'share the live', 'revoke', 'viewer link', 'in a browser', 'stop access'],
    },
    {
      id: 'page-7',
      number: 7,
      title: 'Rename speaker labels',
      audience: ['reporter', 'transcriber'],
      summary: 'The app labels voices as Speaker 1, Speaker 2 and so on until you name them. Renaming a label updates every line in the job at once.',
      answer: 'Click any speaker label, choose Rename speaker, and it changes on every line at once.',
      steps: [
        'Open the job and click any speaker label in the transcript.',
        'Choose Rename speaker.',
        'Type the label the way it should appear, for example MR. SMITH or THE WITNESS.',
        'Click Apply to all lines.',
      ],
      phrases: ['speaker 1', 'speaker 2', 'speaker 3', 'speaker label', 'speaker labels', 'rename the speaker', 'mr smith'],
    },
    {
      id: 'page-8',
      number: 8,
      title: 'Change plan or see hourly audio usage',
      audience: ['reporter', 'transcriber', 'agency admin'],
      summary: 'Monthly plans include a set number of audio hours, and hourly plans charge only for the audio you process. You can see this month\'s hours and switch plans in Account settings.',
      answer: 'Your hours used and your plan are both under Account settings, then Plan and usage.',
      steps: [
        'Open Account settings and select Plan and usage.',
        'This month\'s audio hours are shown next to your plan.',
        'To switch between monthly and hourly, click Change plan and pick one.',
        'The new plan starts at your next billing date.',
      ],
      phrases: ['hourly plan', 'monthly plan', 'audio hours', 'hours used', 'change plan', 'change my plan', 'usage', 'switch to hourly', 'switch to monthly'],
    },
  ];

  // Questions someone has noticed with no help page yet. Each is a short phrase
  // list, like a saved search. An email is tagged with one when it matches at
  // least two of its phrases. The outline and shot list feed "What to write next".
  const watchTopics = [
    {
      id: 'topic-venue-wifi',
      title: 'Live link won\'t open on court or hotel Wi-Fi',
      phrases: ['hotel wifi', 'hotel wi fi', 'courthouse wifi', 'courthouse wi fi', 'court wi fi', 'guest network', 'just spun', 'just spins', 'wouldn\'t load', 'won\'t load', 'couldn\'t open', 'blank page', 'blank screen', 'blocked', 'blocking', 'hotspot', 'cellular'],
      outline: {
        title: 'Live link won\'t open on court or hotel Wi-Fi',
        audience: 'Attorney viewers, and the reporters and agency admins who send them links',
        answer: 'When a live link won\'t open on a court or hotel network, the network is usually blocking it, and a phone hotspot is the quickest way in.',
        steps: [
          'Open the same link on a phone hotspot. If it loads there, the venue network is blocking it, not the link.',
          'Send the venue\'s IT contact the address the live view uses so they can allow it [check in the app].',
          'If the network can\'t be changed in time, follow the session on a hotspot or cellular data.',
          'Reporters: send counsel this page along with the link before the session starts.',
          'If the link won\'t load on a hotspot either, reply to the link email and a person will check the link itself.',
        ],
      },
      shots: [
        { screen: 'Laptop showing the live view stuck loading', action: 'Open the link on venue Wi-Fi; the page spins', caption: 'Live link stuck loading at a hotel or courthouse?' },
        { screen: 'Phone hotspot settings', action: 'Turn on the hotspot and join it from the laptop', caption: 'Try a hotspot first.' },
        { screen: 'Live view on the hotspot', action: 'Reload the same link; the transcript appears', caption: 'Same link, different network: it works.' },
        { screen: 'Email to the venue\'s IT contact', action: 'Paste the address to allow [check in the app]', caption: 'Ask IT to allow this address before the session.' },
        { screen: 'Share screen in a live job', action: 'Attach this guide while sending the link', caption: 'Reporters: send this guide with the link.' },
      ],
    },
    {
      id: 'topic-list-after',
      title: 'Spelling list on a job that\'s already finished',
      phrases: ['already finished', 'already done', 'afterwards', 'after the fact', 'after the job', 'after the session', 'finished job', 'finished transcript', 're run', 'rerun', 'be applied to', 'apply the spelling list', 'apply the list'],
      outline: {
        title: 'Use a spelling list on a job that\'s already finished',
        audience: 'Reporters and transcribers',
        answer: 'Names added to the spelling list after a job finishes don\'t change the transcript by themselves, but you can still fix every instance at once.',
        steps: [
          'Add the correct spellings to the job\'s spelling list so the next job with these names gets them right.',
          'Open the finished job and look for an option to reapply the spelling list [check in the app].',
          'If there isn\'t one, use Find and replace for each name, starting with the names that appear most.',
          'Check speaker labels and the index for the same names [check in the app: whether replace covers them].',
          'Next time, add names before capture (see "Add names to the spelling list before a job").',
        ],
      },
      shots: [
        { screen: 'Finished transcript with one name spelled three ways', action: 'Scroll through the three spellings', caption: 'Name spelled three ways after the job?' },
        { screen: 'The job\'s spelling list', action: 'Type the correct spelling and save', caption: 'Add the right spelling to the list first.' },
        { screen: 'Finished job menu', action: 'Reapply the list, or open Find and replace [check in the app]', caption: 'Then fix the finished transcript in one pass.' },
        { screen: 'Transcript after the change', action: 'Search the name; every instance now matches', caption: 'Every instance now matches.' },
        { screen: 'New job setup', action: 'Add names before starting capture', caption: 'Next time: add names before the job starts.' },
      ],
    },
    {
      id: 'topic-second-mic',
      title: 'Second microphone is silent in an in-person session',
      phrases: ['second mic', 'second microphone', 'two mics', 'two microphones', 'channel 2', 'second channel', 'second input', 'flat line', 'silent', 'silence', 'in person', 'only one channel'],
      outline: {
        title: 'Second microphone is silent in an in-person session',
        audience: 'Reporters recording in person with two microphones',
        answer: 'When the second microphone records nothing, the job is usually listening to one input, and a quick sound test before going on the record catches it.',
        steps: [
          'Before the session, open the sound test and speak into each microphone. Both meters should move [check in the app: where the second meter shows].',
          'If only one meter moves, set the job\'s input to your two-channel interface, not the laptop\'s built-in microphone [check in the app].',
          'On the interface, check the second channel\'s gain and its phantom power switch if your microphone needs it.',
          'Record a 30-second test and play back each channel on its own.',
          'If channel 2 is still silent, reply with your interface model and a person will take it.',
        ],
      },
      shots: [
        { screen: 'Sound test with one meter moving', action: 'Speak into microphone 2; its meter stays flat', caption: 'Second mic flat in the sound test?' },
        { screen: 'Job audio settings', action: 'Switch the input to the two-channel interface [check in the app]', caption: 'Pick the interface, not the laptop mic.' },
        { screen: 'Close-up of the audio interface', action: 'Turn up channel 2 gain; switch on phantom power if needed', caption: 'Check gain and phantom power on channel 2.' },
        { screen: 'Sound test again', action: 'Speak into each microphone; both meters move', caption: 'Both channels moving: you\'re set.' },
        { screen: 'A 30-second test recording', action: 'Play each channel on its own', caption: 'Play back each channel before going on the record.' },
      ],
    },
    {
      id: 'topic-foot-pedal',
      title: 'Foot pedal for playback',
      phrases: ['foot pedal', 'playback', 'rewinding', 'transcription pedal'],
      outline: null,
      shots: [],
    },
  ];

  const accountTypes = [
    // [number, type, plan]
    [1, 'freelance reporter', 'monthly'],
    [2, 'freelance reporter', 'hourly'],
    [3, 'agency', 'monthly'],
    [4, 'transcriber', 'hourly'],
    [5, 'freelance reporter', 'monthly'],
    [6, 'agency', 'hourly'],
    [7, 'transcriber', 'monthly'],
    [8, 'freelance reporter', 'hourly'],
    [9, 'agency', 'hourly'],
    [10, 'freelance reporter', 'hourly'],
    [11, 'transcriber', 'hourly'],
    [12, 'agency', 'monthly'],
    [13, 'freelance reporter', 'monthly'],
    [14, 'freelance reporter', 'hourly'],
    [15, 'transcriber', 'monthly'],
    [16, 'agency', 'hourly'],
    [17, 'freelance reporter', 'monthly'],
    [18, 'transcriber', 'hourly'],
    [19, 'agency', 'monthly'],
    [20, 'freelance reporter', 'hourly'],
  ];
  const accounts = accountTypes.map(([n, type, plan]) => ({
    id: 'A' + String(n).padStart(2, '0'),
    name: 'Account ' + String(n).padStart(2, '0'),
    type,
    plan,
  }));

  // hand_label is the lane the author expected when writing each email.
  // Lane ids: call_now, money, confidential, record, trust, draft, repeat, unclear.
  const emails = [
    // Monday 14 September
    { id: 'm01', account: 'A04', from_first_name: 'Imran', role: 'transcriber', received: '2026-09-14T08:12', subject: 'Update banner keeps coming back', body: 'There\'s a banner at the top saying my version is out of date. Is it safe to install the update in the middle of a big file? I don\'t want to lose anything.', hand_label: 'draft' },
    { id: 'm02', account: 'A02', from_first_name: 'Dana', role: 'reporter', received: '2026-09-14T08:47', subject: 'Capture won\'t start, depo in 15 min', body: 'My deposition starts in 15 minutes and capture won\'t start. I get a spinning wheel after I hit Record. The attorneys are already setting up.', hand_label: 'call_now' },
    { id: 'm03', account: 'A08', from_first_name: 'Tom', role: 'reporter', received: '2026-09-14T10:05', subject: 'Straight into Eclipse?', body: 'Can I export straight into Eclipse, or do I need to go through RTF first? I\'d like to cut a step out of my evenings.', hand_label: 'draft' },
    { id: 'm04', account: 'A01', from_first_name: 'Nadia', role: 'reporter', received: '2026-09-14T11:30', subject: 'Doctor\'s name spelled three ways', body: 'I forgot to add the doctor\'s name before Friday\'s deposition, so I put it in the spelling list afterwards. The finished transcript still spells it three different ways. Can the list be applied to a job that\'s already finished?', hand_label: 'repeat' },
    { id: 'm05', account: 'A10', from_first_name: 'Hannah', role: 'reporter', received: '2026-09-14T14:22', subject: 'Rest of the month', body: 'I switched to the hourly plan on the 3rd but was billed the full monthly price. Can I get a refund for the rest of the month?', hand_label: 'money' },
    { id: 'm06', account: 'A19', from_first_name: 'Ruth', role: 'agency admin', received: '2026-09-14T16:40', subject: 'Sending counsel the live transcript', body: 'How do our reporters share the live link with counsel during a remote depo? Do the attorneys need their own account?', hand_label: 'draft' },

    // Tuesday 15 September
    { id: 'm07', account: 'A13', from_first_name: 'Priya', role: 'reporter', received: '2026-09-15T07:55', subject: 'App keeps closing', body: 'I have a hearing this morning at 9:30 and the app crashed twice while I was setting up. It closes as soon as I open the job. Please help.', hand_label: 'call_now' },
    { id: 'm08', account: 'A15', from_first_name: 'Bea', role: 'transcriber', received: '2026-09-15T09:18', subject: 'USB pedal', body: 'Does the app work with a USB foot pedal for playback? I can\'t find a setting for it anywhere.', hand_label: 'unclear' },
    { id: 'm09', account: 'A03', from_first_name: 'Grace', role: 'agency admin', received: '2026-09-15T10:42', subject: 'Attorneys couldn\'t get the transcript at the courthouse', body: 'Two attorneys told our reporter the live link wouldn\'t load on the courthouse Wi-Fi last week. It worked once they moved to cellular. Is there a list of what the court\'s network needs to allow?', hand_label: 'repeat' },
    { id: 'm10', account: 'A05', from_first_name: 'Marcus', role: 'reporter', received: '2026-09-15T12:10', subject: 'Offline option on the new laptop', body: 'Offline mode is greyed out on my new Windows laptop. The message mentions virtualization. What do I need to do?', hand_label: 'draft' },
    { id: 'm11', account: 'A04', from_first_name: 'Imran', role: 'transcriber', received: '2026-09-15T15:03', subject: 'Names instead of numbers', body: 'My transcript says Speaker 1 and Speaker 2 everywhere. How do I change them to MR. SMITH and THE WITNESS?', hand_label: 'draft' },
    { id: 'm12', account: 'A02', from_first_name: 'Dana', role: 'reporter', received: '2026-09-15T17:26', subject: 'Witness side not recorded', body: 'In-person session today with two mics. The second microphone showed a flat line the whole time, so the witness side is silent in the recording. The first channel is fine.', hand_label: 'repeat' },

    // Wednesday 16 September
    { id: 'm13', account: 'A18', from_first_name: 'Mei', role: 'transcriber', received: '2026-09-16T08:30', subject: 'Faster exports?', body: 'A friend said there\'s a new version with faster exports. How do I get the latest version on my Mac?', hand_label: 'draft' },
    { id: 'm14', account: 'A01', from_first_name: 'Nadia', role: 'reporter', received: '2026-09-16T09:51', subject: 'Thursday\'s deposition', body: 'The audio is missing for Thursday\'s deposition. The transcript is there, but the play button does nothing and the file shows zero length. I need it for readback questions.', hand_label: 'record' },
    { id: 'm15', account: 'A13', from_first_name: 'Priya', role: 'reporter', received: '2026-09-16T11:14', subject: 'New laptop this weekend', body: 'I\'m switching to a new laptop this weekend. Do I need to go into the BIOS and turn on virtualization again on the new machine?', hand_label: 'draft' },
    { id: 'm16', account: 'A14', from_first_name: 'Owen', role: 'reporter', received: '2026-09-16T13:37', subject: 'Drug names coming up', body: 'How do I add names to the spelling list before a job? I\'ve got a medical malpractice depo next week with a lot of drug names.', hand_label: 'draft' },
    { id: 'm17', account: 'A06', from_first_name: 'Rebecca', role: 'attorney viewer', received: '2026-09-16T15:58', subject: 'Transcript wouldn\'t show at my hotel', body: 'I was counsel on a deposition yesterday and the live link just spun on the hotel Wi-Fi. It worked on my phone\'s hotspot. Is the hotel network blocking something?', hand_label: 'repeat' },
    { id: 'm18', account: 'A16', from_first_name: 'Victor', role: 'agency admin', received: '2026-09-16T17:12', subject: 'Card statement question', body: 'There\'s a charge on our card for $412 that nobody here recognizes. Our bookkeeper wants to dispute it with the bank unless you can explain it. Which account is it for?', hand_label: 'money' },

    // Thursday 17 September
    { id: 'm19', account: 'A10', from_first_name: 'Hannah', role: 'reporter', received: '2026-09-17T08:05', subject: 'Offline depo tomorrow', body: 'I have an offline deposition tomorrow at a courthouse with no Wi-Fi. What should I check tonight so capture works when I get there?', hand_label: 'draft' },
    { id: 'm20', account: 'A08', from_first_name: 'Tom', role: 'reporter', received: '2026-09-17T09:33', subject: 'Only one side came through', body: 'Recorded an in-person depo yesterday with a two-channel interface, and only the first channel has audio. Channel 2 is silent even though the levels moved on the interface itself.', hand_label: 'repeat' },
    { id: 'm21', account: 'A07', from_first_name: 'Sofia', role: 'transcriber', received: '2026-09-17T10:48', subject: 'Page and line numbers', body: 'When I export to a Word document, will the page and line numbers match what I see in the app? My clients check them closely.', hand_label: 'draft' },
    { id: 'm22', account: 'A06', from_first_name: 'Lorraine', role: 'agency admin', received: '2026-09-17T13:20', subject: 'Juvenile hearing next week', body: 'We have a sealed juvenile hearing next week. Does any of the audio leave the reporter\'s laptop when she works offline? The court wants that in writing before the hearing.', hand_label: 'confidential' },
    { id: 'm23', account: 'A09', from_first_name: 'Felipe', role: 'agency admin', received: '2026-09-17T15:45', subject: 'Do all our reporters need this?', body: 'Do all our reporters need to install the update this week, or can they wait until after their jobs? A couple are still on an older version number.', hand_label: 'draft' },
    { id: 'm24', account: 'A07', from_first_name: 'Sofia', role: 'transcriber', received: '2026-09-17T16:59', subject: 'Late case caption', body: 'I got the case caption late and updated the spelling list after the job was done. Is there a way to re-run the transcript so it picks up the new names?', hand_label: 'repeat' },

    // Friday 18 September
    { id: 'm25', account: 'A08', from_first_name: 'Tom', role: 'reporter', received: '2026-09-18T08:21', subject: 'Meter not moving', body: 'We\'re on the record now and the audio meter isn\'t moving. I\'m writing on my machine as a backup, but I need the recording. What do I check first?', hand_label: 'call_now' },
    { id: 'm26', account: 'A15', from_first_name: 'Bea', role: 'transcriber', received: '2026-09-18T09:40', subject: 'Following up on the pedal', body: 'Following up on my foot pedal question. It plugs in fine, but pressing it doesn\'t pause playback in the app.', hand_label: 'unclear' },
    { id: 'm27', account: 'A05', from_first_name: 'Marcus', role: 'reporter', received: '2026-09-18T11:02', subject: 'After the depo ends', body: 'After a deposition ends, how do I revoke the live link? I don\'t want the attorneys to keep watching once we\'re off the record.', hand_label: 'draft' },
    { id: 'm28', account: 'A12', from_first_name: 'Celeste', role: 'agency admin', received: '2026-09-18T12:35', subject: 'Court network trouble', body: 'Our client\'s paralegal says the live link is blocked on the court\'s guest network. She just sees a blank page. Do you have anything we can send to the court\'s IT people?', hand_label: 'repeat' },
    { id: 'm29', account: 'A19', from_first_name: 'Ruth', role: 'agency admin', received: '2026-09-18T14:15', subject: 'Two reporter seats', body: 'Please cancel the two reporter seats we added in August. Those reporters have left the agency and we don\'t want to keep paying for them.', hand_label: 'money' },
    { id: 'm30', account: 'A02', from_first_name: 'Dana', role: 'reporter', received: '2026-09-18T16:28', subject: 'Where are my hours?', body: 'I\'m on the hourly plan. Where can I see how many audio hours I\'ve used so far this month?', hand_label: 'draft' },

    // Monday 21 September
    { id: 'm31', account: 'A17', from_first_name: 'Elena', role: 'reporter', received: '2026-09-21T08:09', subject: 'Can\'t send counsel the link', body: 'Remote deposition in 20 minutes and the Share button is greyed out, so I can\'t send counsel the live link. The witness is waiting already.', hand_label: 'call_now' },
    { id: 'm32', account: 'A20', from_first_name: 'Kevin', role: 'reporter', received: '2026-09-21T09:26', subject: 'Never done this before', body: 'Your setup check says to turn on VT-x in the BIOS. I\'ve never been in the BIOS before. Where do I find it?', hand_label: 'draft' },
    { id: 'm33', account: 'A11', from_first_name: 'Joel', role: 'transcriber', received: '2026-09-21T10:55', subject: 'Witness names still wrong', body: 'The attorney sent me the witness list after the session. I put every name in the spelling list, but the finished transcript didn\'t change. Do I have to fix each one by hand?', hand_label: 'repeat' },
    { id: 'm34', account: 'A12', from_first_name: 'Celeste', role: 'agency admin', received: '2026-09-21T12:40', subject: 'Wrong date on a cover page', body: 'A certified transcript we filed last week shows the wrong hearing date on the cover page. Opposing counsel noticed. We need to know whether that came from the app or from our template.', hand_label: 'record' },
    { id: 'm35', account: 'A18', from_first_name: 'Mei', role: 'transcriber', received: '2026-09-21T14:18', subject: 'All at once?', body: 'Is there a way to rename the speaker labels all at once instead of fixing every line? It takes me ages on long files.', hand_label: 'draft' },
    { id: 'm36', account: 'A10', from_first_name: 'Hannah', role: 'reporter', received: '2026-09-21T16:47', subject: 'Witness mic not picked up', body: 'At a conference room depo on Friday my second mic didn\'t record anything. Its meter never moved in the app. Is there a setting for a second input?', hand_label: 'repeat' },

    // Tuesday 22 September
    { id: 'm37', account: 'A17', from_first_name: 'Elena', role: 'reporter', received: '2026-09-22T08:14', subject: 'What that button does', body: 'What does Prepare for offline actually do? Should I click it the night before or the morning of the session?', hand_label: 'draft' },
    { id: 'm38', account: 'A20', from_first_name: 'Kevin', role: 'reporter', received: '2026-09-22T09:30', subject: 'The rough draft last week', body: 'The rough draft didn\'t come through until two days after the depo, and I lost a client over this. They\'d been with me for six years. I need to understand what happened.', hand_label: 'trust' },
    { id: 'm39', account: 'A16', from_first_name: 'Victor', role: 'agency admin', received: '2026-09-22T11:05', subject: 'Counsel at the hotel', body: 'Counsel staying at the hotel by the courthouse couldn\'t open the live view on the hotel Wi-Fi this week. The same laptop worked from their office. What do we tell them?', hand_label: 'repeat' },
    { id: 'm40', account: 'A11', from_first_name: 'Joel', role: 'transcriber', received: '2026-09-22T12:52', subject: 'Same case every month', body: 'Can I load a word list of proper names before I start a new file? The same case comes back every month.', hand_label: 'draft' },
    { id: 'm41', account: 'A03', from_first_name: 'Grace', role: 'agency admin', received: '2026-09-22T14:36', subject: 'Wrong attorney', body: 'I sent the live link for today\'s session to the wrong attorney by mistake. How do I cancel or revoke it before they open it?', hand_label: 'draft' },
    { id: 'm42', account: 'A12', from_first_name: 'Celeste', role: 'agency admin', received: '2026-09-22T16:20', subject: 'Our scopist\'s software', body: 'One of our scopists works in CaseCAT. What\'s the right export so the file opens cleanly in her CAT software?', hand_label: 'draft' },

    // Wednesday 23 September
    { id: 'm43', account: 'A03', from_first_name: 'Grace', role: 'agency admin', received: '2026-09-23T07:48', subject: 'Reporter stuck at the courthouse', body: 'One of our reporters has a trial session starting in 10 minutes and offline mode won\'t turn on. She\'s been on the phone with our office, but nobody here can get it working. Can someone call her?', hand_label: 'call_now' },
    { id: 'm44', account: 'A15', from_first_name: 'Bea', role: 'transcriber', received: '2026-09-23T09:12', subject: 'Pedal again', body: 'Still hoping to hear about the foot pedal. I\'m rewinding with the keyboard for now and it\'s slowing me down a lot.', hand_label: 'unclear' },
    { id: 'm45', account: 'A20', from_first_name: 'Kevin', role: 'reporter', received: '2026-09-23T10:37', subject: 'Yesterday\'s job', body: 'Can I apply the spelling list to yesterday\'s job? It\'s already finished, and I\'d rather not search and replace forty names.', hand_label: 'repeat' },
    { id: 'm46', account: 'A02', from_first_name: 'Dana', role: 'reporter', received: '2026-09-23T12:05', subject: 'First offline job', body: 'I\'m doing my first offline job next month. Is there a one-time setup I should do now, like the virtualization thing?', hand_label: 'draft' },
    { id: 'm47', account: 'A04', from_first_name: 'Imran', role: 'transcriber', received: '2026-09-23T13:44', subject: 'Two payments', body: 'I was billed twice this month, once on the 1st and again on the 2nd, for the same amount. Can you check which one is real?', hand_label: 'money' },
    { id: 'm48', account: 'A14', from_first_name: 'Owen', role: 'reporter', received: '2026-09-23T15:30', subject: 'Request from a client', body: 'A client asked me to make sure the audio from last Tuesday\'s deposition is removed from your servers. Can you delete the audio and confirm once it\'s gone?', hand_label: 'confidential' },

    // Thursday 24 September
    { id: 'm49', account: 'A05', from_first_name: 'Marcus', role: 'reporter', received: '2026-09-24T08:58', subject: 'Counsel lost the feed', body: 'Witness is on the stand and the live link dropped for opposing counsel. Their screen just says reconnecting. I can keep writing, but they can\'t see anything.', hand_label: 'call_now' },
    { id: 'm50', account: 'A17', from_first_name: 'Elena', role: 'reporter', received: '2026-09-24T09:58', subject: 'Offline gone after last night', body: 'I installed the update last night and now offline mode is greyed out. Did the new version turn off virtualization?', hand_label: 'unclear' },
    { id: 'm51', account: 'A06', from_first_name: 'Lorraine', role: 'agency admin', received: '2026-09-24T11:21', subject: 'Same problem, different attorney', body: 'Another attorney on our cases hit a blank screen on the courthouse Wi-Fi on Tuesday. Is this something on your side or theirs?', hand_label: 'repeat' },
    { id: 'm52', account: 'A19', from_first_name: 'Ruth', role: 'agency admin', received: '2026-09-24T13:03', subject: 'For the kit bags', body: 'Is there a checklist our reporters should run before each offline session? We\'d like to print it for their kit bags.', hand_label: 'draft' },
    { id: 'm53', account: 'A07', from_first_name: 'Sofia', role: 'transcriber', received: '2026-09-24T14:50', subject: 'Frozen again', body: 'Third time this month the app has frozen in the middle of a long file, and I\'ve had to redo an hour of work. I\'m honestly thinking of switching to something else. Is this a known problem?', hand_label: 'trust' },
    { id: 'm54', account: 'A18', from_first_name: 'Mei', role: 'transcriber', received: '2026-09-24T16:34', subject: 'Easier on the eyes', body: 'Is there a dark theme? Staring at a white screen for eight hours a day is rough on my eyes.', hand_label: 'unclear' },

    // Friday 25 September
    { id: 'm55', account: 'A13', from_first_name: 'Priya', role: 'reporter', received: '2026-09-25T08:40', subject: 'Names added later', body: 'I added names to the spelling list after the fact, and nothing changed in the finished transcript. Does the list only work if it\'s filled in ahead of time?', hand_label: 'repeat' },
    { id: 'm56', account: 'A16', from_first_name: 'Victor', role: 'agency admin', received: '2026-09-25T10:10', subject: 'Setting it up from the office', body: 'Can our office set up the spelling list for a job before the reporter gets there? We usually have the case caption a day ahead, and we\'d like names spelled right from the start.', hand_label: 'draft' },
    { id: 'm57', account: 'A09', from_first_name: 'Felipe', role: 'agency admin', received: '2026-09-25T11:48', subject: 'Monday\'s job is gone', body: 'One of our reporters says a job from Monday was deleted, and she didn\'t do it. It\'s not in the trash either. The transcript is due to the firm next week.', hand_label: 'record' },
    { id: 'm58', account: 'A14', from_first_name: 'Owen', role: 'reporter', received: '2026-09-25T13:15', subject: 'One mic records nothing', body: 'I use two microphones for in-person jobs. Since last week the second one records silence. Do I need to pick it somewhere in the app?', hand_label: 'repeat' },
    { id: 'm59', account: 'A09', from_first_name: 'Alana', role: 'attorney viewer', received: '2026-09-25T14:57', subject: 'Before next week\'s depo', body: 'The court reporter said she\'d send the live link before the depo. Do I need to install anything, or does it work in a browser?', hand_label: 'draft' },
    { id: 'm60', account: 'A06', from_first_name: 'Lorraine', role: 'agency admin', received: '2026-09-25T16:12', subject: 'Volume is up', body: 'We\'ve been on the hourly plan, but our volume is up. How do we change plan to monthly, and when does it take effect?', hand_label: 'draft' },
  ];

  root.ASK_ONCE_DATA = Object.freeze({ period, helpPages, watchTopics, accounts, emails });
})(globalThis);
