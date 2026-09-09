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
const MODULE2 = `Module Flow ${stamp}`;
const TOPIC_C = `Topic Flow ${stamp}`;
const CONTENT_C = `Content Flow ${stamp}`;
const ACTIVITY_C = `Activity Flow ${stamp}`;

let admin: SupabaseClient;
let userId: string;
const ids: Record<string, string> = {};

// eslint-disable-next-line no-empty-pattern -- Playwright requires the fixtures arg to be a destructuring pattern
test.beforeAll(async ({}, testInfo) => {
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

  // Topic B carries a completed Activity so the progress test can flip it to
  // `completed` — the enforce_topic_completion trigger requires one (RN-ROADMAP-012).
  await admin.from("activities").insert({
    user_id: userId,
    topic_id: ids.topicB,
    title: `${ACTIVITY} B`,
    instruction: "Exercício concluído.",
    completed_at: new Date().toISOString(),
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

  // A separate module + topic for the progress-flow test (start → complete).
  const mod2 = await admin
    .from("modules")
    .insert({
      user_id: userId,
      track_id: ids.track,
      slug: `module-flow-${stamp}`,
      title: MODULE2,
      position: 1,
    })
    .select("id")
    .single();
  ids.module2 = mod2.data!.id;

  const topicC = await admin
    .from("topics")
    .insert({
      user_id: userId,
      module_id: ids.module2,
      slug: `topic-flow-${stamp}`,
      title: TOPIC_C,
      status: "not_started",
      position: 0,
    })
    .select("id")
    .single();
  ids.topicC = topicC.data!.id;

  await admin.from("contents").insert({
    user_id: userId,
    topic_id: ids.topicC,
    title: CONTENT_C,
    didactic_payload: { explanation: "y" },
    position: 0,
  });
  await admin.from("activities").insert({
    user_id: userId,
    topic_id: ids.topicC,
    title: ACTIVITY_C,
    instruction: "Pratique.",
    position: 0,
  });
});

test.afterAll(async () => {
  if (!admin || !ids.track) return;
  // tracks→modules and modules→topics are ON DELETE RESTRICT, so go bottom-up;
  // contents/activities/materials cascade from topics. Covers rows created by
  // the edit test too (any module under this track).
  const mods = await admin.from("modules").select("id").eq("track_id", ids.track);
  const modIds = (mods.data ?? []).map((m) => m.id);
  if (modIds.length > 0) await admin.from("topics").delete().in("module_id", modIds);
  await admin.from("modules").delete().eq("track_id", ids.track);
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
  await page.goto(`/app/roadmap/${ids.module}`);
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-label",
    /0 de 2 topics concluídos/,
  );

  const update = await admin.from("topics").update({ status: "completed" }).eq("id", ids.topicB);
  expect(update.error).toBeNull();

  await page.goto(`/app/roadmap/${ids.module}`);
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-label",
    /1 de 2 topics concluídos/,
  );

  await admin.from("topics").update({ status: "not_started" }).eq("id", ids.topicB);
});

test("create, reorder, archive and restore Modules / Topics", async ({ page }) => {
  const modName = `Edit Mod ${stamp}`;
  const t1 = `Edit Topic 1 ${stamp}`;
  const t2 = `Edit Topic 2 ${stamp}`;

  await page.goto("/app/roadmap");
  await page.getByRole("button", { name: "Gerenciar" }).click();
  await page.getByRole("button", { name: "Novo Module" }).click();
  await page.getByLabel("Título").fill(modName);
  await page.getByRole("button", { name: "Salvar" }).click();

  const modLink = page.getByRole("link", { name: modName });
  await expect(modLink).toBeVisible();
  await modLink.click();

  await page.getByRole("button", { name: "Gerenciar" }).click();
  for (const name of [t1, t2]) {
    await page.getByRole("button", { name: "Novo Topic" }).click();
    await page.getByLabel("Título").fill(name);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("link", { name })).toBeVisible();
  }

  // Move Topic 1 down → Topic 2 becomes first (its "up" control turns disabled).
  await page.getByRole("button", { name: `Mover ${t1} para baixo` }).click();
  await expect(page.getByRole("button", { name: `Mover ${t2} para cima` })).toBeDisabled();

  // Archive Topic 1, then restore it from the archived screen.
  await page.getByRole("button", { name: `Arquivar ${t1}` }).click();
  await expect(page.getByRole("link", { name: t1 })).toBeHidden();

  await page.goto("/app/roadmap/arquivados");
  const restore = page.getByRole("button", { name: `Restaurar ${t1}` });
  await expect(restore).toBeVisible();
  await restore.click();
  await expect(restore).toBeHidden();
});

test("drive a Topic from not_started to completed and reopen it", async ({ page }) => {
  const topicUrl = `/app/roadmap/${ids.module2}/${ids.topicC}`;
  await page.goto(topicUrl);

  await expect(page.getByText("Não iniciado")).toBeVisible();
  await page.getByRole("button", { name: "Iniciar Topic" }).click();
  await expect(page.getByText("Estudando")).toBeVisible();

  // Content completion is independent of expansion and never completes the Topic.
  const contentCheckbox = page.getByRole("checkbox", { name: new RegExp(CONTENT_C) });
  await expect(contentCheckbox).toHaveAttribute("aria-checked", "false");
  await contentCheckbox.click();
  await expect(contentCheckbox).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Estudando")).toBeVisible();

  // "Concluir Topic" is gated until an Activity is complete (RN-ROADMAP-012).
  await expect(page.getByRole("button", { name: "Concluir Topic" })).toBeDisabled();
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reabrir" })).toBeVisible();

  await page.getByRole("button", { name: "Concluir Topic" }).click();
  await expect(page.getByText("Concluído")).toBeVisible();

  // Reopening the Activity drops the Topic back to studying (Foundation trigger).
  await page.getByRole("button", { name: "Reabrir" }).click();
  await expect(page.getByText("Estudando")).toBeVisible();
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
