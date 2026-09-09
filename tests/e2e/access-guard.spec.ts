import { test, expect } from "@playwright/test";

test("anonymous visit to /app redirects to login", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
});

test("anonymous visit to a nested private route redirects to login", async ({ page }) => {
  await page.goto("/app/projetos");
  await expect(page).toHaveURL(/\/login/);
});

test("anonymous visit to / serves the public Portfolio, not a login redirect", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
});
