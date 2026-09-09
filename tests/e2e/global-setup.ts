import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Deterministic user for the authenticated shell specs. Provisioned through the
// GoTrue admin API (bypasses `enable_signup = false`), never a public signup.
export const E2E_USER = {
  email: "e2e@pdi-os.test",
  password: "e2e-local-password-001",
};

export const STORAGE_STATE = "tests/e2e/.auth/user.json";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`global-setup requires ${name} (local Supabase).`);
  return value;
}

async function provisionUser() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const admin = createClient(url, env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const list = await admin.auth.admin.listUsers();
  if (list.error) throw new Error(`listUsers failed: ${list.error.message}`);

  const existing = list.data.users.find((user) => user.email === E2E_USER.email);
  const result = existing
    ? await admin.auth.admin.updateUserById(existing.id, {
        password: E2E_USER.password,
        email_confirm: true,
      })
    : await admin.auth.admin.createUser({
        email: E2E_USER.email,
        password: E2E_USER.password,
        email_confirm: true,
      });
  if (result.error) throw new Error(`provision user failed: ${result.error.message}`);

  // Fail loudly with the real GoTrue error instead of the app's masked redirect.
  const anon = createClient(url, env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await anon.auth.signInWithPassword({
    email: E2E_USER.email,
    password: E2E_USER.password,
  });
  if (signIn.error) {
    throw new Error(
      `password sign-in check failed: ${signIn.error.message} (status ${signIn.error.status})`,
    );
  }
}

// Logs in once through the real UI so the Supabase auth cookies are captured,
// then reuses that session for the authenticated shell specs.
export default async function globalSetup(config: FullConfig) {
  await provisionUser();

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
