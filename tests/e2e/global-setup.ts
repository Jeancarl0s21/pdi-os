import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Deterministic user for the authenticated shell specs. Provisioned through the
// GoTrue admin API (bypasses `enable_signup = false`), never a public signup.
export const E2E_USER = {
  email: "e2e@pdi-os.test",
  password: "e2e-local-password-001",
};

export const STORAGE_STATE = "tests/e2e/.auth/user.json";

async function ensureUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "global-setup requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (local Supabase).",
    );
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;

  const existing = data.users.find((user) => user.email === E2E_USER.email);
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: E2E_USER.password,
      email_confirm: true,
    });
    return;
  }

  const created = await admin.auth.admin.createUser({
    email: E2E_USER.email,
    password: E2E_USER.password,
    email_confirm: true,
  });
  if (created.error) throw created.error;
}

// Logs in once through the real UI so the Supabase auth cookies are captured,
// then reuses that session for the authenticated shell specs.
export default async function globalSetup(config: FullConfig) {
  await ensureUser();

  const { baseURL, channel } = config.projects[0].use;
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
