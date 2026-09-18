import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("visitor opens the live tournament and recovers from an offline state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Northern Circuit Invitational" })).toBeVisible();
  await expect(page.locator(".sync-state")).toContainText("Live · synced");

  await page.getByRole("button", { name: "Test offline" }).click();
  await expect(page.getByRole("status")).toContainText("Live connection lost");
  await expect(page.locator(".sync-state")).toContainText("Offline · snapshot");

  await page.getByRole("button", { name: "Reconnect" }).click();
  await expect(page.locator(".sync-state")).toContainText("Live · synced");
});

test("viewer cannot publish a result", async ({ page }) => {
  await page.goto("/organizer");
  await expect(page.getByRole("status")).toContainText("all changes are persisted");
  await page.getByLabel("Demo role").selectOption("viewer");
  await expect(page.getByRole("button", { name: /Publish result|Update result/ })).toBeDisabled();
  await expect(page.getByText("Viewer can inspect live state")).toBeVisible();
});

test("operator result reaches an already connected spectator", async ({ browser }) => {
  const context = await browser.newContext();
  const spectator = await context.newPage();
  const organizer = await context.newPage();

  await spectator.goto("/");
  await expect(spectator.locator(".sync-state")).toContainText("Live · synced");
  await organizer.goto("/organizer");
  await expect(organizer.getByRole("status")).toContainText("all changes are persisted");

  const awayScore = organizer.getByLabel("Northstar");
  const currentScore = Number(await awayScore.inputValue());
  const nextScore = currentScore >= 99 ? currentScore - 1 : currentScore + 1;
  await awayScore.fill(String(nextScore));
  await organizer.getByRole("button", { name: /Publish result|Update result/ }).click();

  await expect(organizer.getByRole("status")).toContainText("live clients updated");
  await expect(spectator.locator(".team-row").nth(1).locator(".score")).toHaveText(
    String(nextScore),
  );
  await expect(spectator.locator(".live-label")).toHaveText("Completed");
  await context.close();
});

test("stale operator draft rolls back to the last confirmed score", async ({ browser }) => {
  const staleContext = await browser.newContext();
  const currentContext = await browser.newContext();
  const staleOperator = await staleContext.newPage();
  const currentOperator = await currentContext.newPage();

  await staleOperator.goto("/organizer");
  await currentOperator.goto("/organizer");
  await expect(staleOperator.getByRole("status")).toContainText("all changes are persisted");
  await expect(currentOperator.getByRole("status")).toContainText("all changes are persisted");

  const staleScore = staleOperator.getByLabel("Northstar");
  const currentScore = currentOperator.getByLabel("Northstar");
  const confirmed = Number(await staleScore.inputValue());
  const winningScore = confirmed >= 998 ? confirmed - 1 : confirmed + 1;
  const staleDraft = confirmed >= 997 ? confirmed - 2 : confirmed + 2;

  await currentScore.fill(String(winningScore));
  await currentOperator.getByRole("button", { name: /Publish result|Update result/ }).click();
  await expect(currentOperator.getByRole("status")).toContainText("live clients updated");

  await staleScore.fill(String(staleDraft));
  await staleOperator.getByRole("button", { name: /Publish result|Update result/ }).click();
  await expect(staleOperator.getByRole("status")).toContainText("Newer result detected");
  await expect(staleScore).toHaveValue(String(confirmed));

  await staleContext.close();
  await currentContext.close();
});

test("event dialog traps focus, closes with Escape, and restores focus", async ({ page }) => {
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Follow event" });
  await opener.click();

  const dialog = page.getByRole("dialog", { name: "Follow Northern Circuit" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close demo dialog" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: /Open Arena Control/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("public and organizer pages have no serious accessibility violations", async ({ page }) => {
  for (const path of ["/", "/organizer"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(blocking).toEqual([]);
  }
});
