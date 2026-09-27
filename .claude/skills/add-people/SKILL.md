---
name: add-people
description: Add a new playable people to Reinos de Hierro. Use when the user wants a new playable race, faction, kingdom or culture on the start screen, or says things like "add the Frisians" or "quiero añadir un pueblo nuevo".
---

# Add a playable people

A people is one entry in `RACES` in `src/data.js`. Six exist today: vikingos,
anglosajones, irlandeses, escoceses, francos, bizantinos.

## Steps

1. **Check the history first.** The people must have existed in or around
   `SETTING.year` (950) and plausibly have reached the Danelaw. If it did not,
   say so and suggest the nearest real alternative instead of inventing one.

2. **Add the entry** to `RACES` in `src/data.js`, keyed by a lowercase Spanish
   plural with no accents (`frisones`). Required fields:

   - `era: [from, to]` — the years the people existed. Must span 950.
   - `name` — plural display name in Spanish, e.g. `'Frisones'`.
   - `one` — how a quest giver addresses one of them, e.g. `'mercader frisón'`.
   - `init` — single letter for the shield badge.
   - `c1`, `c2` — two hex colours for the shield.
   - `blurb` — one or two sentences of real history, in Spanish.
   - `hp`, `str`, `def`, `spd`, `dmg` — stats. Keep them inside the range the
     existing peoples use so the start-screen bars stay readable.
   - `weapon`, `armor` — ids that already exist in `ITEMS`, or add them first
     with the `add-item` skill.
   - `look` — body colours, `helm`, `shield` for the 3D model.

3. **Add a unit test** in `tests/unit/data.test.js` if the people introduces a
   new shape or an edge case. `history.test.js` already checks every people
   automatically.

4. **Check the text** with the `history-review` skill or the
   `history-reviewer` agent. The blurb is player-facing, so the anachronism
   list in `tests/unit/history.test.js` applies to it.

5. **Run `npm run verify`.**

## Watch out

- Stats feed the start-screen bars, which are scaled against fixed maxima
  (`hp/130`, `str*dmg/17`, `def+armor/15`, `spd/1.25`). Values above those
  overflow the bar.
- Text is Spanish. Comments and test names are English.
