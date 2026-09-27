# Contributing

Thanks for working on Reinos de Hierro. This page covers the workflow. For the
architecture and the reasoning behind the rules, read [CLAUDE.md](CLAUDE.md).

## Language

- **Game text is Spanish.** Anything a player reads: names, descriptions,
  quest dialogue, interface labels.
- **Everything else is English.** Documentation, code comments, test names,
  branch names and commit messages.

## Setup

```bash
npm install
npx playwright install chromium
npm run dev
```

On macOS 12 or older, Playwright has no Chromium build. Skip that second
command and run the end-to-end suite against an installed browser instead:
`PW_CHANNEL=chrome npm run test:e2e`.

## Before every commit

```bash
npm run verify
```

Lint, unit tests with coverage thresholds, then the end-to-end suite. It has to
be green. The end-to-end part takes several minutes because it renders real
WebGL in software.

## Where code goes

Three layers, and the split is what keeps the game testable.

- **`src/core/`** — pure rules. No DOM, no Three.js, no timers, no module-level
  side effects. Randomness is injected as a `rand` argument so tests are
  deterministic. ESLint fails the build if a core module imports `three` or
  reaches for a DOM global.
- **`src/data.js`** — all content: peoples, items, quests, enemies, shop. Start
  here to add content.
- **`src/game.js`** — the Three.js runtime. The only layer allowed to touch the
  DOM or the renderer.

If you find yourself wanting a browser API inside `src/core/`, the rule belongs
in core and the browser part belongs in `src/game.js`.

## Testing rules

- **Every rules change ships with a unit test.** Damage, stacking, quest
  transitions, terrain — all of it is unit testable, so test it.
- **Coverage thresholds are enforced** in `vitest.config.js` over `src/core/**`
  and `src/data.js`. Add tests rather than lowering a threshold.
- **New content must pass `tests/unit/history.test.js`.** Every people needs
  `era: [from, to]` spanning `SETTING.year`, and player-facing text may not use
  a term from the anachronism list.
- **End-to-end tests run in software WebGL** at a few frames per second, so
  every action costs several frames. Before assuming the game broke, check
  whether the test is racing a timer. The two-tap replace flow in
  `tests/e2e/game.spec.js` is split across two tests for exactly that reason.

## Historical setting

The Danelaw, around 950. Silver rather than gold, mail rather than plate,
spear and axe and seax rather than longsword and crossbow, salves rather than
potions, and no horned helmets. When you add content, prefer a detail that is
true to the period over one that merely sounds medieval.

When a review finds a new anachronism, add a pattern to `ANACHRONISMS` in
`tests/unit/history.test.js` with a short reason. That list only ever grows —
never widen it to let something through.

## Things that will bite you

- **Never use `confirm()` or `alert()`.** The claude.ai artifact viewer blocks
  them, so the game would hang there. Use the two-tap pattern the start-screen
  `#go` button uses.
- **Three.js is pinned to `0.128.0`.** Newer versions change lighting; if you
  upgrade, re-check every light intensity in `src/game.js`.
- **Changing the save shape** means bumping `SAVE_VERSION` in
  `src/core/state.js` and extending `migrate()` in `src/data.js`, with a test
  covering the old shape.
- **Inserting a quest in the middle of `QUESTS`** shifts every later index and
  invalidates saves mid-chain. Append, or migrate.

## Commit messages

Lowercase, no commas, no symbols. One idea per body line.

```
add a frisian people to the start screen

frisian traders reached the danelaw through the north sea ports
cover the new era range in the history test
```

## Pull requests

CI runs lint, unit tests and the end-to-end suite on every push and pull
request, and uploads the coverage and Playwright reports as artifacts. The
GitHub Pages deploy waits for CI to pass on `main`.
