import { expect, test } from "@playwright/test";

test("a visitor can save a name and see it after refresh", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Stay in charge while someone you trust helps." })).toBeVisible();
  await expect(page.getByText("You are in control of anything you create here.")).toBeVisible();
  await expect(page.getByText("It does not send email. Nothing on this screen pretends otherwise.")).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/01-home-390.png" });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: "docs/screenshots/01-home-1440.png" });

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  await page.getByLabel("What should we call you?").fill("Nora Alvarez");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("status")).toHaveText(/Saved on this server/);
  await page.screenshot({ path: "docs/screenshots/01-settings-390.png" });

  await page.reload();
  await expect(page.getByLabel("What should we call you?")).toHaveValue("Nora Alvarez");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByText("Nora Alvarez").first()).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole("banner").getByText("Nora Alvarez")).toBeVisible();

  await page.goto("/missing-page");
  await expect(page.getByRole("heading", { name: "That page is not in Tether" })).toBeVisible();
  expect(errors).toEqual([]);
});
