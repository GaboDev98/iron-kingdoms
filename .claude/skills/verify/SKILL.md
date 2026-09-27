---
name: verify
description: Run the full check suite for Reinos de Hierro and interpret the failures. Use before committing, when the user asks to verify, check, validate or test everything, or when CI is red.
---

# Verify

```bash
npm run verify
```

Runs lint, then unit tests with coverage thresholds, then the Playwright suite.
Run it before every commit.

On macOS 12 or older, Playwright has no Chromium build. Use an installed
browser instead:

```bash
PW_CHANNEL=chrome npm run test:e2e
```

## Reading failures

**Lint fails on a `src/core` import** — a core module reached for `three` or a
DOM global. Move the impure part into `src/game.js` and keep the rule pure;
do not silence the rule.

**Coverage below threshold** — thresholds are in `vitest.config.js` and cover
`src/core/**` and `src/data.js`. New rules need new unit tests rather than a
lowered threshold.

**`history.test.js` fails** — either a people has an `era` that does not span
`SETTING.year`, or player-facing text used a term from the anachronism list.
Fix the content. Only extend the list when a review finds a genuinely new
anachronism, never to let one through.

**A Playwright test times out** — the suite renders real WebGL in software at a
few frames per second, so every action costs several frames. First check
whether the test is racing a timer in the game rather than assuming the game
broke. The two-tap replace flow is deliberately split across two tests for
exactly that reason; read the comments in `tests/e2e/game.spec.js` before
changing it.

## Faster loops

- `npm run test:watch` while working on rules.
- `npx playwright test --project=desktop --grep "part of the name"` for one
  end-to-end case.
