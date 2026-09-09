import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_STATE } from "./global-setup";

// Mobile layout is a CSS-breakpoint concern; a narrow viewport in the desktop
// project exercises it while keeping the shared auth session (branded-Chrome
// mobile contexts drop storageState). BKL-REL-01.
test.use({ storageState: STORAGE_STATE, viewport: { width: 390, height: 844 } });

test.beforeEach(() => {
  test.skip(test.info().project.name !== "chromium-desktop", "runs once, narrow viewport");
});

const serious = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));

async function noHorizontalScroll(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page must not scroll horizontally (RNF-RESP-004)").toBeLessThanOrEqual(1);
}

const PRIVATE_SCREENS = [
  "/app",
  "/app/planejamento",
  "/app/tarefas",
  "/app/tarefas/arquivadas",
  "/app/roadmap",
  "/app/estudos",
  "/app/projetos",
  "/app/perfil",
];

for (const path of PRIVATE_SCREENS) {
  test(`${path} on a narrow viewport: renders, no serious a11y, no h-scroll`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await noHorizontalScroll(page);
    expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
  });
}

test("the public landing on a narrow viewport is clean", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const anon = await context.newPage();
  await anon.goto("/");
  await noHorizontalScroll(anon);
  expect(serious((await new AxeBuilder({ page: anon }).analyze()).violations)).toEqual([]);
  await context.close();
});

test("an unknown route renders the 404 page", async ({ page }) => {
  await page.goto("/app/rota-que-nao-existe");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
});
