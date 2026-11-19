// GTA VI trophy guide + tracker: checklist, filters, spoiler setting,
// platinum roadmap, missable warnings, export/import. Everything runs
// offline from files under app/: the trophy data is fetched from the
// relative path data/trophies.json, progress lives in localStorage, and
// the app makes no network request of its own. Links to sources open
// only when the reader follows them.
import { ROADMAP, phaseEarnedCount } from './roadmap.js';

const STORAGE_KEY = 'gta6-trophy-guide-v1';
const SPOILER_KEY = 'gta6-trophy-guide-spoilers';

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
const trophies = (await (await fetch('data/trophies.json')).json()).trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

let earned = new Set(loadEarned());
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
}

// ---- Detail panel: one trophy's guide with its sources ----
// The panel is the guide's proof: official name and description, the
// facts, the guide in the entry's own words, how sure the guide is, the
// roadmap step it belongs to, and the named sources behind every fact.
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
  // Four facts only: missable and hidden are chips on the trophy card,
  // the chapter lives in the roadmap line below, Xbox in the card's meta.
  const facts = el('dl', 'facts');
  for (const [k, v] of [
    ['Grade', gradeChip(t)], ['Kind', KINDS[t.kind]],
    ['Target', t.target], ['Difficulty', difficultyDots(t)],
  ]) {
    facts.append(el('dt', null, k), el('dd', null, v));
  }
  panel.append(facts);
  const phase = phaseFor(t.id);
  if (phase) panel.append(el('p', 'detail-roadmap', `Roadmap: Phase ${phase.phase} · ~${phase.time.replace('About ', '')}`));
  panel.append(el('h3', null, 'How to unlock it'));
  panel.append(el('p', null, t.guide));
  const note = t.confidence === 'unconfirmed'
    ? 'Confidence: unconfirmed — no guide has pinned down the exact trigger yet; see the sources below for updates.'
    : t.confidence === 'reported'
      ? 'Confidence: reported — steps from PowerPyx and GTABase via GTA-Zone, cross-checked with PlanetGTA6.'
      : 'Confidence: official — the name, description and grade are PlayStation\u2019s own.';
  panel.append(el('p', 'confidence', note));
  panel.append(el('h3', null, 'Sources'));
  const list = el('ul', 'sources');
  for (const s of t.sources) {
    const li = el('li');
    const a = el('a', null, s.name);
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    li.append(a);
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

function renderList() {
  const list = document.getElementById('trophy-list');
  const shown = visibleTrophies();
  document.getElementById('list-count').textContent =
    `Showing ${shown.length} of ${trophies.length} trophies${earned.size ? ` · ${earned.size} earned` : ''}`;
  list.replaceChildren();
  for (const t of shown) {
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
    if (t.hidden) head.append(el('span', 'hidden-tag', 'Hidden on PS5'));
    body.append(head);
    body.append(el('h3', null, masked ? 'Hidden trophy — earn it to reveal' : t.name));
    body.append(el('p', 'desc', masked ? 'This trophy stays hidden on PlayStation until you earn it. Turn spoilers on to see it.' : t.description));
    const meta = el('p', 'meta', `${masked ? '' : `Target: ${t.target} · `}Difficulty ${difficultyDots(t)} · Xbox ${t.gamerscore}G`);
    body.append(meta);
    const open = el('button', 'guide-btn', 'Guide & sources');
    open.type = 'button';
    open.addEventListener('click', () => { selectedId = t.id; renderList(); renderDetail(); document.getElementById('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
    body.append(open);
    card.append(box, body);
    list.append(card);
  }
  if (!shown.length) list.append(el('p', 'empty', 'No trophies match these filters. Clear the search or a filter to see more.'));
}

// ---- Roadmap view ----
function renderRoadmap() {
  const wrap = document.getElementById('roadmap');
  wrap.replaceChildren();
  wrap.append(el('p', 'lede', 'About 200 hours in total (PowerPyx, via GTA-Zone): 60–80 for the story, about 100 for the 100% checklist, about 10 for Strangers & Freaks and cleanup. One playthrough, no mission replay, free roam after the story. Do the phases in order; tick trophies off in the tracker as you earn them.'));
  for (const phase of ROADMAP) {
    const done = phaseEarnedCount(phase, earned);
    const section = el('section', 'phase');
    section.append(el('h3', null, `Phase ${phase.phase} — ${phase.title} (${done}/${phase.trophyIds.length} earned, ${phase.time})`));
    section.append(el('p', null, phase.text));
    const chips = el('div', 'chips');
    for (const id of phase.trophyIds) {
      const t = byId.get(id);
      const chip = el('button', 'chip' + (earned.has(id) ? ' earned' : ''), isHiddenFromReader(t) ? `Hidden trophy` : t.name);
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
  wrap.append(el('h3', null, 'All trophies by missable status'));
  const rows = el('ul', 'missable-list');
  for (const t of trophies) {
    const li = el('li', t.missable === 'possible' ? 'possible' : '');
    li.textContent = `${earned.has(t.id) ? '✓ ' : ''}${isHiddenFromReader(t) ? 'Hidden trophy' : t.name} — ${t.missable === 'possible' ? 'POSSIBLY MISSABLE: do the Chapter 1 meditation spot' : 'Cannot be missed'}`;
    rows.append(li);
  }
  wrap.append(rows);
  wrap.append(el('p', 'sources-note', 'Missable status: PowerPyx via GTA-Zone, cross-checked with PlanetGTA6 and OutputLag. Sources: '));
  const a = el('a', null, 'GTA-Zone trophy list');
  a.href = 'https://gta-zone.com/news/gta-6-trophies-achievements/';
  a.target = '_blank'; a.rel = 'noopener';
  wrap.lastChild.append(a);
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
    const payload = { game: 'Grand Theft Auto VI', platform: 'PlayStation 5', exported: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b).map((id) => byId.get(id).name) };
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
      saveEarned(); renderProgress(); renderList(); renderDetail(); renderRoadmap(); renderMissables();
      document.getElementById('import-note').textContent = `Imported ${earned.size} earned trophies.`;
    } catch {
      document.getElementById('import-note').textContent = 'That file could not be read as trophy progress. It must be a JSON export from this guide.';
    }
    e.target.value = '';
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (window.confirm('Clear all earned trophies in this browser? This cannot be undone. Export your progress first if you want to keep it.')) {
      earned = new Set();
      saveEarned(); renderProgress(); renderList(); renderDetail(); renderRoadmap(); renderMissables();
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
setView(['tracker', 'roadmap', 'missables', 'about'].includes(view) ? view : 'tracker');
