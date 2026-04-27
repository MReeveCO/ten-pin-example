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

test('clicking a knocked pin before DONE does not restore it', async ({ page }) => {
  await pin(page, 1).click();
  await pin(page, 1).click();
  await expect(pin(page, 1)).toHaveClass(/knocked/);
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

test('DONE on ball 1 shows STRIKE when all 10 pins are knocked down', async ({ page }) => {
  for (let i = 1; i <= 10; i++) {
    await pin(page, i).click();
  }
  await doneButton(page).click();
  await expect(scoreArea(page)).toHaveText('Round complete: STRIKE! All 10 pins knocked down!');
});

test('STRIKE hides the DONE button', async ({ page }) => {
  for (let i = 1; i <= 10; i++) {
    await pin(page, i).click();
  }
  await doneButton(page).click();
  await expect(doneButton(page)).toBeHidden();
});

test('DONE on ball 2 shows SPARE when all 10 pins are knocked down', async ({ page }) => {
  await pin(page, 1).click();
  await doneButton(page).click();
  for (let i = 2; i <= 10; i++) {
    await pin(page, i).click();
  }
  await doneButton(page).click();
  await expect(scoreArea(page)).toHaveText('Round complete: SPARE! All 10 pins knocked down!');
});

test('DONE button shows correct message when no pins are knocked down', async ({ page }) => {
  await doneButton(page).click();
  await expect(scoreArea(page)).toHaveText('No pins knocked down.');
});

test('score after second DONE includes gone pins from first DONE', async ({ page }) => {
  await pin(page, 1).click();
  await pin(page, 2).click();
  await doneButton(page).click();
  await pin(page, 3).click();
  await doneButton(page).click();
  await expect(scoreArea(page)).toHaveText('Round complete: 3 pins knocked down.');
});

test('second DONE hides the DONE button', async ({ page }) => {
  await doneButton(page).click();
  await doneButton(page).click();
  await expect(doneButton(page)).toBeHidden();
});

test('first DONE does not show Round complete prefix', async ({ page }) => {
  await pin(page, 1).click();
  await doneButton(page).click();
  await expect(scoreArea(page)).toHaveText('1 pin knocked down.');
});

test('after DONE, a knocked pin becomes gone', async ({ page }) => {
  await pin(page, 1).click();
  await doneButton(page).click();
  await expect(pin(page, 1)).toHaveClass(/gone/);
  await expect(pin(page, 1)).not.toHaveClass(/knocked/);
});

test('after DONE, a gone pin cannot be interacted with', async ({ page }) => {
  await pin(page, 1).click();
  await doneButton(page).click();
  await pin(page, 1).click();
  await expect(pin(page, 1)).toHaveClass(/gone/);
});

test('after DONE, a standing pin can be knocked down and restored', async ({ page }) => {
  await doneButton(page).click();
  await pin(page, 1).click();
  await expect(pin(page, 1)).toHaveClass(/knocked/);
  await pin(page, 1).click();
  await expect(pin(page, 1)).not.toHaveClass(/knocked/);
});

test('reset button clears all knocked and gone pins', async ({ page }) => {
  await pin(page, 1).click();
  await pin(page, 2).click();
  await doneButton(page).click();
  await pin(page, 3).click();
  await resetButton(page).click();
  await expect(page.locator('.pin.knocked')).toHaveCount(0);
  await expect(page.locator('.pin.gone')).toHaveCount(0);
});
