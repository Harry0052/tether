import { expect, test } from "@playwright/test";

test("an owner can invite a helper and revoke that access immediately", async ({ page, browser }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tasks/new");
  await page.getByLabel("What should we call you?").fill("Nora Alvarez");
  await page.getByRole("button", { name: "Create checklist" }).click();
  await page.getByLabel("Access lasts").selectOption("1");
  await page.getByRole("button", { name: "Create an invitation link" }).click();
  const link = page.getByLabel("Copy this link now");
  await expect(link).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/03-invite-390.png" });
  const inviteUrl = await link.inputValue();

  const helper = await browser.newContext();
  const other = await helper.newPage();
  await other.setViewportSize({ width: 390, height: 844 });
  await other.goto(inviteUrl);
  await expect(other.getByRole("heading", { name: "Review this invitation" })).toBeVisible();
  await expect(other.getByText("Nora Alvarez")).toBeVisible();
  await expect(other.getByText("Suggest only")).toBeVisible();
  await other.screenshot({ path: "docs/screenshots/03-invite-review-390.png" });
  await other.getByLabel("What should we call you?").fill("Alex Rivera");
  await other.getByRole("button", { name: "Accept and open the checklist" }).click();
  await expect(other.getByText("You can only suggest.")).toBeVisible();
  await expect(other.getByText("You can suggest", { exact: true })).toBeVisible();
  await expect(other.getByRole("button", { name: /Mark done/ })).toHaveCount(0);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/people");
  await expect(page.getByRole("heading", { name: "Alex Rivera" })).toBeVisible();
  await page.getByRole("checkbox", { name: /loses access immediately/ }).check();
  await page.getByRole("button", { name: "Remove access" }).click();
  await expect(page.getByRole("status")).toContainText("Access removed");
  await page.screenshot({ path: "docs/screenshots/03-people-1440.png" });

  await other.reload();
  await expect(other.getByRole("heading", { name: "This checklist is not available to you" })).toBeVisible();
  await expect(other.locator("body")).not.toContainText("Set up a video call");

  await other.goto("/invite/not-a-token");
  await expect(other.getByRole("heading", { name: "This invitation link is not valid." })).toBeVisible();
  await expect(other.locator("body")).not.toContainText("Nora Alvarez");
  await expect(other.locator("body")).not.toContainText("Set up a video call");
  await helper.close();
  expect(errors).toEqual([]);
});
