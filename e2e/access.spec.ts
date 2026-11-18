import { expect, test } from "@playwright/test";

test("preferences save text size and Spanish, and the keyboard can reach them", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/settings");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

  await page.getByLabel("What should we call you?").fill("Nora Alvarez");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved on this server" })).toBeVisible();

  await page.getByRole("radio", { name: "Largest" }).check();
  await page.getByRole("radio", { name: "High contrast" }).check();
  await page.getByRole("radio", { name: "Español" }).check();
  await page.getByRole("checkbox", { name: "Shorter labels" }).check();
  await page.getByRole("button", { name: "Save preferences" }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.locator("html")).toHaveAttribute("data-scale", "1.5");
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
  await expect(page.getByRole("heading", { level: 1, name: "Ajustes" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ayuda" })).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/05-settings-es-390.png" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: "docs/screenshots/05-settings-es-1440.png" });

  await page.goto("/activity");
  await expect(page.getByRole("heading", { level: 1, name: "Actividad" })).toBeVisible();
});
