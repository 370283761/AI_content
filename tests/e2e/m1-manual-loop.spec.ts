import { expect, test } from "@playwright/test";

test("人工创作闭环：项目到生产工作台", async ({ page }) => {
  await page.goto("/projects/new");
  await page.getByLabel("项目名称").fill(`M1 E2E ${Date.now()}`);
  await page.getByLabel("故事创意").fill("一名失去记忆的少女在婚礼前夜发现自己的身份被替换。");
  await page.getByRole("button", { name: "创建并进入项目设定" }).click();
  await expect(page).toHaveURL(/\/projects\/[^/]+\/setup/);

  await page.getByLabel("一句话故事").fill("少女在婚礼前夜夺回身份与人生。 ");
  await page.getByRole("button", { name: "角色与关系" }).click();
  await page.getByLabel("姓名").fill("林晚");
  await page.getByLabel("身份").fill("被替换身份的真正继承人");
  await page.getByRole("button", { name: "创建角色" }).click();
  await expect(page.getByText("林晚 · 年龄待定")).toBeVisible();

  await page.getByRole("link", { name: "下一步：剧集规划" }).click();
  await page.getByLabel("标题").fill("婚礼前夜");
  await page.getByLabel("核心冲突").fill("林晚必须在婚礼开始前证明身份");
  await page.getByRole("button", { name: "创建分集" }).click();
  await page.getByRole("link", { name: "编辑剧本" }).click();

  await page.getByPlaceholder("新场景标题").fill("后台化妆间");
  await page.getByRole("button", { name: "新增场景" }).click();
  await page.getByLabel("画面描述").fill("林晚在镜中看见被撕掉一角的出生证明。 ");
  await page.getByRole("link", { name: "下一步：分镜编辑" }).click();
  await page.getByRole("button", { name: "新增镜头" }).click();
  await page.getByLabel("人物动作").fill("林晚拾起出生证明，猛然抬头看向镜子。 ");
  await page.getByRole("link", { name: "下一步：生产工作台" }).click();

  await expect(page.getByText("人工数据模式")).toBeVisible();
  await expect(page.getByText("即梦交接（M2/M3）")).toBeVisible();
});
