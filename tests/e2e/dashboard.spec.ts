import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_STATE } from "./global-setup";

test.use({ storageState: STORAGE_STATE });

test.beforeEach(() => {
  test.skip(test.info().project.name !== "chromium-desktop", "runs once");
});

const serious = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));

test("quick task from the dashboard, then complete it from the pending card", async ({ page }) => {
  const title = `DashTask-${Date.now()}`;

  await page.goto("/app");
  const pending = page.locator("section", {
    has: page.getByRole("heading", { name: "Tasks pendentes" }),
  });
  const activity = page.locator("section", {
    has: page.getByRole("heading", { name: "Atividade recente" }),
  });
  await expect(page.getByRole("region", { name: "Resumo de Tasks" })).toBeVisible();

  await page.getByLabel("Nova Task rápida").fill(title);
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(pending.getByText(title, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Concluir ${title}` }).click();
  await expect(pending.getByText(title, { exact: true })).toBeHidden();
  await expect(activity.getByText(`Task concluída · ${title}`)).toBeVisible();
});

test("dashboard quick actions link out to the specialised screens", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("link", { name: "Registrar estudo" })).toHaveAttribute(
    "href",
    "/app/estudos?novo=1",
  );
});

test("the Dashboard has no serious a11y violations", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
});
