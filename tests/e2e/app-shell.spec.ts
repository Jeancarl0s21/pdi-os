import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STORAGE_STATE } from "./global-setup";

test.use({ storageState: STORAGE_STATE });

// These assertions target the persistent desktop sidebar. The mobile drawer has
// its own spec (mobile-nav.spec.ts).
test.beforeEach(() => {
  test.skip(test.info().project.name !== "chromium-desktop", "desktop shell layout");
});

// Mirrors components/shell/nav-items.ts (UX-DEC-002, PT-BR slugs).
const NAV = [
  { href: "/app", heading: "Dashboard" },
  { href: "/app/planejamento", heading: "Planejamento" },
  { href: "/app/tarefas", heading: "Tasks" },
  { href: "/app/roadmap", heading: "Roadmap" },
  { href: "/app/estudos", heading: "Estudos" },
  { href: "/app/projetos", heading: "Projects" },
  { href: "/app/perfil", heading: "Perfil" },
];

test("authenticated shell renders with accessible navigation", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
});

test("every navigation destination resolves to its page", async ({ page }) => {
  for (const item of NAV) {
    const response = await page.goto(item.href);
    expect(response?.status(), `${item.href} status`).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: item.heading, level: 1 })).toBeVisible();
  }
});

test("navigation marks the active destination", async ({ page }) => {
  await page.goto("/app/roadmap");
  const activeLink = page.getByRole("link", { name: "Roadmap" });
  await expect(activeLink).toHaveAttribute("aria-current", "page");
});
