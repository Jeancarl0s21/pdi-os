import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_STATE } from "./global-setup";

test.use({ storageState: STORAGE_STATE });

test.beforeEach(() => {
  test.skip(test.info().project.name !== "chromium-desktop", "runs once");
});

const serious = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));

function cardInColumn(page: Page, column: string, title: string) {
  return page
    .getByRole("region", { name: column })
    .getByRole("button", { name: new RegExp(title) });
}

async function createTask(page: Page, title: string, opts: { priority?: string } = {}) {
  await page.getByRole("button", { name: "Nova Task" }).click();
  const drawer = page.getByRole("dialog", { name: "Nova Task" });
  await drawer.getByLabel("Título").fill(title);
  if (opts.priority) await drawer.getByLabel("Prioridade").selectOption(opts.priority);
  await drawer.getByRole("button", { name: "Criar Task" }).click();
  await expect(drawer).toBeHidden();
}

test("quick task lands in the Backlog column", async ({ page }) => {
  await page.goto("/app/tarefas");
  const title = `Kb quick ${Date.now()}`;

  await page.getByRole("textbox", { name: "Nova Task rápida" }).fill(title);
  await page.getByRole("button", { name: /Adicionar/ }).click();

  await expect(cardInColumn(page, "Backlog", title)).toBeVisible();
});

test("a card moves between columns with the arrows", async ({ page }) => {
  await page.goto("/app/tarefas");
  const title = `Kb move ${Date.now()}`;
  await createTask(page, title);

  const backlogCard = cardInColumn(page, "Backlog", title);
  await backlogCard
    .locator("xpath=ancestor::li[1]")
    .getByRole("button", { name: "Mover para Em andamento" })
    .click();
  await expect(cardInColumn(page, "Em andamento", title)).toBeVisible();

  await cardInColumn(page, "Em andamento", title)
    .locator("xpath=ancestor::li[1]")
    .getByRole("button", { name: "Mover para Backlog" })
    .click();
  await expect(cardInColumn(page, "Backlog", title)).toBeVisible();
});

test("archive removes a card and it can be restored", async ({ page }) => {
  await page.goto("/app/tarefas");
  const title = `Kb archive ${Date.now()}`;
  await createTask(page, title);

  await cardInColumn(page, "Backlog", title)
    .locator("xpath=ancestor::li[1]")
    .getByRole("button", { name: "Arquivar" })
    .click();
  await expect(page.getByRole("button", { name: new RegExp(title) })).toBeHidden();

  await page.goto("/app/tarefas/arquivadas");
  const archivedRow = page.locator("li").filter({ hasText: title });
  await expect(archivedRow).toBeVisible();
  await archivedRow.getByRole("button", { name: "Restaurar" }).click();
  await expect(archivedRow).toBeHidden();

  await page.goto("/app/tarefas");
  await expect(cardInColumn(page, "Backlog", title)).toBeVisible();
});

test("a card opens the edit drawer", async ({ page }) => {
  await page.goto("/app/tarefas");
  const title = `Kb edit ${Date.now()}`;
  await createTask(page, title);

  await cardInColumn(page, "Backlog", title).click();
  await expect(page.getByRole("dialog", { name: "Editar Task" })).toBeVisible();
});

test("priority filter narrows the cards", async ({ page }) => {
  await page.goto("/app/tarefas");
  const title = `Kb filter ${Date.now()}`;
  await createTask(page, title, { priority: "medium" });

  await expect(cardInColumn(page, "Backlog", title)).toBeVisible();
  await page.getByLabel("Prioridade").selectOption("high");
  await expect(page.getByRole("button", { name: new RegExp(title) })).toBeHidden();
});

test("Kanban, drawer and archived list have no serious a11y violations", async ({ page }) => {
  await page.goto("/app/tarefas");
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

  await page.getByRole("button", { name: "Nova Task" }).click();
  await expect(page.getByRole("dialog", { name: "Nova Task" })).toBeVisible();
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
  await page.keyboard.press("Escape");

  await page.goto("/app/tarefas/arquivadas");
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
});

test("dashboard shows the task summary", async ({ page }) => {
  await page.goto("/app");
  const summary = page.getByRole("region", { name: "Resumo de Tasks" });
  await expect(summary.getByText("Pendentes")).toBeVisible();
  await expect(summary.getByText("Atrasadas")).toBeVisible();
  await expect(summary.getByText("Concluídas")).toBeVisible();
});
