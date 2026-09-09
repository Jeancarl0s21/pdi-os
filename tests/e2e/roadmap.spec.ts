import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { E2E_USER, STORAGE_STATE } from "./global-setup";

test.use({ storageState: STORAGE_STATE });

const serious = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""));

const stamp = Date.now();
const TRACK = `Track E2E ${stamp}`;
const MODULE = `Module E2E ${stamp}`;
const TOPIC_A = `Topic A ${stamp}`;
const TOPIC_B = `Topic B ${stamp}`;
const CONTENT = `Content E2E ${stamp}`;
const ACTIVITY = `Activity E2E ${stamp}`;
const MATERIAL = `Material E2E ${stamp}`;

let admin: SupabaseClient;
let userId: string;
const ids: Record<string, string> = {};

test.beforeAll(async (_fixtures, testInfo) => {
  if (testInfo.project.name !== "chromium-desktop") return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const list = await admin.auth.admin.listUsers();
  userId = list.data.users.find((u) => u.email === E2E_USER.email)!.id;

  const track = await admin
    .from("tracks")
    .insert({ user_id: userId, slug: `track-e2e-${stamp}`, title: TRACK, source_order: 999 })
    .select("id")
    .single();
  ids.track = track.data!.id;

  const mod = await admin
    .from("modules")
    .insert({
      user_id: userId,
      track_id: ids.track,
      slug: `module-e2e-${stamp}`,
      title: MODULE,
      description: "Módulo de teste e2e.",
      position: 0,
    })
    .select("id")
    .single();
  ids.module = mod.data!.id;

  const topics = await admin
    .from("topics")
    .insert([
      {
        user_id: userId,
        module_id: ids.module,
        slug: `topic-a-${stamp}`,
        title: TOPIC_A,
        description: "Descrição do topic A.",
        status: "studying",
        recommended_level: "Fundamentos",
        position: 0,
      },
      {
        user_id: userId,
        module_id: ids.module,
        slug: `topic-b-${stamp}`,
        title: TOPIC_B,
        status: "not_started",
        position: 1,
      },
    ])
    .select("id,slug");
  ids.topicA = topics.data!.find((t) => t.slug === `topic-a-${stamp}`)!.id;
  ids.topicB = topics.data!.find((t) => t.slug === `topic-b-${stamp}`)!.id;

  await admin.from("contents").insert({
    user_id: userId,
    topic_id: ids.topicA,
    title: CONTENT,
    didactic_payload: {
      explanation: "Explicação didática do conteúdo.",
      key_points: ["Ponto um", "Ponto dois"],
      example: { type: "scenario", context: "ctx", content: "corpo do exemplo" },
      when_to_use: "Quando modelar um fluxo.",
      pitfalls: "Não decore rótulos.",
    },
    position: 0,
  });

  await admin.from("activities").insert({
    user_id: userId,
    topic_id: ids.topicA,
    title: ACTIVITY,
    instruction: "Desenhe um fluxo ponta a ponta.",
    external_environment: "Notebook/Markdown",
    external_url: "https://example.com/exercicio",
    position: 0,
  });

  await admin.from("materials").insert({
    user_id: userId,
    topic_id: ids.topicA,
    title: MATERIAL,
    type: "primary_reference",
    source: "Docs",
    url: "https://example.com/doc",
    position: 0,
  });
});

test.afterAll(async () => {
  if (!admin || !ids.track) return;
  // FKs cascade from topics; tracks/modules use ON DELETE RESTRICT, so go bottom-up.
  await admin.from("topics").delete().eq("module_id", ids.module);
  await admin.from("modules").delete().eq("id", ids.module);
  await admin.from("tracks").delete().eq("id", ids.track);
});

test.beforeEach(() => {
  test.skip(test.info().project.name !== "chromium-desktop", "runs once");
});

test("navigate Track overview → Module → Topic and read the Topic", async ({ page }) => {
  await page.goto("/app/roadmap");
  const moduleLink = page.getByRole("link", { name: new RegExp(MODULE) });
  await expect(moduleLink).toBeVisible();

  await moduleLink.click();
  await expect(page.getByRole("heading", { name: MODULE })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(TOPIC_A) })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(TOPIC_B) })).toBeVisible();

  await page.getByRole("link", { name: new RegExp(TOPIC_A) }).click();
  await expect(page.getByRole("heading", { name: TOPIC_A })).toBeVisible();
  await expect(page.getByText("Estudando")).toBeVisible();

  // Content is collapsed until opened; expanding does not change status.
  const contentToggle = page.getByRole("button", { name: new RegExp(CONTENT) });
  await expect(contentToggle).toHaveAttribute("aria-expanded", "false");
  await contentToggle.click();
  await expect(page.getByText("Explicação didática do conteúdo.")).toBeVisible();
  await expect(page.getByText("Ponto um")).toBeVisible();

  await expect(page.getByRole("link", { name: "Abrir ambiente" })).toHaveAttribute(
    "href",
    "https://example.com/exercicio",
  );
  await expect(page.getByRole("link", { name: new RegExp(MATERIAL) })).toHaveAttribute(
    "href",
    "https://example.com/doc",
  );
});

test("module progress reflects completed active topics", async ({ page }) => {
  await admin.from("topics").update({ status: "completed" }).eq("id", ids.topicB);
  await page.goto(`/app/roadmap/${ids.module}`);
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-label",
    /1 de 2 topics concluídos/,
  );
  await admin.from("topics").update({ status: "not_started" }).eq("id", ids.topicB);
});

test("the roadmap screens have no serious a11y violations", async ({ page }) => {
  await page.goto("/app/roadmap");
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

  await page.goto(`/app/roadmap/${ids.module}`);
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);

  await page.goto(`/app/roadmap/${ids.module}/${ids.topicA}`);
  await page.getByRole("button", { name: new RegExp(CONTENT) }).click();
  expect(serious((await new AxeBuilder({ page }).analyze()).violations)).toEqual([]);
});
