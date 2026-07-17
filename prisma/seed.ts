import { CharacterRole, PrismaClient, SourceKind } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { slug: process.env.DEFAULT_WORKSPACE_SLUG ?? "local" },
    update: {},
    create: { slug: process.env.DEFAULT_WORKSPACE_SLUG ?? "local", name: "本地工作区" },
  });

  const user = await prisma.user.upsert({
    where: { email: process.env.DEFAULT_USER_EMAIL ?? "local@ai-content.test" },
    update: { workspaceId: workspace.id },
    create: {
      workspaceId: workspace.id,
      email: process.env.DEFAULT_USER_EMAIL ?? "local@ai-content.test",
      name: "本地创作者",
    },
  });

  const existingExample = await prisma.project.findFirst({
    where: { workspaceId: workspace.id, ownerId: user.id, name: "婚礼前夜：被替换的人生" },
  });

  if (!existingExample) {
    await prisma.project.create({
      data: {
        workspaceId: workspace.id,
        ownerId: user.id,
        name: "婚礼前夜：被替换的人生",
        genre: "都市逆袭动漫短剧",
        sourceKind: SourceKind.idea,
        lastStage: "shots",
        params: { targetEpisodeLength: 60, aspectRatio: "9:16", style: "二次元赛璐璐" },
        sources: { create: { kind: SourceKind.idea, title: "原始创意", content: "婚礼前夜，林晚发现自己的人生被堂姐替换，她必须在仪式开始前找回身份与证据。" } },
        storyBible: { create: { logline: "被夺走身份的少女在婚礼前夜夺回人生。", theme: "身份、自我选择与反击", tone: "高压、克制、逐步反转", worldbuilding: "现代都市豪门与婚礼后台。", coreConflict: "林晚必须在婚礼开始前证明自己才是真正继承人。", mainGoal: "找回证据并公开身份。", immutableFacts: ["林晚是林家真正继承人", "出生证明缺失一角"] } },
        styleProfile: { create: { templateName: "二次元赛璐璐", texture: "清晰线稿与电影感景深", colorLighting: "冷绿色后台与暖金色礼堂形成对比", composition: "竖屏人物近景优先", aspectRatio: "9:16", negativePrompt: "文字水印、手指畸形、角色换脸、服装突变" } },
        characters: { create: [
          { name: "林晚", age: "24", identity: "被替换身份的真正继承人", role: CharacterRole.protagonist, personality: "克制、敏锐、在压力中迅速决断", goal: "在婚礼开始前公开真相", appearance: { hair: "黑色长发", eyes: "深棕色" }, costumes: ["白色伴娘礼服"], iconicItems: ["缺角出生证明"], forbiddenChanges: ["黑色长发", "左眼下泪痣"], visualPrompt: "24岁东亚女性，黑色长发，左眼下泪痣，白色伴娘礼服" },
          { name: "苏蔓", age: "26", identity: "冒名顶替的堂姐", role: CharacterRole.antagonist, personality: "优雅、控制欲强、擅长掩饰", goal: "顺利完成婚礼并保住继承权", appearance: { hair: "栗色盘发" }, costumes: ["香槟金婚纱"], iconicItems: ["祖母绿耳坠"], forbiddenChanges: ["栗色盘发"], visualPrompt: "26岁东亚女性，栗色盘发，香槟金婚纱，祖母绿耳坠" },
        ] },
        seasons: { create: { order: 1, title: "第一季", arc: "林晚从发现异常到公开身份并夺回主动权。", episodes: { create: { order: 1, title: "婚礼前夜", hook: "林晚从镜框背后发现一张缺角出生证明。", goal: "确认自己的真实身份。", conflict: "苏蔓派人封锁后台并抢夺证据。", mainPlot: "林晚发现证据、试探苏蔓并在追逐中保住证明。", cliffhanger: "证明背面出现母亲留下的第二个地址。", targetDuration: 60, scenes: { create: [
          { order: 1, title: "后台化妆间", timeOfDay: "夜", durationEst: 28, visualDescription: "冷绿色灯光下，林晚独自在镜前整理礼服。", actions: ["林晚从镜框背后抽出缺角纸张", "门外脚步突然停住"], dialogues: [{ speaker: "林晚", line: "这个名字……为什么是我？" }], emotionalGoal: "从疑惑转为警觉", shots: { create: [
            { order: 1, durationEst: 4, fields: { characters: ["林晚"], location: "后台化妆间", shotSize: "ws", angle: "平视", cameraMovement: "缓慢推进", action: "林晚独自坐在镜前", expression: "压抑疲惫", lighting: "冷绿色顶灯", styleNote: "二次元赛璐璐，竖屏", dialogueOrNarration: "", continuityFromPrev: "", continuityToNext: "手靠近镜框", exclude: ["文字水印"] } },
            { order: 2, durationEst: 4, fields: { characters: ["林晚"], location: "后台化妆间", shotSize: "cu", angle: "侧俯拍", cameraMovement: "固定镜头", action: "手指从镜框后抽出出生证明", expression: "", lighting: "镜前补光", styleNote: "纸张细节清晰", dialogueOrNarration: "纸张摩擦声", continuityFromPrev: "手靠近镜框", continuityToNext: "林晚看清名字", exclude: ["乱码"] } },
          ] } },
          { order: 2, title: "礼堂侧廊", timeOfDay: "夜", durationEst: 32, visualDescription: "暖金色礼堂侧廊，婚礼音乐从远处传来。", actions: ["林晚藏起证明冲向出口", "苏蔓挡在走廊尽头"], dialogues: [{ speaker: "苏蔓", line: "把不属于你的东西交出来。" }], emotionalGoal: "冲突正式爆发", shots: { create: [
            { order: 3, durationEst: 5, fields: { characters: ["林晚"], location: "礼堂侧廊", shotSize: "ms", angle: "低角度", cameraMovement: "跟拍", action: "林晚握紧证明快步冲向出口", expression: "紧张而坚定", lighting: "暖金色壁灯", styleNote: "运动感线条", dialogueOrNarration: "急促脚步声", continuityFromPrev: "林晚看清名字", continuityToNext: "苏蔓出现", exclude: ["角色换装"] } },
          ] } },
        ] } } } } },
      },
    });
  }
}

main().finally(() => prisma.$disconnect());
