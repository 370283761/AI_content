# AI 视频剧集创作平台开发计划

> 文档用途：基于当前仓库全部产品、技术、Agent、测试与原型资料，制定从 M0 设计基线到 MVP 可交付版本的实施路线。
>
> 当前版本：V0.1  
> 制定日期：2026-07-16  
> 适用范围：MVP（动漫短剧、即梦 Seedance 2.0、外部人工生成与剪辑）

## M0.5 执行结果

状态：**已完成（2026-07-16）**

- [x] 正式术语统一为即梦 Seedance 2.0、动漫短剧、MD/XLSX/TXT/ZIP。
- [x] 内容生命周期、字段锁定、版本、单租户和生产状态机已通过 ADR 固化。
- [x] 生产页确定以专业工作台 B 为主，吸收任务看板状态能力。
- [x] 功能清单校正为 44 个待开发功能，并作为本地任务跟踪主表。
- [x] 增加可重复执行的 `npm run validate:m0.5` 基线校验。
- [x] Git 基线 commit：`a45c61f`。

---

## 1. 当前状态判断

项目当前处于 **M0：需求、架构与交互原型完成，正式工程尚未初始化** 的阶段。

已经具备：

- MVP 需求基线及 10 项已确认产品决策。
- 技术架构、模块、数据模型草案和 API 清单。
- 10 个 AI Agent 的职责与结构化输出约定。
- 32 个功能点清单和 MVP 验收用例草案。
- 可操作的抛弃式静态原型，用于验证用户旅程和生产工作台布局。

尚未具备：

- Next.js 正式应用、TypeScript 工程与 UI 组件体系。
- Git 仓库及可查询的 commit 历史。
- Prisma Schema、数据库迁移和种子数据。
- Docker Compose、Postgres、Redis、MinIO 实际配置。
- 正式 API、业务服务、AI 网关、队列 Worker 和对象存储实现。
- 单元、集成、API 和 E2E 测试代码。
- 真实 AI 调用和即梦提示词效果评估样本。

因此，现有 `prototype/` 只能作为交互参考，不能直接演进为生产代码。

---

## 2. 开发前必须收敛的事项

这些事项应在正式搭建工程前完成，避免数据模型和页面反复返工。

### 2.1 统一正式产品用词与示例

正式基线已经确定：

- 外部平台：即梦 AI / Seedance 2.0。
- 首发用户：动漫短剧创作者。
- 导出格式：MD、XLSX、TXT、ZIP。

当前原型仍包含“灵梦”“真人短剧”“电影感真人写实”“PDF/DOCX”等旧内容。正式工程不得复制这些过时文案和示例数据。

处理方式：

1. 原型保留为历史验证材料，不作为数据种子直接导入。
2. 为正式应用重新准备一套动漫短剧示例项目。
3. 正式 UI 采用即梦、动漫、MD/XLSX/TXT 的统一术语。

### 2.2 冻结状态机

镜头生产状态统一为：

```text
todo -> submitted -> generated -> adopted
                            \-> needs_work -> todo
                            \-> discarded
```

补充规则：

- `adopted`、`discarded` 为终态，但允许用户显式恢复到 `needs_work`。
- 提交提示词时记录实际使用的 `promptVersionId`。
- 上传结果后进入 `generated`，然后才能采用、修改或废弃。
- 优化生成新提示词后，镜头回到 `todo`，等待再次提交。

内容生命周期与生产状态必须分开：

```text
内容生命周期：draft -> pending -> confirmed -> locked
镜头生产状态：todo -> submitted -> generated -> adopted/needs_work/discarded
```

### 2.3 区分实体状态与字段锁定

需求要求字段级锁定，但技术设计中的单一 `lock_status` 更接近实体生命周期。正式模型建议同时保留：

- `contentStatus`：`draft | pending | confirmed | locked`。
- `lockedFields`：JSON 数组或对象，记录具体锁定字段路径。

`lockGuard` 必须检查字段路径；不能仅凭实体整体状态判断。

### 2.4 冻结版本模型

MVP 建议采用：

- `ContentVersion`：保存 StoryBible、Character、Episode、Scene、Shot 的结构化快照。
- `PromptVersion`：作为独立领域对象，保存视频提示词、首帧提示词、父版本、镜头快照和实际使用状态。
- 恢复历史版本不是原地覆盖，而是以旧快照创建一个新版本。

第一阶段只要求 Scene、Shot、Prompt 的完整版本能力；其他实体至少保留更新时间和 AI 输入快照。

### 2.5 冻结单租户归属方案

MVP 无账号系统，但所有项目必须有归属。建议：

- 初始化一个固定 `Workspace` 和默认 `User`。
- 服务端通过配置获取默认 workspace，不信任客户端传入 ownerId。
- 所有项目查询默认附带 workspace 条件。
- 后续接入账号系统时，不需要迁移核心项目关系。

### 2.6 冻结 API 资源语义

技术文档中的 `/api/scenes`、`/api/shots` 需要细化为资源路径，例如：

```text
GET    /api/episodes/:episodeId/scenes
POST   /api/episodes/:episodeId/scenes
PATCH  /api/scenes/:sceneId
DELETE /api/scenes/:sceneId

GET    /api/episodes/:episodeId/shots
POST   /api/episodes/:episodeId/shots
PATCH  /api/shots/:shotId
DELETE /api/shots/:shotId
```

还需补齐：

- `POST /api/uploads/presign`
- `POST /api/projects/:projectId/impact/analyze`
- `POST /api/projects/:projectId/impact/apply`
- `GET/PATCH /api/settings/ai-providers`
- `GET /api/health`

### 2.7 建立代码库治理基础

当前目录没有可查询的 Git 历史，无法执行项目规定的 commit 查询和功能归档流程。正式开发前应：

1. 初始化 Git 仓库或连接现有远程仓库。
2. 创建首个文档基线 commit。
3. 确定使用 GitHub Issues、其他任务系统或本地 Markdown 维护开发任务。
4. 后续每个功能 commit 引用 FR/FUNC/TC 编号。

---

## 3. 总体实施策略

采用 **纵向切片 + 可替换 AI + 每阶段可演示** 的方式开发。

### 3.1 不采用的方式

- 不先把全部数据库表建完，再统一开发页面。
- 不一次实现 10 个 Agent 后才联调。
- 不在第一阶段接入真实 AI、Redis、MinIO 的所有复杂能力。
- 不把抛弃式原型复制进正式项目后逐渐修补。

### 3.2 每个切片的标准结构

每个功能切片应同时包含：

```text
数据模型
-> Repository/业务服务
-> API
-> 页面与交互
-> 单元/集成/E2E 测试
-> 功能清单与文档更新
```

### 3.3 AI 接入顺序

AI 能力按用户旅程逐段接入：

```text
AnalystAgent
-> PlannerAgent
-> WriterAgent + LocalEditAgent
-> StoryboardAgent
-> SeedanceAdapter + PromptSmithAgent
-> OptimizerAgent
-> ContinuityAgent
-> ImpactAgent
-> NovelistAgent
```

说明：小说生成虽位于用户入口，但不是验证“故事到提示词”核心闭环的必要条件，建议在基本 AI 链路稳定后再接入，避免首轮范围过大。

---

## 4. 里程碑计划

以下工期为单名全栈开发者的参考工作日，不包含产品等待、AI 供应商审批和外部平台调研时间。

## M0.5 基线收敛与工程准备（2～3 天）

### 目标

让产品、技术、测试和原型对同一套术语、状态机和数据契约达成一致，形成可以开始编码的基线。

### 任务

- 完成第 2 章的七项前置决策。
- 将功能清单状态从“开发中”调整为“待开发”，避免误判进度。
- 更新原型说明，明确正式产品为即梦/动漫方向。
- 确定生产工作台最终采用的布局组合。
- 初始化 Git 和首个基线 commit。
- 建立开发任务跟踪方式。
- 建立 `docs/adr/`，至少记录：模块化单体、版本策略、字段锁定、单租户方案、生产状态机。

### 验收

- 产品文档、技术文档、Agent 文档和测试文档没有关键术语冲突。
- 状态机有明确的允许/禁止转移表。
- Prisma Schema 可以据此开始编写，不存在版本和锁定语义歧义。
- Git 可以查询历史，开发流程 Step 1/4/6 可执行。

---

## M1 工程骨架与人工创作闭环（8～12 天）

### 目标

即使不调用 AI，用户也可以创建项目、人工维护完整内容结构，并在刷新后继续工作。

### M1.1 工程与基础设施（2～3 天）

任务：

- 初始化 Next.js App Router + TypeScript strict。
- 配置 Tailwind、shadcn/ui、ESLint、Prettier、Vitest、Playwright。
- 创建 `.env.example` 和 Zod 环境校验。
- 添加 Docker Compose：Postgres、Redis、MinIO。
- 初始化 Prisma、默认 Workspace/User 和基础种子数据。
- 实现 Prisma、日志、配置、错误响应和 `/api/health`。
- 建立 CI：lint、typecheck、unit test、build。

验收：

- 一条命令启动基础依赖，一条命令启动应用。
- `/api/health` 能报告应用、数据库、Redis 和对象存储状态。
- `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` 均通过。

### M1.2 项目管理切片（2 天）

覆盖：`FUNC-001`～`FUNC-005`，`FR-PROJ-001`～`003`。

任务：

- Project、SourceDocument 数据模型与迁移。
- 项目创建、列表、详情、重命名、归档 API。
- 三种入口 UI：故事创意、生成小说、粘贴小说。
- 首阶段仅保存“生成小说”参数，不执行真实 AI。
- `lastStage`、项目完成度计算和继续制作跳转。
- 1 秒节流自动保存及保存失败重试。

验收：

- 创建项目后原始内容持久化。
- 刷新、退出、重新进入后仍能继续制作。
- 项目归档后默认列表不显示，但数据未被删除。

### M1.3 圣经与锁定切片（2～3 天）

覆盖：`FUNC-020`～`FUNC-024`，`FR-BIBLE-001`～`004`。

任务：

- StoryBible、Character、Relationship、Location、Prop、StyleProfile。
- 故事、角色和视觉圣经结构化表单。
- `contentStatus` 与 `lockedFields`。
- `lockGuard` 纯函数和服务层写入守卫。
- 角色删除前引用检查。
- 准备正式动漫示例项目基础数据。

验收：

- 用户可以人工完成故事、角色和视觉设定。
- 锁定字段不能被普通更新或模拟 AI 更新覆盖。
- 数据来源可区分 `source | inferred | user`。

### M1.4 剧集、剧本和分镜人工切片（2～4 天）

覆盖人工 CRUD 部分：`FUNC-031`、`041`、`043`、`051`、`052`。

任务：

- Season、Episode、Scene、Shot 数据模型。
- 分集卡、结构化场景和镜头编辑页面。
- 新增、编辑、软删除、拆分、合并、拖拽排序。
- 场景和镜头自动重编号。
- 时长总计和基础规则警告。
- 生产工作台先接入本地结构化数据，不接 AI。

验收：

- 用户能人工创建一集约 60 秒、8～15 镜头的内容。
- 修改顺序后编号、时长、引用关系正确。
- 删除已引用场景或角色时显示影响并禁止静默删除。

### M1 出口标准

- 端到端人工路径可演示：创建项目 → 圣经 → 分集 → 剧本 → 分镜。
- 所有数据在 Postgres 持久化。
- 尚无真实 AI 时，用户仍可以手工维护完整内容结构。

---

## M2 AI 基础与故事分析切片（5～7 天）

### 目标

建立可测试的 AI 基础设施，并用 AnalystAgent 验证一次真实的结构化 AI 写入。

### M2.1 AI 网关基础（3～4 天）

任务：

- 供应商配置 Schema 与安全加载。
- `AIProvider` 抽象、Claude/OpenAI 兼容提供者。
- `gateway.invoke()`、任务路由、超时、重试、token/成本记录。
- `AITask` 表、traceId 和结构化日志。
- Zod Schema → JSON Schema → 输出校验 → 两次修复。
- MockProvider，用于无需外网和 API Key 的本地开发测试。
- 首阶段使用数据库任务状态 + 进程内执行器验证接口；随后切换 BullMQ Worker。

验收：

- 相同业务 Agent 可以在 Mock、Claude、OpenAI 兼容提供者间切换。
- 无效 JSON 不会写入业务表。
- 调用失败、修复失败、超时均形成可追踪的 AITask。

### M2.2 AnalystAgent 纵向切片（2～3 天）

覆盖：`FUNC-011`～`FUNC-013`，`FR-SRC-001/003`。

任务：

- Analyst Schema、提示模板和服务。
- 故事分析异步 API 与任务进度 UI。
- 将分析结果映射为待确认的 StoryBible、Character、Relationship。
- 原文事实、AI 推断和缺失信息分离展示。
- 用户确认后才允许作为规划输入。

验收：

- 粘贴故事后得到可编辑、可确认的结构化分析结果。
- AI 失败不丢失原文，也不产生半成品业务数据。
- MockProvider 下 E2E 稳定通过，真实供应商完成一次冒烟测试。

---

## M3 故事到即梦提示词主链路（10～14 天）

### 目标

打通 MVP 最核心路径：已确认故事 → 整季规划 → 单集剧本 → 分镜 → 即梦提示词。

### M3.1 剧集规划（2～3 天）

覆盖：`FUNC-030`～`FUNC-033`。

- PlannerAgent Schema、模板、服务和队列任务。
- 整季与分集结果事务写入。
- 单集局部重生成，不覆盖其他集和锁定内容。
- 基础剧情问题展示。

### M3.2 单集剧本与局部编辑（2～3 天）

覆盖：`FUNC-040`～`FUNC-043`。

- WriterAgent 输出结构化 Scene 数组。
- LocalEditAgent 仅返回选中字段。
- Scene 的 ContentVersion 和撤销能力。
- 时长估算：对白字数、动作复杂度和目标时长提示。

### M3.3 自动分镜（2～3 天）

覆盖：`FUNC-050`～`FUNC-052`。

- StoryboardAgent 输出 8～15 个镜头。
- 引用角色、场景和视觉设定。
- Shot 的结构化 Schema 与 ContentVersion。
- 批量写入使用事务，失败时不保留不完整镜头集。

### M3.4 Seedance 提示词（3～5 天）

覆盖：`FUNC-060`～`FUNC-064`。

- `IPlatformAdapter` 和 SeedanceAdapter。
- 先以配置化通用规则实现，不假设未经验证的平台能力。
- PromptSmithAgent、视频提示词、首帧提示词和负面约束。
- PromptVersion、父版本、镜头快照、版本切换和一键复制。
- 建立至少 20 个固定镜头的提示词评估样本。

### M3 出口标准

- MockProvider 下可以自动完成“故事分析 → 规划 → 剧本 → 分镜 → 提示词”。
- 真实供应商至少成功跑通一部示例项目的第 1 集。
- 所有 AI 结果均经过 Schema 校验、锁定守卫和版本记录。
- 用户可以复制每个镜头的即梦提示词。

---

## M4 即梦生产闭环（5～7 天）

### 目标

让用户能将外部即梦生成结果带回平台，管理状态并迭代提示词。

### M4.1 对象存储与上传（2 天）

覆盖：`FUNC-071`。

- MinIO/S3 初始化桶和存储服务。
- 预签名上传、MIME/大小校验、1GB 项目配额。
- ReferenceAsset、GenerationResult。
- 视频与截图上传进度、失败重试和预览。

### M4.2 生产状态机与进度（1～2 天）

覆盖：`FUNC-070`、`FUNC-074`。

- 实现冻结后的状态转换表。
- 每次提交绑定 PromptVersion。
- 生产工作台采用已确认的布局组合。
- 状态筛选、下一个待处理镜头和汇总统计。

### M4.3 失败反馈优化（2～3 天）

覆盖：`FUNC-072`、`FUNC-073`。

- 失败原因标签和补充说明。
- OptimizerAgent 基于父提示词生成新版本。
- 结构化 diff、修改原因和版本关联。
- 新版本完成后镜头回到 `todo`。

### M4 出口标准

- 用户可上传至少一个外部生成结果并关联实际提示词版本。
- 用户可标记采用、待修改、废弃。
- 失败反馈生成 V2，V1 保留且 diff 可查看。
- 刷新页面后生产状态和结果仍存在。

---

## M5 一致性、影响传播与版本恢复（5～8 天）

### 目标

实现产品区别于普通 AI 文本工具的核心控制能力。

### M5.1 连续性与生成风险（2～3 天）

覆盖：`FUNC-032`、`FUNC-053`、`FUNC-054`。

- 先实现确定性规则：引用缺失、时长、角色数、相邻造型变化。
- 再由 ContinuityAgent 处理人物动机、信息与复杂语义问题。
- Issue 记录包含实体、类型、严重级别和解决状态。
- 所有问题只提示，不强制阻断；导出时汇总警告。

### M5.2 影响传播（2～3 天）

覆盖：`FUNC-080`～`FUNC-083`。

- Reference 关系写入和 stale 状态。
- 上游修改前/后差异与影响分析。
- ImpactDialog：仅保存、同步未锁定、取消。
- 锁定对象保持旧版本并显示差异。
- 同步任务幂等、可重试、可查看失败项。

### M5.3 版本恢复（1～2 天）

- Scene、Shot、Prompt 历史查看。
- 恢复历史版本时创建新版本。
- 恢复后重新计算下游 stale 状态。

### M5 出口标准

- 修改角色标志物能得到准确影响数量。
- 同步未锁定内容不会覆盖锁定字段。
- 连续性问题能定位到具体镜头。
- 历史恢复不会破坏版本链。

---

## M6 小说生成、导出与发布质量（6～9 天）

### 目标

补齐入口能力和最终交付物，达到 MVP 12 条发布验收标准。

### M6.1 小说章节生成（2～3 天）

覆盖：`FUNC-010`，`FR-SRC-002`。

- NovelistAgent 与章节 Schema。
- 创意、题材、章节数和字数配置。
- 章节编辑、确认、锁定和版本。
- 生成结果继续进入 AnalystAgent。

### M6.2 导出生产包（2～3 天）

覆盖：`FUNC-090`～`FUNC-092`。

- 导出前缺失项和连续性警告。
- ExcelJS 生成分镜与制作进度 XLSX。
- 生成剧本 MD、即梦提示词 MD、单镜头 TXT。
- archiver 打包 ZIP，写入对象存储，生成下载链接。
- 文件名和 Sheet 内容使用固定模板，避免跨平台乱码。

### M6.3 示例项目与发布验收（2～3 天）

- 建立一套动漫短剧示例项目，不沿用真人原型数据。
- 实现首次引导、空状态、错误、重试和保存失败 UI。
- 完成 13 条 E2E 测试和 12 条 MVP 发布验收。
- 核对功能清单、测试用例、README、本地开发环境和项目结构。
- 完成性能、容量、备份和错误恢复冒烟测试。

### M6 出口标准

- 用户可以从故事创意、生成小说或粘贴小说开始。
- 用户能完成一集动漫短剧的即梦生产包。
- ZIP 只包含正式基线规定的 MD、XLSX、TXT 和素材目录。
- MVP 12 条验收标准全部通过并有测试证据。

---

## 5. 依赖关系与关键路径

```text
状态/版本/锁定决策
  -> Prisma 与工程骨架
  -> 人工数据闭环
  -> AI Gateway
  -> Analyst
  -> Planner
  -> Writer
  -> Storyboard
  -> Seedance Prompt
  -> 生产结果与 Optimizer
  -> Continuity / Impact
  -> Export / 发布验收
```

可并行项：

- 正式动漫示例数据可以与 M1 工程搭建并行准备。
- 前端通用组件可以与对应 API/服务并行开发。
- Seedance 平台调研和提示词评估集可以从 M1 开始持续进行。
- 导出模板可以在 M4 后半段提前开发。
- Playwright 用例可以随每个纵向切片增量补充。

不能提前的项：

- 未冻结字段锁定与版本模型前，不应编写 Prisma 正式 Schema。
- 未完成 AI Gateway 前，不应分别在业务模块直接接 Claude/OpenAI SDK。
- 未有结构化 Shot 前，不应实现 Seedance 提示词生成。
- 未绑定 PromptVersion 前，不应实现 GenerationResult。
- 未建立 Reference 关系前，不应实现影响传播同步。

---

## 6. 建议的数据模型落地顺序

### 第一批：M1

```text
Workspace
User
Project
SourceDocument
StoryBible
Character
Relationship
Location
Prop
StyleProfile
Season
Episode
Scene
Shot
ContentVersion
```

### 第二批：M2～M3

```text
AIProviderConfig（非密钥配置）
AITask
PromptVersion
Reference
QualityIssue
```

### 第三批：M4～M6

```text
ReferenceAsset
GenerationResult
FailureFeedback
ExportBatch
```

所有关键表从首次迁移开始包含：

- UUID 主键。
- `createdAt`、`updatedAt`。
- 必要的 `deletedAt` 软删除字段。
- workspace/project 归属。
- 唯一顺序约束和版本约束。

---

## 7. 测试计划

### 7.1 测试金字塔

- 单元测试：Schema、状态机、锁定、影响传播、适配器、导出格式。
- 集成测试：Prisma Repository、API、BullMQ、MinIO、事务写入。
- E2E：MVP 用户旅程与关键失败恢复。
- API 冒烟：pytest 作为可从外部执行的长期接口回归集。
- AI 评估：固定输入样本比较 Schema 成功率、字段遗漏和提示词质量。

### 7.2 每个里程碑的最低测试要求

| 里程碑 | 最低要求 |
|---|---|
| M1 | 项目 CRUD、自动保存、lockGuard、场景/镜头排序集成测试；人工闭环 E2E |
| M2 | Gateway 校验/修复/超时/路由单测；Analyst Mock E2E |
| M3 | 5 个创作 Agent Schema；整条 Mock AI E2E；20 个 Seedance 样本 |
| M4 | 状态机全转移测试；上传限制；V1→V2 E2E |
| M5 | Reference/Impact 图测试；锁定传播；连续性规则集 |
| M6 | ZIP 内容断言；13 条 E2E；12 条 MVP 发布验收 |

### 7.3 测试环境原则

- 单元测试不得访问真实 AI 或网络。
- 集成测试优先使用隔离测试数据库和独立对象存储桶。
- E2E 默认使用 MockProvider，另设真实 AI 冒烟测试，不进入普通 CI。
- 测试数据使用动漫短剧示例，避免与旧真人原型混淆。
- 每次修复 AI 输出问题时，把失败样本加入评估集。

---

## 8. 发布门禁

每个功能进入“已完成”前必须满足：

- 对应 FR、FUNC 和 TC 编号明确。
- 数据迁移可重复执行。
- API 有请求与响应 Zod Schema。
- AI 输出有 Zod Schema 和失败策略。
- 锁定内容没有被覆盖。
- 正常、异常和权限/归属路径均有测试。
- `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` 通过。
- 功能清单、测试用例和受影响文档已更新。
- commit message 记录功能范围与验收结果。

MVP 发布额外要求：

- 12 条产品验收全部通过。
- 无 P0/P1 缺陷。
- AI Schema 成功率和失败恢复达到可接受水平。
- 导出包在 macOS/Windows 上解压和中文文件名正常。
- 单项目 1GB 限制可正确阻止超额上传。
- 不包含 API Key、真实用户数据和原型旧术语。

---

## 9. 风险排序

### P0：开发前处理

1. 产品基线与原型术语、风格、导出格式冲突。
2. 字段锁定与实体生命周期在现有技术设计中混用。
3. 剧本/镜头版本要求没有完整数据表定义。
4. 当前没有 Git 历史，既定开发流程无法执行。

### P1：M2/M3 前处理

1. `GPT-5.6` 与 Claude 的实际模型名、接口和可用性需要通过配置验证，不能写死文档示例值。
2. Seedance 2.0 提示词限制与能力尚未确认。
3. AI 结构化输出稳定性和中文长文本成本未知。
4. BullMQ Worker 与 Next.js 部署进程如何分离需要在工程骨架中明确。

### P2：发布前处理

1. MinIO 预签名 URL、项目容量计算和文件清理一致性。
2. 导出大文件时内存占用与失败重试。
3. 无账号模式下的本地备份和恢复说明。
4. 用户人工在即梦生成和下载视频，平台无法自动确认提交状态的真实性。

---

## 10. 工作量参考

单名熟悉 TypeScript/Next.js 的全栈开发者：

| 阶段 | 参考工作日 |
|---|---:|
| M0.5 基线收敛 | 2～3 |
| M1 工程与人工闭环 | 8～12 |
| M2 AI 基础与分析 | 5～7 |
| M3 故事到提示词 | 10～14 |
| M4 生产闭环 | 5～7 |
| M5 一致性与影响 | 5～8 |
| M6 导出与验收 | 6～9 |
| 合计 | 41～60 工作日 |

若需要压缩为首个可用版本，建议在 M3 后发布内部 Alpha：

```text
故事输入
-> AI 分析
-> 剧集规划
-> 单集剧本
-> 分镜
-> 即梦提示词复制
```

Alpha 可以暂不包含结果上传、影响传播和 ZIP 导出，但必须保留结构化数据、锁定守卫和提示词版本。

---

## 11. 第一批开发任务

正式编码建议从以下任务开始，严格按顺序执行：

1. `BASE-001`：修正文档与原型基线冲突，冻结术语、状态机、字段锁定和版本模型。
2. `BASE-002`：初始化 Git、首个基线 commit 和任务跟踪方式。
3. `ARCH-001`：初始化 Next.js/TypeScript/pnpm 工程和代码质量工具。
4. `INFRA-001`：Docker Compose + Postgres/Redis/MinIO + health check。
5. `DATA-001`：Prisma 第一批核心模型与默认 Workspace/User 种子。
6. `PROJ-001`：项目创建、列表、详情、归档和 SourceDocument 持久化。
7. `UI-001`：正式应用壳、项目导航、阶段进度和通用状态组件。
8. `SAVE-001`：自动保存、错误重试和 `lastStage`。
9. `BIBLE-001`：故事/角色/视觉圣经人工编辑。
10. `LOCK-001`：字段级锁定与 `lockGuard`。
11. `CONTENT-001`：Season/Episode/Scene/Shot 人工 CRUD 和排序。
12. `E2E-001`：人工创作闭环 Playwright 用例。

第一批完成后，项目才进入可以安全接入 AI Gateway 的状态。

---

## 12. 计划完成定义

本计划完成不等于“所有页面已经出现”，而是满足以下结果：

1. 用户能从创意、生成小说或粘贴小说创建项目。
2. AI 结果始终结构化、可追踪、可确认、可锁定。
3. 用户能得到一集 8～15 个镜头的即梦生产方案。
4. 每个镜头的提示词、外部生成结果和失败反馈形成版本闭环。
5. 上游修改不会静默破坏已确认或锁定内容。
6. 用户能导出 MD、XLSX、TXT、ZIP 生产包，并在外部完成视频生成和剪辑。
7. MVP 验收、自动化测试和文档归档均有证据。
