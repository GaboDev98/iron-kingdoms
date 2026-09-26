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

test('asks for a second tap before replacing a saved game', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(([k]) => localStorage.setItem(k, JSON.stringify({
    v: 1, race: 'vikingos', hp: 100, maxHp: 120, str: 14, def: 4, level: 3, xp: 0, coins: 15, inv: [],
    eq: { weapon: 'hacha', armor: 'tunica' }, quest: { idx: 0, status: 'available', progress: 0 },
    pos: { x: 2, z: 10 }, bossLoot: false, t: 1,
  })), [SAVE_KEY]);
  await page.reload();
  await expect(page.locator('#cont')).toContainText('Vikingos, nivel 3');
  await page.locator('.race[data-r="bizantinos"]').click();
  await page.locator('#go').click();
  await expect(page.locator('#go')).toContainText('Toca otra vez');
  await expect(page.locator('#start')).toBeVisible();
  await page.locator('#go').click();
  await expect(page.locator('#who')).toContainText('Bizantinos');
});

test('migrates a save from the old mixed-era version', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(([k]) => localStorage.setItem(k, JSON.stringify({
    v: 1, race: 'romanos', hp: 100, maxHp: 115, str: 11, def: 8, level: 2, xp: 0, coins: 40,
    inv: [{ id: 'francisca', q: 1 }], eq: { weapon: 'gladius', armor: 'scutum' },
    quest: { idx: 0, status: 'available', progress: 0 }, pos: { x: 2, z: 10 }, bossLoot: false, t: 1,
  })), [SAVE_KEY]);
  await page.reload();
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
