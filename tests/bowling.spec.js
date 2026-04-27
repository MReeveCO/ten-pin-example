import { test, expect } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pageUrl = `file://${join(__dirname, "..", "index.html")}`;

const pin = (page, number) => page.locator(`[data-pin="${number}"]`);
const doneButton = (page) => page.locator("#done-btn");
const nextPlayerButton = (page) => page.locator("#next-player-btn");
const resetButton = (page) => page.locator("#reset-btn");
const scoreArea = (page) => page.locator("#score-area");
const playerInfo = (page) => page.locator("#current-player-info");
const playerCountBtn = (page, n) => page.locator(`[data-count="${n}"]`);
const ballScore = (page, p, r, b) => page.locator(`#ball-${p}-${r}-${b}`);
const roundTotal = (page, p, r) => page.locator(`#total-${p}-${r}`);

// All game tests start with 1 player selected
test.beforeEach(async ({ page }) => {
	await page.goto(pageUrl);
	await playerCountBtn(page, 1).click();
});

// ── Setup screen ──────────────────────────────────────────────────────────────

test("setup screen shows player count buttons 1 to 4", async ({ page }) => {
	await page.goto(pageUrl); // fresh load before player selection
	for (let i = 1; i <= 4; i++) {
		await expect(playerCountBtn(page, i)).toBeVisible();
	}
});

test("selecting player count hides setup and shows the game", async ({
	page,
}) => {
	await page.goto(pageUrl);
	await expect(page.locator("#setup")).toBeVisible();
	await playerCountBtn(page, 1).click();
	await expect(page.locator("#setup")).toBeHidden();
	await expect(page.locator("#game")).toBeVisible();
});

// ── Player info ───────────────────────────────────────────────────────────────

test("player info shows Player 1 Round 1 Ball 1 on start", async ({ page }) => {
	await expect(playerInfo(page)).toHaveText("Player 1 — Round 1, Ball 1");
});

test("player info updates to Ball 2 after first DONE", async ({ page }) => {
	await pin(page, 1).click();
	await doneButton(page).click();
	await expect(playerInfo(page)).toHaveText("Player 1 — Round 1, Ball 2");
});

// ── Pin behaviour ─────────────────────────────────────────────────────────────

test("shows all 10 pins on load", async ({ page }) => {
	await expect(page.locator(".pin")).toHaveCount(10);
});

test("pins start standing", async ({ page }) => {
	await expect(page.locator(".pin.knocked")).toHaveCount(0);
});

test("clicking a pin knocks it down", async ({ page }) => {
	await pin(page, 1).click();
	await expect(pin(page, 1)).toHaveClass(/knocked/);
});

test("clicking a knocked pin before DONE does not restore it", async ({
	page,
}) => {
	await pin(page, 1).click();
	await pin(page, 1).click();
	await expect(pin(page, 1)).toHaveClass(/knocked/);
});

test("after DONE, a knocked pin becomes gone", async ({ page }) => {
	await pin(page, 1).click();
	await doneButton(page).click();
	await expect(pin(page, 1)).toHaveClass(/gone/);
	await expect(pin(page, 1)).not.toHaveClass(/knocked/);
});

test("after DONE, a gone pin cannot be interacted with", async ({ page }) => {
	await pin(page, 1).click();
	await doneButton(page).click();
	await pin(page, 1).click();
	await expect(pin(page, 1)).toHaveClass(/gone/);
});

test("after DONE, a standing pin can be knocked down and restored", async ({
	page,
}) => {
	await doneButton(page).click();
	await pin(page, 1).click();
	await expect(pin(page, 1)).toHaveClass(/knocked/);
	await pin(page, 1).click();
	await expect(pin(page, 1)).not.toHaveClass(/knocked/);
});

// ── Scoring messages ──────────────────────────────────────────────────────────

test("DONE button shows correct count for a single pin", async ({ page }) => {
	await pin(page, 5).click();
	await doneButton(page).click();
	await expect(scoreArea(page)).toHaveText("1 pin knocked down.");
});

test("DONE button shows correct count for multiple pins", async ({ page }) => {
	await pin(page, 1).click();
	await pin(page, 3).click();
	await pin(page, 7).click();
	await doneButton(page).click();
	await expect(scoreArea(page)).toHaveText("3 pins knocked down.");
});

test("DONE button shows correct message when no pins are knocked down", async ({
	page,
}) => {
	await doneButton(page).click();
	await expect(scoreArea(page)).toHaveText("No pins knocked down.");
});

test("DONE on ball 1 shows STRIKE when all 10 pins are knocked down", async ({
	page,
}) => {
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(scoreArea(page)).toHaveText(
		"Round complete: STRIKE! All 10 pins knocked down!",
	);
});

test("DONE on ball 2 shows SPARE when all 10 pins are knocked down", async ({
	page,
}) => {
	await pin(page, 1).click();
	await doneButton(page).click();
	for (let i = 2; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(scoreArea(page)).toHaveText(
		"Round complete: SPARE! All 10 pins knocked down!",
	);
});

test("first DONE does not show Round complete prefix", async ({ page }) => {
	await pin(page, 1).click();
	await doneButton(page).click();
	await expect(scoreArea(page)).toHaveText("1 pin knocked down.");
});

test("score after second DONE includes gone pins from first DONE", async ({
	page,
}) => {
	await pin(page, 1).click();
	await pin(page, 2).click();
	await doneButton(page).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	await expect(scoreArea(page)).toHaveText(
		"Round complete: 3 pins knocked down.",
	);
});

// ── Round complete / Next player ──────────────────────────────────────────────

test("pins cannot be clicked when Next player button is showing", async ({
	page,
}) => {
	await doneButton(page).click();
	await doneButton(page).click();
	await pin(page, 1).click();
	await expect(pin(page, 1)).not.toHaveClass(/knocked/);
});

test("second DONE hides the DONE button and shows Next player", async ({
	page,
}) => {
	await doneButton(page).click();
	await doneButton(page).click();
	await expect(doneButton(page)).toBeHidden();
	await expect(nextPlayerButton(page)).toBeVisible();
});

test("STRIKE hides the DONE button and shows Next player", async ({ page }) => {
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(doneButton(page)).toBeHidden();
	await expect(nextPlayerButton(page)).toBeVisible();
});

test("Next player button resets pins and advances to Round 2", async ({
	page,
}) => {
	await pin(page, 1).click();
	await doneButton(page).click();
	await doneButton(page).click();
	await nextPlayerButton(page).click();
	await expect(page.locator(".pin.knocked")).toHaveCount(0);
	await expect(page.locator(".pin.gone")).toHaveCount(0);
	await expect(playerInfo(page)).toHaveText("Player 1 — Round 2, Ball 1");
});

test("with 2 players Next player advances to Player 2 before Round 2", async ({
	page,
}) => {
	await page.goto(pageUrl);
	await playerCountBtn(page, 2).click();
	await doneButton(page).click();
	await doneButton(page).click();
	await nextPlayerButton(page).click();
	await expect(playerInfo(page)).toHaveText("Player 2 — Round 1, Ball 1");
});

test("with 2 players after both finish Round 1, advances to Round 2 Player 1", async ({
	page,
}) => {
	await page.goto(pageUrl);
	await playerCountBtn(page, 2).click();
	// Player 1, Round 1
	await doneButton(page).click();
	await doneButton(page).click();
	await nextPlayerButton(page).click();
	// Player 2, Round 1
	await doneButton(page).click();
	await doneButton(page).click();
	await nextPlayerButton(page).click();
	await expect(playerInfo(page)).toHaveText("Player 1 — Round 2, Ball 1");
});

// ── Scoreboard ────────────────────────────────────────────────────────────────

test("scoreboard shows ball score for ball 1 after DONE", async ({ page }) => {
	await pin(page, 1).click();
	await pin(page, 2).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	await expect(ballScore(page, 0, 0, 0)).toHaveText("3");
});

test("scoreboard shows ball score for ball 2 after second DONE", async ({
	page,
}) => {
	await doneButton(page).click();
	await pin(page, 1).click();
	await pin(page, 2).click();
	await doneButton(page).click();
	await expect(ballScore(page, 0, 0, 1)).toHaveText("2");
});

test("scoreboard shows cumulative round total after round is complete", async ({
	page,
}) => {
	await pin(page, 1).click();
	await pin(page, 2).click();
	await doneButton(page).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	await expect(roundTotal(page, 0, 0)).toHaveText("3");
});

test("strike score is hidden until next 2 balls are bowled", async ({
	page,
}) => {
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(roundTotal(page, 0, 0)).toHaveText("");
	await nextPlayerButton(page).click();
	// Ball 1 of round 2 only — still waiting on second bonus ball
	await pin(page, 1).click();
	await pin(page, 2).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	await expect(roundTotal(page, 0, 0)).toHaveText("");
});

test("strike score is 10 plus next 2 balls once they are bowled", async ({
	page,
}) => {
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await nextPlayerButton(page).click();
	// Bowl 3 + 5 across two balls in round 2
	await pin(page, 1).click();
	await pin(page, 2).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	for (let i = 4; i <= 8; i++) await pin(page, i).click();
	await doneButton(page).click();
	// Strike score = 10 + 3 + 5 = 18; round 2 = 8; cumulative round 1 = 18, round 2 = 26
	await expect(roundTotal(page, 0, 0)).toHaveText("18");
	await expect(roundTotal(page, 0, 1)).toHaveText("26");
});

test("strike followed by strike: round 1 score is still hidden after the second strike", async ({
	page,
}) => {
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await nextPlayerButton(page).click();
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(roundTotal(page, 0, 0)).toHaveText("");
});

test("strike, strike, 3+3 scores 23 / 39 / 45", async ({ page }) => {
	// Round 1: strike
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await nextPlayerButton(page).click();
	// Round 2: strike
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await nextPlayerButton(page).click();
	// Round 3: 3 + 3
	await pin(page, 1).click();
	await pin(page, 2).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	await pin(page, 4).click();
	await pin(page, 5).click();
	await pin(page, 6).click();
	await doneButton(page).click();
	await expect(roundTotal(page, 0, 0)).toHaveText("23");
	await expect(roundTotal(page, 0, 1)).toHaveText("39");
	await expect(roundTotal(page, 0, 2)).toHaveText("45");
});

test("spare score is hidden until the next ball is bowled", async ({
	page,
}) => {
	await pin(page, 1).click();
	await pin(page, 2).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	for (let i = 4; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(roundTotal(page, 0, 0)).toHaveText("");
});

test("spare score is 10 plus next ball once it is bowled", async ({ page }) => {
	await pin(page, 1).click();
	await pin(page, 2).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	for (let i = 4; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await nextPlayerButton(page).click();
	// Bowl 4 pins as first ball of round 2
	for (let i = 1; i <= 4; i++) await pin(page, i).click();
	await doneButton(page).click();
	// Spare score = 10 + 4 = 14
	await expect(roundTotal(page, 0, 0)).toHaveText("14");
});

test("scoreboard shows X spanning both boxes for a strike", async ({
	page,
}) => {
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(ballScore(page, 0, 0, 0)).toHaveText("X");
	await expect(ballScore(page, 0, 0, 1)).toBeHidden();
});

test("scoreboard shows / in second box for a spare", async ({ page }) => {
	await pin(page, 1).click();
	await pin(page, 2).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	for (let i = 4; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(ballScore(page, 0, 0, 0)).toHaveText("3");
	await expect(ballScore(page, 0, 0, 1)).toHaveText("/");
});

test("scoreboard round 10 has three ball score slots", async ({ page }) => {
	// round index 9 = round 10
	await expect(page.locator("#ball-0-9-0")).toBeAttached();
	await expect(page.locator("#ball-0-9-1")).toBeAttached();
	await expect(page.locator("#ball-0-9-2")).toBeAttached();
});

// ── Round 10 ──────────────────────────────────────────────────────────────────

async function advanceToRound10(page) {
	for (let r = 0; r < 9; r++) {
		await doneButton(page).click();
		await doneButton(page).click();
		await nextPlayerButton(page).click();
	}
}

test("round 10 with no strike or spare: game over after ball 2", async ({
	page,
}) => {
	await advanceToRound10(page);
	await expect(playerInfo(page)).toHaveText("Player 1 — Round 10, Ball 1");
	await doneButton(page).click();
	await expect(doneButton(page)).toBeVisible();
	await doneButton(page).click();
	await expect(doneButton(page)).toBeHidden();
	await expect(page.locator("#score-area")).toContainText("Game over");
});

test("round 10 strike: ball 1 does not end the round", async ({ page }) => {
	await advanceToRound10(page);
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(doneButton(page)).toBeVisible();
	await expect(playerInfo(page)).toHaveText("Player 1 — Round 10, Ball 2");
});

test("round 10 strike: all pins reset for ball 2", async ({ page }) => {
	await advanceToRound10(page);
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(page.locator(".pin.gone")).toHaveCount(0);
	await expect(page.locator(".pin.knocked")).toHaveCount(0);
});

test("round 10 strike: ball 3 ends the round", async ({ page }) => {
	await advanceToRound10(page);
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await doneButton(page).click();
	await doneButton(page).click();
	await expect(doneButton(page)).toBeHidden();
});

test("round 10 spare: ball 2 does not end the round", async ({ page }) => {
	await advanceToRound10(page);
	await pin(page, 1).click();
	await pin(page, 2).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	for (let i = 4; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(doneButton(page)).toBeVisible();
	await expect(playerInfo(page)).toHaveText("Player 1 — Round 10, Ball 3");
});

test("round 10 spare: pins reset for ball 3", async ({ page }) => {
	await advanceToRound10(page);
	await pin(page, 1).click();
	await doneButton(page).click();
	for (let i = 2; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(page.locator(".pin.gone")).toHaveCount(0);
	await expect(page.locator(".pin.knocked")).toHaveCount(0);
});

test("round 10 spare: ball 3 ends the round", async ({ page }) => {
	await advanceToRound10(page);
	await pin(page, 1).click();
	await doneButton(page).click();
	for (let i = 2; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await doneButton(page).click();
	await expect(doneButton(page)).toBeHidden();
});

test("round 10 strike score: 10 + ball 2 + ball 3", async ({ page }) => {
	await advanceToRound10(page);
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await pin(page, 1).click();
	await pin(page, 2).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	for (let i = 4; i <= 8; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(roundTotal(page, 0, 9)).toHaveText("18");
});

test("round 10 spare score: 10 + ball 3", async ({ page }) => {
	await advanceToRound10(page);
	await pin(page, 1).click();
	await pin(page, 2).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	for (let i = 4; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await pin(page, 1).click();
	await pin(page, 2).click();
	await pin(page, 3).click();
	await pin(page, 4).click();
	await doneButton(page).click();
	await expect(roundTotal(page, 0, 9)).toHaveText("14");
});

test("round 10 score is hidden until ball 3 is bowled after a spare", async ({
	page,
}) => {
	await advanceToRound10(page);
	await pin(page, 1).click();
	await doneButton(page).click();
	for (let i = 2; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	await expect(roundTotal(page, 0, 9)).toHaveText("");
});

// ── Undo ──────────────────────────────────────────────────────────────────────

test("undo button is hidden on start", async ({ page }) => {
	await expect(page.locator("#undo-btn")).toBeHidden();
});

test("undo button appears after DONE", async ({ page }) => {
	await doneButton(page).click();
	await expect(page.locator("#undo-btn")).toBeVisible();
});

test("undo after ball 1 restores knocked pins to standing", async ({
	page,
}) => {
	await pin(page, 1).click();
	await pin(page, 2).click();
	await doneButton(page).click();
	await page.locator("#undo-btn").click();
	await expect(pin(page, 1)).not.toHaveClass(/knocked/);
	await expect(pin(page, 1)).not.toHaveClass(/gone/);
	await expect(pin(page, 2)).not.toHaveClass(/knocked/);
	await expect(pin(page, 2)).not.toHaveClass(/gone/);
});

test("undo after ball 1 restores player info to ball 1", async ({ page }) => {
	await doneButton(page).click();
	await page.locator("#undo-btn").click();
	await expect(playerInfo(page)).toHaveText("Player 1 — Round 1, Ball 1");
});

test("undo button hides itself after undoing the only DONE", async ({
	page,
}) => {
	await doneButton(page).click();
	await page.locator("#undo-btn").click();
	await expect(page.locator("#undo-btn")).toBeHidden();
});

test("undo after round complete hides Next player and shows DONE", async ({
	page,
}) => {
	await doneButton(page).click();
	await doneButton(page).click();
	await page.locator("#undo-btn").click();
	await expect(nextPlayerButton(page)).toBeHidden();
	await expect(doneButton(page)).toBeVisible();
	await expect(playerInfo(page)).toHaveText("Player 1 — Round 1, Ball 2");
});

test("undo after round complete leaves ball 1 gone pins intact and restores ball 2 pins to standing", async ({
	page,
}) => {
	await pin(page, 1).click();
	await doneButton(page).click();
	await pin(page, 2).click();
	await doneButton(page).click();
	await page.locator("#undo-btn").click();
	await expect(pin(page, 1)).toHaveClass(/gone/);
	await expect(pin(page, 2)).not.toHaveClass(/knocked/);
	await expect(pin(page, 2)).not.toHaveClass(/gone/);
});

test("undo clears the ball score from the scoreboard", async ({ page }) => {
	await pin(page, 1).click();
	await pin(page, 2).click();
	await pin(page, 3).click();
	await doneButton(page).click();
	await page.locator("#undo-btn").click();
	await expect(ballScore(page, 0, 0, 0)).toHaveText("");
});

test("undo clears the round total from the scoreboard", async ({ page }) => {
	await pin(page, 1).click();
	await doneButton(page).click();
	await pin(page, 2).click();
	await doneButton(page).click();
	await page.locator("#undo-btn").click();
	await expect(roundTotal(page, 0, 0)).toHaveText("");
});

test("undo button is hidden after Next player is clicked", async ({ page }) => {
	await doneButton(page).click();
	await doneButton(page).click();
	await nextPlayerButton(page).click();
	await expect(page.locator("#undo-btn")).toBeHidden();
});

// ── Reset ─────────────────────────────────────────────────────────────────────

test("reset button returns to setup screen", async ({ page }) => {
	await pin(page, 1).click();
	await resetButton(page).click();
	await expect(page.locator("#setup")).toBeVisible();
	await expect(page.locator("#game")).toBeHidden();
});

test("after reset and restarting, pins are all standing", async ({ page }) => {
	await pin(page, 1).click();
	await pin(page, 2).click();
	await doneButton(page).click();
	await resetButton(page).click();
	await playerCountBtn(page, 1).click();
	await expect(page.locator(".pin.knocked")).toHaveCount(0);
	await expect(page.locator(".pin.gone")).toHaveCount(0);
});

test("max score is 300", async ({ page }) => {
	for (let r = 0; r < 9; r++) {
		for (let i = 1; i <= 10; i++) await pin(page, i).click();
		await doneButton(page).click();
		await nextPlayerButton(page).click();
	}

	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
	for (let i = 1; i <= 10; i++) await pin(page, i).click();
	await doneButton(page).click();
  for (let i = 1; i <= 10; i++) await pin(page, i).click();
  await doneButton(page).click();
  await expect(roundTotal(page, 0, 9)).toHaveText("300");
});
