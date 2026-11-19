![GTA 6 trophy guide](https://make.fun/badge/gta6-trophy-guide-01.svg)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/HALCYON1803/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/HALCYON1803/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# GTA VI Trophy Guide & Tracker

An offline guide and tracker for all **55 Grand Theft Auto VI trophies on PlayStation 5** — 1 Platinum, 2 Gold, 6 Silver, 46 Bronze, 28 hidden, none online. Built for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01) on make.fun.

## What it does

- **Tracker** — tick trophies off as you earn them. Progress is saved in the browser (localStorage), survives reloads, and can be exported to a file and imported back. Progress by grade (Platinum/Gold/Silver/Bronze) and by kind, with a progress bar.
- **Every trophy, with a guide** — official name, description and grade as PlayStation publishes them, plus a guide in this entry's own words: what to do, where, and whether it can be missed. Every guide cites its sources by name and link.
- **Platinum roadmap** — five phases in play order (story in chapter order, side strands, open-world grind, money and 100% completion), with per-phase progress. About 200 hours in total (PowerPyx estimate).
- **Missables** — exactly one trophy is possibly missable: Positive Mental Attitude (the Chapter 1 meditation spot). The other 54 cannot be missed. The guide says so plainly, with the manual-save habit that protects you.
- **Filters & spoilers** — search, filter by kind, grade and status, missable-only view, and a spoiler setting that hides the 28 hidden trophies until earned.
- **Honest about what is not known yet** — five trophies whose exact triggers no guide has pinned down yet (In The Beginning…, Capital Offense, Bad Luck I Guess, The Truth Is Out There, Ten Pin) are marked **unconfirmed** instead of inventing steps.
- **Seven sources, one registry** — every trophy is backed by at least two of seven sources (PowerPyx, GTA-Zone, PlanetGTA6, GTABase, OutputLag, eGamers, TechWiser), all retrieved and verified on 20 Nov 2026. Every one of the 170 numbered steps cites its source by number, and the **Source matrix** tab shows which source backs which trophy.
- **Watch list** — five side strands (Andy, Kenton, Billy, Randy, Tyrone) have story-linked windows (TechWiser, the only source that flags them); the guide tells you to start each chain as soon as it unlocks.
- **Disagreements shown, not hidden** — where the sources split (18 meditation spots for Positive Mental Attitude vs 15 for the 100% checklist), the guide shows both versions with the sources behind each, and the counter is set to the safe number, 18.
- **Fully offline** — static files under `app/`, no CDN, no web fonts, no network requests at run time. Open `app/index.html` in desktop Chrome with the network off and it works.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Or serve `app/` with any static file server.

## Files

- `app/index.html`, `app/style.css`, `app/app.js`, `app/roadmap.js` — the guide itself.
- `app/data/trophies.json` — the 55 trophies: official name, description, grade, Gamerscore, hidden flag, kind, missable flag, difficulty, target, guide and sources, plus the 7-source registry. 170 numbered steps, every one cited by source number.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.
- `screenshots/` — real renders of the app in a browser (see `shots.json`).
- `SOURCES.md` — every source used, and what each fact rests on.

## Sources

Trophy names, descriptions and grades: PlayStation Network, as mirrored by Exophase and PSNProfiles (18 Nov 2026) and cross-checked with TrueAchievements. Guide steps, counts, difficulty, time and the missable call: PowerPyx, direct and via GTA-Zone. The watch list rests on TechWiser; the meditation disagreement is documented by eGamers. Seven sources in all, retrieved and verified 20 Nov 2026. Full list in `SOURCES.md`.

## Licence

MIT — see `LICENSE`. This is an independent fan-made guide, not affiliated with Rockstar Games, Sony or PlayStation, and it uses no Rockstar logo, artwork or game screenshots.
