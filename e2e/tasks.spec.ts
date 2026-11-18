import { expect, test } from "@playwright/test";

const steps = [
  "Write down who you want to see",
  "Pick a day and a time",
  "Open the calling app on your own phone",
  "Check the camera and the sound",
  "End the call when you are both ready",
];

test("an owner creates a checklist and still sees it after refresh", async ({ page, browser }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tasks");
  await expect(page.getByRole("heading", { name: "No checklist yet" })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/02-tasks-empty-390.png" });

  await page.goto("/tasks/new");
  await page.getByLabel("What should we call you?").fill("Nora Alvarez");
  await page.getByRole("button", { name: "Create checklist" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Set up a video call" })).toBeVisible();
  await expect(page.getByText("You are in control. Only you can mark a step done.")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/02-task-room-390.png" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: "docs/screenshots/02-task-room-1440.png" });
  await page.setViewportSize({ width: 390, height: 844 });

  for (const step of steps) {
    await page.getByRole("button", { name: `Mark done: ${step}` }).click();
  }
  await expect(page.getByText("5 of 5 steps done").first()).toBeVisible();
  await page.reload();
  await expect(page.getByText("5 of 5 steps done").first()).toBeVisible();
  await expect(page.getByText("Complete").first()).toBeVisible();

  const taskUrl = page.url();
  const stranger = await browser.newContext();
  const other = await stranger.newPage();
  await other.goto(taskUrl);
  await expect(other.getByRole("heading", { name: "This checklist is not available to you" })).toBeVisible();
  await stranger.close();

  await page.goto("/sample");
  await expect(page.getByText("Sample", { exact: true })).toBeVisible();
  await expect(page.getByText("Mira is not a real person")).toBeVisible();
  await expect(page.getByRole("button", { name: /Mark done/ })).toHaveCount(0);
  await page.screenshot({ path: "docs/screenshots/02-sample-390.png" });
  expect(errors).toEqual([]);
});

test("a custom checklist with no steps is rejected and a dropped network saves nothing", async ({ page }) => {
  await page.goto("/tasks/new");
  await page.getByLabel("What should we call you?").fill("Nora Alvarez");
  await page.getByRole("radio", { name: /A list you write/ }).check();
  await page.getByRole("button", { name: "Create checklist" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "at least one step" })).toBeVisible();

  await page.route("**/api/tasks", (route) => route.abort());
  await page.getByRole("textbox", { name: "Steps" }).fill("Look in the drawer");
  await page.getByRole("button", { name: "Create checklist" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "offline" })).toBeVisible();
  await page.goto("/tasks");
  await expect(page.getByRole("heading", { name: "No checklist yet" })).toBeVisible();
});
