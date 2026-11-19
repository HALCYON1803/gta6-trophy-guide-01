// The platinum roadmap: the order to earn the 55 trophies in, in five
// phases. The order is built from the official descriptions and the
// guide sources (PowerPyx and GTABase, via GTA-Zone): story first, in
// chapter order, with the missable meditation spot done in Chapter 1;
// side strands as they unlock; the open-world grind after the credits;
// money and the 100% checklist last, because most of it is already done
// by then. Each phase names its trophies by id, matching trophies.json.

export const ROADMAP = [
  {
    phase: 1,
    title: 'Before you start, and Chapters 1–2',
    time: 'About 25 hours',
    text: 'Turn cheats off and keep them off: using one disables trophies and saving (PowerPyx, via GTA-Zone). Make a manual save at the start of every chapter, because there is no mission replay and no New Game+. In Chapter 1, do the first meditation spot offered at home: it is the only spot PowerPyx flags as possibly missable, and it is gone after the chapter. Play both chapters in order and try the activities as they unlock.',
    trophyIds: [2, 3, 20, 28, 4, 8, 24, 29],
  },
  {
    phase: 2,
    title: 'Chapters 3–4: Vice City and the big jobs',
    time: 'About 30 hours',
    text: 'Chapter 3 brings The Cartel Heist and Yasmani\u2019s jobs, which hand you the Snap Gun used for the quiet jewelry-store robbery later. Chapter 4 brings three more mission trophies and an optional mission that opens the bank vaults, so take the optional missions as they appear instead of rushing to the chapter end. Scan vehicles and WAiNK locations as you travel between missions.',
    trophyIds: [5, 9, 10, 11, 12, 6, 39, 40, 43],
  },
  {
    phase: 3,
    title: 'Chapter 5, the finale, and the side strands',
    time: 'About 15 hours',
    text: 'Finish Chapter 5 and the final mission, with a manual save made before the finale. Then work through the character strands in free roam: Andy, Kenton, Randy and Tyrone each have a final mission with its own trophy, Billy\u2019s five jobs run from the Thrillbilly Mudclub, and eight stranger strands earn Strangers & Freaks. Only Kirk, Kyle, Yago and Pilot Pete count towards that silver, so check the guide before spending time on a strand.',
    trophyIds: [13, 7, 22, 23, 26, 27, 25],
  },
  {
    phase: 4,
    title: 'Open-world grind after the credits',
    time: 'About 60 hours',
    text: 'Free roam after the story is where the long trophies live: 250 stunts, gold at all 42 Shooting Range challenges, a drone-race win at each of the 14 locations, 20 different race wins, 50 challenges, 100 vehicles scanned, 100 WAiNK locations, 3 card sets and the whole map explored. Do the one-off moments in the same sweep: the jet departure at VCIA, the tank at Mile Zero, the bowling-alley robbery, the 500 profile actions and the five cryptic trophies whose triggers are still unconfirmed.',
    trophyIds: [15, 17, 18, 19, 21, 16, 32, 35, 42, 31, 30, 36, 33, 34, 37, 38, 41, 46, 47, 48, 44, 45, 49, 50, 51],
  },
  {
    phase: 5,
    title: 'Money, 100% completion, platinum',
    time: 'About 40 hours',
    text: 'Finish the money trophies: launder $250,000 of Marked Bills (Yasmani pays best), spend $100,000 in shops, buy all 8 garages for sale, and register 10 vehicles in the Scooter Bros app. Then close out the 100% checklist (Progress, then Stats, then 100% Completion): 300 of 397 stunts, 70 of 80 challenges, 15 of 18 meditation spots, 200 of 277 vehicles, 100 of 255 animals, 50 of 66 weapons, all 8 vaults, all 42 drone races and all 39 gang operations. A Long Road pops at 100%, and Vice Got a Price! follows with it.',
    trophyIds: [52, 53, 54, 55, 14, 1],
  },
];

// How many of one phase's trophies a set of earned trophy ids covers.
export function phaseEarnedCount(phase, earnedIds) {
  let count = 0;
  for (const id of phase.trophyIds) if (earnedIds.has(id)) count += 1;
  return count;
}

// Every trophy id the roadmap covers, in roadmap order (all 55, each once).
export function roadmapOrder() {
  const order = [];
  for (const phase of ROADMAP) order.push(...phase.trophyIds);
  return order;
}
