import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pageUrl = `file://${join(__dirname, '..', 'index.html')}`;

const pin = (page, number) => page.locator(`[data-pin="${number}"]`);
const doneButton = (page) => page.locator('#done-btn');
const resetButton = (page) => page.locator('#reset-btn');
const scoreArea = (page) => page.locator('#score-area');

test.beforeEach(async ({ page }) => {
  await page.goto(pageUrl);
});

test('shows all 10 pins on load', async ({ page }) => {
  await expect(page.locator('.pin')).toHaveCount(10);
});

test('pins start standing', async ({ page }) => {
  await expect(page.locator('.pin.knocked')).toHaveCount(0);
});

test('clicking a pin knocks it down', async ({ page }) => {
  await pin(page, 1).click();
  await expect(pin(page, 1)).toHaveClass(/knocked/);
});

test('clicking a knocked pin stands it back up', async ({ page }) => {
  await pin(page, 1).click();
  await pin(page, 1).click();
  await expect(pin(page, 1)).not.toHaveClass(/knocked/);
});

test('DONE button shows correct count for a single pin', async ({ page }) => {
  await pin(page, 5).click();
  await doneButton(page).click();
  await expect(scoreArea(page)).toHaveText('1 pin knocked down.');
});

test('DONE button shows correct count for multiple pins', async ({ page }) => {
  await pin(page, 1).click();
  await pin(page, 3).click();
  await pin(page, 7).click();
  await doneButton(page).click();
  await expect(scoreArea(page)).toHaveText('3 pins knocked down.');
});

test('DONE button shows strike message when all 10 pins are knocked down', async ({ page }) => {
  for (let i = 1; i <= 10; i++) {
    await pin(page, i).click();
  }
  await doneButton(page).click();
  await expect(scoreArea(page)).toHaveText('STRIKE! All 10 pins knocked down!');
});

test('DONE button shows correct message when no pins are knocked down', async ({ page }) => {
  await doneButton(page).click();
  await expect(scoreArea(page)).toHaveText('No pins knocked down.');
});

test('reset button clears all knocked pins', async ({ page }) => {
  await pin(page, 1).click();
  await pin(page, 2).click();
  await resetButton(page).click();
  await expect(page.locator('.pin.knocked')).toHaveCount(0);
});
