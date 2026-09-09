import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_STATE } from "./global-setup";

test.use({ storageState: STORAGE_STATE });

test.beforeEach(() => {
  test.skip(test.info().project.name !== "chromium-desktop", "runs once");
});

const serious = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));

test("quick task creates a row from just the title", async ({ page }) => {
  await page.goto("/app/tarefas");
  const title = `Quick ${Date.now()}`;

  await page.getByRole("textbox", { name: "Nova Task rápida" }).fill(title);
  await page.getByRole("button", { name: /Adicionar/ }).click();

  await expect(page.getByRole("button", { name: new RegExp(title) })).toBeVisible();
});

test("create, edit and complete a task through the drawer", async ({ page }) => {
  await page.goto("/app/tarefas");
  const title = `Full ${Date.now()}`;

  await page.getByRole("button", { name: "Nova Task" }).click();
  const create = page.getByRole("dialog", { name: "Nova Task" });
  await create.getByLabel("Título").fill(title);
  await create.getByLabel("Prioridade").selectOption("high");
  await create.getByLabel("Categoria").selectOption("study");
  const tags = create.getByLabel("Tags");
  await tags.fill("foco");
  await tags.press("Enter");
  await create.getByRole("button", { name: "Criar Task" }).click();

  const row = page.getByRole("button", { name: new RegExp(title) });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Alta");
  await expect(row).toContainText("foco");

  await row.click();
  const edit = page.getByRole("dialog", { name: "Editar Task" });
  await edit.getByLabel("Status").selectOption("done");
  await edit.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByRole("button", { name: new RegExp(title) })).toContainText("Concluída");
});

test("tasks page and open drawer have no serious a11y violations", async ({ page }) => {
  await page.goto("/app/tarefas");
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

  await page.getByRole("button", { name: "Nova Task" }).click();
  await expect(page.getByRole("dialog", { name: "Nova Task" })).toBeVisible();
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
});

test("dashboard shows the task summary", async ({ page }) => {
  await page.goto("/app");
  const summary = page.getByRole("region", { name: "Resumo de Tasks" });
  await expect(summary.getByText("Pendentes")).toBeVisible();
  await expect(summary.getByText("Atrasadas")).toBeVisible();
  await expect(summary.getByText("Concluídas")).toBeVisible();
});
