import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_STATE } from "./global-setup";

test.use({ storageState: STORAGE_STATE });

test.beforeEach(() => {
  test.skip(test.info().project.name !== "chromium-mobile", "mobile drawer layout");
});

test("mobile drawer opens, exposes destinations, closes on Escape", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Abrir navegação" }).click();
  const drawer = page.getByRole("dialog", { name: "Navegação" });
  await expect(drawer.getByRole("link", { name: "Planejamento" })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
});

test("mobile drawer navigates and then closes", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await page
    .getByRole("dialog", { name: "Navegação" })
    .getByRole("link", { name: "Roadmap" })
    .click();

  await expect(page).toHaveURL(/\/app\/roadmap$/);
  await expect(page.getByRole("heading", { name: "Roadmap", level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Navegação" })).toBeHidden();
});
