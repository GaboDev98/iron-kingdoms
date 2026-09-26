import { test, expect } from '@playwright/test';

const SAVE_KEY = 'reinos-hierro-partida-v1';

// Fail any test that throws in the page.
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => { throw err; });
});

test('shows every playable people on the start screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.race')).toHaveCount(6);
  await expect(page.locator('#go')).toBeDisabled();
});

test('starts a new game and shows the HUD', async ({ page }) => {
  await page.goto('/');
  await page.locator('.race[data-r="vikingos"]').click();
  await page.locator('#go').click();
  await expect(page.locator('#start')).toBeHidden();
  await expect(page.locator('#who')).toContainText('Vikingos');
  await expect(page.locator('#qT')).toHaveText('Lobos en el bosque');
});

test('opens the inventory with the starting items', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.locator('.race[data-r="anglosajones"]').click();
  await page.locator('#go').click();
  await page.locator(isMobile ? '#bInv' : '#bInvDesk').click();
  await expect(page.locator('#inv')).toBeVisible();
  await expect(page.locator('#eqW')).toContainText('Lanza de fresno');
  await expect(page.locator('.slot[aria-label="Ungüento de hierbas"]')).toBeVisible();
});

// A saved game the replace tests start from.
const SAVED_VIKING = {
  v: 1, race: 'vikingos', hp: 100, maxHp: 120, str: 14, def: 4, level: 3, xp: 0, coins: 15, inv: [],
  eq: { weapon: 'hacha', armor: 'tunica' }, quest: { idx: 0, status: 'available', progress: 0 },
  pos: { x: 2, z: 10 }, bossLoot: false, t: 1,
};

async function openWithSavedGame(page, save) {
  await page.goto('/');
  await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [SAVE_KEY, save]);
  await page.reload();
}

// The replace flow is split across two tests on purpose. The armed state lapses
// after 5 s, and under software WebGL the page renders at roughly 2.5 FPS, so a
// single test that asserts the armed state between the two taps spends the whole
// window on those assertions and the second tap arrives after the reset.
test('one tap arms the replace button and keeps the saved game', async ({ page }) => {
  await openWithSavedGame(page, SAVED_VIKING);
  await expect(page.locator('#cont')).toContainText('Vikingos, nivel 3');
  await page.locator('.race[data-r="bizantinos"]').click();

  await page.locator('#go').click();
  await expect(page.locator('#go')).toContainText('Toca otra vez');
  await expect(page.locator('#start')).toBeVisible();
  await expect(page.locator('#who')).toBeEmpty();
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).race, SAVE_KEY)).toBe('vikingos');
});

// Guarded by the test above: that one proves the first tap alone never starts a
// game, so reaching Bizantinos here really did take the confirming second tap.
test('a second tap replaces the saved game', async ({ page }) => {
  await openWithSavedGame(page, SAVED_VIKING);
  await expect(page.locator('#cont')).toContainText('Vikingos, nivel 3');
  await page.locator('.race[data-r="bizantinos"]').click();

  // Nothing between the taps: every awaited step here costs several frames and
  // would eat into the 5 s window. The second tap is dispatched rather than
  // clicked for the same reason, and runs the same handler the real click above
  // already proved reachable.
  await page.locator('#go').click();
  await page.locator('#go').dispatchEvent('click');

  await expect(page.locator('#who')).toContainText('Bizantinos');
  await expect(page.locator('#start')).toBeHidden();
});

test('migrates a save from the old mixed-era version', async ({ page }) => {
  await openWithSavedGame(page, {
    v: 1, race: 'romanos', hp: 100, maxHp: 115, str: 11, def: 8, level: 2, xp: 0, coins: 40,
    inv: [{ id: 'francisca', q: 1 }], eq: { weapon: 'gladius', armor: 'scutum' },
    quest: { idx: 0, status: 'available', progress: 0 }, pos: { x: 2, z: 10 }, bossLoot: false, t: 1,
  });
  await expect(page.locator('#cont')).toContainText('Bizantinos');
  await page.locator('#cont').click();
  await expect(page.locator('#who')).toContainText('Bizantinos');
});

test('saves progress to localStorage', async ({ page }) => {
  await page.goto('/');
  await page.locator('.race[data-r="francos"]').click();
  await page.locator('#go').click();
  await expect.poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null')?.race, SAVE_KEY)).toBe('francos');
});
