import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_STATE } from "./global-setup";

test.use({ storageState: STORAGE_STATE });

test.beforeEach(() => {
  test.skip(test.info().project.name !== "chromium-desktop", "runs once");
});

const serious = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));

test("editing the profile is reflected on the public landing", async ({ page }) => {
  const headline = `Data Engineer ${Date.now()}`;
  const linkLabel = `GitHub ${Date.now()}`;
  const stackName = `Postgres ${Date.now()}`;

  await page.goto("/app/perfil");
  await page.getByLabel("Nome de exibição").fill("Jean Carlos");
  await page.getByLabel("Headline").fill(headline);
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByText("Perfil salvo.")).toBeVisible();

  await page.getByRole("button", { name: "Adicionar link" }).click();
  await page.getByLabel("Rótulo").fill(linkLabel);
  await page.getByLabel("URL").fill("https://github.com/jeancarl0s21");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(linkLabel)).toBeVisible();

  await page.getByRole("button", { name: "Adicionar item" }).click();
  await page.getByLabel("Nome").fill(stackName);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(stackName)).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Jean Carlos", level: 1 })).toBeVisible();
  await expect(page.getByText(headline)).toBeVisible();
  await expect(page.getByRole("link", { name: linkLabel })).toBeVisible();
  await expect(page.getByText(stackName)).toBeVisible();
});

test("the Perfil screen has no serious a11y violations", async ({ page }) => {
  await page.goto("/app/perfil");
  await expect(page.getByLabel("Nome de exibição")).toBeVisible();
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
});
