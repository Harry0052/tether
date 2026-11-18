import { expect, test } from "@playwright/test";

test("a helper suggestion waits for the owner and stays in the record", async ({ page, browser }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tasks/new");
  await page.getByLabel("What should we call you?").fill("Nora Alvarez");
  await page.getByRole("button", { name: "Create checklist" }).click();
  await page.getByRole("button", { name: "Create an invitation link" }).click();
  const inviteUrl = await page.getByLabel("Copy this link now").inputValue();

  const helper = await browser.newContext();
  const other = await helper.newPage();
  await other.setViewportSize({ width: 1440, height: 900 });
  await other.goto(inviteUrl);
  await other.getByLabel("What should we call you?").fill("Alex Rivera");
  await other.getByRole("button", { name: "Accept and open the checklist" }).click();
  await other.getByLabel("Note, optional").first().fill("password: hunter2");
  await other.getByRole("button", { name: "Suggest this is done: Write down who you want to see" }).click();
  await expect(other.getByText("Waiting for the owner.")).toBeVisible();

  await page.reload();
  const waiting = page.getByRole("heading", { name: "Waiting for you" });
  await expect(waiting).toBeVisible();
  await waiting.scrollIntoViewIfNeeded();
  await expect(page.getByText("password: hunter2")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/04-approval-390.png" });
  await page.getByRole("button", { name: "Approve: Write down who you want to see" }).click();
  await expect(page.getByText("1 of 5 steps done").first()).toBeVisible();
  await expect(page.getByText("Suggestion approved").first()).toBeVisible();
  await expect(page.getByText("hunter2")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("1 of 5 steps done").first()).toBeVisible();
  await expect(page.getByText("Suggestion approved").first()).toBeVisible();

  await other.reload();
  await other.getByRole("button", { name: "Suggest this is done: Pick a day and a time" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Reject: Pick a day and a time" }).click();
  await expect(page.getByText("Suggestion rejected").first()).toBeVisible();
  await expect(page.getByText("1 of 5 steps done").first()).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  const record = page.getByRole("heading", { name: "Record" });
  await record.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "docs/screenshots/04-record-1440.png" });
  await helper.close();
});
