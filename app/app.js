// GTA VI trophy guide + tracker: checklist, filters, spoiler setting,
// platinum roadmap, missable warnings, export/import. Everything runs
// offline from files under app/: the trophy data is fetched from the
// relative path data/trophies.json, progress lives in localStorage, and
// the app makes no network request of its own. Links to sources open
// only when the reader follows them.
import { ROADMAP, phaseEarnedCount } from './roadmap.js';

const STORAGE_KEY = 'gta6-trophy-guide-v1';
const SPOILER_KEY = 'gta6-trophy-guide-spoilers';
const COUNTER_KEY = 'gta6-trophy-guide-counters-v1';
// Live counters for count-based trophies (id -> done so far), saved beside
// the earned set. A counter only exists for trophies whose target is a
// plain count the player tracks (18 meditation spots, 42 gold medals…).

// Full kind names, as shown in the Kind filter and the detail panel.
const KINDS = {
  platinum: 'Platinum', completion: '100% completion', story: 'Story',
  side: 'Side quest', collectible: 'Collectible', activity: 'Activity',
  crime: 'Crime', exploration: 'Exploration', money: 'Money', moment: 'One-off moment',
};

// Short kind names, so the header's per-kind counts fit on one line.
const KIND_SHORT = {
  platinum: 'Plat', completion: '100%', story: 'Story', side: 'Side',
  collectible: 'Coll.', activity: 'Activity', crime: 'Crime',
  exploration: 'Expl.', money: 'Money', moment: 'Moment',
};

const params = new URLSearchParams(location.search);
const DATA = await (await fetch('data/trophies.json')).json();
const trophies = DATA.trophies;
// The seven sources, as a registry: each trophy cites sources by their
// global [n] id, and each step cites the same id, so one number means the
// same source everywhere in the guide.
const SOURCES = new Map(DATA.sources.map((s) => [s.id, s]));
const byId = new Map(trophies.map((t) => [t.id, t]));

let earned = new Set(loadEarned());
let counters = loadCounters();
let spoilers = loadSpoilers();
let view = params.get('view') || 'tracker';
let selectedId = Number(params.get('select')) || null;
const filters = {
  q: params.get('q') || '',
  kind: params.get('kind') || 'all',
  grade: params.get('grade') || 'all',
  status: params.get('status') || 'all',
  missableOnly: params.get('missable') === '1',
};

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((id) => byId.has(id)) : [];
  } catch { return []; }
}

function loadSpoilers() {
  if (params.get('spoilers') === '1') return true;
  if (params.get('spoilers') === '0') return false;
  try { return localStorage.getItem(SPOILER_KEY) === '1'; } catch { return false; }
}

function loadCounters() {
  try {
    const raw = JSON.parse(localStorage.getItem(COUNTER_KEY) ?? '{}');
    const out = new Map();
    if (raw && typeof raw === 'object') {
      for (const [k, v] of Object.entries(raw)) {
        const id = Number(k);
        const t = byId.get(id);
        if (t && t.counter && Number.isFinite(v)) {
          out.set(id, Math.max(0, Math.min(t.counter.total, Math.floor(v))));
        }
      }
    }
    return out;
  } catch { return new Map(); }
}

function saveCounters() {
  try { localStorage.setItem(COUNTER_KEY, JSON.stringify(Object.fromEntries(counters))); } catch { /* storage unavailable */ }
}

function counterVal(id) {
  return counters.get(id) || 0;
}

function bumpCounter(id, delta) {
  const t = byId.get(id);
  if (!t || !t.counter) return;
  counters.set(id, Math.max(0, Math.min(t.counter.total, counterVal(id) + delta)));
  saveCounters();
  renderProgress(); renderList(); renderDetail(); renderRoadmap(); renderMissables(); renderMatrix();
}

function saveEarned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function saveSpoilers() {
  localStorage.setItem(SPOILER_KEY, spoilers ? '1' : '0');
}

// A hidden trophy stays masked until spoilers are on or it is earned.
function isHiddenFromReader(t) {
  return t.hidden && !spoilers && !earned.has(t.id);
}

function gradeChip(t) {
  return t.grade === 'platinum' ? '◆ Platinum' : t.grade === 'gold' ? '◆ Gold' : t.grade === 'silver' ? '◆ Silver' : '◆ Bronze';
}

function difficultyDots(t) {
  return '●'.repeat(t.difficulty) + '○'.repeat(5 - t.difficulty) + ` ${t.difficulty}/5`;
}

// Which roadmap phase a trophy belongs to, for the detail panel's line.
function phaseFor(id) {
  for (const phase of ROADMAP) if (phase.trophyIds.includes(id)) return phase;
  return null;
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ---- Header progress ----
function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = Math.round((done / total) * 100);
  document.getElementById('progress-count').textContent = `${done} of ${total} earned · ${pct}%`;
  document.getElementById('progress-bar').style.width = `${pct}%`;
  document.getElementById('progress-bar').setAttribute('aria-valuenow', String(pct));
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (earned.has(t.id)) counts[t.grade] += 1;
  document.getElementById('grade-counts').textContent =
    `Platinum ${counts.platinum}/1 · Gold ${counts.gold}/2 · Silver ${counts.silver}/6 · Bronze ${counts.bronze}/46 · Xbox 1,000G total · `;
  const kinds = {};
  for (const t of trophies) if (earned.has(t.id)) kinds[t.kind] = (kinds[t.kind] || 0) + 1;
  document.getElementById('kind-counts').textContent = Object.entries(KIND_SHORT)
    .map(([k, label]) => `${label} ${kinds[k] || 0}/${trophies.filter((t) => t.kind === k).length}`).join(' · ');
  // GOAL: the two trophies the whole run points at — Vice Got a Price!
  // needs the other 54, A Long Road needs all 55 ticked in this tracker.
  const others = earned.size - (earned.has(1) ? 1 : 0);
  document.getElementById('goal-strip').textContent =
    `GOAL · Vice Got a Price! ${others}/54 · A Long Road ${earned.size}/55 trophies ticked`;
  // Cited by source: how many of the 55 each of the 7 sources backs,
  // computed from the data so the strip can never drift from the guide.
  document.getElementById('audit-cited').textContent =
    'Cited by source: ' + DATA.sources.map((s) =>
      `[${s.id}] ${s.name.split(' — ')[0]} ${trophies.filter((t) => t.sources.includes(s.id)).length}/55`).join(' · ');
}

// ---- Detail panel: one trophy's guide with its sources ----
// The panel is the guide's proof: official name and description, the
// facts, the guide as numbered steps with the source of each step beside
// it, how sure the guide is, the roadmap step it belongs to, and the
// numbered sources behind every fact, with retrieval dates.
function renderDetail() {
  const panel = document.getElementById('detail');
  panel.replaceChildren();
  const t = byId.get(selectedId);
  if (!t) {
    panel.append(el('p', 'empty', 'Pick a trophy to read its full guide, with sources. The guide says what to do, where, and whether it can be missed.'));
    return;
  }
  const masked = isHiddenFromReader(t);
  panel.append(el('h2', null, masked ? 'Hidden trophy' : t.name));
  panel.append(el('p', 'desc', masked ? 'This trophy stays hidden on PlayStation until you earn it. Turn spoilers on to read its guide.' : t.description));
  if (masked) return;
  if (t.confidence === 'unconfirmed') {
    panel.append(el('p', 'unconfirmed-box', 'Not pinned down yet — no guide has confirmed the exact trigger for this trophy. The steps below are the best reading of the official description so far; check the sources for updates as players crack it.'));
  }
  // Four facts only: missable and hidden are chips on the trophy card,
  // the chapter lives in the roadmap line below, Xbox in the card's meta.
  // A count-based trophy carries its live counter inside the Target fact.
  const facts = el('dl', 'facts');
  for (const [k, v] of [
    ['Grade', gradeChip(t)], ['Kind', KINDS[t.kind]],
    ['Target', t.target], ['Difficulty', difficultyDots(t)],
  ]) {
    facts.append(el('dt', null, k));
    const dd = el('dd');
    dd.textContent = v;
    if (k === 'Target' && t.counter) {
      dd.append(document.createTextNode(' · '));
      const val = el('span', 'count-val', `${counterVal(t.id)} / ${t.counter.total}`);
      dd.append(val);
      const minus = el('button', 'count-btn', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', `One fewer ${t.counter.unit}`);
      minus.addEventListener('click', () => bumpCounter(t.id, -1));
      const plus = el('button', 'count-btn', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', `One more ${t.counter.unit}`);
      plus.addEventListener('click', () => bumpCounter(t.id, 1));
      dd.append(minus, plus);
    }
    facts.append(dd);
  }
  panel.append(facts);
  const phase = phaseFor(t.id);
  if (phase) panel.append(el('p', 'detail-roadmap', `Roadmap: Phase ${phase.phase} · ~${phase.time.replace('About ', '')}`));
  // Where the sources disagree, the guide shows both sides instead of
  // picking one silently: the disagreement names the split and the
  // sources behind each side, and the safe play is in the steps below.
  if (t.disagree) {
    const box = el('div', 'disagree-box');
    box.append(el('h3', null, 'Sources disagree — both versions shown'));
    box.append(el('p', null, t.disagree.text));
    const cited = el('p', 'disagree-cited', 'Cited by: ');
    t.disagree.srcs.forEach((id, i) => {
      if (i) cited.append(document.createTextNode(', '));
      const s = SOURCES.get(id);
      const a = el('a', null, `[${id}] ${s.name.split(' — ')[0]}`);
      a.href = s.url; a.target = '_blank'; a.rel = 'noopener';
      cited.append(a);
    });
    box.append(cited);
    panel.append(box);
  }
  // Watch: a strand with a story-linked window — start it as soon as it
  // unlocks rather than leaving it for after the credits.
  if (t.watch) {
    const box = el('div', 'watch-box');
    box.append(el('h3', null, '⚠ Watch — start this strand early'));
    box.append(el('p', null, t.watchNote));
    panel.append(box);
  }
  panel.append(el('h3', null, 'How to unlock it'));
  const steps = el('ol', 'steps');
  for (const s of (t.steps || [{ text: t.guide, src: 1 }])) {
    const li = el('li');
    li.append(document.createTextNode(s.text + ' '));
    const cite = el('sup', 'cite', `[${s.src}]`);
    li.append(cite);
    steps.append(li);
  }
  panel.append(steps);
  const note = t.confidence === 'unconfirmed'
    ? 'Confidence: unconfirmed — see the sources below for updates.'
    : t.confidence === 'reported'
      ? 'Confidence: reported — steps cite the sources below, all retrieved 20 Nov 2026.'
      : 'Confidence: official — the name, description and grade are PlayStation\u2019s own.';
  panel.append(el('p', 'confidence', note));
  panel.append(el('h3', null, 'Sources'));
  const list = el('ul', 'sources');
  for (const id of t.sources) {
    const s = SOURCES.get(id);
    const li = el('li');
    li.append(document.createTextNode(`[${id}] `));
    const a = el('a', null, s.name);
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    li.append(a, document.createTextNode(` · retrieved ${s.retrieved}`));
    list.append(li);
  }
  panel.append(list);
  const toggle = el('button', 'earned-btn', earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned');
  toggle.type = 'button';
  toggle.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id); else earned.add(t.id);
    saveEarned(); renderProgress(); renderList(); renderDetail(); renderRoadmap(); renderMissables();
  });
  panel.append(toggle);
}

// ---- Trophy list ----
function visibleTrophies() {
  const q = filters.q.trim().toLowerCase();
  return trophies.filter((t) => {
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.status === 'earned' && !earned.has(t.id)) return false;
    if (filters.status === 'unearned' && earned.has(t.id)) return false;
    if (filters.missableOnly && t.missable !== 'possible') return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

// ---- Phase chips and missable banner (tools row / tracker top) ----
function renderPhaseChips() {
  const wrap = document.getElementById('phase-chips');
  wrap.replaceChildren();
  for (const phase of ROADMAP) {
    const done = phaseEarnedCount(phase, earned);
    const chip = el('button', 'phase-chip' + (done === phase.trophyIds.length ? ' done' : ''),
      `P${phase.phase} ${done}/${phase.trophyIds.length}`);
    chip.type = 'button';
    chip.title = `Phase ${phase.phase} — ${phase.title}`;
    chip.addEventListener('click', () => {
      const head = document.getElementById(`phase-group-${phase.phase}`);
      if (head) head.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    wrap.append(chip);
  }
}

function renderMissableBanner() {
  const banner = document.getElementById('missable-banner');
  const pma = byId.get(28);
  if (!pma || earned.has(28)) { banner.hidden = true; banner.replaceChildren(); return; }
  banner.hidden = false;
  banner.replaceChildren();
  banner.append(document.createTextNode('⚠ 1 possibly missable trophy — Positive Mental Attitude: meditate at the first spot in Chapter 1, before the chapter ends.'));
  const open = el('button', null, 'Open the guide');
  open.type = 'button';
  open.addEventListener('click', () => {
    selectedId = 28; renderList(); renderDetail();
    document.getElementById('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  banner.append(open);
}

// ---- Trophy list, grouped by roadmap phase ----
function renderList() {
  const list = document.getElementById('trophy-list');
  const shown = visibleTrophies();
  document.getElementById('list-count').textContent =
    `Showing ${shown.length} of ${trophies.length} trophies${earned.size ? ` · ${earned.size} earned` : ''}`;
  renderPhaseChips();
  renderMissableBanner();
  list.replaceChildren();
  const shownIds = new Set(shown.map((t) => t.id));
  for (const phase of ROADMAP) {
    const group = phase.trophyIds.map((id) => byId.get(id)).filter((t) => shownIds.has(t.id));
    if (!group.length) continue;
    const done = phaseEarnedCount(phase, earned);
    const head = el('h3', 'phase-group', `Phase ${phase.phase} — ${phase.title} `);
    head.id = `phase-group-${phase.phase}`;
    head.append(el('span', 'phase-count', `(${done}/${phase.trophyIds.length} earned)`));
    list.append(head);
    for (const t of group) list.append(trophyCard(t));
  }
  if (!shown.length) list.append(el('p', 'empty', 'No trophies match these filters. Clear the search or a filter to see more.'));
}

function trophyCard(t) {
  const masked = isHiddenFromReader(t);
  const card = el('article', 'trophy' + (earned.has(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : ''));
  const box = el('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.setAttribute('aria-label', `Earned: ${masked ? 'hidden trophy' : t.name}`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id); else earned.delete(t.id);
    saveEarned(); renderProgress(); renderList(); renderDetail(); renderRoadmap(); renderMissables();
  });
  const body = el('div', 'trophy-body');
  const head = el('div', 'trophy-head');
  head.append(el('span', 'grade ' + t.grade, gradeChip(t)));
  head.append(el('span', 'kind', KINDS[t.kind]));
  if (t.missable === 'possible') head.append(el('span', 'missable', '⚠ Possibly missable'));
  if (t.watch) head.append(el('span', 'watch-tag', '⚠ Watch'));
  if (t.hidden) head.append(el('span', 'hidden-tag', 'Hidden on PS5'));
  body.append(head);
  body.append(el('h3', null, masked ? 'Hidden trophy — earn it to reveal' : t.name));
  body.append(el('p', 'desc', masked ? 'This trophy stays hidden on PlayStation until you earn it. Turn spoilers on to see it.' : t.description));
  const meta = el('p', 'meta', `${masked ? '' : `Target: ${t.target} · `}Difficulty ${difficultyDots(t)} · Xbox ${t.gamerscore}G`);
  body.append(meta);
  // Inline citations on every row: the global [n] ids of the sources
  // behind this trophy, so the list itself shows the guide is sourced.
  body.append(el('p', 'src-chips', `Sources ${t.sources.map((id) => `[${id}]`).join(' ')}`));
  const open = el('button', 'guide-btn', 'Guide & sources');
  open.type = 'button';
  open.addEventListener('click', () => { selectedId = t.id; renderList(); renderDetail(); document.getElementById('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  body.append(open);
  card.append(box, body);
  return card;
}

// ---- Roadmap view ----
function renderRoadmap() {
  const wrap = document.getElementById('roadmap');
  wrap.replaceChildren();
  wrap.append(el('p', 'lede', 'About 200 hours in total (PowerPyx): 60–80 for the story, about 100 for the 100% checklist, about 10 for Strangers & Freaks and cleanup. One playthrough, no mission replay, free roam after the story. Do the phases in order; tick trophies off in the tracker as you earn them.'));
  // NEXT UP: the first unearned trophy in roadmap order, with its counter
  // when it has one. Positive Mental Attitude leads while it is unearned:
  // its Chapter 1 spot is the one thing that can be missed for good.
  const nextId = ROADMAP.flatMap((p) => p.trophyIds).find((id) => !earned.has(id));
  const nextUp = el('p', 'next-up');
  if (nextId === undefined) {
    nextUp.append(el('strong', null, 'NEXT UP — '), document.createTextNode('Platinum earned: every trophy is ticked off. Vice Got a Price! is yours.'));
  } else {
    const nt = byId.get(nextId);
    const nphase = phaseFor(nextId);
    const counter = nt.counter ? ` · ${counterVal(nextId)}/${nt.counter.total} ${nt.counter.unit}` : '';
    const why = nextId === 28
      ? 'do the Chapter 1 meditation spot before the chapter ends'
      : `Phase ${nphase.phase} · ~${nphase.time.replace('About ', '')}`;
    nextUp.append(el('strong', null, 'NEXT UP — '));
    nextUp.append(document.createTextNode(`${isHiddenFromReader(nt) ? 'Hidden trophy' : nt.name}${counter} · ${why}.`));
  }
  wrap.append(nextUp);
  // Ground rules: the four facts the whole roadmap rests on, each cited
  // by the global source numbers used everywhere else in the guide.
  const rules = el('div', 'ground-rules');
  rules.append(el('h3', null, 'Ground rules — read these first'));
  const ruleList = el('ul', null);
  for (const text of [
    'All 55 trophies are offline, in one playthrough — no online trophies, no DLC trophies. [2][4]',
    'Cheats off, always: using one disables trophies and saving. [1][2]',
    'Keep a manual save at the start of every chapter and one before the final mission — there is no mission replay and no New Game+. [2][5]',
    'Free roam continues after the story, and every side strand stays open — except the Chapter 1 meditation spot. [1][2]',
  ]) ruleList.append(el('li', null, text));
  rules.append(ruleList);
  wrap.append(rules);
  wrap.append(el('p', 'methodology', 'HOW THIS ROADMAP WAS BUILT — Built from the official trophy descriptions and 7 sources, all retrieved and verified on 20 November 2026. Phases follow chapter order, side strands as they unlock, the open-world grind after the credits, and money with the 100% checklist last — because most of it is already done by then.'));
  for (const phase of ROADMAP) {
    const done = phaseEarnedCount(phase, earned);
    const section = el('section', 'phase');
    section.append(el('h3', null, `Phase ${phase.phase} — ${phase.title} (${done}/${phase.trophyIds.length} earned, ${phase.time})`));
    section.append(el('p', null, phase.text));
    const stageSrcs = [...new Set(phase.trophyIds.flatMap((id) => byId.get(id).sources))].sort((a, b) => a - b);
    section.append(el('p', 'stage-coverage', `STAGE SOURCE COVERAGE — ${stageSrcs.map((id) => `[${id}] ${SOURCES.get(id).name.split(' — ')[0]}`).join(' · ')}`));
    const chips = el('div', 'chips');
    for (const id of phase.trophyIds) {
      const t = byId.get(id);
      const label = isHiddenFromReader(t) ? 'Hidden trophy'
        : (t.counter && counterVal(id) > 0 ? `${t.name} ${counterVal(id)}/${t.counter.total}` : t.name);
      const chip = el('button', 'chip' + (earned.has(id) ? ' earned' : ''), label);
      chip.type = 'button';
      chip.addEventListener('click', () => { selectedId = id; setView('tracker'); renderList(); renderDetail(); document.getElementById('detail').scrollIntoView({ behavior: 'smooth' }); });
      chips.append(chip);
    }
    section.append(chips);
    wrap.append(section);
  }
}

// ---- Missables view ----
function renderMissables() {
  const wrap = document.getElementById('missables');
  wrap.replaceChildren();
  wrap.append(el('p', 'lede', 'Good news first: 54 of the 55 trophies cannot be missed. Every story trophy pops by playing the missions, every side strand stays open after the story, and nothing on the 100% checklist is missable. There is exactly one possible exception, and one habit that protects you from everything else.'));
  const warn = el('div', 'warning');
  warn.append(el('h3', null, '⚠ The one possibly missable trophy'));
  warn.append(el('p', null, 'Positive Mental Attitude — meditate at every spot across Leonida (18 spots, 10 locations). The first meditation spot is offered at home in Chapter 1 and becomes permanently unavailable after that chapter. PowerPyx got the trophy after doing it, but it is not yet confirmed whether the trophy needs that spot, so do it in Chapter 1 to be safe. The last spot needs Jason and Lucia playable together, which opens after Chapter 2.'));
  wrap.append(warn);
  const habit = el('div', 'tip');
  habit.append(el('h3', null, 'The habit that covers everything else'));
  habit.append(el('p', null, 'Keep a manual save at the start of every chapter and one before the final mission. There is no mission replay and no New Game+, so a chapter-start save is your only way back. And keep cheats off while trophy hunting: using one disables trophies and saving.'));
  wrap.append(habit);
  // Watch list: five side strands whose chains have windows linked to
  // story progress (TechWiser — the only source that gives the warning).
  // They stay completable in free roam, but start them when they unlock.
  const watchWrap = el('div', 'watch-list');
  watchWrap.append(el('h3', null, 'Watch list — 5 strands to start early'));
  watchWrap.append(el('p', null, 'TechWiser reports the stranger chains behind five hidden trophies have windows linked to story progress; only one source gives that warning, so begin each chain as soon as it unlocks. PowerPyx adds that all trophy-related quest givers return in free roam, so a started chain stays completable after the story.'));
  const watchRows = el('ul', null);
  for (const t of trophies.filter((x) => x.watch)) {
    const li = el('li');
    li.append(el('strong', null, `${isHiddenFromReader(t) ? 'Hidden trophy' : t.name} — `));
    li.append(document.createTextNode(t.watchNote));
    watchRows.append(li);
  }
  watchWrap.append(watchRows);
  wrap.append(watchWrap);
  wrap.append(el('h3', null, 'All trophies by missable status'));
  const rows = el('ul', 'missable-list');
  for (const t of trophies) {
    const li = el('li', t.missable === 'possible' ? 'possible' : '');
    li.textContent = `${earned.has(t.id) ? '✓ ' : ''}${isHiddenFromReader(t) ? 'Hidden trophy' : t.name} — ${t.missable === 'possible' ? 'POSSIBLY MISSABLE: do the Chapter 1 meditation spot' : 'Cannot be missed'}`;
    rows.append(li);
  }
  wrap.append(rows);
  wrap.append(el('p', 'sources-note', 'Missable status: PowerPyx, cross-checked with PlanetGTA6 and OutputLag; the watch list rests on TechWiser, the only source that flags the story windows. Sources: '));
  const a = el('a', null, 'GTA-Zone trophy list');
  a.href = 'https://gta-zone.com/news/gta-6-trophies-achievements/';
  a.target = '_blank'; a.rel = 'noopener';
  wrap.lastChild.append(a);
}

// ---- Source matrix ----
// One row per trophy, one column per source: a ✓ where that source backs
// the trophy, so the reader can see at a glance that no trophy stands on
// a single source and which source covers what.
function renderMatrix() {
  const wrap = document.getElementById('matrix');
  wrap.replaceChildren();
  wrap.append(el('p', 'lede', 'Every trophy in this guide is backed by at least two of the seven sources below, and every step cites its source by number. The matrix shows which source backs which trophy — read a column to see what one source covers, read a row to see what backs one trophy.'));
  const table = el('table', 'matrix-table');
  const head = el('tr');
  head.append(el('th', null, 'Trophy'));
  for (const s of DATA.sources) {
    const th = el('th', null, `[${s.id}]`);
    th.title = s.name;
    head.append(th);
  }
  head.append(el('th', null, 'Earned'));
  table.append(head);
  for (const t of trophies) {
    const row = el('tr');
    row.append(el('td', 'matrix-name', isHiddenFromReader(t) ? 'Hidden trophy' : t.name));
    for (const s of DATA.sources) {
      row.append(el('td', 'matrix-cell' + (t.sources.includes(s.id) ? ' yes' : ''), t.sources.includes(s.id) ? '✓' : '·'));
    }
    row.append(el('td', 'matrix-cell', earned.has(t.id) ? '✓' : '·'));
    table.append(row);
  }
  const foot = el('tr', 'matrix-foot');
  foot.append(el('td', null, 'Coverage'));
  for (const s of DATA.sources) {
    foot.append(el('td', null, `${trophies.filter((t) => t.sources.includes(s.id)).length}/55`));
  }
  foot.append(el('td', null, `${earned.size}/55`));
  table.append(foot);
  wrap.append(table);
  wrap.append(el('p', 'sub', DATA.sources.map((s) => `[${s.id}] ${s.name}`).join(' · ')));
}

// ---- Views ----
function setView(next) {
  view = next;
  for (const button of document.querySelectorAll('[data-view]')) {
    button.classList.toggle('active', button.dataset.view === view);
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  }
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${view}`;
  }
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
  if (view === 'matrix') renderMatrix();
}

// ---- Controls ----
function bindControls() {
  const search = document.getElementById('search');
  search.value = filters.q;
  search.addEventListener('input', () => { filters.q = search.value; renderList(); });
  const kind = document.getElementById('kind');
  kind.value = filters.kind;
  kind.addEventListener('change', () => { filters.kind = kind.value; renderList(); });
  const grade = document.getElementById('grade');
  grade.value = filters.grade;
  grade.addEventListener('change', () => { filters.grade = grade.value; renderList(); });
  const status = document.getElementById('status');
  status.value = filters.status;
  status.addEventListener('change', () => { filters.status = status.value; renderList(); });
  const missable = document.getElementById('missable-only');
  missable.checked = filters.missableOnly;
  missable.addEventListener('change', () => { filters.missableOnly = missable.checked; renderList(); });
  const spoiler = document.getElementById('spoilers');
  spoiler.checked = spoilers;
  spoiler.addEventListener('change', () => { spoilers = spoiler.checked; saveSpoilers(); renderList(); renderDetail(); renderRoadmap(); renderMissables(); });
  for (const button of document.querySelectorAll('[data-view]')) {
    button.addEventListener('click', () => setView(button.dataset.view));
  }
  document.getElementById('export').addEventListener('click', () => {
    const payload = { game: 'Grand Theft Auto VI', platform: 'PlayStation 5', exported: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b).map((id) => byId.get(id).name), counters: Object.fromEntries([...counters].filter(([, v]) => v > 0).map(([id, v]) => [byId.get(id).name, v])) };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const names = new Set(Array.isArray(data) ? data : data.earned || []);
      const next = new Set();
      for (const t of trophies) if (names.has(t.name)) next.add(t.id);
      earned = next;
      const nextCounters = new Map();
      const saved = (data && typeof data === 'object' && !Array.isArray(data)) ? (data.counters || {}) : {};
      for (const t of trophies) {
        if (t.counter && Number.isFinite(saved[t.name])) {
          nextCounters.set(t.id, Math.max(0, Math.min(t.counter.total, Math.floor(saved[t.name]))));
        }
      }
      counters = nextCounters;
      saveEarned(); saveCounters(); renderProgress(); renderList(); renderDetail(); renderRoadmap(); renderMissables();
      document.getElementById('import-note').textContent = `Imported ${earned.size} earned${counters.size ? ` · ${counters.size} counters` : ''}.`;
    } catch {
      document.getElementById('import-note').textContent = 'That file could not be read as trophy progress. It must be a JSON export from this guide.';
    }
    e.target.value = '';
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (window.confirm('Clear all earned trophies and counters in this browser? This cannot be undone. Export your progress first if you want to keep it.')) {
      earned = new Set();
      counters = new Map();
      saveEarned(); saveCounters(); renderProgress(); renderList(); renderDetail(); renderRoadmap(); renderMissables();
    }
  });
  document.getElementById('print').addEventListener('click', () => window.print());
}

bindControls();
if (filters.grade !== 'all' || filters.kind !== 'all' || filters.missableOnly) setView('tracker');
renderProgress();
renderDetail();
renderList();
renderRoadmap();
renderMissables();
renderMatrix();
setView(['tracker', 'roadmap', 'missables', 'matrix', 'about'].includes(view) ? view : 'tracker');
