import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { E2E_USER, STORAGE_STATE } from "./global-setup";

test.use({ storageState: STORAGE_STATE });

const serious = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));

const stamp = Date.now();
const TOPIC = `RoadmapTopic-${stamp}`;

let admin: SupabaseClient;
let userId: string;
const ids: Record<string, string> = {};

const dialog = (page: Page) => page.getByRole("dialog");

// eslint-disable-next-line no-empty-pattern -- Playwright requires a destructuring pattern
test.beforeAll(async ({}, testInfo) => {
  if (testInfo.project.name !== "chromium-desktop") return;

  admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const list = await admin.auth.admin.listUsers();
  userId = list.data.users.find((u) => u.email === E2E_USER.email)!.id;

  const track = await admin
    .from("tracks")
    .insert({ user_id: userId, slug: `estudo-trk-${stamp}`, title: `Estudo Track ${stamp}` })
    .select("id")
    .single();
  ids.track = track.data!.id;
  const mod = await admin
    .from("modules")
    .insert({
      user_id: userId,
      track_id: ids.track,
      slug: `estudo-mod-${stamp}`,
      title: `Estudo Mod ${stamp}`,
      position: 0,
    })
    .select("id")
    .single();
  ids.module = mod.data!.id;
  const topic = await admin
    .from("topics")
    .insert({
      user_id: userId,
      module_id: ids.module,
      slug: `estudo-top-${stamp}`,
      title: TOPIC,
      position: 0,
    })
    .select("id")
    .single();
  ids.topic = topic.data!.id;
});

test.afterAll(async () => {
  if (!admin || !ids.track) return;
  await admin.from("study_sessions").delete().eq("user_id", userId);
  await admin.from("topics").delete().eq("module_id", ids.module);
  await admin.from("modules").delete().eq("track_id", ids.track);
  await admin.from("tracks").delete().eq("id", ids.track);
});

test.beforeEach(() => {
  test.skip(test.info().project.name !== "chromium-desktop", "runs once");
});

test("register, edit, filter by date and delete a StudySession", async ({ page }) => {
  const recent = `Recente ${stamp}`;
  const old = `Antigo ${stamp}`;
  const sessions = page.getByRole("listitem").filter({ hasText: String(stamp) });

  await page.goto("/app/estudos");

  await page.getByRole("button", { name: "Registrar estudo" }).click();
  await dialog(page).getByLabel("Assunto").fill(recent);
  await dialog(page).getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(recent)).toBeVisible();

  await page.getByRole("button", { name: "Registrar estudo" }).click();
  await dialog(page).getByLabel("Data").fill("2026-01-05");
  await dialog(page).getByLabel("Assunto").fill(old);
  await dialog(page).getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(old)).toBeVisible();

  // Most recent first (DEC-040).
  await expect(sessions.first()).toContainText(recent);

  // Date filter drops the older one.
  await page.getByLabel("De", { exact: true }).fill("2026-06-01");
  await expect(page.getByText(old)).toBeHidden();
  await expect(page.getByText(recent)).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();

  await page.getByRole("button", { name: `Editar ${recent}` }).click();
  await dialog(page).getByLabel("Assunto").fill(`${recent} v2`);
  await dialog(page).getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(`${recent} v2`)).toBeVisible();

  await page.getByRole("button", { name: `Excluir ${recent} v2` }).click();
  await dialog(page).getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByText(`${recent} v2`)).toBeHidden();
});

test("Registrar estudo from a Topic prefills the Topic, then Sem Topic hides it", async ({
  page,
}) => {
  const title = `SessaoDoTopic-${stamp}`;
  const inList = page.getByRole("listitem").filter({ hasText: title });

  await page.goto(`/app/roadmap/${ids.module}/${ids.topic}`);
  await page.getByRole("link", { name: "Registrar estudo deste Topic" }).click();
  await expect(page).toHaveURL(/\/app\/estudos/);

  await expect(dialog(page).getByLabel("Topic")).toHaveValue(ids.topic);
  await dialog(page).getByLabel("Assunto").fill(title);
  await dialog(page).getByRole("button", { name: "Salvar" }).click();
  await expect(inList).toHaveCount(1);

  await page.getByLabel("Sem Topic").check();
  await expect(inList).toHaveCount(0);
});

test("the Estudos screen has no serious a11y violations", async ({ page }) => {
  await page.goto("/app/estudos");
  await expect(page.getByRole("button", { name: "Registrar estudo" })).toBeVisible();
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
});
