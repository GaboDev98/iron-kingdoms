# Reinos de Hierro

Third-person 3D medieval RPG set in the Danelaw around the year 950. Plain
JavaScript, no framework.

## Stack

- **Three.js 0.128.0**, pinned. Newer versions change how lighting is computed;
  if you bump it, re-check every light intensity in `src/game.js`.
- **Vite 8** for dev server and builds.
- **Vitest** for unit tests, **Playwright** for end-to-end tests, **ESLint** for
  static rules.
- Ships as a web build (GitHub Pages), Android and iOS (Capacitor), desktop
  (Electron) and a single-file build for uploading back to claude.ai.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run lint` | ESLint over the whole repo |
| `npm test` | Unit tests once |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:coverage` | Unit tests with coverage thresholds enforced |
| `npm run test:e2e` | Playwright suite, desktop and Pixel 7 projects |
| `npm run verify` | lint, then coverage, then e2e. **Run before every commit** |
| `npm run build` | Production build into `dist/` |
| `npm run build:single` | One self-contained HTML file in `dist-single/` |
| `npm run desktop` | Build and open the Electron window |

Playwright ships no Chromium for macOS 12 and older. On such a machine run the
suite against an installed browser: `PW_CHANNEL=chrome npm run test:e2e`.

To launch and drive the game by hand, use the `run-game` skill. It covers
`.claude/launch.json` and the frame-rate traps that come with a hidden browser
pane.

## Architecture

Three layers. The split is what makes the game testable, so keep it.

### `src/core/` — pure rules

No DOM, no Three.js, no timers, no globals. Plain functions over plain data,
runnable in Node. Randomness is injected as a `rand` argument so results are
reproducible in tests.

| Module | Owns |
|---|---|
| `world.js` | Terrain height, paths, walkability, seeded PRNG, world constants |
| `inventory.js` | Slots, stacking, add/remove, equipping. `INV_MAX` is 20 |
| `combat.js` | Damage, criticals, XP curve, level-ups, death penalty |
| `quests.js` | Quest state machine: available → active → ready → next |
| `state.js` | Save-game shape, `SAVE_VERSION`, `newState()` |

ESLint enforces this: `src/core` may not import `three` and may not touch DOM
globals. That rule is not advisory — a violation fails `npm run lint`.

### `src/data.js` — content

All game content in one file: `SETTING`, `RACES`, `ITEMS`, `QUESTS`, `ETYPES`,
`SHOP`. Start here to add content. It also holds `RACE_MAP`, `ITEM_MAP` and
`migrate()`, which repair saves written by older versions.

### `src/game.js` — runtime

Three.js scene, character models, input, camera, AI, HUD and persistence. This
is the only layer allowed to touch the DOM or the renderer. It imports the rules
from `src/core/` rather than reimplementing them.

`src/main.js` is the entry point: fonts, styles, then the game.

## Rules

- **`src/core/` stays pure.** No DOM, no Three.js, no module-level side effects.
- **Every rules change ships with a unit test.** If you change damage, stacking,
  quest transitions or terrain, `tests/unit/` must cover it.
- **New content must pass `tests/unit/history.test.js`.** Every people needs
  `era: [from, to]` spanning `SETTING.year`, and no player-facing text may use a
  term from the anachronism list.
- **Game text is Spanish. Everything else is English** — documentation, code
  comments, test names, commit messages.
- **Commit messages are lowercase with no commas and no symbols.**
- **Run `npm run verify` before every commit.**
- **Never use `confirm()` or `alert()`.** The claude.ai artifact viewer blocks
  them. Use the two-tap pattern that `#go` uses on the start screen.
- Bump `SAVE_VERSION` and extend `migrate()` whenever the save shape changes.

## Historical setting

The Danelaw, northern and eastern England under Danish law, around 950. Playable
peoples: Vikings (Danish settlers), Anglo-Saxons, Irish, Scots, Franks and
Byzantines. Keep content inside that window:

- Silver, not gold. The Danelaw economy ran on silver pennies and hacksilver.
- Mail (*brynja*) is the good armour and is expensive. No plate.
- Spear, axe, seax and simple bow. No longbow, no crossbow, no longsword.
- No horned helmets — that is a 19th-century invention.
- Remedies are salves and herbs, never "potions".

When adding content, prefer a detail that is true to the period over one that
merely sounds medieval. `.claude/agents/history-reviewer.md` reviews text
against this.
