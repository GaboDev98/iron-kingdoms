# Reinos de Hierro

A third-person 3D medieval RPG set in the Danelaw around the year 950, built
with [Three.js](https://threejs.org) and [Vite](https://vite.dev).

The game text is in Spanish. Everything else — documentation, code comments,
test names and commit messages — is in English.

## Requirements

- [Node.js](https://nodejs.org) 20 or newer
- [Visual Studio Code](https://code.visualstudio.com), or any editor you like
- Git and a GitHub account

## Getting started

```bash
npm install
npm run dev
```

Open the address the terminal prints, usually `http://localhost:5173`. The page
reloads whenever you save a file. To try it on your phone, put the phone on the
same wifi network and open the `Network` address the terminal shows.

## Project layout

| Path | What it holds |
|---|---|
| `index.html` | The interface: HUD, pack, dialogue and start screen |
| `src/styles.css` | Interface styles |
| `src/data.js` | Peoples, items, quests, enemies and the shop. **Start here to add content** |
| `src/core/` | Pure game rules, no DOM and no Three.js, unit tested in Node |
| `src/game.js` | The 3D runtime: world, characters, combat, input, saving |
| `src/main.js` | Entry point: fonts, styles, then the game |
| `tests/unit/` | Vitest suites for the rules and the content |
| `tests/e2e/` | Playwright suites that drive the real game in a browser |
| `electron/main.cjs` | The desktop window |
| `capacitor.config.json` | Android and iOS configuration |
| `.github/workflows/ci.yml` | Lint, unit tests and end-to-end tests |
| `.github/workflows/deploy.yml` | Publishes to GitHub Pages once CI passes |

The rules live in `src/core/` on purpose: they are plain functions over plain
data, so they can be tested in Node without a browser or a WebGL context.
ESLint enforces that separation — `src/core/` may not import `three` or touch
DOM globals.

## Testing

```bash
npm run verify
```

That is the whole gate: ESLint, then unit tests with coverage thresholds, then
the Playwright suite. Run it before every commit. The individual pieces:

| Command | What it runs |
|---|---|
| `npm run lint` | ESLint over the repository |
| `npm test` | Unit tests once |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:coverage` | Unit tests with coverage thresholds enforced |
| `npm run test:e2e` | Playwright, on a desktop viewport and a Pixel 7 |

Unit tests cover `src/core/` and `src/data.js`, including a history check that
fails when a playable people falls outside the year 950 or when player-facing
text uses a term from a list of known anachronisms. The Three.js runtime is
covered by the end-to-end suite instead.

The end-to-end suite renders real WebGL through SwiftShader, which is software
rendering: expect a few frames per second and a run of several minutes. Because
every Playwright action waits on frames, a test that races a timer in the game
will fail for reasons that have nothing to do with the game. If an end-to-end
test starts failing, check that first.

### Browsers on older macOS

Playwright ships no Chromium build for macOS 12 and older. On such a machine,
run the suite against an installed browser:

```bash
PW_CHANNEL=chrome npm run test:e2e
```

CI leaves `PW_CHANNEL` unset and uses the bundled Chromium.

## Publishing

### Web (GitHub Pages)

1. In your repository, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
2. Push to `main`. CI runs first, and `deploy.yml` publishes only if it passes.
3. The game lands at `https://YOUR_USER.github.io/reinos-de-hierro/`.

The `dist/` folder that `npm run build` produces also works on
[itch.io](https://itch.io) as an HTML game, on Netlify, or any static host.

### Android

Needs [Android Studio](https://developer.android.com/studio).

```bash
npx cap add android   # first time only
npm run android       # build, sync and open Android Studio
```

From Android Studio you can run on an emulator or device, and produce a signed
APK or AAB for Google Play under **Build → Generate Signed Bundle / APK**.

### iOS

Needs a Mac with Xcode, and an Apple Developer account to publish.

```bash
npx cap add ios   # first time only
npm run ios       # build, sync and open Xcode
```

### Desktop (Windows, macOS, Linux)

```bash
npm run desktop         # open the game in a desktop window
npm run desktop:build   # build an installer into release/
```

Each platform produces its own installer: `.exe` on Windows, `.dmg` on macOS,
`.AppImage` on Linux.

### Single-file build

```bash
npm run build:single
```

Produces `dist-single/index.html` with everything inlined. Useful for sharing,
or for uploading the game back to claude.ai as an artifact.

## Before publishing to app stores

- Change `appId` (`com.reinosdehierro.juego`) in `capacitor.config.json` and in
  `package.json` to one of your own, for example
  `com.yourname.reinosdehierro`. Google Play and the App Store will not let you
  change it after the first release.
- Add icons and splash screens. [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets)
  generates them for Android and iOS.

## Saved games

Progress is saved to local storage on each device or browser. Syncing with a
Claude account only works inside the claude.ai artifact; anywhere else the game
ignores it without error.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, and [CLAUDE.md](CLAUDE.md)
for the architecture and project rules.

## Technical note

Three.js is pinned to `0.128.0`, the version the game was built against. Newer
releases change how lighting is computed: if you upgrade, re-check the light
intensities in `src/game.js`.
