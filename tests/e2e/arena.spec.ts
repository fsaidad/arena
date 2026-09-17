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
  await expect(page.getByRole("button", { name: "Publish result" })).toBeDisabled();
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
  await organizer.getByRole("button", { name: "Publish result" }).click();

  await expect(organizer.getByRole("status")).toContainText("live clients updated");
  await expect(spectator.locator(".team-row").nth(1).locator(".score")).toHaveText(
    String(nextScore),
  );
  await context.close();
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
