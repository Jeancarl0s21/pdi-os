import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const authRoutes = ["/login", "/forgot-password", "/reset-password"];

for (const route of authRoutes) {
  test(`${route} renders without serious accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact ?? ""),
      ),
    ).toEqual([]);
  });
}

test("login form exposes labelled email and password fields", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Senha", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});
