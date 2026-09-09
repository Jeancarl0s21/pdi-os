import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_STATE } from "./global-setup";

test.use({ storageState: STORAGE_STATE });

test.beforeEach(() => {
  test.skip(test.info().project.name !== "chromium-desktop", "runs once");
});

const serious = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));

const EDITOR_URL = /\/app\/projetos\/[0-9a-f-]{36}$/;

async function createProject(page: Page, name: string, tech: string) {
  await page.goto("/app/projetos");
  await page.getByRole("link", { name: "Novo Project" }).click();
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Descrição curta").fill("Resumo do project.");
  await page.getByLabel("Status de execução").selectOption("in_progress");
  const techs = page.getByLabel("Tecnologias");
  await techs.fill(tech);
  await techs.press("Enter");
  await page.getByRole("button", { name: "Criar Project" }).click();
  await page.waitForURL(EDITOR_URL);
}

test("create a project and land on its editor", async ({ page }) => {
  const name = `Proj ${Date.now()}`;
  await createProject(page, name, "Postgres");

  await expect(page.getByLabel("Nome")).toHaveValue(name);
  await expect(page.getByLabel("Status de execução")).toHaveValue("in_progress");
});

test("edit a project's fields and technologies", async ({ page }) => {
  const name = `Proj edit ${Date.now()}`;
  await createProject(page, name, "dbt");

  await page.getByLabel("Nome").fill(`${name} v2`);
  await page.getByLabel("Status de execução").selectOption("completed");
  const techs = page.getByLabel("Tecnologias");
  await techs.fill("Airflow");
  await techs.press("Enter");
  await page.getByRole("button", { name: "Salvar" }).click();

  await page.reload();
  await expect(page.getByLabel("Nome")).toHaveValue(`${name} v2`);
  await expect(page.getByLabel("Status de execução")).toHaveValue("completed");
  await expect(page.getByText("Airflow")).toBeVisible();
});

test("archive then restore a project via the editor", async ({ page }) => {
  const name = `Proj archive ${Date.now()}`;
  await createProject(page, name, "Spark");

  await page.getByRole("button", { name: "Arquivar" }).click();
  await expect(page.getByRole("button", { name: "Restaurar" })).toBeVisible();

  await page.goto("/app/projetos");
  await expect(page.getByRole("link", { name: new RegExp(name) })).toBeHidden();

  await page.getByRole("link", { name: "Arquivado", exact: true }).click();
  const card = page.getByRole("link", { name: new RegExp(name) });
  await expect(card).toBeVisible();

  await card.click();
  await page.getByRole("button", { name: "Restaurar" }).click();
  await expect(page.getByLabel("Status de execução")).toHaveValue("planned");
});

test("status filter navigates and filters the list", async ({ page }) => {
  await createProject(page, `Proj filter ${Date.now()}`, "Kafka");

  await page.goto("/app/projetos?status=planned");
  await expect(page).toHaveURL(/status=planned/);
  await expect(page.getByRole("link", { name: "Planejado", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("projects list and editor have no serious a11y violations", async ({ page }) => {
  await createProject(page, `Proj a11y ${Date.now()}`, "Trino");

  const editorViolations = serious((await new AxeBuilder({ page }).analyze()).violations);
  expect(editorViolations).toEqual([]);

  await page.goto("/app/projetos");
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

  await page.goto("/app/projetos/novo");
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
});
