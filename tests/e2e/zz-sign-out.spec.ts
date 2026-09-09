import { test, expect } from "@playwright/test";
import { STORAGE_STATE } from "./global-setup";

// Sign-out ends the shared session, so this file is named to sort last and is
// pinned to a single project — nothing authenticated runs after it.
test.use({ storageState: STORAGE_STATE });

test.beforeEach(() => {
  test.skip(test.info().project.name !== "chromium-desktop", "runs once, terminates the session");
});

test("sign out from the user menu returns to login", async ({ page }) => {
  await page.goto("/app");
  await page
    .getByRole("button", { name: /pdi-os\.test/ })
    .first()
    .click();
  await page.getByRole("menuitem", { name: "Sair" }).click();

  await expect(page).toHaveURL(/\/login/);

  // The private area is no longer reachable with this browser session.
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login/);
});
