import { chromium, type FullConfig } from "@playwright/test";

// Credentials for the deterministic user inserted by supabase/seed.sql (local/CI only).
export const E2E_USER = {
  email: "e2e@pdi-os.test",
  password: "e2e-local-password-001",
};

export const STORAGE_STATE = "tests/e2e/.auth/user.json";

// Logs in once through the real UI so the Supabase auth cookies are captured, then
// reuses that session for the authenticated shell specs.
export default async function globalSetup(config: FullConfig) {
  const { baseURL, channel } = config.projects[0].use;
  // Match the project channel: CI uses system Chrome (no bundled browser download).
  const browser = await chromium.launch({ channel });
  const page = await browser.newPage({ baseURL });

  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(E2E_USER.email);
  await page.getByLabel("Senha", { exact: true }).fill(E2E_USER.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/app");

  await page.context().storageState({ path: STORAGE_STATE });
  await browser.close();
}
