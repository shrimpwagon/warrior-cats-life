// Warrior Cats Life — game data tables.

const PELT_COLORS = [
  { id: 'ginger',     name: 'Ginger',       base: '#c47a30', accent: '#a3601f', belly: '#f0d8a0' },
  { id: 'black',      name: 'Black',        base: '#2a2520', accent: '#0e0a08', belly: '#5d5249' },
  { id: 'white',      name: 'White',        base: '#f5efe2', accent: '#d8cfb4', belly: '#ffffff' },
  { id: 'gray',       name: 'Gray',         base: '#7a7a7a', accent: '#4a4a4a', belly: '#bfbfbf' },
  { id: 'brown',      name: 'Brown',        base: '#7d5d3a', accent: '#5d432a', belly: '#b39368' },
  { id: 'cream',      name: 'Cream',        base: '#e8d2a0', accent: '#c5b079', belly: '#f7e7c0' },
  { id: 'silver',     name: 'Silver',       base: '#b0b8c0', accent: '#7d8590', belly: '#dde2e8' },
  { id: 'calico',     name: 'Calico',       base: '#c47a30', accent: '#2a2520', belly: '#f5efe2', special: 'calico' },
  { id: 'tortoiseshell', name: 'Tortoiseshell', base: '#7d5d3a', accent: '#2a2520', belly: '#c47a30', special: 'tortie' },
  { id: 'blue-gray',  name: 'Blue-gray',    base: '#6a7a8a', accent: '#3a4858', belly: '#a8b3c0' }
];

const PELT_DESIGNS = [
  { id: 'solid',    name: 'Solid' },
  { id: 'tabby',    name: 'Tabby (stripes)' },
  { id: 'spotted',  name: 'Spotted' },
  { id: 'mackerel', name: 'Mackerel (fine stripes)' },
  { id: 'classic',  name: 'Classic (swirls)' }
];

const EYE_COLORS = [
  { id: 'amber',  name: 'Amber',  color: '#d49a2a' },
  { id: 'green',  name: 'Green',  color: '#3a8a3a' },
  { id: 'blue',   name: 'Blue',   color: '#3878c4' },
  { id: 'yellow', name: 'Yellow', color: '#e8c63a' },
  { id: 'hazel',  name: 'Hazel',  color: '#8a6a3a' },
  { id: 'copper', name: 'Copper', color: '#a85a2a' }
];

const DEN_TYPES = [
  { id: 'leader',     name: "Leader's den",      sprite: 'img/den-leader.svg',      desc: 'For the clan leader.',  size: 110, role: 'leader',      cost: 10 },
  { id: 'deputy',     name: "Deputy's den",      sprite: 'img/den-deputy.svg',      desc: 'For the leader\'s second-in-command.', size: 110, role: 'deputy', cost: 10 },
  { id: 'medicine',   name: "Medicine cat den",  sprite: 'img/den-medicine.svg',    desc: 'Herbs and healing.',    size: 110, role: 'medicine cat',cost: 10 },
  { id: 'warrior',    name: "Warriors' den",     sprite: 'img/den-warrior.svg',     desc: 'Where warriors sleep.', size: 120, role: 'warrior',     cost: 10 },
  { id: 'apprentice', name: "Apprentices' den",  sprite: 'img/den-apprentice.svg',  desc: 'For training cats.',    size: 110, role: 'apprentice',  cost: 10 },
  { id: 'nursery',    name: 'Nursery',           sprite: 'img/den-nursery.svg',     desc: 'Queens and kits.',      size: 120, role: 'queen', roleOptions: ['queen', 'kit'], cost: 10 },
  { id: 'elder',      name: "Elders' den",       sprite: 'img/den-elder.svg',       desc: 'For retired cats.',     size: 120, role: 'elder',       cost: 10 },
  { id: 'kits',       name: 'Kit play mound',    sprite: 'img/den-kits.svg',        desc: 'A safe play spot.',     size: 100, role: 'kit',         cost: 10 },
  { id: 'freshkill',  name: 'Fresh-kill pile',   sprite: 'img/den-freshkill.svg',   desc: 'Hungry cats can feed themselves here.',   size: 100, role: null, cost: 10 },
  { id: 'mediator',   name: "Mediator's den",    sprite: 'img/den-mediator.svg',    desc: 'Where disputes are settled.', size: 110, role: 'mediator', cost: 10 },
  { id: 'gatheringtree', name: 'Gathering tree', sprite: 'img/den-gatheringtree.svg', desc: 'Other clans gather here every 10 days. Only buildable after winning a war.', size: 130, role: null, cost: 0, requiresWarWin: true }
];

const PREY_TYPES = [
  { id: 'mouse',    name: 'Mouse',    sprite: 'img/prey-mouse.svg',    speed: 1.0, value: 1, weight: 50 },
  { id: 'vole',     name: 'Vole',     sprite: 'img/prey-vole.svg',     speed: 0.8, value: 1, weight: 30 },
  { id: 'squirrel', name: 'Squirrel', sprite: 'img/prey-squirrel.svg', speed: 1.4, value: 2, weight: 15 },
  { id: 'bird',     name: 'Bird',     sprite: 'img/prey-bird.svg',     speed: 1.7, value: 2, weight: 5 }
];

// First names that combine into Warriors-style cat names.
const NAME_PREFIXES = [
  'Bramble','Fern','Stone','Ash','Moss','Fire','Cloud','River','Leaf','Oak',
  'Star','Thorn','Snow','Shadow','Mist','Sun','Dust','Hollow','Wren','Spider',
  'Frost','Berry','Bracken','Crow','Owl','Honey','Briar','Reed','Hawk','Tawny'
];
const NAME_SUFFIXES = [
  'paw','claw','heart','tail','fur','whisker','stripe','fang','foot','flight',
  'song','leaf','pelt','spirit','shine','wing','storm','breeze','splash','ear'
];

function randomName() {
  const a = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
  const b = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
  return a + b;
}

// Suffix rules per role: apprentice→paw, kit→kit, leader→star.
// Warriors specifically must NOT end in "paw" (they've earned their warrior name).
function randomNameForRole(role) {
  const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
  if (role === 'apprentice') return prefix + 'paw';
  if (role === 'kit')        return prefix + 'kit';
  if (role === 'leader')     return prefix + 'star';
  if (role === 'warrior') {
    // Pick a suffix, avoiding 'paw'.
    let suf;
    do { suf = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)]; }
    while (suf === 'paw');
    return prefix + suf;
  }
  return randomName();
}

// Force the role-specific suffix even if the player typed something else.
function applyRoleSuffix(name, role) {
  if (!name) return name;
  const lower = name.toLowerCase();
  if (role === 'apprentice' && !lower.endsWith('paw'))  return name + 'paw';
  if (role === 'kit'        && !lower.endsWith('kit'))  return name + 'kit';
  if (role === 'leader'     && !lower.endsWith('star')) return name + 'star';
  // Warriors shouldn't keep a 'paw' suffix from their apprentice days.
  if (role === 'warrior'    &&  lower.endsWith('paw'))  return name.slice(0, -3);
  return name;
}

// Daily thoughts/wants. Some require feeding.
const DAILY_WANTS = [
  { id: 'food',         text: 'I am hungry. Could I have some prey?', need: 'food' },
  { id: 'food2',        text: 'My belly is empty. I want a fat mouse.', need: 'food' },
  { id: 'food3',        text: 'Has anyone been to the fresh-kill pile?', need: 'food' },
  { id: 'rest',         text: 'I want to curl up in my den and rest.', need: null },
  { id: 'sky',          text: 'The clouds are moving fast today. I wonder where they go.', need: null },
  { id: 'friend',       text: "I'd like to talk to a clanmate today.", need: null },
  { id: 'patrol',       text: 'A border patrol would feel good.', need: null },
  { id: 'training',     text: 'I want to practice my hunting crouch.', need: null },
  { id: 'starclan',     text: 'I had a dream of StarClan last night.', need: null },
  { id: 'kits',         text: 'I love watching the kits play.', need: null },
  { id: 'prey',         text: 'I think I smelled a squirrel near the great oak.', need: null },
  { id: 'leader',       text: 'When will the next clan meeting be?', need: null },
  { id: 'restless',     text: 'My paws feel restless. I should run.', need: null },
  { id: 'medicine',     text: 'My fur is itching... maybe a herb would help.', need: null },
  { id: 'lonely',       text: 'I feel a little alone today.', need: null }
];

// Generic dialogue lines used when two cats meet.
const TALK_OPENERS = [
  '{a} flicks {a-tail} tail in greeting.',
  '{a} bumps muzzles with {b}.',
  '{a} sniffs the air around {b}.',
  '{a} rumbles a low purr at {b}.',
  '{a} pads up to {b} with bright eyes.',
  '{a} settles down beside {b} in the grass.',
  '{a} catches {b}\'s scent and trots over.',
  '{a} brushes past {b}, then pauses.',
  '{a} licks the top of {b}\'s head.',
  '{a} curls {a-tail} tail around {b}.',
  '{a} lets out a soft mrrow at {b}.',
  '{a} sits down tail-to-tail with {b}.',
  '{a} cuts across the clearing toward {b}.',
  '{a} arches their back in a long stretch beside {b}.',
  '{a} looks up from grooming as {b} approaches.',
  '{a} taps {b}\'s flank with a paw.',
  '{a} lays {a-tail} tail across {b}\'s back.',
  '{a} narrows {a-tail} eyes at {b}.'
];

// 40 friendship body lines — bonds, memories, training, growing up, hopes.
const TALK_BODIES_FRIEND = [
  '"Have you been to the river? The fish were running."',
  '"I dreamed of StarClan again. They sang of green-leaf."',
  '"That patrol yesterday was long. My paws ache."',
  '"You always know what to say."',
  '"Race you to the great oak?"',
  '"Remember when we were both apprentices? We were terrible."',
  '"You\'re the only one I can really talk to about this."',
  '"My mother would have liked you."',
  '"I caught the biggest mouse this morning. You should have seen it."',
  '"Do you ever think about the cat we were before our warrior names?"',
  '"I could sleep through a storm with you here."',
  '"You smell like the willow tree by the river."',
  '"That kit is going to be trouble — just like you were."',
  '"I owe you for that day on the border. I haven\'t forgotten."',
  '"My mentor would say I\'ve gone soft. Maybe I have."',
  '"Did I tell you about the dream where I could fly?"',
  '"You laughed at my hunting crouch. I am NEVER showing you again."',
  '"How do you always know the right thing to say?"',
  '"I think I love this clan more than anything."',
  '"Do you ever miss being small?"',
  '"You and I — we\'ve been through everything."',
  '"My littermate would have loved meeting you."',
  '"There\'s a quiet between us I can\'t find anywhere else."',
  '"I hope my kits one day meet a friend like you."',
  '"You taught me what loyalty looks like."',
  '"My father always said the moon keeps no secrets. I get it now."',
  '"You make the hard days easier."',
  '"I want to bring you on every patrol. You\'re my luck."',
  '"Do you remember the time we got lost in the marshlands?"',
  '"I\'ve been working on a new battle move. Want to see?"',
  '"You were the first cat to be kind to me here."',
  '"My mother told me to pick friends like prey — carefully. I picked well."',
  '"Some days I forget what fear feels like, when I\'m with you."',
  '"You\'ll be a great elder one day. You already give the best advice."',
  '"I\'ve been thinking about who I was a season ago. I don\'t know that cat anymore."',
  '"Walk under the stars with me tonight?"',
  '"Let\'s sneak some prey from the pile, you and me."',
  '"I think I\'ll always be a little bit a kit, around you."',
  '"Promise we\'ll grow old together, in this clan?"',
  '"Even StarClan can\'t hold a candle to having you as a friend."'
];

// 40 "getting to know you" body lines — strangers, recent acquaintances.
const TALK_BODIES_NEW = [
  '"I don\'t think we\'ve really talked yet."',
  '"Your eyes are like sunlight on water."',
  '"What do you think of the new dens?"',
  '"Do you remember when the clearing was empty?"',
  '"What was your mother like?"',
  '"Where did you grow up?"',
  '"Do you remember being a kit?"',
  '"What\'s your favorite season?"',
  '"What did your mentor teach you first?"',
  '"Have you ever seen another clan up close?"',
  '"My pelt is soaked. Mind grooming behind my ears?"',
  '"I had the strangest dream last night."',
  '"What do you think StarClan is really like?"',
  '"Do you ever miss the nursery?"',
  '"What\'s your favorite prey to catch?"',
  '"I sometimes wonder if anything lies beyond the territory."',
  '"What was your favorite game when you were small?"',
  '"What\'s the worst thing you\'ve ever eaten?"',
  '"Did you ever fall out of a tree as a kit?"',
  '"What\'s the bravest thing you\'ve ever done?"',
  '"Sometimes I want to just run, all night, until the moon sets."',
  '"What was the first thing you ever caught?"',
  '"Tell me something no one else knows about you."',
  '"Did you have brothers or sisters?"',
  '"What\'s the strangest twoleg-thing you\'ve seen?"',
  '"My paws still hurt from training. Yours?"',
  '"Do you think the moon watches us back?"',
  '"What do you do when you can\'t sleep?"',
  '"Who taught you to hunt?"',
  '"What\'s your favorite spot in the territory?"',
  '"Sometimes I feel like I don\'t fit in here."',
  '"Are you scared of foxes? I won\'t laugh."',
  '"My fur was a different color when I was a kit."',
  '"Have you ever felt rain in greenleaf? Best feeling in the world."',
  '"What does your name mean to you?"',
  '"I\'ve been trying to learn the call of every bird. It\'s harder than it sounds."',
  '"Do you think we choose our destiny, or is it chosen for us?"',
  '"What was your favorite story your parents told?"',
  '"I caught a frog yesterday. It was disappointing."',
  '"Will you walk patrol with me sometime?"'
];

// 40 enmity body lines — slights, threats, lingering grudges.
const TALK_BODIES_FOE = [
  '"Watch where you put your paws."',
  '"You think you\'re so clever."',
  '"Stay out of my fur."',
  '"That last patrol was your fault."',
  '"I\'ve been waiting to say this — you\'re a disgrace."',
  '"My mother warned me about cats like you."',
  '"You\'ll mess this clan up. Just watch."',
  '"Don\'t pretend you care."',
  '"Even your scent makes me want to hiss."',
  '"You took the last fresh-kill. Of course you did."',
  '"I\'m surprised you\'re still here."',
  '"You wouldn\'t last a moonrise without the rest of us."',
  '"Don\'t look at me like you understand."',
  '"Your mentor must have given up on you early."',
  '"I haven\'t forgotten what you said. I won\'t."',
  '"Stop pretending to be something you\'re not."',
  '"You could fall in the river and I\'d watch."',
  '"You think you\'re StarClan-blessed? You\'re not."',
  '"Even kits know to stay away from you."',
  '"My father would have torn into you."',
  '"Don\'t patrol with me. Ever."',
  '"You\'re lucky the leader doesn\'t see what I see."',
  '"You\'re a fox in cat\'s fur."',
  '"I dream about the day you leave."',
  '"You don\'t belong here."',
  '"I\'d trade you for a moldy mouse."',
  '"You were a sneaky kit and you\'re a sneaky warrior."',
  '"Did StarClan even bless your warrior name?"',
  '"You couldn\'t catch a sleeping squirrel."',
  '"Stay on your side of the camp."',
  '"I\'ve seen rocks with more sense than you."',
  '"You ate fast at the kill-pile, like always."',
  '"You think no one sees what you do?"',
  '"Cross me one more time. Just once."',
  '"You don\'t even know how much you\'ve cost this clan."',
  '"I\'m done being polite."',
  '"You\'re a worse mentor than my mentor was."',
  '"I\'d rather hunt with a twoleg than you."',
  '"Your scent in the den makes me sick."',
  '"You\'re going to die alone, and I won\'t mourn."'
];

// 40 mate-specific body lines — deep love, plans for kits, shared futures.
const TALK_BODIES_MATE = [
  '"You\'re my whole sky."',
  '"I dreamed about you again. I always dream about you."',
  '"Do you think we\'ll have kits one day?"',
  '"I want every dawn with you."',
  '"My heart is calmer when I hear you breathe."',
  '"You\'re the only home I\'ve ever needed."',
  '"Even on the hardest days, you make me purr."',
  '"I\'d walk into a thunderpath for you. Not that I should."',
  '"Tell me about when you were a kit again. I love that story."',
  '"Your fur smells like the moor in newleaf."',
  '"When I look at you, I see every season."',
  '"I want to grow old with you in the elders\' den."',
  '"Sometimes I just lie awake watching you sleep."',
  '"I never thought I\'d love anyone like this."',
  '"You\'re the first cat who ever truly knew me."',
  '"Every patrol I go on, I just want to come back to you."',
  '"I\'d rather share a whisker of yours than feast alone."',
  '"You\'re what StarClan must have meant by destiny."',
  '"I hope our kits have your eyes."',
  '"Do you remember the night we first walked under the stars?"',
  '"I\'d give my last life for one more season with you."',
  '"You make me brave."',
  '"I love it when you laugh — really laugh."',
  '"My mother dreamed of someone like you for me. She\'d be glad."',
  '"Let\'s slip away to the river later. Just us."',
  '"You always know when I\'m hurting, even before I do."',
  '"I can\'t believe you chose me."',
  '"I want to spend my ninth life curled against you."',
  '"You\'re warmth in greenleaf and shelter in leaf-bare."',
  '"I memorized the sound of your purr a long time ago."',
  '"If I ever lose you, I don\'t know what I\'d do."',
  '"You taught me what love is."',
  '"Some nights I can\'t even pray properly. I just think about you."',
  '"Tell me about the kits you used to imagine. I want to know."',
  '"My favorite scent in the world is rain on your fur."',
  '"You see me. You really see me. That\'s a rare thing."',
  '"Promise to keep being you, no matter what?"',
  '"I want to hear about your day. All of it. The boring parts especially."',
  '"You\'re my mate. You\'re my forever."',
  '"Even StarClan must envy what we have."'
];

// Lines that mention a third clanmate {c} — gossip, observations, praise. Mixed
// into normal conversation when other cats exist in the clan.
const THIRD_CAT_LINES_NEW = [
  '"What do you think of {c}? I can\'t read them yet."',
  '"{c} seems different than I expected."',
  '"Have you been on patrol with {c}? Are they friendly?"',
  '"Everyone keeps talking about {c}. What\'s the deal?"',
  '"{c} keeps glancing at me in camp. Is that just me?"',
  '"Tell me about {c}. They seem hard to know."',
  '"{c} laughed at my hunting crouch. I\'m never living it down."'
];
const THIRD_CAT_LINES_FRIEND = [
  '"Have you noticed how {c} has been moping around lately?"',
  '"I was on patrol with {c} yesterday — they\'re a great hunter."',
  '"Did you hear about {c} catching that hawk?"',
  '"{c} keeps trying to teach the apprentices the wrong moves."',
  '"I think {c} could use a friend right now."',
  '"{c} told me the funniest thing about you. Want to know?"',
  '"You and {c} would actually get along, I think."',
  '"{c} sleeps with their paws in the air. I\'ve seen it."',
  '"Don\'t tell {c} I said this, but they\'re carrying the patrols."'
];
const THIRD_CAT_LINES_FOE = [
  '"{c} agrees with me — you\'re a problem."',
  '"Don\'t think {c} hasn\'t noticed your attitude."',
  '"Even {c} can\'t stand you. Did you know?"',
  '"{c} and I were just talking about how lazy you\'ve gotten."',
  '"You think {c} is on your side? They\'re not."'
];
const THIRD_CAT_LINES_MATE = [
  '"Did you see how {c} looked at us today? I think they know."',
  '"{c} mentioned us in the warriors\' den. Apparently we\'re an inspiration."',
  '"I caught {c} watching us yesterday. Sweet, isn\'t it?"',
  '"{c} told me they\'re happy for us. That meant a lot."',
  '"I want our kits one day to grow up around cats like {c}."',
  '"Even {c} can\'t hide a smile when they see us together."'
];

// Lines that sound like a specific personality. When a cat with that trait
// speaks, there's a chance their body line is replaced with one of these.
const PERSONALITY_LINES = {
  energetic: [
    '"I just ran the whole territory! Want to come?"',
    '"My paws can\'t stop moving today."',
    '"Race you to the great oak!"',
    '"I\'ve hunted, patrolled, AND chased a butterfly. What\'s next?"',
    '"Sitting still is the worst. Move with me."'
  ],
  outgoing: [
    '"I love camp days when everyone\'s talking."',
    '"You should come by the warriors\' den tonight."',
    '"Tell me about your day. All of it."',
    '"Come on, we never just talk anymore."',
    '"I want to know everyone here. Including you."'
  ],
  annoying: [
    '"You\'ll hear about it whether you like it or not."',
    '"Did I tell you about the time I caught two voles at once?"',
    '"Listen, listen, this is important."',
    '"Hey. Hey. Look at me. Hey."',
    '"I have an opinion and I\'m about to share it."'
  ],
  shy: [
    '"I... I shouldn\'t be talking. Sorry."',
    '"Could we just sit quietly for a moment?"',
    '"I don\'t know how to say what I mean."',
    '"You go first. I\'ll listen."',
    '"My voice always sounds wrong out loud."'
  ],
  grumpy: [
    '"Fine. What do you want."',
    '"Don\'t expect me to smile about it."',
    '"Everyone\'s loud today. Including you."',
    '"You wouldn\'t understand. Nobody does."',
    '"I\'ve been in a bad mood since dawn. Don\'t take it personally."'
  ],
  playful: [
    '"Pounce on this leaf with me!"',
    '"Watch this!"',
    '"You\'re too serious. Let\'s play."',
    '"Bet you can\'t catch my tail."',
    '"Today is a great day to do something silly."'
  ],
  wise: [
    '"There\'s a saying — still water sees deepest."',
    '"Listen before you act."',
    '"My mentor told me — no fight is won twice."',
    '"The clearest answer is usually the kindest one."',
    '"You\'re thinking about it too much. Sometimes the answer just is."'
  ],
  mysterious: [
    '"You don\'t need to know everything about me."',
    '"There are stars only I dream of."',
    '"Maybe. Maybe not."',
    '"Let me keep some things to myself."',
    '"What I saw last night was... not for sharing."'
  ]
};

// Cutscene lines, varied by speaker personality. Each personality has 2-3
// alternates per slot so the same cat won't sound robotic on repeat cutscenes.
const CONFESS_OPEN = {
  energetic:  ['"I have to tell you something! It can\'t wait!"', '"My heart\'s pounding — I have to say this NOW."'],
  outgoing:   ['"Listen — I\'ve been wanting to say this out loud."', '"I came to find you on purpose. There\'s a thing."'],
  shy:        ['"There\'s... there\'s something I want to say. If that\'s okay."', '"Could I... talk to you? Just for a moment?"'],
  grumpy:     ['"Don\'t look at me like that. I\'m only saying this once."', '"Stop. Listen. I\'ve been holding this in too long."'],
  playful:    ['"I have a secret. Bet you can\'t guess what."', '"Pounce-tag me later. First — I have to say something."'],
  wise:       ['"There\'s something I\'ve been weighing for a long time."', '"I\'ve been turning a thought over and over. I\'d like to share it."'],
  mysterious: ['"What I\'m about to say... I haven\'t told anyone."', '"There are things I keep close. This isn\'t one of them anymore."'],
  annoying:   ['"Hey hey hey — wait. Wait. Come here. I have to tell you a thing."', '"Listen, listen, listen. This is important. LISTEN."']
};
const CONFESS_DECLARE = {
  energetic:  ['"I love you! I think I have for ages!"', '"I love you. There — said it. PHEW."'],
  outgoing:   ['"I\'m in love with you. I want the whole clan to know."', '"I love you. You. Specifically you."'],
  shy:        ['"I... I have feelings for you. I have for a while."', '"You\'re the only cat I think about. I love you."'],
  grumpy:     ['"I love you. Don\'t make a thing of it."', '"...I love you. I hate that I do, but I do."'],
  playful:    ['"I love you. And I\'ll race you to prove it."', '"I love you. I made up a song about you. It\'s bad."'],
  wise:       ['"My heart has belonged to you for moons. I should have said it sooner."', '"Loving you isn\'t a question for me anymore. It\'s a fact."'],
  mysterious: ['"You\'ve been in every dream I\'ve had. I can\'t hide it."', '"I love you. Some truths are too heavy to carry alone."'],
  annoying:   ['"I LOVE you. Did you hear me? I LOVE you."', '"I love you and I\'m saying it five times tomorrow too."']
};
const CONFESS_REPLY = {
  energetic:  ['"YES! I love you too! Race me to the river!"', '"You love me?? I love you back, twice!"'],
  outgoing:   ['"I love you. I want the whole clan to know."', '"I\'ve been wishing you\'d say it. I love you, too."'],
  shy:        ['"...I was hoping you\'d say that."', '"I... I love you, too. I never thought I could say that."'],
  grumpy:     ['"...took you long enough."', '"Fine. I love you back. There. Don\'t make me say it again."'],
  playful:    ['"Took you long enough! Catch me — I\'ll let you."', '"I love you. Now race me."'],
  wise:       ['"I\'ve been waiting for this moment. I love you."', '"My heart already knew. I love you."'],
  mysterious: ['"You see me. You really see me. Of course I love you back."', '"I\'ve dreamed of this moment. I love you."'],
  annoying:   ['"FINALLY! I love you too! Loud, just like you!"', '"Yes! Yes yes yes! I love you!"']
};
const DATE_OPEN = {
  energetic:  ['"I want to walk every paw of this territory with you."', '"I love being here with you. Let\'s NEVER stop walking."'],
  outgoing:   ['"I want every cat to see how good we are together."', '"You make me proud. I want to walk camp at your side, always."'],
  shy:        ['"I get nervous when we\'re alone. But it\'s a good nervous."', '"I keep wanting more time with you. Is that okay?"'],
  grumpy:     ['"I don\'t like much. I like you."', '"You annoy me less than everyone else. That\'s saying a lot."'],
  playful:    ['"Let\'s do the silliest thing we can think of, just us."', '"I keep daydreaming about you. It\'s embarrassing. Kind of."'],
  wise:       ['"You\'re the calmest place in this clan for me."', '"I see seasons of us ahead. Whole moons of us."'],
  mysterious: ['"There\'s something between us. Even StarClan watches it."', '"I dreamed of you again. Exactly as you are."'],
  annoying:   ['"You like me back. You can\'t take it back. Hah."', '"Tell me you love me. Tell me again. One more time."']
};
const DATE_REPLY_MATE = {
  energetic:  ['"I\'m yours. Forever! Race me there!"', '"YES, until StarClan calls!"'],
  outgoing:   ['"I want every cat to know — you\'re mine."', '"Then we tell the whole clan tomorrow."'],
  shy:        ['"I\'m yours, until StarClan calls."', '"Yes... yes. I want this. I want you."'],
  grumpy:     ['"...fine. Forever. Don\'t make me repeat it."', '"You and me, until I\'m grey. Deal."'],
  playful:    ['"Forever. And I get to pounce on you whenever."', '"Yours! Mine! Forever! Catch me!"'],
  wise:       ['"Then I\'m yours, until StarClan calls."', '"My heart agrees. So does my mind. So do my paws."'],
  mysterious: ['"Then we share even the things no one else hears."', '"Forever was always the plan."'],
  annoying:   ['"FOREVER! And ever! And ever! And ever!"', '"YES! Forever! Tell me again! Forever!"']
};
const DATE_REPLY_CRUSH = {
  energetic:  ['"Let\'s figure it out, fast!"', '"Whatever it is, I\'m in!"'],
  outgoing:   ['"Then we\'ll figure it out, together."', '"I want every step with you."'],
  shy:        ['"I\'d like that. I\'d really like that."', '"...okay. Yes. Yes please."'],
  grumpy:     ['"Hmph. Fine. Together."', '"Together. Stop looking so smug."'],
  playful:    ['"Together! Now bet you can\'t catch me!"', '"Together. And then a chase."'],
  wise:       ['"Then we\'ll walk it slowly, side by side."', '"One moon at a time, together."'],
  mysterious: ['"Together. Even the parts no one sees."', '"Then it\'s our path, no one else\'s."'],
  annoying:   ['"Together! Forever! I\'m saying it loud!"', '"Together!! Tell me yes again!!"']
};

// Replies grouped by tone — short, general acknowledgments that fit any opener.
const TALK_REPLIES_NEW = [
  '"...maybe. We should talk more."',
  '"That\'s an interesting thought."',
  '"I\'d like that."',
  '"You\'re kind to ask."',
  '"Hmm. I never thought about it that way."',
  '"Tell me more sometime."',
  '"I\'ll think about that for a long time."',
  '"You\'re full of surprises."',
  '"Huh. I didn\'t know that about you."',
  '"That\'s a good point."',
  '"I\'ll have to sit with that one."',
  '"You make me want to think harder."',
  '"You and I see things differently. I like that."',
  '"That\'s the most honest thing anyone\'s said to me today."',
  '"Now you\'ve got me curious."',
  '"I haven\'t thought about it that way in moons."'
];
const TALK_REPLIES_FRIEND = [
  '"You\'re right. Thank you for talking."',
  '"I\'m glad you said that."',
  '"You always know."',
  '"That means a lot, coming from you."',
  '"You and me — always."',
  '"I needed to hear that today."',
  '"You\'re a gift to this clan."',
  '"I\'d say the same back to you, twice over."',
  '"You always make me feel seen."',
  '"That\'s exactly the kind of thing I love about you."',
  '"You read me like the wind."',
  '"I owe you for this conversation."',
  '"I\'ll carry that with me."',
  '"Same back, friend. Always."',
  '"You make me a better cat."',
  '"That\'s why we\'re friends."'
];
const TALK_REPLIES_FOE = [
  '"Hmph. We\'ll see about that."',
  '"Save your breath."',
  '"You\'ll regret saying that."',
  '"Tch."',
  '"I\'m done with you."',
  '"Go bother someone else."',
  '"Stay out of my way."',
  '"I won\'t forget this."',
  '"You think I care?"',
  '"Spare me your speeches."',
  '"Get out of my fur."',
  '"I\'ve heard enough."',
  '"You\'re wasting both our time."',
  '"Walk away. Now."',
  '"Don\'t make this worse."',
  '"You\'ll get yours."'
];
const TALK_REPLIES_MATE = [
  '"...I always love hearing your voice."',
  '"My heart hears you."',
  '"I love you more than I can say."',
  '"You\'re my everything too."',
  '"Forever, my love."',
  '"I\'d say it back a thousand times."',
  '"Come here. Closer."',
  '"You\'re the best part of my life."',
  '"Every word out of you makes me purr."',
  '"I love hearing you think out loud."',
  '"You make me want to grow old quietly with you."',
  '"My favorite voice in the world."',
  '"Say more. I want to hear all of it."',
  '"My heart, always."',
  '"I\'m yours, completely."',
  '"There\'s nowhere else I\'d rather be."'
];

const TALK_CLOSERS = [
  '{a} settles back, tail wrapped around paws.',
  '{b} lets out a soft mrrow.',
  'They share a long, warm look.',
  '{a} pads off, glancing back over {a-shoulder}.',
  '{b} blinks slowly — the cat way of saying "I love you."',
  '{a} stretches and pads back to the dens.',
  '{b} flicks an ear and looks toward the horizon.',
  'The two of them sit in comfortable silence.',
  '{a} gives {b}\'s shoulder a gentle nudge before turning away.',
  'A long pause, then both cats laugh softly.',
  '{b} grooms a paw, thinking.',
  '{a} stretches out in the sun, eyes half-closed.',
  '{b} trots off toward the fresh-kill pile.',
  'The wind shifts, carrying their scents away.',
  'They part with a final brush of tails.'
];

// Personality traits — each cat carries one or two. The flag above their head
// shows the trait color; two-trait cats get a striped multicolor flag.
const PERSONALITIES = [
  { id: 'energetic',  name: 'Energetic',  color: '#ffd76a', desc: 'Always on the move.' },
  { id: 'outgoing',   name: 'Outgoing',   color: '#f0a060', desc: 'Loves to chat with anyone.' },
  { id: 'annoying',   name: 'Annoying',   color: '#d04a4a', desc: 'Grates on others a little.' },
  { id: 'shy',        name: 'Shy',        color: '#5a8acb', desc: 'Quiet and reserved.' },
  { id: 'grumpy',     name: 'Grumpy',     color: '#7a7674', desc: 'Always a little annoyed.' },
  { id: 'playful',    name: 'Playful',    color: '#e09abd', desc: 'Pounces on everything.' },
  { id: 'wise',       name: 'Wise',       color: '#9460c4', desc: 'Listens before speaking.' },
  { id: 'mysterious', name: 'Mysterious', color: '#2c2030', desc: 'Hard to read.' }
];

// Personality clash matrix — modifies first-impression scores between cats.
// (id1, id2) -> delta. Symmetric; lookup tries both orderings.
const PERSONALITY_CLASH = {
  'annoying|annoying':   -8,
  'annoying|grumpy':     -6,
  'annoying|wise':       -5,
  'annoying|shy':        -5,
  'shy|outgoing':        -4,
  'shy|energetic':       -3,
  'grumpy|playful':      -5,
  'grumpy|outgoing':     -3,
  'mysterious|outgoing': -3,
  'wise|annoying':       -5,
  // Vibes that match each other:
  'shy|shy':              4,
  'energetic|energetic':  4,
  'energetic|playful':    5,
  'outgoing|playful':     5,
  'wise|wise':            4,
  'wise|mysterious':      3,
  'grumpy|grumpy':        3,
  'mysterious|mysterious':3
};

// Who a cat is romantically attracted to.
const ORIENTATIONS = [
  { id: 'she-cats', name: 'She-cats' },
  { id: 'toms',     name: 'Toms' },
  { id: 'any',      name: 'Anyone' }
];

// Den interior decorations (cost 10 prey each to apply).
const INTERIOR_TYPES = [
  { id: 'leafy', name: 'Leafy bedding',   color: '#2a4218', desc: 'Springy fern fronds.' },
  { id: 'stone', name: 'Stone-lined',     color: '#5e5749', desc: 'Cool flat stones.' },
  { id: 'mossy', name: 'Mossy floor',     color: '#3a5024', desc: 'Thick green moss.' },
  { id: 'soft',  name: 'Soft-bedded fur', color: '#a07a48', desc: 'Lined with fur and feathers.' }
];

// Names of the other clans your cats may go to war with or meet at gatherings.
const OTHER_CLANS = ['ShadowClan', 'RiverClan', 'WindClan', 'ThunderClan', 'SkyClan'];

// Daily slice-of-life events shown on Skip Day.
const DAILY_EVENTS = [
  '{a} found a strange feather by the camp wall.',
  '{a} groomed {b} for a long time today.',
  '{a} woke up from a dream of StarClan.',
  'A breeze carried fox-scent through camp; {a} sniffed at it warily.',
  '{a} tried a new hunting crouch and almost slipped.',
  '{a} and {b} shared a long, slow blink.',
  '{a} watched the sunset from the high rocks.',
  'Two crows squabbled over the fresh-kill pile until {a} chased them off.',
  '{a} taught a young one how to listen for prey.',
  '{a} dreamed about another clan.'
];

const RELATIONSHIP_THRESHOLDS = {
  friend:    35,
  bestie:    65,
  crush:     75,
  mate:      90,
  dislike:  -25,
  enemy:    -60
};
