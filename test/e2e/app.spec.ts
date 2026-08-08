import { expect, test } from "@playwright/test";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

test("switches across ChatGPT, web-link and text modes", async ({ page }) => {
  const requests: unknown[] = [];
  await page.route("**/api/render", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "image/png", body: png });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "分享图片生成器" })).toBeVisible();

  // ChatGPT mode shows only the conversation style.
  await expect(page.locator("#style")).toHaveValue("conversation-clean");

  // Web-link mode shows the article themes.
  await page.getByRole("radio", { name: "网页链接" }).check();
  await expect(page.locator("#style")).toHaveValue("article-clean");
  await expect(page.locator("#style option")).toHaveText(["简约白", "苹果风", "深色", "杂志风", "社交卡片"]);

  // Text mode also shows article themes and counts code points.
  await page.getByRole("radio", { name: "输入文字" }).check();
  await page.getByLabel("分享文字（支持 Markdown）").fill("😀一段文字");
  await expect(page.locator("#text-count")).toContainText("5 / 2000");
  await page.getByRole("button", { name: "生成图片" }).click();

  await expect(page.getByRole("img", { name: "生成的分享图片预览" })).toBeVisible();
  expect(requests).toContainEqual({ source: "plain-text", text: "😀一段文字", style: "article-clean" });
});
