// ===================================================================
// Warrior Cats Life — main game module
// ===================================================================

(() => {

const SAVE_KEY = 'warrior-cats-life-v1';

// ---------------- Game state ----------------

const state = {
  day: 1,
  tutorialStep: 0,    // index into TUTORIAL[]
  tutorialDone: false,
  cats: [],
  dens: [],
  inventory: { mouse: 0, vole: 0, squirrel: 0, bird: 0 },
  relationships: {}, // 'idA|idB' -> { score, type }
  lastCrushPromptDay: 0,
  pendingRole: null,         // role assigned by the most recent den; consumed when a cat is made
  pendingRoleOptions: null,  // array of role choices when the den allows multiple (e.g. nursery)
  decorations: [],           // trees & rocks placed in the clearing
  nextActionDay: 1,          // earliest day on which the player can build/make again
  patrol: [],                // cat ids currently out on patrol; resolves next Skip Day
  warParty: [],              // cat ids currently out at war; resolves next Skip Day
  warEnemy: null,            // name of the rival clan currently being fought
  warsWon: 0,                // total wars won (gates the gathering tree)
  forbiddenLovers: [],       // [{ ourCatId, theirCat: {…full data}, score }]
  recentEvents: [],          // events since the last leader meeting: {day, text}
  lastHuntDay: 0,            // day on which the player last hunted; one hunt per day
  lastMediationDay: -99,     // day of last mediator intervention
  lastGatheringDay: 0,       // last day a gathering was held
  usedTalk: {                // indices already used per dialogue category — no repeats until exhausted
    body_friend: [], body_new: [], body_foe: [], body_mate: [],
    reply_friend: [], reply_new: [], reply_foe: [], reply_mate: []
  }
};

// Pair-id -> last performance.now() timestamp of an auto-talk. Not persisted.
const lastAutoTalkAt = new Map();

const ACTION_COOLDOWN_DAYS = 6;
const FREE_INTRO_CATS = 2;            // first 2 cats skip the cooldown AND are free + mandatory
const DECORATIONS_UNLOCK_DAY = 10;    // trees & rocks become buildable on day 10
const KILL_UNLOCK_DAY = 20;           // player-triggered kill appears on cat stats from day 20
const CAT_COST = 0;                   // making a cat is free
const STARTING_PREY = 20;             // bootstrap prey so the player can build their first den right away
const INTERIOR_COST = 10;             // prey cost to (re)decorate a den
const MAX_CATS = 12;                  // hard clan size cap
const ELDER_LIFESPAN_DAYS = 30;       // elders pass peacefully 30 days after they're made
const MEETING_INTERVAL_DAYS = 5;      // leader holds a meeting every 5 days
const HATE_MURDER_THRESHOLD = -80;    // rel score at which mortal-enemy murder may happen
const HATE_MURDER_CHANCE = 0.05;      // per qualifying enemy pair per Skip Day
const MEDIATION_COOLDOWN_DAYS = 4;    // mediator can intervene only every 4 days
const AUTO_TALK_DISTANCE = 36;        // px — cats this close auto-talk
const AUTO_TALK_COOLDOWN_MS = 12000;  // a given pair won't auto-talk more often than this

const TREE_SVG = '<svg viewBox="0 0 80 80" width="100%" height="100%">' +
  '<ellipse cx="40" cy="44" rx="36" ry="32" fill="#15240d"/>' +
  '<ellipse cx="32" cy="36" rx="14" ry="10" fill="#2a4218"/>' +
  '<ellipse cx="50" cy="48" rx="11" ry="8"  fill="#243a14"/>' +
  '<ellipse cx="40" cy="30" rx="10" ry="6"  fill="#314e1e"/>' +
  '</svg>';

const ROCK_SVG = '<svg viewBox="0 0 80 60" width="100%" height="100%">' +
  '<ellipse cx="40" cy="40" rx="34" ry="18" fill="#4a443a"/>' +
  '<ellipse cx="40" cy="34" rx="32" ry="16" fill="#7a7466"/>' +
  '<ellipse cx="30" cy="28" rx="12" ry="5"  fill="#a09a8a"/>' +
  '</svg>';

const DECORATION_TYPES = {
  tree: { id: 'tree', name: 'tree', cost: 40, size: 80, svg: TREE_SVG },
  rock: { id: 'rock', name: 'rock', cost: 30, size: 70, svg: ROCK_SVG }
};

// ---------------- Tutorial script ----------------

const TUTORIAL = [
  { pose: 'cheer',    text: "Welcome to your clearing! Down in the lower-right, hit '🏠 Build a den' to pick a place for your cats to sleep — or '🐾 Make a cat' to start with your first warrior.",
    target: '#add-den-btn' },
  { pose: 'thinking', text: "Pick whichever den you'd like first — leader, warrior, nursery, medicine, or even just a kit play mound. Drag it where you want, then click anywhere on the world.",
    target: '#den-choices .den-choice' },
  { pose: 'cheer',    text: "Wonderful! You can build more dens any time. Now let's add a cat — hit '🐾 Make a cat'.",
    target: '#add-cat-btn' },
  { pose: 'pointing', text: "Give them a name, choose their gender, pelt color, pelt design, and eye color. Then hit Done!",
    target: '#cat-done' },
  { pose: 'cheer',    text: "There they are, padding around the clearing! You can drag any cat to move them.",
    target: '.cat' },
  { pose: 'thinking', text: "Drop one cat onto another to see them talk. Click a cat to see their stats and what they're thinking about today." },
  { pose: 'pointing', text: "When everyone gets hungry, hit the 🐭 Hunt button up top to play the hunting minigame and stock the fresh-kill pile.",
    target: '#hunt-btn' },
  { pose: 'talking',  text: "When you're ready to move time forward, hit ⏭ Skip Day. Each day cats get new thoughts, and friendships and crushes can grow.",
    target: '#skip-day-btn' },
  { pose: 'cheer',    text: "That's it! The clearing is yours now. May StarClan light your path." }
];

// ---------------- Save / load ----------------

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
    // sanity defaults
    state.cats     = state.cats     || [];
    state.dens     = state.dens     || [];
    state.inventory = Object.assign({ mouse: 0, vole: 0, squirrel: 0, bird: 0 }, state.inventory || {});
    state.relationships = state.relationships || {};
    if (typeof state.pendingRole        === 'undefined') state.pendingRole        = null;
    if (typeof state.pendingRoleOptions === 'undefined') state.pendingRoleOptions = null;
    if (typeof state.nextActionDay      === 'undefined') state.nextActionDay      = 1;
    state.decorations    = state.decorations    || [];
    state.patrol         = state.patrol         || [];
    state.warParty       = state.warParty       || [];
    if (typeof state.warsWon === 'undefined') state.warsWon = 0;
    state.forbiddenLovers = state.forbiddenLovers || [];
    state.recentEvents   = state.recentEvents   || [];
    if (typeof state.lastHuntDay === 'undefined') state.lastHuntDay = 0;
    if (typeof state.lastMediationDay === 'undefined') state.lastMediationDay = -99;
    state.usedTalk = state.usedTalk || {};
    ['body_friend','body_new','body_foe','body_mate',
     'reply_friend','reply_new','reply_foe','reply_mate'].forEach(k => {
       state.usedTalk[k] = state.usedTalk[k] || [];
     });
    // Backfill missing fields on legacy cats.
    state.cats.forEach(c => {
      if (!c.role) c.role = 'warrior';
      if (!c.orientation) c.orientation = 'any';
      if (typeof c.annoying === 'undefined') c.annoying = Math.random() < 0.18;
      if (!c.personality || !c.personality.length) c.personality = rollPersonality();
    });
    return true;
  } catch (e) { return false; }
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

// ---------------- DOM helpers ----------------

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

function uid() { return 'id-' + Math.random().toString(36).slice(2, 10); }

function showModal(id) { $('#' + id).classList.remove('hidden'); }
function hideModal(id) { $('#' + id).classList.add('hidden'); }

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#' + id).classList.add('active');
}

// ---------------- Guide cat ----------------

function setGuide(pose, text, opts = {}) {
  $('#guide').classList.remove('hidden');  // un-hide the cat the first time we speak
  $('#guide-img').src = 'img/guide-' + pose + '.svg';
  if (text == null) {
    $('#guide-bubble').classList.add('hidden');
  } else {
    $('#guide-bubble').classList.remove('hidden');
    $('#guide-text').textContent = text;
    $('#guide-next').textContent = opts.last ? 'Got it!' : 'Next';
  }
}

function hideGuideBubble() {
  $('#guide').classList.remove('hidden');     // keep the cat visible…
  $('#guide-bubble').classList.add('hidden'); // …but tuck the bubble away
}

function startTutorial() {
  state.tutorialStep = 0;
  state.tutorialDone = false;
  showTutorialStep();
}

function showTutorialStep() {
  if (state.tutorialStep >= TUTORIAL.length) {
    state.tutorialDone = true;
    hideGuideBubble();
    updateTutorialPointer();
    save();
    return;
  }
  const step = TUTORIAL[state.tutorialStep];
  setGuide(step.pose, step.text, { last: state.tutorialStep === TUTORIAL.length - 1 });
  updateTutorialPointer();
}

// Pointer that highlights the next thing the player should click.
const ARROW_W = 70, ARROW_H = 40;

function updateTutorialPointer() {
  const ptr = document.getElementById('tutorial-pointer');
  if (!ptr) return;

  const step = TUTORIAL[state.tutorialStep];
  // Only point at things while the guide cat is on screen — keeps the arrow
  // from appearing during the fade-in, before startTutorial has fired.
  const guideHidden = document.getElementById('guide').classList.contains('hidden');
  let target = (state.tutorialDone || guideHidden || !step || !step.target) ? null
             : document.querySelector(step.target);

  // If a modal is open, only point at things inside that modal — pointing at
  // a button hidden behind the overlay would just be confusing.
  if (target) {
    const openModal = document.querySelector('.modal:not(.hidden)');
    if (openModal && !openModal.contains(target)) target = null;
  }
  let r;
  if (target) {
    r = target.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) target = null;
  }

  // Clear glow from anything that isn't the current target. Skipping the
  // current target avoids restarting its CSS pulse animation each frame.
  document.querySelectorAll('.tutorial-target-glow').forEach(n => {
    if (n !== target) n.classList.remove('tutorial-target-glow');
  });

  if (!target) { ptr.classList.add('hidden'); return; }

  // Prefer "above the target, pointing down". If there's no room above
  // (e.g. top-bar buttons), flip below pointing up.
  const cx = r.left + r.width / 2;
  let x, y, rot;
  if (r.top >= ARROW_H + 16) {
    x = cx - ARROW_W / 2;
    y = r.top - ARROW_H - 8;
    rot = 90;   // svg points right by default; rotate to point down
  } else {
    x = cx - ARROW_W / 2;
    y = r.bottom + 8;
    rot = -90;  // point up
  }

  ptr.classList.remove('hidden');
  ptr.style.left = x + 'px';
  ptr.style.top  = y + 'px';
  ptr.style.transform = `rotate(${rot}deg)`;

  target.classList.add('tutorial-target-glow');
}

function advanceTutorialOnAction(actionId) {
  if (state.tutorialDone) return;
  // Action-keyed advancement: bumps the tutorial when the user actually does
  // the thing the current step asks them to do.
  const map = {
    den_built:    2, // after first den built, jump to "Now let's add a cat"
    cat_made:     4, // after first cat made
    cat_dragged:  5, // when they drag a cat
    cat_clicked:  6, // when they click a cat
    hunt_started: 7, // when they hit hunt
    day_skipped:  8  // when they skip a day
  };
  if (map[actionId] != null && state.tutorialStep < map[actionId]) {
    state.tutorialStep = map[actionId];
    showTutorialStep();
  }
}

$('#guide-next').addEventListener('click', () => {
  state.tutorialStep++;
  showTutorialStep();
  save();
});

// ---------------- World rendering ----------------

const world = $('#world');

function worldRect() { return world.getBoundingClientRect(); }

function clampToWorld(x, y, margin = 30) {
  const r = worldRect();
  return {
    x: Math.max(margin, Math.min(r.width - margin, x)),
    y: Math.max(margin, Math.min(r.height - margin, y))
  };
}

function renderAll() {
  renderDecorations(); // first — trees & rocks sit behind dens and cats
  renderDens();
  renderCats();
  renderRelationships();
  refreshBuilderButtons();
  refreshHuntButton();
  $('#day-num').textContent = state.day;
  $('#inv-count').textContent = totalInventory();
}

function refreshHuntButton() {
  const btn = $('#hunt-btn');
  if (!btn) return;
  if (state.lastHuntDay === state.day) {
    btn.setAttribute('disabled', '');
    btn.textContent = '🐭 Hunted (today)';
  } else {
    btn.removeAttribute('disabled');
    btn.textContent = '🐭 Hunt';
  }
}

// ---------------- Dens ----------------

function renderDens() {
  // Remove existing den nodes (but keep cats)
  world.querySelectorAll('.den').forEach(n => n.remove());
  state.dens.forEach(d => {
    const def = DEN_TYPES.find(t => t.id === d.typeId);
    if (!def) return;
    const interiorClass = d.interior ? ' interior-' + d.interior : '';
    const node = el('div', {
      class: 'den' + interiorClass,
      style: `left:${d.x - def.size/2}px; top:${d.y - def.size/2}px; width:${def.size}px; height:${def.size}px;`,
      'data-id': d.id
    });
    node.innerHTML = `<img src="${def.sprite}" style="width:100%;height:100%;" alt="" />
      <span class="label">${def.name}</span>`;
    makeDenDraggable(node, d);
    world.appendChild(node);
  });
}

// Den interior decoration modal — pick a style for the inside (10 prey each).
function openDenInterior(den) {
  const def = DEN_TYPES.find(t => t.id === den.typeId);
  if (!def) return;
  $('#den-interior-title').textContent = def.name + ' — interior';
  const grid = $('#den-interior-choices');
  grid.innerHTML = '';
  INTERIOR_TYPES.forEach(it => {
    const card = el('div', { class: 'interior-choice' + (den.interior === it.id ? ' selected' : '') });
    card.innerHTML =
      `<div class="interior-swatch" style="background:${it.color};"></div>` +
      `<span class="interior-name">${it.name}</span>` +
      `<span class="interior-desc">${it.desc}</span>`;
    card.addEventListener('click', () => {
      if (den.interior === it.id) { hideModal('den-interior-modal'); return; }
      if (totalInventory() < INTERIOR_COST) {
        setGuide('thinking', "Not enough prey — decorating costs " + INTERIOR_COST + ".");
        hideModal('den-interior-modal');
        return;
      }
      consumePrey(INTERIOR_COST);
      den.interior = it.id;
      save();
      renderDens();
      $('#inv-count').textContent = totalInventory();
      hideModal('den-interior-modal');
      setGuide('cheer', def.name + " is now lined with " + it.name.toLowerCase() + ".");
    });
    grid.appendChild(card);
  });
  showModal('den-interior-modal');
}

document.getElementById('den-interior-close').addEventListener('click', () => hideModal('den-interior-modal'));

function makeDenDraggable(node, denData) {
  let dragging = false, dragStarted = false, sx = 0, sy = 0, ox = 0, oy = 0;
  node.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    sx = e.clientX; sy = e.clientY;
    dragging = true; dragStarted = false;
    node.setPointerCapture(e.pointerId);
    const r = worldRect();
    ox = e.clientX - r.left - denData.x;
    oy = e.clientY - r.top - denData.y;
    e.preventDefault();
  });
  node.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (!dragStarted) {
      if (Math.hypot(e.clientX - sx, e.clientY - sy) < 4) return;
      dragStarted = true;
    }
    const r = worldRect();
    const p = clampToWorld(e.clientX - r.left - ox, e.clientY - r.top - oy, 50);
    denData.x = p.x;
    denData.y = p.y;
    node.style.left = (p.x - DEN_TYPES.find(t=>t.id===denData.typeId).size/2) + 'px';
    node.style.top  = (p.y - DEN_TYPES.find(t=>t.id===denData.typeId).size/2) + 'px';
  });
  node.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    node.releasePointerCapture(e.pointerId);
    if (dragStarted) save();
    else openDenInterior(denData); // a click (no drag) opens interior decoration
  });
}

// Open den picker
$('#add-den-btn').addEventListener('click', openDenPicker);

// Dens that may only be built once per game. All other types can be repeated.
const UNIQUE_DEN_IDS = new Set(['leader', 'medicine', 'deputy']);

function builtDenIds() {
  return new Set(state.dens.map(d => d.typeId));
}

function openDenPicker() {
  const grid = $('#den-choices');
  grid.innerHTML = '';
  const built = builtDenIds();
  // Filter dens: unique-once dens are removed after build; gathering tree
  // requires a war win first.
  const remaining = DEN_TYPES.filter(d => {
    if (UNIQUE_DEN_IDS.has(d.id) && built.has(d.id)) return false;
    if (d.requiresWarWin && state.warsWon === 0) return false;
    if (d.id === 'gatheringtree' && built.has('gatheringtree')) return false;
    return true;
  });
  if (remaining.length === 0) {
    grid.appendChild(el('div', { class: 'den-empty' }, 'Every den has been built. Your camp is complete!'));
  } else {
    remaining.forEach(d => {
      const btn = el('div', { class: 'den-choice', onclick: () => placeDen(d.id) });
      const costStr = d.cost ? `<span class="den-cost">${d.cost} prey</span>` : '';
      btn.innerHTML = `<img src="${d.sprite}" alt=""/>
        <span class="den-name">${d.name}</span>
        <span class="den-desc">${d.desc}</span>
        ${costStr}`;
      grid.appendChild(btn);
    });
  }
  showModal('den-modal');
}

$('#den-cancel').addEventListener('click', () => hideModal('den-modal'));

// While placing, the den sprite follows the cursor and drops on a click in the world.
let placingDen = null;   // { typeId, def }
let ghostDen   = null;

function placeDen(typeId) {
  hideModal('den-modal');
  cancelPlacingDen(); // in case there was already a ghost
  const def = DEN_TYPES.find(t => t.id === typeId);
  if (!def) return;
  // If this den has a prey cost (e.g. fresh-kill pile = 20), check now.
  if (def.cost && totalInventory() < def.cost) {
    setGuide('thinking', "Not enough prey — building the " + def.name.toLowerCase() + " costs " + def.cost + " prey.");
    return;
  }
  placingDen = { typeId, def };
  setGuide('pointing', "Move your mouse over the clearing and click to drop the " + def.name.toLowerCase() + ". (Esc to cancel.)");

  ghostDen = el('div', {
    class: 'den-ghost',
    style: `width:${def.size}px; height:${def.size}px; left:-200px; top:-200px;`
  });
  ghostDen.innerHTML = `<img src="${def.sprite}" alt="" />`;
  document.body.appendChild(ghostDen);

  document.addEventListener('mousemove', moveGhost);
  document.addEventListener('keydown', cancelKey);
  document.body.style.cursor = 'crosshair';
}

function moveGhost(e) {
  if (!ghostDen) return;
  ghostDen.style.left = e.clientX + 'px';
  ghostDen.style.top  = e.clientY + 'px';
}

function cancelKey(e) {
  if (e.key === 'Escape') cancelPlacingDen();
}

function cancelPlacingDen() {
  if (ghostDen) { ghostDen.remove(); ghostDen = null; }
  placingDen = null;
  document.removeEventListener('mousemove', moveGhost);
  document.removeEventListener('keydown', cancelKey);
  document.body.style.cursor = '';
}

world.addEventListener('click', (e) => {
  // Tree / rock placement first — they have their own state.
  if (placingDecoration) {
    const r = worldRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const def = placingDecoration.def;
    if (totalInventory() < def.cost) { cancelPlacingDecoration(); return; }
    consumePrey(def.cost);
    state.decorations.push({ id: uid(), type: placingDecoration.type, x, y });
    cancelPlacingDecoration();
    renderDecorations();
    save();
    refreshBuilderButtons();
    $('#inv-count').textContent = totalInventory();
    setGuide('cheer', `A new ${def.name}! ${def.cost} prey spent.`);
    return;
  }
  if (!placingDen) return;
  const r = worldRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  const def = placingDen.def;
  const den = { id: uid(), typeId: placingDen.typeId, x, y };
  if (def.cost) {
    if (totalInventory() < def.cost) { cancelPlacingDen(); return; } // safety
    consumePrey(def.cost);
    $('#inv-count').textContent = totalInventory();
  }
  state.dens.push(den);
  recordEvent("A new " + def.name.toLowerCase() + " was built.");
  cancelPlacingDen();
  renderDens();
  // Whatever den just got built becomes the role of the next cat made.
  if (def.role) {
    state.pendingRole = def.role;
    state.pendingRoleOptions = def.roleOptions ? def.roleOptions.slice() : [def.role];
  }
  save();
  refreshBuilderButtons();
  advanceTutorialOnAction('den_built');
  // Show the role-explanation message AFTER any tutorial advance, so it sticks.
  if (def.role) {
    if (def.roleOptions && def.roleOptions.length > 1) {
      setGuide('cheer', "A " + def.name.toLowerCase() + "! Hit '🐾 Make a cat' — you can choose " + def.roleOptions.join(' or ') + ".");
    } else {
      setGuide('cheer', "A " + def.name.toLowerCase() + "! The next cat you make will be a " + def.role + ". Hit '🐾 Make a " + def.role + "'.");
    }
  } else {
    setGuide('cheer', "The " + def.name.toLowerCase() + " is set up.");
  }
});

// ---------------- Decorations (trees & rocks) ----------------

let placingDecoration = null;   // { type, def }
let ghostDecoration   = null;

function placeDecoration(type) {
  const def = DECORATION_TYPES[type];
  if (!def) return;
  if (totalInventory() < def.cost) return; // not enough prey
  if (state.day < DECORATIONS_UNLOCK_DAY) return;

  cancelPlacingDen();
  cancelPlacingDecoration();
  placingDecoration = { type, def };

  ghostDecoration = el('div', {
    class: 'decoration-ghost',
    style: `width:${def.size}px;height:${def.size}px;left:-200px;top:-200px;`
  });
  ghostDecoration.innerHTML = def.svg;
  document.body.appendChild(ghostDecoration);
  document.addEventListener('mousemove', moveDecorationGhost);
  document.addEventListener('keydown', cancelDecorationKey);
  document.body.style.cursor = 'crosshair';
  setGuide('pointing', `Click in the clearing to place the ${def.name} (${def.cost} prey). Esc to cancel.`);
}

function moveDecorationGhost(e) {
  if (!ghostDecoration) return;
  ghostDecoration.style.left = e.clientX + 'px';
  ghostDecoration.style.top  = e.clientY + 'px';
}

function cancelDecorationKey(e) { if (e.key === 'Escape') cancelPlacingDecoration(); }

function cancelPlacingDecoration() {
  if (ghostDecoration) { ghostDecoration.remove(); ghostDecoration = null; }
  placingDecoration = null;
  document.removeEventListener('mousemove', moveDecorationGhost);
  document.removeEventListener('keydown', cancelDecorationKey);
  document.body.style.cursor = '';
}

// Spend exactly one piece of prey, taking from whichever type has the most.
// Returns the prey id eaten, or null if the pile is empty.
function consumeOnePrey() {
  let bestType = null, bestCount = 0;
  for (const t of PREY_TYPES) {
    const c = state.inventory[t.id] || 0;
    if (c > bestCount) { bestCount = c; bestType = t.id; }
  }
  if (!bestType) return null;
  state.inventory[bestType]--;
  return bestType;
}

// Spend `amount` prey, taking from whichever type has the most.
function consumePrey(amount) {
  let remaining = amount;
  while (remaining > 0) {
    let bestType = null, bestCount = 0;
    for (const t of PREY_TYPES) {
      const c = state.inventory[t.id] || 0;
      if (c > bestCount) { bestCount = c; bestType = t.id; }
    }
    if (!bestType) return false;
    state.inventory[bestType]--;
    remaining--;
  }
  return true;
}

function renderDecorations() {
  world.querySelectorAll('.decoration').forEach(n => n.remove());
  state.decorations.forEach(d => {
    const def = DECORATION_TYPES[d.type];
    if (!def) return;
    const node = el('div', {
      class: 'decoration ' + d.type,
      style: `left:${d.x - def.size/2}px; top:${d.y - def.size/2}px; width:${def.size}px; height:${def.size}px;`,
      'data-id': d.id
    });
    node.innerHTML = def.svg;
    makeDecorationDraggable(node, d);
    world.appendChild(node);
  });
}

function makeDecorationDraggable(node, dec) {
  let dragging = false, ox = 0, oy = 0;
  node.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    node.setPointerCapture(e.pointerId);
    const r = worldRect();
    ox = e.clientX - r.left - dec.x;
    oy = e.clientY - r.top  - dec.y;
    e.preventDefault();
  });
  node.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = worldRect();
    const def = DECORATION_TYPES[dec.type];
    const p = clampToWorld(e.clientX - r.left - ox, e.clientY - r.top - oy, 30);
    dec.x = p.x; dec.y = p.y;
    node.style.left = (p.x - def.size/2) + 'px';
    node.style.top  = (p.y - def.size/2) + 'px';
  });
  node.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    node.releasePointerCapture(e.pointerId);
    save();
  });
}

$('#add-tree-btn').addEventListener('click', () => placeDecoration('tree'));
$('#add-rock-btn').addEventListener('click', () => placeDecoration('rock'));

// Hide/disable the builder buttons based on what's still possible.
function refreshBuilderButtons() {
  const denBtn = $('#add-den-btn');
  const catBtn = $('#add-cat-btn');
  const built = builtDenIds();
  // The picker is empty only if every available type is one-of-a-kind AND already built.
  const noneAvailable = DEN_TYPES.every(d => UNIQUE_DEN_IDS.has(d.id) && built.has(d.id));
  const daysLeft = Math.max(0, state.nextActionDay - state.day);
  const onCooldown = daysLeft > 0;

  // Build-a-den: hidden only when literally nothing can be built; disabled during cooldown.
  if (noneAvailable) {
    denBtn.classList.add('hidden');
  } else {
    denBtn.classList.remove('hidden');
    if (onCooldown) {
      denBtn.setAttribute('disabled', '');
      denBtn.querySelector('.builder-text').innerHTML =
        'Build a den<span class="builder-hint">skip ' + daysLeft + ' more day' + (daysLeft === 1 ? '' : 's') + '</span>';
    } else {
      denBtn.removeAttribute('disabled');
      denBtn.querySelector('.builder-text').innerHTML = 'Build a den';
    }
  }

  // Make-a-cat: gated by clan-cap, cooldown, prey cost, and den-role.
  const atCap        = state.cats.length >= MAX_CATS;
  const isFreeIntro  = state.cats.length < FREE_INTRO_CATS;
  const prey         = totalInventory();
  const cantAffordCat = !isFreeIntro && prey < CAT_COST;

  if (atCap) {
    catBtn.setAttribute('disabled', '');
    catBtn.querySelector('.builder-text').innerHTML =
      'Make a cat<span class="builder-hint">clan is full (' + MAX_CATS + ' max)</span>';
  } else if (onCooldown) {
    catBtn.setAttribute('disabled', '');
    catBtn.querySelector('.builder-text').innerHTML =
      'Make a cat<span class="builder-hint">skip ' + daysLeft + ' more day' + (daysLeft === 1 ? '' : 's') + '</span>';
  } else if (!state.pendingRole) {
    catBtn.setAttribute('disabled', '');
    catBtn.querySelector('.builder-text').innerHTML =
      'Make a cat<span class="builder-hint">build a den first</span>';
  } else if (cantAffordCat) {
    catBtn.setAttribute('disabled', '');
    catBtn.querySelector('.builder-text').innerHTML =
      'Make a cat<span class="builder-hint">need ' + (CAT_COST - prey) + ' more prey</span>';
  } else {
    catBtn.removeAttribute('disabled');
    const opts = state.pendingRoleOptions || [];
    const baseLabel = opts.length > 1 ? 'Make a ' + opts.join('/') : 'Make a ' + state.pendingRole;
    const costHint  = isFreeIntro ? 'free' : (CAT_COST + ' prey');
    catBtn.querySelector('.builder-text').innerHTML =
      baseLabel + '<span class="builder-hint">' + costHint + '</span>';
  }

  // Trees & rocks: locked until day 10, then gated on prey count.
  const treeBtn = $('#add-tree-btn');
  const rockBtn = $('#add-rock-btn');
  if (state.day >= DECORATIONS_UNLOCK_DAY) {
    const prey = totalInventory();
    [['tree', treeBtn], ['rock', rockBtn]].forEach(([type, btn]) => {
      const def = DECORATION_TYPES[type];
      btn.classList.remove('hidden');
      if (prey >= def.cost) {
        btn.removeAttribute('disabled');
        btn.querySelector('.builder-text').innerHTML =
          'Add ' + def.name + '<span class="builder-hint">' + def.cost + ' prey</span>';
      } else {
        btn.setAttribute('disabled', '');
        btn.querySelector('.builder-text').innerHTML =
          'Add ' + def.name + '<span class="builder-hint">need ' + (def.cost - prey) + ' more prey</span>';
      }
    });
  } else {
    treeBtn.classList.add('hidden');
    rockBtn.classList.add('hidden');
  }
}

// ---------------- Cat creation ----------------

function buildCatModal() {
  const colorRow  = $('#color-choices');
  const designRow = $('#design-choices');
  const eyeRow    = $('#eye-choices');
  colorRow.innerHTML  = '';
  designRow.innerHTML = '';
  eyeRow.innerHTML    = '';
  PELT_COLORS.forEach(c => {
    const sw = el('button', {
      class: 'swatch',
      title: c.name,
      style: `background: linear-gradient(135deg, ${c.base} 0%, ${c.base} 50%, ${c.accent} 50%, ${c.accent} 100%);`,
      'data-id': c.id,
      onclick: (e) => {
        e.preventDefault();
        $$('#color-choices .swatch').forEach(n => n.classList.remove('selected'));
        sw.classList.add('selected');
        catForm.colorId = c.id;
        renderCatPreview();
      }
    });
    colorRow.appendChild(sw);
  });
  PELT_DESIGNS.forEach(d => {
    const p = el('button', { class: 'pill', 'data-id': d.id }, d.name);
    p.addEventListener('click', (e) => {
      e.preventDefault();
      $$('#design-choices .pill').forEach(n => n.classList.remove('selected'));
      p.classList.add('selected');
      catForm.designId = d.id;
      renderCatPreview();
    });
    designRow.appendChild(p);
  });
  EYE_COLORS.forEach(c => {
    const sw = el('button', {
      class: 'swatch',
      title: c.name,
      style: `background: ${c.color};`,
      'data-id': c.id,
      onclick: (e) => {
        e.preventDefault();
        $$('#eye-choices .swatch').forEach(n => n.classList.remove('selected'));
        sw.classList.add('selected');
        catForm.eyeId = c.id;
        renderCatPreview();
      }
    });
    eyeRow.appendChild(sw);
  });
  // Gender pill row
  $$('#gender-choices .pill').forEach(p => {
    p.onclick = (e) => {
      e.preventDefault();
      $$('#gender-choices .pill').forEach(n => n.classList.remove('selected'));
      p.classList.add('selected');
      catForm.gender = p.dataset.value;
    };
  });
  // Orientation pill row
  $$('#orientation-choices .pill').forEach(p => {
    p.onclick = (e) => {
      e.preventDefault();
      $$('#orientation-choices .pill').forEach(n => n.classList.remove('selected'));
      p.classList.add('selected');
      catForm.orientation = p.dataset.value;
    };
  });
}
buildCatModal();

const catForm = { colorId: 'brown', designId: 'tabby', eyeId: 'amber', gender: 'she-cat', orientation: 'any', personality: ['energetic'] };

// Roll a brand-new randomized cat customization. Used both on every modal open
// (so the previous cat's choices never leak through) and by the 🎲 button.
function randomizeCatForm() {
  catForm.colorId     = pickFromList(PELT_COLORS).id;
  catForm.designId    = pickFromList(PELT_DESIGNS).id;
  catForm.eyeId       = pickFromList(EYE_COLORS).id;
  catForm.gender      = pickFromList(['she-cat', 'tom', 'non-binary']);
  catForm.orientation = pickFromList(ORIENTATIONS).id;
  catForm.personality = rollPersonality();
}

// Sync all the cat-creator pills/swatches/preview/flag to the current catForm.
function refreshCatModalUI() {
  $$('#color-choices .swatch').forEach(n => n.classList.toggle('selected', n.dataset.id === catForm.colorId));
  $$('#design-choices .pill').forEach(n => n.classList.toggle('selected', n.dataset.id === catForm.designId));
  $$('#eye-choices .swatch').forEach(n => n.classList.toggle('selected', n.dataset.id === catForm.eyeId));
  $$('#gender-choices .pill').forEach(n => n.classList.toggle('selected', n.dataset.value === catForm.gender));
  $$('#orientation-choices .pill').forEach(n => n.classList.toggle('selected', n.dataset.value === catForm.orientation));
  refreshCatModalFlag();
  renderCatPreview();
}

// The personality flag in the cat creator — click to roll new traits.
function refreshCatModalFlag() {
  const swatch = $('#cat-pflag-swatch');
  const text   = $('#cat-pflag-text');
  if (!swatch || !text) return;
  swatch.setAttribute('style', personalityFlagStyle(catForm.personality));
  text.textContent = personalityLabel(catForm.personality);
}
$('#cat-pflag-btn').addEventListener('click', (e) => {
  e.preventDefault();
  catForm.personality = rollPersonality();
  refreshCatModalFlag();
});

function renderCatPreview() {
  $('#cat-preview').innerHTML = catSpriteSVG(catForm);
}

function openCatModal() {
  if (!state.pendingRole) return; // safety: button is disabled in this state anyway
  $('#cat-role-text').textContent = state.pendingRole;
  $('#cat-name').value = randomNameForRole(state.pendingRole);

  // Render the role toggle if the den offered a choice (e.g. nursery → queen/kit).
  const opts = state.pendingRoleOptions || [];
  const row = $('#role-pick-row');
  if (opts.length > 1) {
    row.style.display = '';
    const choices = $('#role-choices');
    choices.innerHTML = '';
    opts.forEach(r => {
      const btn = el('button', {
        class: 'pill' + (r === state.pendingRole ? ' selected' : ''),
        type: 'button'
      }, r.charAt(0).toUpperCase() + r.slice(1));
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        $$('#role-choices .pill').forEach(n => n.classList.remove('selected'));
        btn.classList.add('selected');
        state.pendingRole = r;
        $('#cat-role-text').textContent = r;
        $('#cat-name').value = randomNameForRole(r);
      });
      choices.appendChild(btn);
    });
  } else {
    row.style.display = 'none';
  }

  // Always start with a fresh randomized customization — the previous cat's
  // choices never leak through.
  randomizeCatForm();
  refreshCatModalUI();

  // Hide the Skip button for the first two cats — they're mandatory.
  const cancelBtn = $('#cat-cancel');
  if (state.cats.length < FREE_INTRO_CATS) cancelBtn.classList.add('hidden');
  else                                     cancelBtn.classList.remove('hidden');

  showModal('cat-modal');
}

// 🎲 Randomize button — re-roll the whole customization.
$('#cat-randomize').addEventListener('click', (e) => {
  e.preventDefault();
  randomizeCatForm();
  $('#cat-name').value = randomNameForRole(state.pendingRole);
  refreshCatModalUI();
});

$('#add-cat-btn').addEventListener('click', openCatModal);
$('#cat-cancel').addEventListener('click', () => hideModal('cat-modal'));

$('#cat-done').addEventListener('click', () => {
  if (state.cats.length >= MAX_CATS) {
    setGuide('thinking', "The clan is at " + MAX_CATS + " cats — that's the limit.");
    return;
  }
  // Charge prey for cats beyond the first two.
  const isFreeIntro = state.cats.length < FREE_INTRO_CATS;
  if (!isFreeIntro && totalInventory() < CAT_COST) {
    setGuide('thinking', "Not enough prey — making a cat costs " + CAT_COST + " prey.");
    return;
  }
  let name = $('#cat-name').value.trim();
  if (!name) name = randomNameForRole(state.pendingRole);
  name = applyRoleSuffix(name, state.pendingRole);
  const cat = makeCat({
    name,
    gender:      catForm.gender,
    orientation: catForm.orientation,
    colorId:     catForm.colorId,
    designId:    catForm.designId,
    eyeId:       catForm.eyeId,
    role:        state.pendingRole || 'warrior',
    personality: catForm.personality
  });
  if (!isFreeIntro) consumePrey(CAT_COST);
  state.cats.push(cat);
  recordEvent(cat.name + " joined the clan as a " + cat.role + ".");
  state.pendingRole = null;        // role consumed
  state.pendingRoleOptions = null;
  // First two cats are free to introduce the game; cooldown kicks in once the
  // intro pair has been made.
  if (state.cats.length >= FREE_INTRO_CATS) {
    state.nextActionDay = state.day + ACTION_COOLDOWN_DAYS;
  }
  // Hold this new cat still for a few seconds so the player sees their design.
  justMadeCats.add(cat.id);
  setTimeout(() => { justMadeCats.delete(cat.id); }, 3000);
  hideModal('cat-modal');
  renderCats();
  renderRelationships();
  refreshBuilderButtons();
  $('#inv-count').textContent = totalInventory();
  save();
  advanceTutorialOnAction('cat_made');
});

function makeCat(spec) {
  const r = worldRect();
  // Spawn the cat right next to the den that grants their role, so the user
  // can see at a glance which den is theirs and what they look like.
  const denType = DEN_TYPES.find(t => t.role === spec.role || (t.roleOptions && t.roleOptions.includes(spec.role)));
  const den = denType ? state.dens.find(d => d.typeId === denType.id) : null;
  let x, y;
  if (den) {
    x = den.x;
    y = den.y + (denType.size / 2) + 30;
  } else {
    x = 80 + Math.random() * (Math.max(r.width - 160, 100));
    y = 80 + Math.random() * (Math.max(r.height - 160, 100));
  }
  // Clamp inside the world.
  const p = clampToWorld(x, y, 40);
  x = p.x; y = p.y;
  return {
    id: uid(),
    name: spec.name,
    gender: spec.gender,
    orientation: spec.orientation || 'any',
    role: spec.role || 'warrior',
    colorId:  spec.colorId,
    designId: spec.designId,
    eyeId:    spec.eyeId,
    x, y,
    targetX: x, targetY: y,
    facing: Math.random() < 0.5 ? 'left' : 'right',
    hunger: 30,    // 0 = full, 100 = starving
    energy: 100,
    happiness: 60,
    want: rollWant(),
    age: 'apprentice',
    bornOnDay: state.day,
    annoying: Math.random() < 0.18,  // ~18% of cats are inherently a little grating
    personality: spec.personality && spec.personality.length ? spec.personality.slice() : rollPersonality(),
    parentIds: spec.parentIds || []  // who their parents were, for family-tree checks
  };
}

// Roll a fresh personality: 1 trait or 2 traits (50/50).
function rollPersonality() {
  const ids = PERSONALITIES.map(p => p.id);
  shuffle(ids);
  return Math.random() < 0.5 ? [ids[0]] : [ids[0], ids[1]];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function personalityColor(traitId) {
  const p = PERSONALITIES.find(x => x.id === traitId);
  return p ? p.color : '#888';
}

function personalityLabel(personalityIds) {
  if (!personalityIds || personalityIds.length === 0) return 'unknown';
  return personalityIds.map(id => {
    const p = PERSONALITIES.find(x => x.id === id);
    return p ? p.name : id;
  }).join(' & ');
}

// Background style for a flag (single color, or two-color stripe for two traits).
function personalityFlagStyle(personalityIds) {
  if (!personalityIds || personalityIds.length === 0) return 'background:#888;';
  if (personalityIds.length === 1) return 'background:' + personalityColor(personalityIds[0]) + ';';
  const c1 = personalityColor(personalityIds[0]);
  const c2 = personalityColor(personalityIds[1]);
  return 'background:linear-gradient(90deg,' + c1 + ' 0%,' + c1 + ' 50%,' + c2 + ' 50%,' + c2 + ' 100%);';
}

// Pick a random personality-flavored line for a cat, or null if their traits
// don't have any defined.
function personalityLine(cat) {
  const traits = (cat.personality || []).filter(t => PERSONALITY_LINES[t] && PERSONALITY_LINES[t].length);
  if (traits.length === 0) return null;
  const trait = pickFromList(traits);
  return pickFromList(PERSONALITY_LINES[trait]);
}

// Sum up the personality clash modifier between two cats.
function personalityClash(a, b) {
  const ap = a.personality || [];
  const bp = b.personality || [];
  let total = 0;
  ap.forEach(x => bp.forEach(y => {
    const k1 = x + '|' + y, k2 = y + '|' + x;
    if (PERSONALITY_CLASH[k1] != null) total += PERSONALITY_CLASH[k1];
    else if (PERSONALITY_CLASH[k2] != null) total += PERSONALITY_CLASH[k2];
  }));
  return total;
}

function rollWant() {
  return DAILY_WANTS[Math.floor(Math.random() * DAILY_WANTS.length)];
}

// ---------------- Cat rendering / wandering ----------------

function renderCats() {
  // remove cat nodes
  world.querySelectorAll('.cat').forEach(n => n.remove());
  state.cats.forEach(c => {
    const onPatrol = state.patrol  && state.patrol.includes(c.id);
    const atWar    = state.warParty && state.warParty.includes(c.id);
    const node = el('div', {
      class: 'cat' + (onPatrol ? ' on-patrol' : '') + (atWar ? ' at-war' : ''),
      'data-id': c.id,
      style: `left:${c.x}px; top:${c.y}px;`
    });
    node.innerHTML = catSpriteSVG(c) +
      `<div class="pflag" style="${personalityFlagStyle(c.personality)}"></div>` +
      `<span class="name-tag">${escapeHtml(c.name)}</span>`;
    if (c.want && c.wantBubbleVisible) {
      const bubble = el('div', { class: 'think-bubble' }, shortWant(c.want.text));
      node.appendChild(bubble);
    }
    makeCatInteractive(node, c);
    world.appendChild(node);
  });
}

function shortWant(text) {
  return text.length > 32 ? text.slice(0, 30) + '…' : text;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}

// Cats freshly made by the player stand still for a moment so the player can
// admire the design they just chose. Cleared after a short delay.
const justMadeCats = new Set();

// Each cat picks a wander target periodically and drifts toward it.
function tickCats(dtMs) {
  const r = worldRect();
  // Look for cats wandering close enough to cross paths and auto-talk.
  checkAutoTalks();
  // Find a fresh-kill pile (if one exists) so hungry cats can self-feed.
  const pile = state.dens.find(d => d.typeId === 'freshkill');
  state.cats.forEach(c => {
    if (c._dragging) return;
    if (justMadeCats.has(c.id)) return;
    if (c._inMeeting) return;
    if (state.patrol && state.patrol.includes(c.id)) return;
    if (state.warParty && state.warParty.includes(c.id)) return;

    // Hungry cats head straight for the pile and eat one piece of prey.
    if (pile && c.hunger >= 60 && totalInventory() > 0 && !c._eatingCooldown) {
      c.targetX = pile.x;
      c.targetY = pile.y;
      if (Math.hypot(c.x - pile.x, c.y - pile.y) < 30) {
        const eaten = consumeOnePrey();
        if (eaten) {
          c.hunger = Math.max(0, c.hunger - 35);
          c.happiness = Math.min(100, c.happiness + 5);
          showFloatingBubble(c, '🐭');
          $('#inv-count').textContent = totalInventory();
          c._eatingCooldown = true;
          setTimeout(() => { delete c._eatingCooldown; }, 18000);
          // After eating, pick a new wander target so they walk away.
          c.targetX = 50 + Math.random() * (r.width - 100);
          c.targetY = 50 + Math.random() * (r.height - 100);
        }
      }
    }
    const dx = c.targetX - c.x;
    const dy = c.targetY - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4 || Math.random() < 0.002) {
      // pick a new target somewhere in the clearing
      c.targetX = 50 + Math.random() * (r.width - 100);
      c.targetY = 50 + Math.random() * (r.height - 100);
    }
    const speed = 0.04 * dtMs;
    if (dist > 0.5) {
      c.x += (dx / dist) * speed;
      c.y += (dy / dist) * speed;
      c.facing = dx < 0 ? 'left' : 'right';
    }
    const node = world.querySelector(`.cat[data-id="${c.id}"]`);
    if (node) {
      node.style.left = c.x + 'px';
      node.style.top  = c.y + 'px';
      // Update facing: re-render only the inner svg if facing changed
      const svg = node.querySelector('svg');
      if (svg) {
        const wantTransform = c.facing === 'left' ? 'translate(80,0) scale(-1,1)' : '';
        const g = svg.querySelector('g');
        if (g && g.getAttribute('transform') !== wantTransform) {
          g.setAttribute('transform', wantTransform);
        }
      }
    }
  });
}

// Cats wandering close together cross paths and exchange a few lines on their
// own. Bad-relationship pairs walk away instead of stopping; good-relationship
// pairs may share prey from the fresh-kill pile.
function checkAutoTalks() {
  if (state.cats.length < 2) return;
  const now = performance.now();
  for (let i = 0; i < state.cats.length; i++) {
    const a = state.cats[i];
    if (a._dragging || a._inMeeting) continue;
    if (state.patrol && state.patrol.includes(a.id)) continue;
    for (let j = i + 1; j < state.cats.length; j++) {
      const b = state.cats[j];
      if (b._dragging || b._inMeeting) continue;
      if (state.patrol && state.patrol.includes(b.id)) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) > AUTO_TALK_DISTANCE) continue;
      const pairId = relKey(a, b);
      const last = lastAutoTalkAt.get(pairId) || 0;
      if (now - last < AUTO_TALK_COOLDOWN_MS) continue;
      lastAutoTalkAt.set(pairId, now);

      const rel = getRel(a, b);
      // If they dislike each other, they walk away rather than stop and talk.
      if (rel.score <= RELATIONSHIP_THRESHOLDS.dislike) {
        veerAwayFrom(a, b);
        veerAwayFrom(b, a);
        showFloatingBubble(a, '😾');
        continue;
      }
      // Otherwise they auto-talk (silently — show a one-line floating bubble).
      autoTalkPair(a, b, rel);
      // Friends/mates may share prey if one is hungry and we have prey.
      tryShareprey(a, b, rel);
    }
  }
}

function veerAwayFrom(self, other) {
  const dx = self.x - other.x;
  const dy = self.y - other.y;
  const dist = Math.hypot(dx, dy) || 1;
  const r = worldRect();
  let nx = self.x + (dx / dist) * 120;
  let ny = self.y + (dy / dist) * 120;
  // Clamp the new wander target into the world.
  const p = clampToWorld(nx, ny, 30);
  self.targetX = p.x;
  self.targetY = p.y;
}

function autoTalkPair(a, b, rel) {
  // Pick a tone-appropriate body line (no repeats, same as the manual drop).
  let bodyArr, bodyKey;
  if (rel.type === 'mate') {
    bodyArr = TALK_BODIES_MATE; bodyKey = 'body_mate';
  } else if (rel.score >= RELATIONSHIP_THRESHOLDS.friend) {
    bodyArr = TALK_BODIES_FRIEND; bodyKey = 'body_friend';
  } else {
    bodyArr = TALK_BODIES_NEW; bodyKey = 'body_new';
  }
  let line = pickUnusedFromList(bodyArr, bodyKey);
  if (rel.type === 'mate' && rel.matetopic && Math.random() < 0.35) {
    line = '"Remember our talks about ' + rel.matetopic + '?"';
  } else {
    const pline = personalityLine(a);
    if (pline && Math.random() < 0.4) line = pline;
  }
  showFloatingBubble(a, shortLine(line));
  // Small relationship nudge from the encounter.
  adjustRel(a, b, 1 + Math.floor(Math.random() * 3));
  renderRelationships();
}

function tryShareprey(a, b, rel) {
  if (rel.score < RELATIONSHIP_THRESHOLDS.friend) return; // only friends share
  if (totalInventory() <= 0) return;
  // Pick the hungrier cat as recipient.
  const hungry = a.hunger >= b.hunger ? a : b;
  const giver  = hungry === a ? b : a;
  if (hungry.hunger < 50) return; // not hungry enough to bother
  if (Math.random() > 0.18) return; // ~18% chance per qualifying close-by event
  // Find prey type to consume.
  let preyType = null, best = 0;
  for (const t of PREY_TYPES) {
    const c = state.inventory[t.id] || 0;
    if (c > best) { best = c; preyType = t.id; }
  }
  if (!preyType) return;
  state.inventory[preyType]--;
  hungry.hunger = Math.max(0, hungry.hunger - 25);
  hungry.happiness = Math.min(100, hungry.happiness + 6);
  giver.happiness = Math.min(100, giver.happiness + 4);
  adjustRel(a, b, 3);
  showFloatingBubble(giver, '🐭→');
  $('#inv-count').textContent = totalInventory();
}

function shortLine(text) {
  const stripped = text.replace(/^"|"$/g, '');
  return '"' + (stripped.length > 28 ? stripped.slice(0, 26) + '…' : stripped) + '"';
}

function showFloatingBubble(cat, text) {
  const node = world.querySelector('.cat[data-id="' + cat.id + '"]');
  if (!node) return;
  // Remove any existing floater.
  node.querySelectorAll('.cross-bubble').forEach(n => n.remove());
  const bubble = el('div', { class: 'cross-bubble' }, text);
  node.appendChild(bubble);
  setTimeout(() => bubble.remove(), 3500);
}

// ---------------- Cat dragging + interactions ----------------

function makeCatInteractive(node, cat) {
  let dragging = false, dragStarted = false, sx = 0, sy = 0, ox = 0, oy = 0;
  node.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    sx = e.clientX; sy = e.clientY;
    dragging = true; dragStarted = false;
    cat._dragging = true;
    node.setPointerCapture(e.pointerId);
    const r = worldRect();
    ox = e.clientX - r.left - cat.x;
    oy = e.clientY - r.top - cat.y;
    e.preventDefault();
  });
  node.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (!dragStarted) {
      if (Math.hypot(e.clientX - sx, e.clientY - sy) < 4) return;
      dragStarted = true;
      node.classList.add('dragging');
    }
    const r = worldRect();
    const p = clampToWorld(e.clientX - r.left - ox, e.clientY - r.top - oy, 30);
    cat.x = p.x; cat.y = p.y;
    cat.targetX = p.x; cat.targetY = p.y;
    node.style.left = p.x + 'px';
    node.style.top  = p.y + 'px';
    // Hover detection: is there another cat under the pointer?
    const target = catUnderPointer(e.clientX, e.clientY, cat.id);
    world.querySelectorAll('.cat.hovering').forEach(n => n.classList.remove('hovering'));
    if (target) {
      const tn = world.querySelector(`.cat[data-id="${target.id}"]`);
      if (tn) tn.classList.add('hovering');
    }
  });
  node.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    cat._dragging = false;
    node.releasePointerCapture(e.pointerId);
    node.classList.remove('dragging');
    world.querySelectorAll('.cat.hovering').forEach(n => n.classList.remove('hovering'));
    if (dragStarted) {
      // dropped: did we drop on another cat?
      const dropTarget = catUnderPointer(e.clientX, e.clientY, cat.id);
      if (dropTarget) {
        startCatTalk(cat, dropTarget);
        // Only the cat the player dragged gets the happiness boost from the
        // interaction — the cat that was landed on gets nothing extra.
        cat.happiness = Math.min(100, cat.happiness + 5);
      }
      advanceTutorialOnAction('cat_dragged');
      save();
    } else {
      // Murder targeting mode: this click selects the victim.
      if (state.murdererSelected) {
        const murderer = state.cats.find(c => c.id === state.murdererSelected);
        state.murdererSelected = null;
        if (murderer && murderer.id !== cat.id) {
          executeMurder(murderer, cat);
          return;
        }
        setGuide('thinking', 'Murder cancelled.');
      }
      // it was a click — mediator gets a special panel; everyone else opens stats.
      if (cat.role === 'mediator') openMediator(cat);
      else                          openStats(cat);
      advanceTutorialOnAction('cat_clicked');
    }
  });
}

function catUnderPointer(clientX, clientY, excludeId) {
  for (const c of state.cats) {
    if (c.id === excludeId) continue;
    const r = worldRect();
    const cx = r.left + c.x;
    const cy = r.top  + c.y;
    if (Math.hypot(clientX - cx, clientY - cy) < 36) return c;
  }
  return null;
}

// ---------------- Stats panel ----------------

function openStats(cat) {
  $('#stats-name').textContent = cat.name + ' — ' + (PELT_COLORS.find(c=>c.id===cat.colorId).name) + ' ' + (PELT_DESIGNS.find(d=>d.id===cat.designId).name.toLowerCase().split(' ')[0]) + ' ' + cat.gender;
  const body = $('#stats-body');
  body.innerHTML = '';
  body.appendChild(statLine('Role',    cat.role || 'warrior'));
  if (cat.mentor) {
    const mentorCat = state.cats.find(m => m.id === cat.mentor);
    if (mentorCat) body.appendChild(statLine('Mentor', mentorCat.name));
  }
  body.appendChild(statLine('Likes',   ORIENTATIONS.find(o => o.id === (cat.orientation || 'any')).name));
  body.appendChild(statLine('Personality', personalityLabel(cat.personality)));
  if (cat.parentIds && cat.parentIds.length > 0) {
    const parentNames = cat.parentIds.map(pid => {
      const p = state.cats.find(c => c.id === pid);
      return p ? p.name : '(gone to StarClan)';
    }).join(' & ');
    body.appendChild(statLine('Parents', parentNames));
  }
  body.appendChild(statLine('Mood',    pct(cat.happiness)));
  body.appendChild(statBar('Hunger',   100 - cat.hunger));
  body.appendChild(statBar('Energy',   cat.energy));
  body.appendChild(statBar('Happiness', cat.happiness));
  body.appendChild(statLine('Eye color', EYE_COLORS.find(e=>e.id===cat.eyeId).name));
  body.appendChild(el('div', { class: 'stat-want' }, '“' + cat.want.text + '”'));
  $('#stats-feed').onclick = () => { openInventory(cat); };
  $('#stats-feed').disabled = !(cat.want && cat.want.need === 'food') && cat.hunger < 50;

  // Kill button — only available after day 20.
  const killBtn = $('#stats-kill');
  if (state.day >= KILL_UNLOCK_DAY) {
    killBtn.classList.remove('hidden');
    killBtn.onclick = () => {
      if (confirm('Send ' + cat.name + ' to StarClan? The clan will mourn.')) killCat(cat);
    };
  } else {
    killBtn.classList.add('hidden');
  }
  // Murder button — also gated by KILL_UNLOCK_DAY. After clicking, the player
  // picks another cat as the victim. If close to witnesses → exile; if
  // isolated → secret murder.
  const murderBtn = $('#stats-murder');
  if (state.day >= KILL_UNLOCK_DAY) {
    murderBtn.classList.remove('hidden');
    murderBtn.onclick = () => {
      hideModal('stats-modal');
      state.murdererSelected = cat.id;
      setGuide('thinking', cat.name + ' is in a killing mood. Click another cat to choose their victim. (Close to others = caught and exiled. Isolated = secret.)');
    };
  } else {
    murderBtn.classList.add('hidden');
  }
  showModal('stats-modal');
}

// Execute a player-orchestrated murder. The outcome depends on whether the
// victim is near other clanmates at the time.
function executeMurder(murderer, victim) {
  const WITNESS_RADIUS = 130; // px
  const witnesses = state.cats.filter(c => {
    if (c.id === murderer.id || c.id === victim.id) return false;
    return Math.hypot(c.x - victim.x, c.y - victim.y) < WITNESS_RADIUS;
  });

  if (witnesses.length > 0) {
    // Caught — murderer is exiled, victim dies, witnesses traumatized.
    const witNames = witnesses.map(w => w.name).join(' and ');
    recordEvent(murderer.name + ' was caught killing ' + victim.name + ' by ' + witNames + ' and was exiled.');
    setGuide('thinking', murderer.name + ' killed ' + victim.name + ' in front of ' + witNames + '. The clan exiled ' + murderer.name + '.');
    witnesses.forEach(w => {
      w.happiness = Math.max(0, w.happiness - 20);
      adjustRel(w, murderer, -50, 'witnessed them murder ' + victim.name);
    });
    // Victim dies (uses the standard grief logic).
    naturalDeath(victim, 'was murdered by ' + murderer.name);
    // Murderer exiled — strip their relationships and remove from clan.
    for (const k of Object.keys(state.relationships)) {
      if (k.includes(murderer.id)) delete state.relationships[k];
    }
    state.cats = state.cats.filter(c => c.id !== murderer.id);
    // If the murderer was the leader/deputy, succession kicks in.
    if (murderer.role === 'leader')      handleLeaderSuccession();
    else if (murderer.role === 'deputy') handleDeputyVacancy();
  } else {
    // No one saw — secret murder. Victim dies; murderer keeps their place.
    recordEvent(victim.name + ' was found dead. No one knows who did it.');
    setGuide('thinking', murderer.name + ' killed ' + victim.name + ' in secret. The clan suspects nothing.');
    naturalDeath(victim, 'was found dead, with no witness');
  }
  renderAll();
  save();
}

// Remove a cat. Other cats grieve based on how close they were.
function killCat(cat) {
  state.cats.forEach(other => {
    if (other.id === cat.id) return;
    const rel = state.relationships[relKey(cat, other)];
    if (!rel) {
      other.happiness = Math.max(0, other.happiness - 2);
      return;
    }
    const closeness = Math.abs(rel.score);
    const drop = Math.min(60, Math.round(2 + closeness * 0.5));
    other.happiness = Math.max(0, other.happiness - drop);
    if (rel.score >= RELATIONSHIP_THRESHOLDS.crush) {
      other.want = { id: 'grief', text: 'I miss ' + cat.name + ' so much. Why did StarClan take them?', need: null };
    } else if (rel.score >= RELATIONSHIP_THRESHOLDS.friend) {
      other.want = { id: 'grief', text: 'The camp feels emptier without ' + cat.name + '.', need: null };
    }
  });
  // Forget all relationships involving this cat.
  for (const k of Object.keys(state.relationships)) {
    if (k.includes(cat.id)) delete state.relationships[k];
  }
  state.cats = state.cats.filter(c => c.id !== cat.id);
  recordEvent(cat.name + " walked the path to StarClan.");
  // If the leader just died, the deputy takes over and appoints a new deputy.
  if (cat.role === 'leader') handleLeaderSuccession();
  // If the deputy just died, the leader appoints a new deputy.
  else if (cat.role === 'deputy') handleDeputyVacancy();
  hideModal('stats-modal');
  setGuide('thinking', cat.name + ' walks the path to StarClan. The clan grieves.');
  renderAll();
  save();
}

// Strip a warrior suffix and replace with 'star' so a promoted deputy gets a
// proper leader name (e.g. "Brambleheart" → "Bramblestar").
function promoteToLeaderName(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith('star')) return name;
  // Try the longest known warrior suffix first.
  const sufs = NAME_SUFFIXES.filter(s => s !== 'paw' && s !== 'kit' && s !== 'star')
                            .slice().sort((a, b) => b.length - a.length);
  for (const suf of sufs) {
    if (lower.endsWith(suf)) return name.slice(0, name.length - suf.length) + 'star';
  }
  return name + 'star';
}

// When the leader dies, the deputy is promoted and a new deputy is chosen.
// If there's no deputy, the medicine cat steps in to name a new leader.
function handleLeaderSuccession() {
  const deputy = state.cats.find(c => c.role === 'deputy');
  if (!deputy) {
    handleMedicineCatAppointsLeader();
    return;
  }
  promoteCatToLeader(deputy, deputy.name + ' is the new leader');
}

// Promote a specific cat to leader, rename them with -star, and have them pick
// a new deputy. Shared by deputy-succession and medicine-cat-appointment paths.
function promoteCatToLeader(cat, announcePrefix) {
  const oldName = cat.name;
  cat.role = 'leader';
  cat.name = promoteToLeaderName(cat.name);
  recordEvent(oldName + " has taken over as the new leader: " + cat.name + ".");
  setGuide('cheer', announcePrefix + ' — ' + cat.name + '!');
  const newDeputy = chooseNewDeputy(cat);
  if (newDeputy) {
    newDeputy.role = 'deputy';
    recordEvent(cat.name + " appointed " + newDeputy.name + " as the new deputy.");
  }
}

// No leader and no deputy — the medicine cat appoints a warrior as the new
// leader (using the same personality-based picking logic).
function handleMedicineCatAppointsLeader() {
  const medCat = state.cats.find(c => c.role === 'medicine cat');
  if (!medCat) {
    recordEvent("The clan has no leader, deputy, or medicine cat. They are leaderless.");
    return;
  }
  const warriors = state.cats.filter(c => c.role === 'warrior');
  if (warriors.length === 0) {
    recordEvent(medCat.name + " has no warriors to name as leader.");
    return;
  }
  // Med cat uses the same personality-based picking logic as a leader picking
  // a deputy — wise/outgoing prefer their closest warrior, mysterious looks
  // for shared traits, others pick at random.
  const candidate = pickByPersonality(medCat, warriors);
  recordEvent(medCat.name + " has named " + candidate.name + " as the new leader.");
  promoteCatToLeader(candidate, medCat.name + ' has named ' + candidate.name + ' the new leader');
}

// Generic personality-driven cat picker — used both by leader-picks-deputy
// and medicine-cat-picks-leader.
function pickByPersonality(picker, candidates) {
  if (candidates.length === 0) return null;
  const traits = picker.personality || [];
  if (traits.includes('wise') || traits.includes('outgoing')) {
    let best = null, bestScore = -Infinity;
    candidates.forEach(c => {
      const r = state.relationships[relKey(picker, c)];
      const s = r ? r.score : 0;
      if (s > bestScore) { best = c; bestScore = s; }
    });
    return best || pickFromList(candidates);
  }
  if (traits.includes('mysterious')) {
    const sharedTrait = candidates.find(c =>
      (c.personality || []).some(t => traits.includes(t))
    );
    return sharedTrait || pickFromList(candidates);
  }
  return pickFromList(candidates);
}

// When the deputy dies, the existing leader picks a new deputy from the warriors.
function handleDeputyVacancy() {
  const leader = state.cats.find(c => c.role === 'leader');
  if (!leader) {
    recordEvent("The deputy is dead and the clan has no leader to appoint a new one.");
    return;
  }
  const newDeputy = chooseNewDeputy(leader);
  if (newDeputy) {
    newDeputy.role = 'deputy';
    recordEvent(leader.name + " appointed " + newDeputy.name + " as the new deputy.");
    setGuide('thinking', leader.name + ' has named ' + newDeputy.name + ' the new deputy.');
  } else {
    recordEvent(leader.name + " has no warriors to appoint as deputy.");
  }
}

// New leader picks a deputy. Method depends on their personality:
//   - wise / outgoing → highest-relationship warrior
//   - mysterious     → warrior who shares a personality trait
//   - grumpy / annoying → arbitrary (random)
//   - everyone else  → random
function chooseNewDeputy(newLeader) {
  const candidates = state.cats.filter(c => c.id !== newLeader.id && c.role === 'warrior');
  if (candidates.length === 0) return null;
  const traits = newLeader.personality || [];

  if (traits.includes('wise') || traits.includes('outgoing')) {
    let best = null, bestScore = -Infinity;
    candidates.forEach(c => {
      const r = state.relationships[relKey(newLeader, c)];
      const s = r ? r.score : 0;
      if (s > bestScore) { best = c; bestScore = s; }
    });
    return best || pickFromList(candidates);
  }
  if (traits.includes('mysterious')) {
    const sharedTrait = candidates.find(c =>
      (c.personality || []).some(t => traits.includes(t))
    );
    return sharedTrait || pickFromList(candidates);
  }
  // Grumpy / annoying / playful / energetic / shy / no-trait → random pick.
  return pickFromList(candidates);
}

function pct(n) { return Math.max(0, Math.min(100, Math.round(n))) + '%'; }

function statLine(key, val) {
  return el('div', { class: 'stat-line' }, [
    el('span', { class: 'key' }, key),
    el('span', { class: 'val' }, val)
  ]);
}

function statBar(key, value) {
  const w = Math.max(0, Math.min(100, Math.round(value)));
  const row = el('div', { class: 'stat-line' }, [
    el('span', { class: 'key' }, key),
    el('span', { class: 'stat-bar', html: `<span style="width:${w}%"></span>` })
  ]);
  return row;
}

$('#stats-close').addEventListener('click', () => hideModal('stats-modal'));

// ---------------- Inventory / feeding ----------------

function totalInventory() {
  return Object.values(state.inventory).reduce((a, b) => a + b, 0);
}

$('#inventory-btn').addEventListener('click', () => openInventory(null));
$('#inv-close').addEventListener('click', () => hideModal('inv-modal'));

function openInventory(targetCat) {
  const list = $('#inv-list');
  list.innerHTML = '';
  let any = false;
  PREY_TYPES.forEach(p => {
    const count = state.inventory[p.id] || 0;
    if (count <= 0) return;
    any = true;
    const row = el('div', { class: 'inv-row' }, [
      el('span', { class: 'inv-label' }, '🐾 ' + p.name),
      el('span', { class: 'inv-count' }, '×' + count)
    ]);
    if (targetCat) {
      const feedBtn = el('button', { class: 'bar-btn' }, 'Feed');
      feedBtn.onclick = () => feedCat(targetCat, p.id);
      row.appendChild(feedBtn);
    }
    list.appendChild(row);
  });
  if (!any) {
    list.appendChild(el('div', { class: 'inv-row empty' }, 'The fresh-kill pile is empty. Try hunting!'));
  }
  showModal('inv-modal');
  hideModal('stats-modal');
}

function feedCat(cat, preyId) {
  if (!state.inventory[preyId] || state.inventory[preyId] <= 0) return;
  const def = PREY_TYPES.find(p => p.id === preyId);
  state.inventory[preyId]--;
  cat.hunger = Math.max(0, cat.hunger - 30 * (def.value || 1));
  cat.happiness = Math.min(100, cat.happiness + 6);
  if (cat.want && cat.want.need === 'food') {
    cat.want = { id: 'sated', text: 'Mmm. That was a good ' + def.name.toLowerCase() + '.', need: null };
  }
  save();
  $('#inv-count').textContent = totalInventory();
  openInventory(cat);
  renderRelationships();
}

// ---------------- Hunt minigame ----------------

let hunt = null;

$('#hunt-btn').addEventListener('click', startHunt);
$('#hunt-quit').addEventListener('click', endHunt);

function startHunt() {
  if (state.lastHuntDay === state.day) {
    setGuide('thinking', "You've already hunted today. Skip Day to hunt again.");
    return;
  }
  state.lastHuntDay = state.day;
  refreshHuntButton();
  hunt = {
    score: 0, time: 20, lastPreySpawn: 0,
    field: $('#hunt-field'),
    timerId: null,
    spawnId: null,
    moveId: null,
    prey: []
  };
  hunt.field.innerHTML = '';
  $('#hunt-score').textContent = '0';
  $('#hunt-timer').textContent = '20';
  showModal('hunt-modal');
  advanceTutorialOnAction('hunt_started');

  hunt.timerId = setInterval(() => {
    hunt.time--;
    $('#hunt-timer').textContent = hunt.time;
    if (hunt.time <= 0) endHunt();
  }, 1000);
  hunt.spawnId = setInterval(spawnPrey, 700);
  hunt.moveId = setInterval(movePrey, 50);
  spawnPrey(); spawnPrey();
}

function spawnPrey() {
  if (!hunt) return;
  if (hunt.prey.length > 5) return;
  // pick prey by weight
  const total = PREY_TYPES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  let pick = PREY_TYPES[0];
  for (const p of PREY_TYPES) { r -= p.weight; if (r <= 0) { pick = p; break; } }
  const fr = hunt.field.getBoundingClientRect();
  const x = Math.random() * (fr.width - 36);
  const y = Math.random() * (fr.height - 36);
  const angle = Math.random() * Math.PI * 2;
  const node = el('img', {
    class: 'prey',
    src: pick.sprite,
    style: `left:${x}px; top:${y}px;`,
    'data-id': pick.id
  });
  const pState = {
    node, def: pick, x, y,
    vx: Math.cos(angle) * pick.speed * 1.5,
    vy: Math.sin(angle) * pick.speed * 1.5,
    life: 5000 + Math.random() * 4000
  };
  node.addEventListener('click', () => catchPrey(pState));
  hunt.field.appendChild(node);
  hunt.prey.push(pState);
}

function movePrey() {
  if (!hunt) return;
  const fr = hunt.field.getBoundingClientRect();
  hunt.prey = hunt.prey.filter(p => {
    p.life -= 50;
    if (p.life <= 0) { p.node.remove(); return false; }
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > fr.width - 36) p.vx *= -1;
    if (p.y < 0 || p.y > fr.height - 36) p.vy *= -1;
    p.node.style.left = p.x + 'px';
    p.node.style.top  = p.y + 'px';
    return true;
  });
}

function catchPrey(p) {
  state.inventory[p.def.id] = (state.inventory[p.def.id] || 0) + 1;
  hunt.score++;
  $('#hunt-score').textContent = hunt.score;
  p.node.remove();
  hunt.prey = hunt.prey.filter(x => x !== p);
}

function endHunt() {
  if (!hunt) return;
  clearInterval(hunt.timerId);
  clearInterval(hunt.spawnId);
  clearInterval(hunt.moveId);
  hunt.prey.forEach(p => p.node.remove());
  hunt = null;
  hideModal('hunt-modal');
  $('#inv-count').textContent = totalInventory();
  save();
}

// ---------------- Cat-on-cat talking ----------------

function relKey(a, b) {
  return [a.id, b.id].sort().join('|');
}

function getRel(a, b) {
  const k = relKey(a, b);
  if (!state.relationships[k]) {
    // First impression — track the contributing reasons so the guide can
    // explain WHY they don't click.
    let score = -3 + Math.floor(Math.random() * 7); // -3..+3 base
    const reasons = [];
    if (a.annoying) {
      score -= 6 + Math.floor(Math.random() * 6);
      reasons.push(b.name + ' finds ' + a.name + ' annoying');
    }
    if (b.annoying) {
      score -= 6 + Math.floor(Math.random() * 6);
      reasons.push(a.name + ' finds ' + b.name + ' annoying');
    }
    if (!attractedTo(a, b) && !attractedTo(b, a)) {
      score -= 2;
      reasons.push('no romantic spark — different orientations');
    }
    if (a.colorId === b.colorId) score += 3;
    const clash = personalityClash(a, b);
    score += clash;
    if (clash <= -3) {
      reasons.push('their personalities clash (' + personalityLabel(a.personality) + ' vs ' + personalityLabel(b.personality) + ')');
    }
    score = Math.max(-30, Math.min(20, score));
    state.relationships[k] = { score, type: classifyRel(score) };
    // Tell the player WHY a fresh relationship soured.
    if (score <= RELATIONSHIP_THRESHOLDS.dislike && reasons.length > 0) {
      setGuide('thinking',
        a.name + ' and ' + b.name + ' didn\'t hit it off — ' + reasons.join('; and ') + '.');
    }
  }
  return state.relationships[k];
}

// Classify a numeric score into a relationship "type" label.
function classifyRel(score) {
  const t = RELATIONSHIP_THRESHOLDS;
  if (score >= t.mate)    return 'mate';
  if (score >= t.crush)   return 'crush';
  if (score >= t.bestie)  return 'best friend';
  if (score >= t.friend)  return 'friend';
  if (score <= t.enemy)   return 'enemy';
  if (score <= t.dislike) return 'dislikes';
  return 'acquaintance';
}

function adjustRel(a, b, delta, reason) {
  const r = getRel(a, b);
  r.score = Math.max(-100, Math.min(100, r.score + delta));
  // Mates stay mates no matter how low the score drops — only an explicit
  // breakup can change them out of the mate state.
  if (r.type !== 'mate') {
    r.type = classifyRel(r.score);
  }
  // Surface meaningful happiness drops to the player so they understand WHY
  // a relationship is souring.
  if (delta <= -3) {
    const msg = a.name + ' likes ' + b.name + ' a little less now' +
                (reason ? ' — ' + reason + '.' : '.');
    setGuide('thinking', msg);
  }
}

function startCatTalk(a, b) {
  const rel = getRel(a, b);
  // Romance shortcut: if both cats want romance today AND the bond is at crush
  // level OR they're already mates, the cutscene plays INSTEAD of the regular
  // talk modal — that's the only thing that happens right now.
  if (canRomanceFire(a, b, rel)) {
    maybePromptCrush(a, b, rel);
    return;
  }
  // Build a short dialog. Pick from the appropriate tier with no repeats.
  const lines = [];
  const opener = pickFromList(TALK_OPENERS);
  lines.push({ kind: 'narrator', text: fillTokens(opener, a, b) });

  // Pick the conversation tier — mate beats friend beats foe beats new.
  let bodyArr, replyArr, bodyKey, replyKey, thirdArr;
  if (rel.type === 'mate') {
    bodyArr = TALK_BODIES_MATE;  replyArr = TALK_REPLIES_MATE;
    bodyKey = 'body_mate';       replyKey = 'reply_mate';
    thirdArr = THIRD_CAT_LINES_MATE;
  } else if (rel.score >= RELATIONSHIP_THRESHOLDS.friend) {
    bodyArr = TALK_BODIES_FRIEND; replyArr = TALK_REPLIES_FRIEND;
    bodyKey = 'body_friend';      replyKey = 'reply_friend';
    thirdArr = THIRD_CAT_LINES_FRIEND;
  } else if (rel.score <= RELATIONSHIP_THRESHOLDS.dislike) {
    bodyArr = TALK_BODIES_FOE;   replyArr = TALK_REPLIES_FOE;
    bodyKey = 'body_foe';        replyKey = 'reply_foe';
    thirdArr = THIRD_CAT_LINES_FOE;
  } else {
    bodyArr = TALK_BODIES_NEW;   replyArr = TALK_REPLIES_NEW;
    bodyKey = 'body_new';        replyKey = 'reply_new';
    thirdArr = THIRD_CAT_LINES_NEW;
  }
  // Other clanmates available to gossip about. Pick a fresh one for each
  // mention so they don't keep namedropping the same cat.
  const others = state.cats.filter(c => c.id !== a.id && c.id !== b.id);
  // A's "speak" = a topic-bearing body line, optionally swapped for personality
  // flavor or third-cat gossip. B's "speak" = a short, general reply that fits
  // most openers, so the back-and-forth reads coherently.
  const speakBody = (speaker) => {
    if (others.length > 0 && Math.random() < 0.22) {
      const c = pickFromList(others);
      return fillTokens(pickFromList(thirdArr), a, b, c);
    }
    let line = pickUnusedFromList(bodyArr, bodyKey);
    const pline = personalityLine(speaker);
    if (pline && Math.random() < 0.4) line = pline;
    return line;
  };

  // Conversation is short: 2 to 4 total lines, alternating A → B → A → B.
  // Opener is A's body line. Closer is a short reply. Middle slot (if any)
  // is another body line.
  const totalLines = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
  for (let i = 0; i < totalLines; i++) {
    const speaker  = (i % 2 === 0) ? a : b;
    const isFirst  = i === 0;
    const isLast   = i === totalLines - 1;
    let line;
    if (isFirst) {
      // Opener — A's body line. Mate may callback to their stored topic.
      if (rel.type === 'mate' && rel.matetopic && Math.random() < 0.35) {
        line = '"Remember when we used to talk about ' + rel.matetopic + '?"';
      } else {
        line = speakBody(speaker);
      }
    } else if (isLast) {
      // Closing — short reply line so the conversation lands cleanly.
      line = pickUnusedFromList(replyArr, replyKey);
    } else {
      // Middle line — substantive body line from whoever's turn it is.
      line = speakBody(speaker);
    }
    lines.push({ kind: 'speaker', who: speaker.name, text: line });
  }

  const closer = pickFromList(TALK_CLOSERS);
  lines.push({ kind: 'narrator', text: fillTokens(closer, a, b) });

  // Score adjustments — usually friendly contact warms cats up.
  let delta = 4 + Math.floor(Math.random() * 5);
  let reason = null;
  if (rel.score <= RELATIONSHIP_THRESHOLDS.dislike) {
    delta = -3;
    reason = 'forced to talk to a cat they don\'t like';
  }
  adjustRel(a, b, delta, reason);

  $('#talk-title').textContent = a.name + ' & ' + b.name;
  const body$ = $('#talk-body');
  body$.innerHTML = '';
  lines.forEach(l => {
    const line = el('div', { class: 'talk-line' });
    if (l.kind === 'speaker') {
      line.innerHTML = `<span class="speaker">${escapeHtml(l.who)}:</span> <span>${escapeHtml(l.text)}</span>`;
    } else {
      line.innerHTML = `<span class="narrator">${escapeHtml(l.text)}</span>`;
    }
    body$.appendChild(line);
  });

  showModal('talk-modal');
  renderRelationships();
  save();
  // (Cutscenes only fire when BOTH cats want romance — handled at the top of
  // startCatTalk via canRomanceFire. No automatic prompt after a normal talk.)
}

// Cutscene gate. Both cats must:
//   - want romance today
//   - have crossed the crush threshold OR already be mates
//   - not have used today's once-per-day cutscene slot
// Kits/apprentices already can't mate (canMate filters them).
function canRomanceFire(a, b, rel) {
  if (!a.wantsRomance || !b.wantsRomance) return false;
  if (!canMate(a, b)) return false; // blocks kits/apprentices and bad orientation
  if (state.lastCrushPromptDay === state.day) return false;
  // Cats can only have ONE mate. If either is already mated to someone else,
  // no new romance cutscene with a third party.
  const aMate = existingMate(a);
  const bMate = existingMate(b);
  if (aMate && aMate.id !== b.id) return false;
  if (bMate && bMate.id !== a.id) return false;
  if (rel.type === 'mate') return true;
  return rel.score >= RELATIONSHIP_THRESHOLDS.crush;
}

$('#talk-close').addEventListener('click', () => hideModal('talk-modal'));

function pickFromList(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Pick an item from arr that hasn't been used yet under the given key. When all
// have been used, the cycle resets so dialogue can repeat eventually — but never
// the same line twice in a row across the clan's history.
function pickUnusedFromList(arr, key) {
  if (!state.usedTalk[key]) state.usedTalk[key] = [];
  if (state.usedTalk[key].length >= arr.length) state.usedTalk[key] = [];
  const usedSet = new Set(state.usedTalk[key]);
  const available = [];
  for (let i = 0; i < arr.length; i++) if (!usedSet.has(i)) available.push(i);
  const idx = available[Math.floor(Math.random() * available.length)];
  state.usedTalk[key].push(idx);
  return arr[idx];
}

function fillTokens(s, a, b, c) {
  return s
    .replace(/\{a-tail\}/g, a.gender === 'tom' ? 'his' : a.gender === 'she-cat' ? 'her' : 'their')
    .replace(/\{a-shoulder\}/g, a.gender === 'tom' ? 'his' : a.gender === 'she-cat' ? 'her' : 'their')
    .replace(/\{a\}/g, a.name)
    .replace(/\{b\}/g, b.name)
    .replace(/\{c\}/g, c ? c.name : 'someone');
}

// ---------------- Crush / mate cutscene ----------------

function maybePromptCrush(a, b, rel) {
  hideModal('talk-modal');
  state.lastCrushPromptDay = state.day;
  // If they've already had their confession and we captured their first topic,
  // don't ask again — just play the cutscene with the stored topic.
  if (rel.matetopic) {
    runCutscene(a, b, rel.matetopic, rel);
    return;
  }
  // Three flavors: confession (first time), date (already crushes), mates.
  let title, intro;
  if (rel.type === 'mate') {
    title = 'Two hearts';
    intro = `${a.name} and ${b.name} love each other deeply.`;
  } else if (rel.hasConfessed) {
    title = 'Growing closer';
    intro = `${a.name} and ${b.name} are still inseparable. Today's walk could change everything.`;
  } else {
    title = 'A confession';
    intro = `${a.name} can't hide it any longer. They want to tell ${b.name} how they feel.`;
  }
  $('#crush-title').textContent = title;
  $('#crush-intro').textContent = intro;
  $('#crush-topic').value = '';
  $('#crush-go').onclick = () => {
    const topic = $('#crush-topic').value.trim();
    // Persist the topic on the relationship so we don't ask again.
    if (topic) rel.matetopic = topic;
    hideModal('crush-modal');
    runCutscene(a, b, topic, rel);
  };
  $('#crush-skip').onclick = () => hideModal('crush-modal');
  showModal('crush-modal');
}

function runCutscene(a, b, topic, rel) {
  // Will this cutscene be the one that promotes them to mates?
  const willBecomeMates = rel.hasConfessed && rel.type !== 'mate' &&
                          (rel.score + 6) >= RELATIONSHIP_THRESHOLDS.mate &&
                          !existingMate(a) && !existingMate(b);
  const isMate = rel && rel.type === 'mate';
  $('#scene-title').textContent = isMate          ? 'Together under the stars'
                                : willBecomeMates ? 'Under the moon, two become one'
                                : 'A walk under the stars';
  const stage = $('#scene-stage');
  stage.innerHTML = '';
  const aImg = el('div', { class: 'scene-cat', style: 'left: -64px;' });
  const bImg = el('div', { class: 'scene-cat', style: 'right: -64px;' });
  aImg.innerHTML = catSpriteSVG(Object.assign({}, a, { facing: 'right' }));
  bImg.innerHTML = catSpriteSVG(Object.assign({}, b, { facing: 'left' }));
  bImg.style.right = 'auto';
  bImg.style.left = '600px';
  stage.appendChild(aImg);
  stage.appendChild(bImg);

  // Animate them walking toward each other
  setTimeout(() => {
    aImg.style.left = '180px';
    bImg.style.left = '320px';
  }, 80);

  const script = $('#scene-script');
  script.innerHTML = '';
  $('#scene-close').disabled = true;

  const lines = buildCutsceneLines(a, b, topic, rel, willBecomeMates);

  let i = 0;
  function next() {
    if (i >= lines.length) {
      $('#scene-close').disabled = false;
      // Resolve the relationship state. Confession → crush, then a future
      // cutscene can promote crush → mate.
      if (!rel.hasConfessed) {
        // First confession: they become official crushes.
        rel.hasConfessed = true;
        rel.type = 'crush';
        rel.score = Math.max(rel.score, RELATIONSHIP_THRESHOLDS.crush);
        // Don't auto-jump to mate — leave room for a second cutscene later.
        rel.score = Math.min(rel.score, RELATIONSHIP_THRESHOLDS.mate - 2);
        recordEvent(a.name + " confessed their feelings to " + b.name + ". They're crushes now.");
      } else if (rel.type !== 'mate') {
        // Crushes already — continued courting may promote them to mates.
        rel.score = Math.min(100, rel.score + 6);
        const aMate = existingMate(a);
        const bMate = existingMate(b);
        if (rel.score >= RELATIONSHIP_THRESHOLDS.mate && !aMate && !bMate) {
          rel.type = 'mate';
          recordEvent(a.name + " and " + b.name + " became mates today.");
        } else {
          rel.type = 'crush';
        }
      } else {
        // Already mates — just a romantic moment.
        rel.score = Math.min(100, rel.score + 4);
      }
      renderRelationships();
      save();
      return;
    }
    const l = lines[i++];
    const line = el('div', { class: 'talk-line' });
    if (l.kind === 'speaker') {
      line.innerHTML = `<span class="speaker">${escapeHtml(l.who)}:</span> <span>${escapeHtml(l.text)}</span>`;
    } else {
      line.innerHTML = `<span class="narrator">${escapeHtml(l.text)}</span>`;
    }
    script.appendChild(line);
    script.scrollTop = script.scrollHeight;
    setTimeout(next, 800);
  }
  setTimeout(next, 700);

  showModal('scene-modal');
}

function pickByTrait(table, cat) {
  const traits = (cat.personality || []).filter(t => table[t]);
  const trait = traits.length ? pickFromList(traits) : 'outgoing';
  return pickFromList(table[trait] || table.outgoing);
}

function buildCutsceneLines(a, b, topic, rel, willBecomeMates) {
  const isMate       = rel && rel.type === 'mate';
  const isConfession = rel && !rel.hasConfessed;
  const t = topic && topic.length ? topic : (isMate ? 'our future together' : 'the way the moon looks tonight');

  if (isConfession) {
    // First-time confession. Lines vary by personality of speaker and replier.
    return [
      { kind: 'narrator', text: `${a.name} pulls ${b.name} aside as the clearing empties.` },
      { kind: 'speaker', who: a.name, text: pickByTrait(CONFESS_OPEN, a) },
      { kind: 'speaker', who: b.name, text: '"What is it? You can tell me anything."' },
      { kind: 'narrator', text: `${a.name} takes a slow breath, ears tilted forward.` },
      { kind: 'speaker', who: a.name, text: pickByTrait(CONFESS_DECLARE, a) },
      { kind: 'speaker', who: b.name, text: pickByTrait(CONFESS_REPLY, b) },
      { kind: 'narrator', text: `Two hearts settle into a new shape. They're crushes now — and the whole clan will see it in their eyes tomorrow.` }
    ];
  }
  if (willBecomeMates) {
    // Mate-ceremony cutscene — when crushes officially become mates.
    return [
      { kind: 'narrator', text: `Under a full moon, ${a.name} and ${b.name} walk side by side to the great oak.` },
      { kind: 'speaker', who: a.name, text: `"I want to be your mate. For all my lives."` },
      { kind: 'speaker', who: b.name, text: pickByTrait(DATE_REPLY_MATE, b) },
      { kind: 'narrator', text: `${a.name} touches noses with ${b.name}. The whole clearing seems to hush.` },
      { kind: 'speaker', who: a.name, text: `"Together, ${b.name}. Always."` },
      { kind: 'speaker', who: b.name, text: `"Together. Until StarClan calls us home."` },
      { kind: 'narrator', text: `Two purrs rumble as one. They are mates now — bonded under the same stars that watch over the clan.` }
    ];
  }
  // Date (still crushes) or mates — personality-varied romantic moment.
  const replyTable = isMate ? DATE_REPLY_MATE : DATE_REPLY_CRUSH;
  return [
    { kind: 'narrator', text: `${a.name} and ${b.name} pad away from the clearing as the sky turns lavender.` },
    { kind: 'speaker', who: a.name, text: `"I've been thinking about ${t}, and about you."` },
    { kind: 'speaker', who: b.name, text: '"I want to hear all of it."' },
    { kind: 'narrator', text: `They settle by the great oak. ${a.name}'s tail brushes ${b.name}'s flank.` },
    { kind: 'speaker', who: a.name, text: pickByTrait(DATE_OPEN, a) },
    { kind: 'speaker', who: b.name, text: pickByTrait(replyTable, b) },
    { kind: 'narrator', text: `Two purrs rumble into the night, low and warm. The clan sleeps, but here, under the stars, two hearts are wide awake.` }
  ];
}

$('#scene-close').addEventListener('click', () => hideModal('scene-modal'));

// ---------------- Skip day ----------------

$('#skip-day-btn').addEventListener('click', skipDay);

function skipDay() {
  state.day++;
  // Roll new wants and tick stats.
  state.cats.forEach(c => {
    c.hunger = Math.min(100, c.hunger + 18 + Math.floor(Math.random() * 10));
    c.energy = Math.min(100, c.energy + 12 - (c.hunger > 70 ? 6 : 0));
    if (c.hunger > 70) c.happiness = Math.max(0, c.happiness - 6);
    else c.happiness = Math.min(100, c.happiness + 2);
    c.want = rollWant();
    c.wantBubbleVisible = Math.random() < 0.6;
  });
  // small drift on relationships — closer cats grow closer naturally.
  for (const k in state.relationships) {
    const r = state.relationships[k];
    if (r.score > 30) r.score = Math.min(100, r.score + 1);
  }
  // Returning patrols, mate kits, elder deaths, jealousy, hate murders, daily event, leader meeting.
  resolvePatrol();
  resolveWar();
  maybeHoldGathering();
  rollSneakIn();
  rollRomanceWants();
  rollForKits();
  rollElderDeaths();
  rollJealousy();
  rollMateRivalry();
  rollMedicineCatGossip();
  rollMateBreakups();
  rollHateMurders();
  showDailyEvent();
  renderAll(); // also refreshes builder buttons (cooldown counter)
  save();
  advanceTutorialOnAction('day_skipped');
  // Hold the leader meeting AFTER everything resolves so the recap is up to date.
  maybeHoldLeaderMeeting();
  // (Spontaneous crush prompts removed — cutscenes only fire when the player
  // drops two cats together AND both cats want romance that day.)
}

// ---------------- Mating, kits, daily events ----------------

function attractedTo(a, target) {
  if (!a.orientation || a.orientation === 'any') return true;
  if (a.orientation === 'toms'     && target.gender === 'tom')      return true;
  if (a.orientation === 'she-cats' && target.gender === 'she-cat')  return true;
  return false;
}

function canMate(a, b) {
  // Kits and apprentices (regular OR medicine cat) are too young to mate.
  const tooYoung = r => r === 'kit' || r === 'apprentice' || r === 'medicine cat apprentice';
  if (tooYoung(a.role) || tooYoung(b.role)) return false;
  // Family members can't mate — parents/grandparents/siblings/cousins, etc.
  if (areRelated(a, b)) return false;
  return attractedTo(a, b) && attractedTo(b, a);
}

// Walk up a cat's family tree and collect ancestor ids (parents, grandparents,
// great-grandparents). Used for incest detection.
function getAncestors(cat, depth) {
  if (depth == null) depth = 4;
  const ancestors = new Set();
  function walk(c, d) {
    if (d <= 0 || !c || !c.parentIds) return;
    for (const pid of c.parentIds) {
      ancestors.add(pid);
      const parent = state.cats.find(x => x.id === pid);
      if (parent) walk(parent, d - 1);
    }
  }
  walk(cat, depth);
  return ancestors;
}

// True if a and b share blood — direct parent/child OR any common ancestor in
// the last 4 generations (covers siblings, cousins, second cousins, etc.).
function areRelated(a, b) {
  if (a.id === b.id) return true;
  if (a.parentIds && a.parentIds.includes(b.id)) return true;
  if (b.parentIds && b.parentIds.includes(a.id)) return true;
  const aAncestors = getAncestors(a);
  const bAncestors = getAncestors(b);
  if (aAncestors.has(b.id) || bAncestors.has(a.id)) return true;
  for (const id of aAncestors) if (bAncestors.has(id)) return true;
  return false;
}

// Find a cat's existing mate (if any) — returns the other cat, or null.
function existingMate(cat) {
  for (const other of state.cats) {
    if (other.id === cat.id) continue;
    const r = state.relationships[relKey(cat, other)];
    if (r && r.type === 'mate') return other;
  }
  return null;
}

// Each cat decides today whether they're hoping for a romantic moment. Both
// cats need to be feeling it for a confession/date cutscene to fire.
function rollRomanceWants() {
  state.cats.forEach(c => {
    if (c.role === 'kit' || c.role === 'apprentice' || c.role === 'elder') {
      c.wantsRomance = false;
      return;
    }
    const chance = 0.20 + (c.happiness / 400);
    c.wantsRomance = Math.random() < chance;
  });
}

// Cats decide each day whether they're feeling broody. Mate pairs where BOTH
// partners want kits the same day have a real shot at having one — the player
// doesn't decide.
function rollForKits() {
  if (state.cats.length >= MAX_CATS) return;

  // Each cat rolls "wantsKits" today. Happier cats are more likely to want kits.
  // Kits and elders never want kits themselves.
  state.cats.forEach(c => {
    if (c.role === 'kit' || c.role === 'elder') { c.wantsKits = false; return; }
    const chance = 0.10 + (c.happiness / 400);   // ~10-35% range based on mood
    c.wantsKits = Math.random() < chance;
    if (c.wantsKits) {
      c.want = { id: 'kits-want', text: 'I want to have kits of my own...', need: null };
      c.wantBubbleVisible = true;
    }
  });

  // Find mate pairs where BOTH partners want kits today.
  const willing = [];
  for (let i = 0; i < state.cats.length; i++) {
    for (let j = i + 1; j < state.cats.length; j++) {
      const a = state.cats[i], b = state.cats[j];
      const r = state.relationships[relKey(a, b)];
      if (r && r.type === 'mate' && canMate(a, b) && a.wantsKits && b.wantsKits) {
        willing.push([a, b]);
      }
    }
  }
  if (willing.length === 0) return;

  // Pick one willing pair (at most one kit per day) and roll their actual chance.
  const [a, b] = pickFromList(willing);
  if (Math.random() > 0.5) return;             // 50% per willing pair per day
  if (state.cats.length >= MAX_CATS) return;
  // Same-gender mate pairs adopt a kit (no biological inheritance) — the kit's
  // looks are fully random, like a found / brought-in kit.
  const adopted = a.gender === b.gender;
  const kit = makeCat({
    name: randomNameForRole('kit'),
    gender:      pickFromList(['she-cat', 'tom', 'non-binary']),
    orientation: pickFromList(['she-cats', 'toms', 'any']),
    colorId:     adopted ? pickFromList(PELT_COLORS).id  : (Math.random() < 0.5 ? a.colorId  : b.colorId),
    designId:    adopted ? pickFromList(PELT_DESIGNS).id : (Math.random() < 0.5 ? a.designId : b.designId),
    eyeId:       adopted ? pickFromList(EYE_COLORS).id   : (Math.random() < 0.5 ? a.eyeId    : b.eyeId),
    role:        'kit',
    parentIds:   [a.id, b.id]
  });
  state.cats.push(kit);
  // Both parents' broodiness is satisfied for now.
  a.wantsKits = false;
  b.wantsKits = false;
  if (adopted) {
    recordEvent(a.name + " and " + b.name + " adopted a kit, " + kit.name + ".");
    setGuide('cheer', a.name + ' and ' + b.name + ' adopted a kit — ' + kit.name + '!');
  } else {
    recordEvent(a.name + " and " + b.name + " welcomed a new kit, " + kit.name + ".");
    setGuide('cheer', a.name + ' and ' + b.name + ' have a new kit — ' + kit.name + '!');
  }
}

// Record an event for the next leader meeting recap.
function recordEvent(text) {
  state.recentEvents.push({ day: state.day, text });
  // Keep the list bounded.
  if (state.recentEvents.length > 40) state.recentEvents.shift();
}

// ---------------- Patrols ----------------

$('#patrol-btn').addEventListener('click', openPatrolModal);
$('#patrol-cancel').addEventListener('click', () => hideModal('patrol-modal'));
$('#patrol-send').addEventListener('click', sendPatrol);

function openPatrolModal() {
  if (state.patrol && state.patrol.length > 0) {
    setGuide('thinking', "A patrol is already out — it'll come back next Skip Day.");
    return;
  }
  if (state.cats.length < 2) {
    setGuide('thinking', "You need at least two cats in the clan to send a patrol.");
    return;
  }
  const list = $('#patrol-cat-list');
  list.innerHTML = '';
  state.cats.forEach(c => {
    if (c.role === 'kit') return; // kits don't patrol
    const row = el('div', { class: 'patrol-row', 'data-id': c.id });
    row.innerHTML =
      `<input type="checkbox" data-id="${c.id}" />` +
      `<span class="pcat-name">${escapeHtml(c.name)}</span>` +
      `<span class="pcat-role">${c.role}</span>`;
    row.addEventListener('click', (e) => {
      const cb = row.querySelector('input');
      if (e.target !== cb) cb.checked = !cb.checked;
      row.classList.toggle('selected', cb.checked);
    });
    list.appendChild(row);
  });
  showModal('patrol-modal');
}

function sendPatrol() {
  const ids = Array.from($('#patrol-cat-list').querySelectorAll('input:checked'))
    .map(cb => cb.dataset.id);
  if (ids.length < 2) {
    setGuide('thinking', "A patrol needs at least two cats.");
    return;
  }
  state.patrol = ids;
  // Mark on patrol so they fade in the world while away.
  state.cats.forEach(c => { c._wasOnPatrol = false; });
  state.cats.forEach(c => { if (ids.includes(c.id)) c._wasOnPatrol = true; });
  hideModal('patrol-modal');
  const names = state.cats.filter(c => ids.includes(c.id)).map(c => c.name).join(', ');
  setGuide('cheer', "The patrol heads out: " + names + ". They'll return after Skip Day.");
  renderCats();
  save();
}

// Called from skipDay — patrols come home with prey + relationship boosts.
function resolvePatrol() {
  if (!state.patrol || state.patrol.length === 0) return;
  const ids = state.patrol;
  const onPatrol = state.cats.filter(c => ids.includes(c.id));
  if (onPatrol.length < 2) { state.patrol = []; return; }

  // 1-20 prey, distributed across types.
  const totalPrey = 1 + Math.floor(Math.random() * 20);
  for (let i = 0; i < totalPrey; i++) {
    const t = pickFromList(PREY_TYPES);
    state.inventory[t.id] = (state.inventory[t.id] || 0) + 1;
  }
  // Bond boost between every pair on the patrol.
  for (let i = 0; i < onPatrol.length; i++) {
    for (let j = i + 1; j < onPatrol.length; j++) {
      adjustRel(onPatrol[i], onPatrol[j], 6 + Math.floor(Math.random() * 5));
    }
  }
  // Patrol takes a toll: hunger up, energy down.
  onPatrol.forEach(c => {
    c.hunger = Math.min(100, c.hunger + 8);
    c.energy = Math.max(0, c.energy - 18);
  });

  state.patrol = [];
  state.cats.forEach(c => { c._wasOnPatrol = false; });
  recordEvent("A patrol returned with " + totalPrey + " prey.");
  setGuide('cheer', "The patrol returned with " + totalPrey + " prey!");
  $('#inv-count').textContent = totalInventory();
}

// ---------------- War (declare battle on another clan) ----------------

$('#war-btn').addEventListener('click', openWarModal);
$('#war-cancel').addEventListener('click', () => hideModal('war-modal'));
$('#war-go').addEventListener('click', sendWarParty);

function openWarModal() {
  if (state.warParty && state.warParty.length > 0) {
    setGuide('thinking', "A war party is already out — they'll return next Skip Day.");
    return;
  }
  const fighters = state.cats.filter(c =>
    c.role === 'warrior' || c.role === 'leader' || c.role === 'deputy' || c.role === 'apprentice'
  );
  if (fighters.length < 2) {
    setGuide('thinking', "You need at least two fighters in the clan to ride out.");
    return;
  }
  const list = $('#war-cat-list');
  list.innerHTML = '';
  fighters.forEach(c => {
    const row = el('div', { class: 'patrol-row', 'data-id': c.id });
    row.innerHTML =
      `<input type="checkbox" data-id="${c.id}" />` +
      `<span class="pcat-name">${escapeHtml(c.name)}</span>` +
      `<span class="pcat-role">${c.role}</span>`;
    row.addEventListener('click', (e) => {
      const cb = row.querySelector('input');
      if (e.target !== cb) cb.checked = !cb.checked;
      row.classList.toggle('selected', cb.checked);
    });
    list.appendChild(row);
  });
  // Enemy clan picker
  const enemySel = $('#war-enemy');
  enemySel.innerHTML = '';
  OTHER_CLANS.forEach(clan => {
    const opt = document.createElement('option');
    opt.value = clan; opt.textContent = clan;
    enemySel.appendChild(opt);
  });
  showModal('war-modal');
}

function sendWarParty() {
  const ids = Array.from($('#war-cat-list').querySelectorAll('input:checked')).map(cb => cb.dataset.id);
  if (ids.length < 2) {
    setGuide('thinking', "A war party needs at least two fighters.");
    return;
  }
  state.warParty = ids;
  state.warEnemy = $('#war-enemy').value;
  hideModal('war-modal');
  const names = state.cats.filter(c => ids.includes(c.id)).map(c => c.name).join(', ');
  setGuide('cheer', "The war party rides out to fight " + state.warEnemy + ": " + names + ".");
  recordEvent("Declared war on " + state.warEnemy + ". Party: " + names + ".");
  renderCats();
  save();
}

// Called from skipDay — war resolves, some return, some die, win/lose decided.
function resolveWar() {
  if (!state.warParty || state.warParty.length === 0) return;
  const ids = state.warParty;
  const fighters = state.cats.filter(c => ids.includes(c.id));
  if (fighters.length < 1) { state.warParty = []; state.warEnemy = null; return; }

  // Win chance scales with party size — bigger party = better odds.
  const winChance = Math.min(0.85, 0.40 + fighters.length * 0.07);
  const won = Math.random() < winChance;

  // Each cat has a chance to die in the battle. Bigger party = lower per-cat risk.
  const deathChance = won ? Math.max(0.06, 0.20 - fighters.length * 0.02)
                          : Math.max(0.12, 0.30 - fighters.length * 0.02);
  const dead = [];
  fighters.forEach(c => {
    if (Math.random() < deathChance) dead.push(c);
  });

  state.warParty = [];
  const enemy = state.warEnemy || 'the rival clan';
  state.warEnemy = null;
  // Survivors bond like patrols.
  const survivors = fighters.filter(c => !dead.includes(c));
  for (let i = 0; i < survivors.length; i++) {
    for (let j = i + 1; j < survivors.length; j++) {
      adjustRel(survivors[i], survivors[j], 8 + Math.floor(Math.random() * 5));
    }
    survivors[i].hunger = Math.min(100, survivors[i].hunger + 12);
    survivors[i].energy = Math.max(0, survivors[i].energy - 25);
  }
  // Apply deaths.
  dead.forEach(c => {
    recordEvent(c.name + " died in battle against " + enemy + ".");
    naturalDeath(c, "fell in battle against " + enemy);
  });

  if (won) {
    state.warsWon++;
    recordEvent("The clan won the battle against " + enemy + "!");
    setGuide('cheer', "Victory against " + enemy + "! " + (state.warsWon === 1 ? "You can now build the Gathering Tree from the den picker." : "") + (dead.length > 0 ? " Lost: " + dead.map(c => c.name).join(', ') + "." : ""));
  } else {
    recordEvent("The clan was defeated by " + enemy + ".");
    setGuide('thinking', "The clan was driven back by " + enemy + "." + (dead.length > 0 ? " Lost: " + dead.map(c => c.name).join(', ') + "." : ""));
  }
  $('#inv-count').textContent = totalInventory();
}

// ---------------- Gathering (every 10 days, after gathering tree built) ----------------

function maybeHoldGathering() {
  if (!state.dens.some(d => d.typeId === 'gatheringtree')) return;
  if (state.day - state.lastGatheringDay < 10) return;
  state.lastGatheringDay = state.day;
  // Generate 3-5 other-clan cats.
  const cats = [];
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) cats.push(makeOtherClanCat());
  state.gatheringCats = cats;
  showGatheringModal();
}

function makeOtherClanCat() {
  const clan = pickFromList(OTHER_CLANS);
  const role = pickFromList(['warrior', 'warrior', 'warrior', 'apprentice', 'leader', 'medicine cat', 'deputy']);
  return {
    id: 'other-' + Math.random().toString(36).slice(2, 10),
    name: randomNameForRole(role),
    role, clan,
    gender: pickFromList(['she-cat', 'tom']),
    orientation: pickFromList(['she-cats', 'toms', 'any']),
    colorId: pickFromList(PELT_COLORS).id,
    designId: pickFromList(PELT_DESIGNS).id,
    eyeId: pickFromList(EYE_COLORS).id,
    personality: rollPersonality(),
    facing: 'right'
  };
}

function showGatheringModal() {
  const list = $('#gathering-list');
  list.innerHTML = '';
  state.gatheringCats.forEach(other => {
    const card = el('div', { class: 'gathering-cat' });
    card.innerHTML = catSpriteSVG(other) +
      `<div class="gc-info">` +
      `  <span class="gc-name">${escapeHtml(other.name)}</span>` +
      `  <span class="gc-meta">${other.clan} ${other.role}</span>` +
      `</div>`;
    card.addEventListener('click', () => interactWithOtherClanCat(other));
    list.appendChild(card);
  });
  showModal('gathering-modal');
}

document.getElementById('gathering-close').addEventListener('click', () => hideModal('gathering-modal'));

// Player picks one of their cats to interact with the other-clan cat. Builds
// a forbidden relationship that may lead to sneak-ins later.
function interactWithOtherClanCat(other) {
  const ourCats = state.cats.filter(c =>
    c.role !== 'kit' && c.role !== 'apprentice' && c.role !== 'medicine cat apprentice'
  );
  if (ourCats.length === 0) {
    setGuide('thinking', "You have no adult cats to send to talk.");
    return;
  }
  // Use a quick prompt to pick which of yours interacts.
  const names = ourCats.map((c, i) => (i + 1) + '. ' + c.name).join('\n');
  const pick = prompt('Which of your cats talks to ' + other.name + '?\n\n' + names + '\n\nEnter a number:');
  const idx = parseInt(pick, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= ourCats.length) return;
  const our = ourCats[idx];
  // Find or create the forbidden-relationship record.
  let fb = state.forbiddenLovers.find(f => f.ourCatId === our.id && f.theirCat.id === other.id);
  if (!fb) {
    fb = { ourCatId: our.id, theirCat: other, score: 0 };
    state.forbiddenLovers.push(fb);
  }
  fb.score += 12 + Math.floor(Math.random() * 8);
  recordEvent(our.name + ' spoke with ' + other.name + ' of ' + other.clan + ' at the Gathering.');
  setGuide('cheer', our.name + ' and ' + other.name + ' (' + other.clan + ') talked alone at the Gathering. A spark of forbidden feeling.');
  save();
}

// ---------------- Sneak-in (forbidden lover slips into camp) ----------------

let sneakerActive = null; // { ourCat, theirCat, fb } currently in camp

function rollSneakIn() {
  if (sneakerActive) return; // only one at a time
  if (!state.forbiddenLovers || state.forbiddenLovers.length === 0) return;
  // Find a forbidden pair with high enough score.
  const eligible = state.forbiddenLovers.filter(f => f.score >= 35);
  if (eligible.length === 0) return;
  if (Math.random() > 0.30) return; // 30% chance per Skip Day if any eligible
  const fb = pickFromList(eligible);
  const ourCat = state.cats.find(c => c.id === fb.ourCatId);
  if (!ourCat) return;
  sneakerActive = { ourCat, theirCat: fb.theirCat, fb };
  $('#sneakin-title').textContent = fb.theirCat.name + ' has snuck into camp!';
  $('#sneakin-text').textContent =
    fb.theirCat.name + ' of ' + fb.theirCat.clan + ' slipped past your patrols to see ' + ourCat.name +
    '. What do you do?';
  showModal('sneakin-modal');
}

function clearSneakerModal() {
  hideModal('sneakin-modal');
  sneakerActive = null;
}

document.getElementById('sneakin-throw').addEventListener('click', () => {
  if (!sneakerActive) return;
  const { ourCat, theirCat, fb } = sneakerActive;
  recordEvent(theirCat.name + ' was thrown out of camp.');
  setGuide('thinking', 'You threw ' + theirCat.name + ' out. ' + ourCat.name + ' is heartbroken.');
  ourCat.happiness = Math.max(0, ourCat.happiness - 20);
  fb.score = Math.max(0, fb.score - 10);
  clearSneakerModal();
  save();
});

document.getElementById('sneakin-kill').addEventListener('click', () => {
  if (!sneakerActive) return;
  const { ourCat, theirCat, fb } = sneakerActive;
  recordEvent(theirCat.name + ' of ' + theirCat.clan + ' was killed in your camp.');
  setGuide('thinking', 'You killed ' + theirCat.name + '. ' + ourCat.name + ' is devastated. ' + theirCat.clan + ' will not forget this.');
  ourCat.happiness = Math.max(0, ourCat.happiness - 50);
  // Remove the forbidden lover entry.
  state.forbiddenLovers = state.forbiddenLovers.filter(f => f !== fb);
  clearSneakerModal();
  save();
});

document.getElementById('sneakin-stay').addEventListener('click', () => {
  if (!sneakerActive) return;
  const { ourCat, theirCat, fb } = sneakerActive;
  // The other-clan cat joins YOUR clan, becomes a real cat.
  const joined = makeCat({
    name: theirCat.name,
    gender: theirCat.gender,
    orientation: theirCat.orientation,
    colorId: theirCat.colorId,
    designId: theirCat.designId,
    eyeId: theirCat.eyeId,
    role: 'warrior',  // they take warrior duties in their new clan
    personality: theirCat.personality
  });
  state.cats.push(joined);
  // Establish a real strong relationship between them.
  const r = getRel(ourCat, joined);
  r.score = Math.max(r.score, 60);
  r.type = classifyRel(r.score);
  state.forbiddenLovers = state.forbiddenLovers.filter(f => f !== fb);
  recordEvent(theirCat.name + ' of ' + theirCat.clan + ' left their clan to join us, for ' + ourCat.name + '.');
  setGuide('cheer', theirCat.name + ' has joined the clan! ' + ourCat.name + ' is overjoyed.');
  ourCat.happiness = Math.min(100, ourCat.happiness + 20);
  clearSneakerModal();
  renderAll();
  save();
});

// ---------------- Mediator (click the mediator cat to adjust two cats' bond) ----------------

function openMediator(mediator) {
  const others = state.cats.filter(c => c.id !== mediator.id);
  if (others.length < 2) {
    setGuide('thinking', "The mediator needs at least two clanmates to mediate between.");
    return;
  }
  const fillSelect = (sel) => {
    sel.innerHTML = '';
    others.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name + ' — ' + c.role;
      sel.appendChild(opt);
    });
  };
  fillSelect($('#med-cat-a'));
  fillSelect($('#med-cat-b'));
  if ($('#med-cat-b').options.length > 1) $('#med-cat-b').selectedIndex = 1;
  // Reset direction to "up"
  $$('#med-dir-choices .pill').forEach(p => {
    p.classList.toggle('selected', p.dataset.value === 'up');
    p.onclick = (e) => {
      e.preventDefault();
      $$('#med-dir-choices .pill').forEach(n => n.classList.remove('selected'));
      p.classList.add('selected');
    };
  });
  // Cooldown info
  const daysSince = state.day - state.lastMediationDay;
  const ready = daysSince >= MEDIATION_COOLDOWN_DAYS;
  const goBtn = $('#med-go');
  if (ready) {
    $('#med-cooldown-info').textContent = '';
    goBtn.removeAttribute('disabled');
  } else {
    const left = MEDIATION_COOLDOWN_DAYS - daysSince;
    $('#med-cooldown-info').textContent = "Already mediated recently — wait " + left + " more day" + (left === 1 ? '' : 's') + '.';
    goBtn.setAttribute('disabled', '');
  }
  goBtn.onclick = () => doMediate(mediator);
  showModal('mediator-modal');
}

document.getElementById('med-cancel').addEventListener('click', () => hideModal('mediator-modal'));

function doMediate(mediator) {
  const aId = $('#med-cat-a').value;
  const bId = $('#med-cat-b').value;
  if (aId === bId) { setGuide('thinking', "Pick two different cats."); return; }
  const dir = ($$('#med-dir-choices .pill.selected')[0] || {}).dataset
            ? $$('#med-dir-choices .pill.selected')[0].dataset.value : 'up';
  const a = state.cats.find(c => c.id === aId);
  const b = state.cats.find(c => c.id === bId);
  if (!a || !b) return;
  const delta = dir === 'up' ? 12 : -12;
  adjustRel(a, b, delta, delta < 0 ? 'the mediator turned them against each other' : null);
  state.lastMediationDay = state.day;
  hideModal('mediator-modal');
  recordEvent(mediator.name + ' mediated between ' + a.name + ' and ' + b.name + ' (' + (delta > 0 ? 'closer' : 'further apart') + ').');
  setGuide('thinking', mediator.name + ' helped ' + a.name + ' and ' + b.name + ' see things ' + (delta > 0 ? 'each other\'s way' : 'differently') + '.');
  renderRelationships();
  save();
}

// ---------------- Elder lifespan ----------------

function rollElderDeaths() {
  const dying = state.cats.filter(c =>
    c.role === 'elder' && (state.day - (c.bornOnDay || 0)) >= ELDER_LIFESPAN_DAYS
  );
  dying.forEach(d => {
    recordEvent(d.name + " passed peacefully in their sleep.");
    naturalDeath(d, "passed peacefully in their sleep");
  });
}

// Like killCat but framed as a natural / non-player death.
function naturalDeath(cat, reasonText) {
  state.cats.forEach(other => {
    if (other.id === cat.id) return;
    const rel = state.relationships[relKey(cat, other)];
    if (!rel) return;
    const drop = Math.min(40, Math.round(Math.abs(rel.score) * 0.4));
    other.happiness = Math.max(0, other.happiness - drop);
  });
  for (const k of Object.keys(state.relationships)) {
    if (k.includes(cat.id)) delete state.relationships[k];
  }
  state.cats = state.cats.filter(c => c.id !== cat.id);
  setGuide('thinking', cat.name + ' ' + reasonText + '. The clan grieves.');
  if (cat.role === 'leader') handleLeaderSuccession();
  else if (cat.role === 'deputy') handleDeputyVacancy();
}

// ---------------- Jealousy (love triangles) ----------------

function rollJealousy() {
  state.cats.forEach(a => {
    // Find who A loves most (must reach crush level).
    let lovedByA = null, scoreFromA = -Infinity;
    state.cats.forEach(b => {
      if (a.id === b.id) return;
      const r = state.relationships[relKey(a, b)];
      if (r && r.score >= RELATIONSHIP_THRESHOLDS.crush && r.score > scoreFromA) {
        lovedByA = b;
        scoreFromA = r.score;
      }
    });
    if (!lovedByA) return;
    // Does the loved cat love someone else MORE than they love A?
    let preferredByB = null, bestScore = scoreFromA;
    state.cats.forEach(c => {
      if (c.id === lovedByA.id || c.id === a.id) return;
      const r = state.relationships[relKey(lovedByA, c)];
      if (r && r.score > bestScore) {
        preferredByB = c;
        bestScore = r.score;
      }
    });
    if (preferredByB) {
      a.happiness = Math.max(0, a.happiness - 7);
      a.want = {
        id: 'jealous',
        text: 'I love ' + lovedByA.name + ', but their heart belongs to ' + preferredByB.name + '...',
        need: null
      };
    }
  });
}

// ---------------- Medicine cat romance gossip ----------------
//
// Medicine cats traditionally aren't supposed to take mates. If a medicine cat
// pairs up, other cats may gossip about it. Sometimes the medicine cat or their
// mate overhears, and the gossipers' relationship with them takes a hit.
function rollMedicineCatGossip() {
  const medMatePairs = [];
  state.cats.forEach(med => {
    if (med.role !== 'medicine cat') return;
    state.cats.forEach(mate => {
      if (mate.id === med.id) return;
      const r = state.relationships[relKey(med, mate)];
      if (r && r.type === 'mate') medMatePairs.push([med, mate]);
    });
  });
  if (medMatePairs.length === 0) return;

  medMatePairs.forEach(([med, mate]) => {
    if (Math.random() > 0.30) return; // 30% chance per day per pair
    const others = state.cats.filter(c => c.id !== med.id && c.id !== mate.id);
    if (others.length < 2) return;
    const g1 = pickFromList(others);
    const g2 = pickFromList(others.filter(c => c.id !== g1.id));
    if (!g2) return;

    // Gossip might be kind ("I think it's sweet") or judgmental ("She broke the code").
    const judging = Math.random() < 0.7;
    if (!judging) return; // not every gossip is harmful

    // Did either of them overhear?
    if (Math.random() < 0.5) {
      const overhearer = Math.random() < 0.5 ? med : mate;
      adjustRel(overhearer, g1, -10, 'overheard them gossiping about the medicine cat\'s romance');
      adjustRel(overhearer, g2, -10, 'overheard them gossiping about the medicine cat\'s romance');
      recordEvent(overhearer.name + ' overheard ' + g1.name + ' and ' + g2.name + ' judging the medicine cat romance.');
      setGuide('thinking', overhearer.name + ' overheard ' + g1.name + ' and ' + g2.name + ' gossiping about the medicine cat\'s mate. The hurt cuts deep.');
    } else {
      // No one overheard, but the gossip still chills relationships subtly.
      adjustRel(g1, g2, 2); // gossipers bond a little
    }
  });
}

// ---------------- Mate rivalry: third-party crushes on a mated cat ----------------
//
// If C has crush+ feelings for B but B is already mated to A, C reacts based
// on personality — anger at A, quiet despair, gracious acceptance, etc.
function rollMateRivalry() {
  state.cats.forEach(c => {
    // Find the cat C is most in love with (must reach crush level).
    let beloved = null, scoreFromC = -Infinity;
    state.cats.forEach(b => {
      if (b.id === c.id) return;
      const r = state.relationships[relKey(c, b)];
      if (r && r.score >= RELATIONSHIP_THRESHOLDS.crush && r.score > scoreFromC) {
        beloved = b;
        scoreFromC = r.score;
      }
    });
    if (!beloved) return;
    // Find beloved's official mate (if any) — that's the rival.
    let rival = null;
    state.cats.forEach(a => {
      if (a.id === c.id || a.id === beloved.id) return;
      const r = state.relationships[relKey(a, beloved)];
      if (r && r.type === 'mate') rival = a;
    });
    if (!rival) return;

    const traits = c.personality || [];
    let angerDelta = 0;
    let happinessHit = 0;
    let wantText = null;
    let event = null;

    if (traits.includes('grumpy') || traits.includes('annoying')) {
      angerDelta = 9;
      wantText = 'Why does ' + rival.name + ' get to be with ' + beloved.name + '? It\'s not fair.';
      event = c.name + ' picked a fight with ' + rival.name + ' over ' + beloved.name + '.';
    } else if (traits.includes('shy')) {
      happinessHit = 9;
      wantText = 'I\'ll never tell ' + beloved.name + ' how I feel. They have ' + rival.name + ' now.';
    } else if (traits.includes('outgoing')) {
      angerDelta = 5;
      happinessHit = 4;
      wantText = 'Maybe I should just talk to ' + beloved.name + ' anyway.';
      event = c.name + ' confronted ' + rival.name + ' about ' + beloved.name + '.';
    } else if (traits.includes('wise')) {
      happinessHit = 5;
      wantText = 'I have to let go of ' + beloved.name + '. They chose their path.';
    } else if (traits.includes('energetic') || traits.includes('playful')) {
      // Refuses to give up — keeps pursuing.
      adjustRel(c, beloved, 2);
      wantText = 'I won\'t give up on ' + beloved.name + ' yet.';
    } else if (traits.includes('mysterious')) {
      angerDelta = 3;
      happinessHit = 6;
      wantText = 'I see things ' + rival.name + ' can\'t.';
    } else {
      angerDelta = 4;
      happinessHit = 3;
    }

    if (angerDelta > 0) adjustRel(c, rival, -angerDelta, 'jealous they\'re mates with ' + beloved.name);
    if (happinessHit > 0) c.happiness = Math.max(0, c.happiness - happinessHit);
    if (wantText) c.want = { id: 'rivalry', text: wantText, need: null };
    if (event) recordEvent(event);

    // Some personalities actively interfere — slowly eroding the existing
    // mate bond. Only fires occasionally so it doesn't tear couples apart fast.
    if ((traits.includes('outgoing') || traits.includes('annoying')) && Math.random() < 0.3) {
      adjustRel(rival, beloved, -3, c.name + ' is sowing doubt between them');
    }
    if (traits.includes('playful') || traits.includes('energetic')) {
      // Tries to charm the beloved closer (without affecting the existing pair).
      adjustRel(c, beloved, 2);
    }

    // Surface the constraint to the player so they know what has to happen.
    if (Math.random() < 0.4) {
      setGuide('thinking', c.name + ' will never be with ' + beloved.name + ' unless ' + beloved.name + ' breaks up with ' + rival.name + ' first.');
    }
  });
}

// ---------------- Mate breakups (when happiness craters) ----------------
//
// Mates can only stop being mates by breaking up. Each Skip Day, any mate pair
// where someone's happiness has dropped low enough has a chance of splitting.
// The aftermath depends on personality.
function rollMateBreakups() {
  for (let i = 0; i < state.cats.length; i++) {
    for (let j = i + 1; j < state.cats.length; j++) {
      const a = state.cats[i], b = state.cats[j];
      const r = state.relationships[relKey(a, b)];
      if (!r || r.type !== 'mate') continue;

      // Reason 1: their MATE-BOND score has dropped really low. Capped at 15%
      // chance per day at score 0; nothing happens above score 30.
      if (r.score < 30) {
        const chance = (30 - r.score) / 200;
        if (Math.random() < chance) {
          breakUpMates(a, b, r, 'their bond has crumbled away');
          continue;
        }
      }

      // Reason 2: one of them has fallen for someone else MORE than their mate.
      // The third party must be at crush level (75+) AND clearly preferred over
      // the existing mate (15+ points higher). Then 10% chance per day per pair.
      let leavingFor = null, leaver = null;
      for (const c of state.cats) {
        if (c.id === a.id || c.id === b.id) continue;
        const ra = state.relationships[relKey(a, c)];
        const rb = state.relationships[relKey(b, c)];
        if (ra && ra.score > r.score + 15 && ra.score >= RELATIONSHIP_THRESHOLDS.crush) {
          leaver = a; leavingFor = c; break;
        }
        if (rb && rb.score > r.score + 15 && rb.score >= RELATIONSHIP_THRESHOLDS.crush) {
          leaver = b; leavingFor = c; break;
        }
      }
      if (leavingFor && Math.random() < 0.10) {
        breakUpMates(a, b, r, leaver.name + ' has fallen for ' + leavingFor.name);
      }
    }
  }
}

function breakUpMates(a, b, rel, cause) {
  const allTraits = (a.personality || []).concat(b.personality || []);
  let scoreChange, aftermath;
  if (allTraits.includes('grumpy') || allTraits.includes('annoying')) {
    scoreChange = -55; // they hate each other now
    aftermath = "they hate each other now.";
  } else if ((a.personality || []).includes('wise') && (b.personality || []).includes('wise')) {
    scoreChange = -8;  // mutual respect, almost still friends
    aftermath = "they parted with mutual respect.";
  } else if (allTraits.includes('shy')) {
    scoreChange = -25;
    aftermath = "both are heartbroken and avoiding each other.";
  } else if (allTraits.includes('playful') || allTraits.includes('outgoing')) {
    scoreChange = -18;
    aftermath = "they're trying to stay friendly about it.";
  } else {
    scoreChange = -30;
    aftermath = "it ended badly.";
  }
  rel.score = Math.max(-100, Math.min(100, rel.score + scoreChange));
  rel.type = classifyRel(rel.score); // out of mate-locked state, free to reclassify
  // Both cats take a happiness hit from the breakup itself.
  a.happiness = Math.max(0, a.happiness - 8);
  b.happiness = Math.max(0, b.happiness - 8);
  const causeText = cause ? ' (' + cause + ') ' : ' ';
  recordEvent(a.name + ' and ' + b.name + ' broke up' + (cause ? ' — ' + cause + '. ' : ' — ') + aftermath);
  setGuide('thinking', a.name + ' and ' + b.name + ' broke up.' + causeText + aftermath.charAt(0).toUpperCase() + aftermath.slice(1));
}

// ---------------- Hate-fueled murder between mortal enemies ----------------

function rollHateMurders() {
  // Build list of qualifying enemy pairs.
  const enemies = [];
  for (let i = 0; i < state.cats.length; i++) {
    for (let j = i + 1; j < state.cats.length; j++) {
      const a = state.cats[i], b = state.cats[j];
      const r = state.relationships[relKey(a, b)];
      if (r && r.score <= HATE_MURDER_THRESHOLD) enemies.push([a, b]);
    }
  }
  enemies.forEach(([a, b]) => {
    if (Math.random() > HATE_MURDER_CHANCE) return;
    if (state.cats.length <= 2) return; // don't wipe out the clan
    // Whichever has lower happiness snaps and kills the other.
    const killer = a.happiness <= b.happiness ? a : b;
    const victim = killer === a ? b : a;
    recordEvent(killer.name + " killed " + victim.name + " in a furious fight.");
    naturalDeath(victim, "was killed by " + killer.name + " after long hatred");
  });
}

// ---------------- Leader meeting (every 5 days) ----------------

function maybeHoldLeaderMeeting() {
  if (state.day % MEETING_INTERVAL_DAYS !== 0) return;
  const leader = state.cats.find(c => c.role === 'leader');
  if (!leader) return;
  // Run the meeting-day promotion ceremony BEFORE the recap so the new names
  // and mentorships show up in the leader's announcement.
  runPromotions();
  const leaderDen = state.dens.find(d => d.typeId === 'leader');
  if (leaderDen) {
    // Position the leader on top of their den for the meeting.
    leader._meetingOrigX = leader.x;
    leader._meetingOrigY = leader.y;
    leader.x = leaderDen.x;
    leader.y = leaderDen.y - 30;       // perched on top
    leader._inMeeting = true;
    renderCats();
  }
  showLeaderMeetingModal(leader);
}

// Promote apprentices to warriors (with a fresh randomized suffix) and kits to
// apprentices (assigned a warrior mentor).
function runPromotions() {
  // Apprentices → warriors
  state.cats.forEach(c => {
    if (c.role !== 'apprentice') return;
    const oldName = c.name;
    let base = oldName;
    if (base.toLowerCase().endsWith('paw')) base = base.slice(0, -3);
    let suf;
    do { suf = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)]; }
    while (suf === 'paw');
    c.name = base + suf;
    c.role = 'warrior';
    if (c.mentor) delete c.mentor; // mentorship ends at warrior naming
    recordEvent(oldName + " earned their warrior name: " + c.name + ".");
  });
  // Kits → apprentices, paired with a mentor. If there's no current medicine
  // cat apprentice (and a medicine cat exists), one of the new apprentices is
  // randomly chosen to become the medicine cat apprentice instead.
  const kitsThisRound = state.cats.filter(c => c.role === 'kit');
  const hasMedApp     = state.cats.some(c => c.role === 'medicine cat apprentice');
  const medCat        = state.cats.find(c => c.role === 'medicine cat');
  let medAppChoice = null;
  if (!hasMedApp && medCat && kitsThisRound.length > 0 && Math.random() < 0.5) {
    medAppChoice = pickFromList(kitsThisRound);
  }

  kitsThisRound.forEach(c => {
    const oldName = c.name;
    let base = oldName;
    if (base.toLowerCase().endsWith('kit')) base = base.slice(0, -3);
    c.name = base + 'paw';
    if (c === medAppChoice) {
      c.role = 'medicine cat apprentice';
      c.mentor = medCat.id;
      recordEvent(oldName + " became " + c.name + ", chosen as the medicine cat apprentice under " + medCat.name + ".");
    } else {
      c.role = 'apprentice';
      const mentors = state.cats.filter(m =>
        m.id !== c.id && (m.role === 'warrior' || m.role === 'leader')
      );
      if (mentors.length > 0) {
        const mentor = pickFromList(mentors);
        c.mentor = mentor.id;
        recordEvent(oldName + " became " + c.name + ", mentored by " + mentor.name + ".");
      } else {
        recordEvent(oldName + " became " + c.name + " — no warrior was free to mentor them.");
      }
    }
  });
}

function showLeaderMeetingModal(leader) {
  $('#meeting-title').textContent = leader.name + ' calls a clan meeting';
  $('#meeting-leader').innerHTML = catSpriteSVG(leader);
  const recap = $('#meeting-recap');
  recap.innerHTML = '';
  if (state.recentEvents.length === 0) {
    recap.appendChild(el('p', {}, 'A quiet few days. StarClan watches over us.'));
  } else {
    state.recentEvents.forEach(ev => {
      const p = el('p', {});
      p.innerHTML = `<span class="recap-day">Day ${ev.day}:</span> ${escapeHtml(ev.text)}`;
      recap.appendChild(p);
    });
  }
  showModal('meeting-modal');
}

document.getElementById('meeting-close').addEventListener('click', () => {
  hideModal('meeting-modal');
  // Return the leader to wandering.
  const leader = state.cats.find(c => c._inMeeting);
  if (leader) {
    if (leader._meetingOrigX != null) {
      leader.x = leader._meetingOrigX;
      leader.y = leader._meetingOrigY;
    }
    leader._inMeeting = false;
    delete leader._meetingOrigX;
    delete leader._meetingOrigY;
    renderCats();
  }
  // Clear recap so the next meeting starts fresh.
  state.recentEvents = [];
  save();
});

function showDailyEvent() {
  if (state.cats.length === 0) return;
  const tmpl = pickFromList(DAILY_EVENTS);
  const a = pickFromList(state.cats);
  const others = state.cats.filter(c => c.id !== a.id);
  const b = others.length ? pickFromList(others) : a;
  const text = tmpl
    .replace(/\{a\}/g, a.name)
    .replace(/\{b\}/g, b.name);
  // Use the bubble (not the tutorial) — and only if we're not in the middle of a tutorial step.
  if (state.tutorialDone) setGuide('talking', text);
}

// ---------------- Relationships panel ----------------

function renderRelationships() {
  const list = $('#relationships-list');
  list.innerHTML = '';
  if (state.cats.length === 0) {
    list.appendChild(el('div', { class: 'rel-empty' }, 'No cats yet. Add one!'));
    return;
  }
  state.cats.forEach(c => {
    const card = el('div', { class: 'rel-card' });
    card.appendChild(el('div', { class: 'rel-name' }, c.name));
    let any = false;
    state.cats.forEach(o => {
      if (o.id === c.id) return;
      const r = state.relationships[relKey(c, o)];
      if (!r) return;
      any = true;
      const widthPct = Math.max(4, Math.abs(r.score));
      const positive = r.score >= 0;
      const lineClass = 'rel-line ' +
        (r.type === 'crush' || r.type === 'mate' ? 'crush ' : '') +
        (positive ? '' : 'foe');
      const line = el('div', { class: lineClass });
      line.innerHTML =
        `<span class="rel-with">${escapeHtml(o.name)} <em style="color:#8a967c;font-style:normal;font-size:0.7rem;">${r.type}</em></span>` +
        `<span class="heart-bar"><span style="width:${widthPct}%"></span></span>`;
      card.appendChild(line);
    });
    if (!any) {
      card.appendChild(el('div', { class: 'rel-line' }, [
        el('span', { class: 'rel-with' }, 'No bonds yet — drag cats together!')
      ]));
    }
    list.appendChild(card);
  });
}

// ---------------- Title screen ----------------

$('#play-btn').addEventListener('click', () => {
  const title   = $('#title-screen');
  const game    = $('#game-screen');
  const overlay = $('#fade-overlay');
  if (game.classList.contains('active') || title.classList.contains('fading-out')) return;

  // Pressing Play always starts a fresh game — wipe cats, dens, relationships, etc.
  resetState();

  // 1. Title screen smoothly fades — the Play button rides the fade — while
  //    the black curtain rises in parallel.
  title.classList.add('fading-out');
  overlay.classList.add('to-black');

  // 2. At full black, hide the title for real and reveal the game screen behind.
  setTimeout(() => {
    title.classList.remove('active', 'fading-out');
    game.classList.add('active');
    renderAll();
    setTimeout(() => overlay.classList.remove('to-black'), 180);
  }, 650);

  // 3. Once the camp is fully visible (curtain dropped), the guide always
  //    introduces the game — fresh state, fresh tutorial.
  setTimeout(() => {
    startTutorial();
    updateTutorialPointer();
  }, 1550);
});

// Reset the in-memory state to "brand new game" without reloading the page.
function resetState() {
  cancelPlacingDen();          // drop any ghost-den / mouse listeners
  cancelPlacingDecoration();
  justMadeCats.clear();
  state.day = 1;
  state.tutorialStep = 0;
  state.tutorialDone = false;
  state.cats = [];
  state.dens = [];
  state.decorations = [];
  state.inventory = { mouse: STARTING_PREY, vole: 0, squirrel: 0, bird: 0 };
  state.relationships = {};
  state.lastCrushPromptDay = 0;
  state.pendingRole = null;
  state.pendingRoleOptions = null;
  state.nextActionDay = 1;
  state.patrol = [];
  state.warParty = [];
  state.warEnemy = null;
  state.warsWon = 0;
  state.forbiddenLovers = [];
  state.lastGatheringDay = 0;
  state.recentEvents = [];
  state.lastHuntDay = 0;
  state.lastMediationDay = -99;
  lastAutoTalkAt.clear();
  state.usedTalk = {
    body_friend: [], body_new: [], body_foe: [], body_mate: [],
    reply_friend: [], reply_new: [], reply_foe: [], reply_mate: []
  };
  save();
}

$('#reset-btn').addEventListener('click', () => {
  if (confirm('Wipe save and start fresh?')) resetSave();
});

// Title-screen "Personality flags" guide.
$('#flag-guide-btn').addEventListener('click', () => {
  const list = $('#flag-guide-list');
  list.innerHTML = '';
  PERSONALITIES.forEach(p => {
    const row = el('div', { class: 'flag-guide-row' });
    row.innerHTML =
      `<span class="pflag-swatch" style="background:${p.color};"></span>` +
      `<span class="label"><b>${p.name}</b><span>${p.desc}</span></span>`;
    list.appendChild(row);
  });
  showModal('flag-guide-modal');
});
$('#flag-guide-close').addEventListener('click', () => hideModal('flag-guide-modal'));

// In-game reset: wipes save and reloads back to the title screen with the Play button.
$('#back-to-title-btn').addEventListener('click', () => {
  if (confirm('Reset everything and go back to the title screen?')) resetSave();
});

// ---------------- Boot ----------------

// Always show the title screen with the Play button on start. The Play button's
// click handler swaps to the game and (if the tutorial isn't done) starts the guide.
load();

// Main animation loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(80, now - last);
  last = now;
  if ($('#game-screen').classList.contains('active')) {
    tickCats(dt);
    if (!state.tutorialDone) updateTutorialPointer();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Periodic auto-save
setInterval(save, 8000);

// Keep world contents inside the world on resize
window.addEventListener('resize', () => {
  if ($('#game-screen').classList.contains('active')) renderAll();
});

})();
