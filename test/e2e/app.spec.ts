import { expect, test } from "@playwright/test";

test("renders the local application and render form", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "聊天长截图" })).toBeVisible();
  await expect(page.getByLabel("分享链接")).toBeVisible();
  await expect(page.getByRole("button", { name: "生成长图" })).toBeVisible();
});
