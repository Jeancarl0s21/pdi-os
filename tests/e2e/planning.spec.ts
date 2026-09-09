import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_STATE } from "./global-setup";

test.use({ storageState: STORAGE_STATE });

test.beforeEach(() => {
  test.skip(test.info().project.name !== "chromium-desktop", "runs once");
});

const serious = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));

const todayISO = new Date().toISOString().slice(0, 10);

async function createTask(
  page: import("@playwright/test").Page,
  title: string,
  opts: { due?: string; priority?: string } = {},
) {
  await page.getByRole("button", { name: "Nova Task" }).click();
  const drawer = page.getByRole("dialog", { name: "Nova Task" });
  await drawer.getByLabel("Título").fill(title);
  if (opts.priority) await drawer.getByLabel("Prioridade").selectOption(opts.priority);
  if (opts.due) await drawer.getByLabel("Prazo").fill(opts.due);
  await drawer.getByRole("button", { name: "Criar Task" }).click();
  await expect(drawer).toBeHidden();
}

test("dated task lands in the Hoje group under Esta semana", async ({ page }) => {
  await page.goto("/app/planejamento");
  const title = `Plan hoje ${Date.now()}`;

  await createTask(page, title, { due: todayISO });

  const hoje = page.getByRole("heading", { name: /Hoje/ });
  await expect(hoje).toBeVisible();
  await expect(page.getByRole("button", { name: new RegExp(title) })).toBeVisible();
});

test("Sem prazo cut isolates undated tasks", async ({ page }) => {
  await page.goto("/app/planejamento");
  const dated = `Plan dated ${Date.now()}`;
  const undated = `Plan undated ${Date.now()}`;

  await createTask(page, dated, { due: todayISO });
  await createTask(page, undated);

  await page.getByRole("button", { name: "Sem prazo" }).click();
  await expect(page.getByRole("button", { name: new RegExp(undated) })).toBeVisible();
  await expect(page.getByRole("button", { name: new RegExp(dated) })).toBeHidden();
});

test("Período personalizado asks for a range, then filters by it", async ({ page }) => {
  await page.goto("/app/planejamento");
  const title = `Plan custom ${Date.now()}`;
  await createTask(page, title, { due: todayISO });

  await page.getByRole("button", { name: "Período personalizado" }).click();
  await expect(page.getByText("Defina o período")).toBeVisible();

  await page.getByLabel("De").fill("2000-01-01");
  await page.getByLabel("Até").fill("2000-01-31");
  await expect(page.getByRole("button", { name: new RegExp(title) })).toBeHidden();

  await page.getByLabel("De").fill(todayISO);
  await page.getByLabel("Até").fill(todayISO);
  await expect(page.getByRole("button", { name: new RegExp(title) })).toBeVisible();
});

test("priority filter narrows the list", async ({ page }) => {
  await page.goto("/app/planejamento");
  const medium = `Plan medium ${Date.now()}`;
  await createTask(page, medium, { due: todayISO, priority: "medium" });

  await page.getByRole("button", { name: "Não concluídas" }).click();
  await expect(page.getByRole("button", { name: new RegExp(medium) })).toBeVisible();

  await page.getByLabel("Prioridade").selectOption("high");
  await expect(page.getByRole("button", { name: new RegExp(medium) })).toBeHidden();
});

test("a task opens the edit drawer from Planejamento", async ({ page }) => {
  await page.goto("/app/planejamento");
  const title = `Plan edit ${Date.now()}`;
  await createTask(page, title, { due: todayISO });

  await page.getByRole("button", { name: new RegExp(title) }).click();
  await expect(page.getByRole("dialog", { name: "Editar Task" })).toBeVisible();
});

test("Planejamento and the mobile filter sheet have no serious a11y violations", async ({
  page,
}) => {
  await page.goto("/app/planejamento");
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: /Filtros/ }).click();
  await expect(page.getByRole("dialog", { name: "Filtros" })).toBeVisible();
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
});
