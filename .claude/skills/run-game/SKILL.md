---
name: run-game
description: Launch Reinos de Hierro and drive it in a browser to check a change by hand. Use when asked to run the game, start the dev server, take a screenshot of the game, or confirm something works in the real app rather than in tests.
---

# Run the game

## Launch

```
preview_start with name "game"
```

`.claude/launch.json` defines `game` (dev server on 5173) and `game-built`
(`vite preview` of `dist/` on 4173).

Both entries call `node node_modules/vite/bin/vite.js` directly instead of
`npm run dev`. **Do not change them back to npm.** The npm wrapper calls
`process.cwd()` while validating engines and dies with
`EPERM: operation not permitted, uv_cwd` when the launcher gives it a working
directory it cannot resolve. Calling the Vite binary through node skips that
wrapper entirely.

If you ever need it by hand:

```bash
node node_modules/vite/bin/vite.js --port 5173 --strictPort
```

## The frame-rate trap

The game renders through `requestAnimationFrame`. **Browsers pause `rAF` in a
hidden tab**, so when the Browser pane is not visible the game loop does not
advance: the world freezes, input is recorded but never consumed, and any
script that waits on a frame hangs until it times out.

That is correct browser behaviour and correct game behaviour — do not try to
"fix" it in `src/game.js`. The loop already clamps `dt` to 50 ms, so coming
back from a hidden tab never jumps the simulation.

What it means in practice:

- **Never `await` a `requestAnimationFrame` promise** inside `javascript_tool`.
  It will time out rather than return.
- `tabs_select` does not reliably un-hide the pane, so do not rely on it.
- Taking a real screenshot with `computer` forces a frame. That is the lever:
  **capture to advance time.**

### Driving the character while the pane is hidden

Key presses through `computer` are press-and-release, so they set
`keys[k] = true` and immediately `false` again — the character barely moves.
Movement needs the key held down across several frames. Hold it by hand:

1. Press the key down via `javascript_tool` and return immediately:
   `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w', bubbles: true }))`
2. Advance frames with a `browser_batch` of small screenshots
   (`scale: 0.1` keeps them cheap). Roughly 8 captures covers about 10 m.
3. Release: the same event with `keyup`.
4. Read the result from the DOM — `#compass` for distance to the target,
   `#prompt` for the interaction hint.

Single-shot keys (`i` for the pack, `e` to talk, `Escape` to close) work fine
as a normal `computer` key press, because one frame is enough.

## A worthwhile smoke run

Start screen → pick a people → start → pack → walk to Edda → talk → accept the
quest. That touches rendering, input, inventory, the quest state machine, the
compass and local saving.

Checks worth making at the end:

- `read_console_messages` with `onlyErrors` — should be empty.
- `localStorage['reinos-hierro-partida-v1']` — after accepting the first quest
  it should read `quest.status: "active"` and a `pos` that has moved off the
  spawn at `{ x: 2, z: 10 }`.

Selecting a people writes nothing, so a leftover save from an earlier run shows
a **Continuar** button on the start screen. Clear it with
`localStorage.clear()` if you need a clean start screen.

## When not to use this

The Playwright suite already drives all of this headlessly and asserts on it:
`npm run test:e2e`, or `PW_CHANNEL=chrome npm run test:e2e` on macOS 12. Run the
game by hand to *look* at something, not to prove a behaviour that a test
should own.
