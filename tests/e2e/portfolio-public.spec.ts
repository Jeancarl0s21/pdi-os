import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_STATE } from "./global-setup";

const serious = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));

const EDITOR_URL = /\/app\/projetos\/[0-9a-f-]{36}$/;

async function createProject(page: Page, name: string) {
  await page.goto("/app/projetos");
  await page.getByRole("link", { name: "Novo Project" }).click();
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Descrição curta").fill("Resumo público do project.");
  await page.getByLabel("Status de execução").selectOption("completed");
  const techs = page.getByLabel("Tecnologias");
  await techs.fill("Postgres");
  await techs.press("Enter");
  await page.getByRole("button", { name: "Criar Project" }).click();
  await page.waitForURL(EDITOR_URL);
}

async function publishProject(page: Page) {
  await page.getByLabel("Descrição completa").fill("Descrição completa exibida no modal público.");
  await page.getByRole("button", { name: "Salvar" }).click();
  await page.locator('input[type="file"]').setInputFiles("tests/e2e/fixtures/cover.png");
  await expect(page.getByRole("img", { name: "Capa do Project" })).toBeVisible();
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("Publicado")).toBeVisible();
}

test.describe("public Portfolio", () => {
  const published = `Public Proj ${Date.now()}`;
  const draft = `Draft Proj ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: STORAGE_STATE });
    const page = await context.newPage();

    await page.goto("/app/perfil");
    await page.getByLabel("Nome de exibição").fill("Jean Carlos");
    await page.getByLabel("Headline").fill("Data / Backend");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo.")).toBeVisible();

    await createProject(page, published);
    await publishProject(page);
    await createProject(page, draft);

    await context.close();
  });

  test("anonymous visitor sees published projects but never a draft", async ({ browser }) => {
    const context = await browser.newContext(); // no storageState -> anonymous
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Jean Carlos", level: 1 })).toBeVisible();

    const card = page.getByRole("button", { name: new RegExp(published) });
    await expect(card).toBeVisible();
    await expect(page.getByText(draft)).toHaveCount(0);

    await card.click();
    const modal = page.getByRole("dialog", { name: published });
    await expect(modal.getByText("Descrição completa exibida no modal público.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();

    await context.close();
  });

  test("landing and project modal have no serious a11y violations", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

    await page.getByRole("button", { name: new RegExp(published) }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

    await context.close();
  });
});
