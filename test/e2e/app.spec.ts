import { expect, test } from "@playwright/test";

test("renders the local application heading", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "聊天长截图" })).toBeVisible();
});
