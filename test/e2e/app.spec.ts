import { expect, test } from "@playwright/test";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

test("switches between ChatGPT and text card modes", async ({ page }) => {
  let requestBody: unknown;
  await page.route("**/api/render", async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "image/png", body: png });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "分享图片生成器" })).toBeVisible();
  await expect(page.getByLabel("分享链接")).toBeVisible();
  await expect(page.getByLabel("图片风格")).toHaveValue("conversation-clean");

  await page.getByLabel("输入文字").check();
  await expect(page.getByLabel("分享文字")).toBeVisible();
  await expect(page.getByLabel("图片风格")).toHaveValue("text-card");

  await page.getByLabel("分享文字").fill("😀一段用于分享的文字");
  await expect(page.locator("#text-count")).toContainText("10 / 2000");
  await page.getByRole("button", { name: "生成图片" }).click();

  await expect(page.getByRole("img", { name: "生成的分享图片预览" })).toBeVisible();
  await expect(page.getByRole("link", { name: "保存图片" })).toHaveAttribute("href", /^blob:/);
  expect(requestBody).toEqual({ source: "plain-text", text: "😀一段用于分享的文字", style: "text-card" });
});
