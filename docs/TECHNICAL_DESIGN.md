# AI 视频剧集创作平台 技术设计文档

> 文档用途：作为架构、后端、前端、AI 工程与 DevOps 的共同技术上下文，基于 [MVP_REQUIREMENTS.md](./MVP_REQUIREMENTS.md) V0.2 需求基线派生。
>
> 当前版本：V0.1 技术方案基线
> 更新时间：2026-07-16
> 状态：已确认（M0.5 架构基线；Seedance 平台能力仍按配置迭代）

---

## 1. 文档范围与目标

本文档基于 MVP 需求文档的 22 章内容，输出一份可以直接指导技术选型、模块拆分、数据建模、接口设计、部署运维和风险控制的架构方案。

### 1.1 设计目标

1. **可交付**：直接支持 [MVP_REQUIREMENTS.md](./MVP_REQUIREMENTS.md) 第 18 章 12 条验收标准。
2. **可扩展**：模块解耦，未来可平滑接入更多视频平台、模型供应商和多用户体系。
3. **可维护**：模块化单体优先，避免过早引入微服务与分布式复杂度。
4. **可观测**：关键 AI 任务、导出任务、生成结果流转均可追踪。
5. **可控成本**：AI 调用最小上下文、缓存中间结果、限制并发。

### 1.2 设计原则

- 结构化数据是事实来源，富文本和导出文件是展示或交付形态。
- AI 输出必须通过 Schema 校验，未通过校验的结果不可写入核心业务表。
- 视频平台规则通过适配器解耦，业务层保存通用镜头结构。
- 锁定与版本能力落在具体业务对象或字段上，不依赖前端状态。
- 一切外部依赖（AI 模型、对象存储、外部视频平台）必须可替换、可配置。

---

## 2. 总体架构

### 2.1 架构分层

```text
┌───────────────────────────────────────────────────────────────┐
│                        Web 前端（Next.js）                     │
│   项目列表 · 项目设定 · 剧集规划 · 剧本 · 分镜 · 生产与导出    │
└───────────────────────────────────────────────────────────────┘
                              │  HTTP / JSON
┌───────────────────────────────────────────────────────────────┐
│                       API 层（Next.js Route Handlers）         │
│         鉴权/资源归属校验 · 请求校验 · DTO 转换 · 异步任务入口 │
└───────────────────────────────────────────────────────────────┘
                              │
┌───────────────────────────────────────────────────────────────┐
│                          业务服务层                            │
│   项目 · 圣经 · 规划 · 剧本 · 分镜 · 提示词 · 生产 · 导出     │
│                    状态机 · 版本管理 · 影响传播                │
└───────────────────────────────────────────────────────────────┘
                    │                     │
       ┌────────────┴─────────┐   ┌───────┴────────┐
       │   AI 模型网关         │   │ 平台适配器层    │
       │  Claude / GPT-5.6     │   │ 即梦 Seedance   │
       │  Schema 校验 · 重试   │   │ Adapter         │
       └────────────┬──────────┘   └───────┬────────┘
                    │                      │
┌───────────────────────────────────────────────────────────────┐
│                      基础设施层                                │
│   PostgreSQL · Redis + BullMQ · S3 兼容存储 · 日志/监控        │
└───────────────────────────────────────────────────────────────┘
```

### 2.2 部署形态（MVP）

- 单机或单容器部署即可满足 MVP。
- 前端与 API 使用 Next.js 一体化交付（App Router + Route Handlers）。
- Postgres、Redis 通过 docker compose 编排。
- 对象存储可先用 MinIO 本地部署，后续切 S3/OSS。

### 2.3 关键架构决策

| 决策 | 选项 | 结论 | 理由 |
|---|---|---|---|
| 应用架构 | 微服务 vs 模块化单体 | 模块化单体 | MVP 复杂度小、团队小、迭代快 |
| 前后端 | 分离 vs 一体化 | Next.js 一体化 | 减少一层部署，简化鉴权与请求转发 |
| 数据库 | Postgres vs MongoDB | Postgres | 强 Schema 支持结构化 AI 输出、事务保障 |
| AI 供应商 | 单一 vs 多供应商 | 多供应商（Claude + GPT-5.6） | 需求 20-7 要求可配置切换 |
| 异步任务 | 内存队列 vs Redis 队列 | Redis + BullMQ | 长任务需持久化与重试 |
| 对象存储 | 本地磁盘 vs S3 兼容 | S3 兼容（MinIO） | 便于替换生产环境存储 |
| 富文本编辑 | Tiptap vs Lexical | Tiptap | 生态成熟，结构化 JSON 便于持久化 |

---

## 3. 技术栈

### 3.1 前端

| 项 | 选择 | 说明 |
|---|---|---|
| 框架 | Next.js 14+ (App Router) | 一体化 SSR + Route Handlers |
| 语言 | TypeScript 5+ | 强类型 |
| UI 库 | shadcn/ui + Tailwind CSS | 可配置设计系统 |
| 状态管理 | Zustand + React Query | 客户端状态 + 服务端缓存 |
| 表单 | React Hook Form + Zod | 与后端共享校验 Schema |
| 编辑器 | Tiptap | 结构化剧本编辑 |
| 图标 | Lucide | 与 shadcn 生态一致 |
| 拖拽 | dnd-kit | 场景/镜头排序 |

### 3.2 后端

| 项 | 选择 | 说明 |
|---|---|---|
| 运行时 | Node.js 20 LTS | 与 Next.js 保持一致 |
| API | Next.js Route Handlers | RESTful + tRPC 可选 |
| ORM | Prisma 5+ | 类型安全 + 迁移工具 |
| 数据校验 | Zod | 前后端共享 |
| 数据库 | PostgreSQL 16 | 支持 JSONB、全文检索 |
| 缓存 | Redis 7 | 会话缓存 + 队列 |
| 队列 | BullMQ | Redis 队列，重试与延迟任务 |
| 对象存储 | MinIO / S3 SDK | 参考资产、生成结果、导出包 |
| 文件生成 | ExcelJS / archiver | XLSX / ZIP 导出 |
| Markdown | markdown-it | MD 导出 |
| 日志 | pino | 高性能结构化日志 |

### 3.3 AI 相关

| 项 | 选择 | 说明 |
|---|---|---|
| 模型供应商 | Claude、GPT-5.6 | 可配置切换，通过统一网关 |
| SDK | Anthropic SDK + OpenAI SDK | 均支持自定义 base_url |
| 结构化输出 | JSON Schema + Zod | 强制校验 |
| 分词/token 估算 | tiktoken | 控制上下文长度 |
| 向量检索（可选） | pgvector | 长小说场景检索 |

### 3.4 DevOps

| 项 | 选择 | 说明 |
|---|---|---|
| 容器化 | Docker + docker compose | 单机部署 |
| CI/CD | GitHub Actions | 构建、测试、部署 |
| 环境变量 | dotenv + zod validator | 启动时校验 |
| 监控 | 结构化日志 + Sentry（可选） | 错误追踪 |

---

## 4. 系统模块设计

对应需求文档第 17.3 节的模块划分，具体职责如下：

### 4.1 identity（身份与项目）

- **职责**：本地/单租户身份、项目 CRUD、项目列表、归档、自动保存节流。
- **关键实体**：`Workspace`（默认单租户）、`User`（默认用户）、`Project`。
- **接口**：`POST /api/projects`、`GET /api/projects`、`PATCH /api/projects/:id`、`GET /api/projects/:id/state`。
- **备注**：无账号系统，种子数据创建默认 Workspace 与 User；Project 保留 `workspace_id`、`owner_id` 字段，客户端不传归属 ID。

### 4.2 ingestion（内容导入与分析）

- **职责**：小说生成（FR-SRC-002）、故事结构分析（FR-SRC-003）、原文保存。
- **关键实体**：`SourceDocument`、`StoryAnalysis`。
- **依赖**：AI 模型网关、异步任务。
- **接口**：`POST /api/projects/:id/source`、`POST /api/projects/:id/analyze`。

### 4.3 bible（故事/角色/视觉设定）

- **职责**：故事圣经、角色圣经、视觉圣经的结构化维护、锁定、版本。
- **关键实体**：`StoryBible`、`Character`、`Relationship`、`Location`、`Prop`、`StyleProfile`。
- **接口**：`GET/PATCH /api/projects/:id/bible/*`、`POST /api/characters/:id/lock`。

### 4.4 planning（剧集规划）

- **职责**：整季故事弧、分集卡片、剧情一致性检查。
- **关键实体**：`Season`、`Episode`。
- **接口**：`POST /api/projects/:id/plan/generate`、`POST /api/episodes/:id/regenerate`。

### 4.5 script（单集剧本）

- **职责**：结构化场景、局部 AI 编辑、时长估算。
- **关键实体**：`Scene`。
- **接口**：`POST /api/episodes/:id/scenes`、`POST /api/scenes/:id/local-edit`。

### 4.6 shot（分镜与连续性）

- **职责**：自动拆分镜头、镜头字段编辑、连续性检查、风险提示。
- **关键实体**：`Shot`。
- **接口**：`POST /api/episodes/:id/split-shots`、`POST /api/shots/:id/continuity-check`。

### 4.7 prompt（提示词编排与平台适配）

- **职责**：结构化提示词数据、即梦 Seedance 2.0 适配器、首帧提示词、版本管理。
- **关键实体**：`PromptVersion`。
- **接口**：`POST /api/shots/:id/prompt/generate`、`GET /api/shots/:id/prompts`。
- **重要**：适配器接口 `IPlatformAdapter`，Seedance 是首个实现。

### 4.8 production（素材与生成结果）

- **职责**：镜头生产状态机、结果上传、失败反馈、提示词自动优化。
- **关键实体**：`ReferenceAsset`、`GenerationResult`。
- **接口**：`POST /api/shots/:id/results`、`POST /api/shots/:id/feedback`。

### 4.9 versioning（版本与影响传播）

- **职责**：内容生命周期状态机、影响关系图、版本恢复。
- **关键实体**：`ContentVersion`、`Reference`。
- **备注**：影响传播是横切能力，其他模块通过统一 API 注册引用关系。

### 4.10 export（导出）

- **职责**：单集生产包打包（XLSX + MD + TXT + ZIP）、导出前检查。
- **关键实体**：`ExportBatch`。
- **接口**：`POST /api/episodes/:id/export`、`GET /api/exports/:id/download`。

### 4.11 ai-gateway（AI 模型网关与任务）

- **职责**：多供应商抽象、Schema 校验、重试、令牌与成本记录、异步任务调度。
- **关键实体**：`AITask`、`AIProviderConfig`。
- **接口内部**：`gateway.invoke({ task, schema, provider, context })`。

---

## 5. 数据模型设计

### 5.1 ER 概览

```text
Workspace (默认单租户)
└── User (默认用户)
    └── Project (workspace_id, owner_id, name, params, quota_used, quota_limit=1GB)
    ├── SourceDocument (kind: novel_generated | pasted | idea)
    ├── StoryBible (jsonb)
    ├── Character (visual_json, locked_fields)
    ├── Relationship
    ├── Location
    ├── Prop
    ├── StyleProfile
    ├── Season
    │   └── Episode
    │       └── Scene (order, content_json, duration_est)
    │           └── Shot (order, fields_json, duration_est)
    │               ├── PromptVersion (version_no, parent_id, snapshot_json)
    │               ├── ReferenceAsset (kind, storage_key)
    │               └── GenerationResult (prompt_version_id, storage_key, status)
    ├── Reference (from_type, from_id, to_type, to_id)  ← 影响传播关键表
    ├── AITask (kind, status, input_ref, output_ref, cost)
    └── ExportBatch (episode_id, format, storage_key)
```

### 5.2 核心表关键字段

**Project**
```text
id            uuid pk
workspace_id  uuid fk (服务端默认 Workspace)
owner_id      uuid fk (服务端默认 User)
name          varchar(200)
params        jsonb  -- 单集时长、比例、风格模板、动漫短剧等
status        varchar(20)  -- active | archived
quota_used    bigint  -- 字节数，用于 1GB 上限
quota_limit   bigint default 1073741824
last_stage    varchar(50)  -- 用于"继续制作"跳转
created_at, updated_at
```

**Shot**
```text
id                 uuid pk
scene_id           uuid fk
order              int
fields             jsonb  -- 结构化提示词字段（第 10.7 章）
duration_est       int    -- 毫秒
production_status  varchar(20)  -- todo/submitted/generated/adopted/needs_work/discarded
content_status     varchar(20)  -- draft/pending/confirmed/locked
locked_fields      jsonb  -- 字段路径数组；整体 locked 时全部字段受保护
current_prompt_id  uuid fk -> PromptVersion
created_at, updated_at
```

**ContentVersion**
```text
id             uuid pk
project_id     uuid fk
entity_type    varchar(30)  -- story_bible | character | episode | scene | shot
entity_id      uuid
version_no     int
parent_id      uuid fk self
snapshot       jsonb
reason         text
source         varchar(20)  -- user | ai | restore | sync
ai_task_id     uuid fk nullable
created_at
```

**PromptVersion**
```text
id             uuid pk
shot_id        uuid fk
version_no     int
parent_id      uuid fk self
platform       varchar(20)  -- seedance-2.0
video_prompt   text
first_frame_prompt text
snapshot       jsonb  -- 生成时的镜头字段快照
reason         text   -- 修改原因（含失败反馈标签）
model          varchar(50)
model_version  varchar(50)
used_by_result boolean default false
created_at
```

**Reference（影响传播的核心）**
```text
id           uuid pk
project_id   uuid fk
from_type    varchar(50)  -- shot | prompt | scene ...
from_id      uuid
to_type      varchar(50)  -- character | location | style ...
to_id        uuid
snapshot_at  timestamp    -- 引用时的上游对象版本时间
status       varchar(20)  -- fresh | stale | synced | stale_locked
```

**AITask**
```text
id           uuid pk
project_id   uuid fk
kind         varchar(50)  -- analyze | plan | script | shot | prompt | novel
status       varchar(20)  -- pending | running | success | failed | cancelled
provider     varchar(20)  -- claude | gpt56
model        varchar(50)
input_ref    jsonb        -- 输入引用快照
output_ref   jsonb        -- 输出引用
prompt_tokens int
output_tokens int
cost_cents   int
error        text
retry_count  int
started_at, finished_at
```

### 5.3 索引与约束

- `Project(workspace_id, status)` 联合索引
- `Project(owner_id, status)` 联合索引
- `Scene(episode_id, order)` 联合唯一
- `Shot(scene_id, order)` 联合唯一
- `PromptVersion(shot_id, version_no)` 联合唯一
- `ContentVersion(entity_type, entity_id, version_no)` 联合唯一
- `Reference(from_type, from_id)` 与 `(to_type, to_id)` 双向索引
- 软删除字段 `deleted_at` 用于关键实体，避免误删

### 5.4 JSONB vs 字段化的边界

- 高频筛选、聚合、跨表关联的字段 → 独立列。
- 表单结构不稳定、按对象整体读取的字段（如镜头 fields、提示词 snapshot）→ JSONB。
- JSONB 字段必须有对应的 Zod Schema 定义。

---

## 6. 状态机与版本设计

### 6.1 内容生命周期状态机（对齐需求 7.4）

```text
        ┌── 用户编辑 ──┐
        ▼              │
     draft ──提交──> pending ──确认──> confirmed ──锁定──> locked
        ▲                                 │                 │
        └─────── AI 重生成 ────────────────┘                 │
                                                            │
                                     解锁（记录变更） ◀─────┘
```

- **draft**：AI 或用户新建。
- **pending**：字段完整，等待用户确认。
- **confirmed**：可作为下游生成依据。
- **locked**：AI 重生成不得覆盖。

实现：关键实体分别保存 `content_status` 与 `locked_fields`；业务服务在任何 AI 写入或批量同步持久化前调用 `lockGuard(entity, incomingPatch)`。AI 网关不直接写业务表。完整规则见 [ADR-0002](./adr/0002-content-status-and-field-locking.md)。

### 6.2 镜头生产状态机（FR-PROD-001）

```text
todo ─提交─> submitted ─回填结果─> generated ─采用─> adopted
                                      ├─修改─> needs_work ─新版本─> todo
                                      └─废弃─> discarded
```

完整允许转移与恢复规则见 [ADR-0005](./adr/0005-shot-production-state-machine.md)。`submitted` 必须绑定实际使用的 PromptVersion，GenerationResult 必须绑定该版本。

### 6.3 版本策略

- 剧本、镜头、提示词的重生成 → 创建新 `*Version` 记录。
- 恢复旧版本 → 复制为新版本，`parent_id` 指向被恢复的版本。
- 引用关系（Reference 表）在版本变动时更新 `snapshot_at` 与 `status`。

### 6.4 影响传播算法

```text
上游对象 X 发生变化时：
  1. 查询 Reference where to_type=X.type AND to_id=X.id
  2. 对每个引用者 Y：
     - 若 Y.content_status = locked 或相关字段在 locked_fields 中 → 标记 stale-locked
     - 若 Y 未锁定 → 标记 stale
  3. 前端展示影响范围数量与列表
  4. 用户选择：仅保存 / 同步未锁定 / 取消
  5. 同步：触发下游对象的 AI 重生成任务（异步）
```

---

## 7. AI 模型网关设计

### 7.1 网关职责

1. 抽象多供应商（Claude、GPT-5.6）为统一接口。
2. 支持通过配置切换 `base_url` 与 `api_key`。
3. 强制结构化输出：Zod Schema → JSON Schema → 传给模型。
4. 校验、修复、重试。
5. 记录 token 消耗与成本。
6. 异步任务化，支持长任务与恢复。

### 7.2 供应商配置

配置文件示例（`config/ai-providers.json`）：

```json
{
  "providers": {
    "claude": {
      "type": "anthropic",
      "base_url": "https://api.anthropic.com",
      "api_key_env": "CLAUDE_API_KEY",
      "models": {
        "default": "claude-sonnet-4-5",
        "long_context": "claude-opus-4-5"
      }
    },
    "gpt56": {
      "type": "openai",
      "base_url": "https://api.openai.com/v1",
      "api_key_env": "GPT56_API_KEY",
      "models": {
        "default": "gpt-5.6-mini",
        "long_context": "gpt-5.6"
      }
    }
  },
  "task_routing": {
    "novel_generation": "claude",
    "story_analysis": "claude",
    "planning": "claude",
    "script": "claude",
    "shot_split": "claude",
    "prompt_seedance": "gpt56",
    "prompt_optimize": "claude"
  }
}
```

### 7.3 网关接口

```ts
interface AIGateway {
  invoke<T>(request: {
    task: TaskKind;              // 用于路由
    schema: ZodSchema<T>;         // 输出校验
    system: string;               // 系统提示词
    input: object;                // 结构化输入
    contextRefs?: ContextRef[];   // 引用的项目实体
    hints?: {
      maxTokens?: number;
      temperature?: number;
    };
    provider?: 'claude' | 'gpt56'; // 手动覆盖路由
  }): Promise<{
    data: T;
    usage: { promptTokens: number; outputTokens: number; costCents: number };
    provider: string;
    model: string;
    taskId: string;
  }>;
}
```

### 7.4 校验与修复

1. 模型返回 JSON → 用 Zod 校验。
2. 校验失败 → 记录错误，发送修复指令（"请修复以下字段：..."）。
3. 修复重试最多 2 次；仍失败则标记任务失败，保留原始文本供人工排查。
4. 网关不得将不通过 Schema 校验的结果写入业务表（对应需求 14.1）。

### 7.5 上下文组装（对齐需求 14.2）

按任务类型注入必要上下文：

| 任务 | 输入上下文 |
|---|---|
| 小说生成 | 创意 + 题材 + 目标长度 + 风格模板 |
| 故事分析 | 原始文本 + 项目偏好 |
| 剧集规划 | 故事圣经 + 角色圣经 + 关键事实 |
| 单集剧本 | 整季规划 + 目标分集 + 相关角色 |
| 分镜生成 | 目标单集剧本 + 相关角色 + 场景 + 视觉圣经 |
| 提示词生成 | 单镜头字段 + 角色当前造型 + 视觉圣经 + Seedance 平台规则 |
| 提示词优化 | 原提示词 + 失败原因标签 + 用户补充说明 |

避免将整个项目全部发送给模型。长小说场景可启用 pgvector 检索。

### 7.6 成本控制

- 任务粒度记录 token 消耗与美元估算。
- 项目级预算配置：单项目每日最高 AI 调用次数与总成本上限。
- 超限时业务层返回明确错误码，用户可选择等待或升级配置。

---

## 8. 平台适配器：即梦 Seedance 2.0

### 8.1 适配器接口

```ts
interface IPlatformAdapter {
  readonly platform: string;              // 'seedance-2.0'
  readonly capabilities: PlatformCaps;    // 支持的时长、比例、参考图能力
  
  buildVideoPrompt(input: ShotFields, context: PromptContext): PromptOutput;
  buildFirstFramePrompt(input: ShotFields, context: PromptContext): PromptOutput;
  validate(prompt: string): ValidationResult;
  optimize(prev: PromptVersion, feedback: FailureFeedback): PromptOutput;
}
```

### 8.2 Seedance 适配器实现要点

- **字段顺序**：Seedance 对提示词字段顺序敏感，适配器负责组织"主体 → 动作 → 情绪 → 环境 → 镜头语言 → 风格 → 负面"顺序。
- **字数控制**：单条提示词长度限制（待官网确认，暂按 500 tokens 保守设置）。
- **负面约束**：将项目级负面约束 + 镜头级排除内容合并注入。
- **时长与比例**：Seedance 2.0 支持的时长与比例映射到平台参数枚举。
- **参考图**：MVP 阶段不生成图片，仅生成参考图提示词，用户外部生成。
- **失败反馈映射**：将预设失败原因（第 10.8 章）映射到强化约束模板。

### 8.3 适配器隔离原则

- 业务表仅存储通用结构化字段。
- 平台特有规则、字段顺序、字符限制、负面模板均封装在适配器内。
- 新增平台只需实现 `IPlatformAdapter`，不改核心业务代码。

---

## 9. API 契约

### 9.1 通用约定

- 所有 API 路径以 `/api` 开头。
- 请求与响应均使用 JSON。
- 错误响应格式：
  ```json
  { "error": { "code": "PROJECT_NOT_FOUND", "message": "...", "details": {} } }
  ```
- 长任务返回 `{ taskId, status: 'pending' }`，客户端通过 SSE 或轮询 `GET /api/tasks/:id` 获取进度。

### 9.2 核心接口清单

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/projects` | 创建项目 |
| GET | `/api/projects` | 项目列表 |
| GET | `/api/projects/:id` | 项目详情（含 last_stage） |
| PATCH | `/api/projects/:id` | 更新项目（重命名、归档、参数） |
| POST | `/api/projects/:id/novel/generate` | 生成小说章节 |
| POST | `/api/projects/:id/analyze` | 故事分析 |
| GET/PATCH | `/api/projects/:id/bible/story` | 故事圣经 |
| GET/POST/PATCH/DELETE | `/api/projects/:id/characters` | 角色 CRUD |
| PATCH | `/api/characters/:id/lock` | 锁定/解锁角色字段 |
| GET/PATCH | `/api/projects/:id/bible/style` | 视觉圣经 |
| POST | `/api/projects/:id/plan/generate` | 生成整季与分集 |
| PATCH | `/api/episodes/:id` | 分集编辑 |
| POST | `/api/episodes/:id/regenerate` | 重生成单集 |
| POST | `/api/episodes/:id/script/generate` | 生成剧本 |
| GET/POST | `/api/episodes/:id/scenes` | 场景列表与创建 |
| PATCH/DELETE | `/api/scenes/:id` | 场景更新与软删除 |
| POST | `/api/scenes/:id/local-edit` | 局部 AI 编辑 |
| POST | `/api/episodes/:id/split-shots` | 拆分镜头 |
| GET/POST | `/api/episodes/:id/shots` | 镜头列表与创建 |
| PATCH/DELETE | `/api/shots/:id` | 镜头更新与软删除 |
| POST | `/api/shots/:id/continuity-check` | 连续性检查 |
| POST | `/api/shots/:id/prompt/generate` | 生成提示词 |
| GET | `/api/shots/:id/prompts` | 提示词版本列表 |
| POST | `/api/shots/:id/results` | 上传生成结果 |
| POST | `/api/shots/:id/feedback` | 失败反馈 → 生成新提示词 |
| PATCH | `/api/shots/:id/status` | 更新生产状态 |
| POST | `/api/uploads/presign` | 获取对象存储预签名上传 URL |
| POST | `/api/projects/:id/impact/analyze` | 分析上游修改影响 |
| POST | `/api/projects/:id/impact/apply` | 应用用户确认的影响同步 |
| GET/PATCH | `/api/settings/ai-providers` | 读取/修改非密钥供应商配置 |
| POST | `/api/episodes/:id/export` | 创建导出任务 |
| GET | `/api/exports/:id` | 导出状态 |
| GET | `/api/exports/:id/download` | 下载 ZIP |
| GET | `/api/tasks/:id` | AI 任务状态 |
| GET | `/api/tasks/:id/stream` | AI 任务 SSE |
| GET | `/api/health` | 应用与依赖健康检查 |

### 9.3 SSE 事件示例

```text
event: progress
data: {"stage":"scene_1","percent":33}

event: partial
data: {"scenes":[{...}]}

event: done
data: {"result":{...}}

event: error
data: {"code":"MODEL_TIMEOUT","message":"..."}
```

---

## 10. 前端架构

### 10.1 路由结构（App Router）

```text
app/
├── (public)/
│   └── page.tsx                     # 落地页
├── projects/
│   ├── page.tsx                     # 项目列表
│   ├── new/page.tsx                 # 创建项目
│   └── [projectId]/
│       ├── layout.tsx               # 项目导航 + 进度侧栏
│       ├── page.tsx                 # 项目概览（含 last_stage 跳转）
│       ├── setup/page.tsx           # 项目设定（故事/角色/视觉）
│       ├── planning/page.tsx        # 剧集规划
│       ├── episodes/[episodeId]/
│       │   ├── script/page.tsx      # 单集剧本
│       │   ├── shots/page.tsx       # 分镜编辑
│       │   └── production/page.tsx  # 即梦生产工作台（专业工作台布局）
│       └── settings/page.tsx        # 项目设置（模型供应商切换）
```

### 10.2 状态管理

- **React Query**：所有服务端数据（项目、剧本、镜头、提示词）。
- **Zustand**：UI 状态（当前选中镜头、面板开关、批量选择）。
- **持久化**：草稿状态用 `sessionStorage`，避免刷新丢失。

### 10.3 组件层次

- `PageLayout`：项目导航 + 阶段进度。
- `AutoSaveForm`：封装 React Hook Form 与自动保存节流（1s）。
- `AITaskButton`：触发异步任务，显示进度与结果。
- `LockableField`：字段级锁定 UI（对齐 FR-BIBLE-004）。
- `ImpactDialog`：上游修改影响提示对话框。
- `PromptCard`、`ShotCard`、`EpisodeCard`：核心业务卡片。

### 10.4 UX 关键点

- 每个页面顶部固定"下一步"按钮（对齐需求 16.1）。
- AI 任务超过 2s 显示进度条。
- 自动保存三态：保存中 / 已保存 / 保存失败并可重试。
- 空状态、加载、错误、重试的统一组件。

---

## 11. 异步任务与队列

### 11.1 任务类型

| 任务 | 触发 | 队列 | 超时 | 重试 |
|---|---|---|---|---|
| novel_generation | 生成小说章节 | ai:novel | 5min | 2 |
| story_analysis | 故事分析 | ai:analyze | 3min | 2 |
| planning | 生成整季与分集 | ai:plan | 4min | 2 |
| script_generation | 生成单集剧本 | ai:script | 4min | 2 |
| shot_split | 拆分镜头 | ai:shot | 3min | 2 |
| prompt_generation | 生成提示词 | ai:prompt | 2min | 2 |
| prompt_optimize | 失败反馈优化 | ai:prompt | 2min | 2 |
| impact_sync | 影响传播同步 | biz:impact | 5min | 1 |
| export_pack | 打包生产包 | biz:export | 3min | 1 |

### 11.2 队列约定

- 队列名前缀：`ai:*` 为 AI 任务，`biz:*` 为业务任务。
- 每个任务持久化 `AITask` 或 `ExportBatch` 记录。
- 失败重试后仍失败 → 状态置 `failed`，前端展示可理解错误。
- 用户离开页面 → 后台继续执行，返回后通过 `GET /api/tasks/:id` 恢复视图。

---

## 12. 文件与对象存储

### 12.1 存储桶规划

| Bucket | 用途 | 生命周期 |
|---|---|---|
| `references` | 角色/场景参考资产（用户上传） | 项目归档后仍保留 |
| `results` | 生成结果视频/截图 | 与项目同生命周期 |
| `exports` | 导出的 ZIP 包 | 保留 7 天 |

### 12.2 存储 Key 规则

```text
{bucket}/{projectId}/{yyyyMM}/{entityType}/{entityId}/{uuid}.{ext}
```

Key 使用 UUID 避免猜测（对应需求 16.4）。

### 12.3 上传流程

1. 客户端调用 `POST /api/uploads/presign` 获取预签名 URL。
2. 客户端直传 MinIO/S3。
3. 客户端回调 `POST /api/shots/:id/results` 提交 metadata。
4. 服务端校验文件大小与类型，累加 `Project.quota_used`。
5. 超过 1GB 阈值时拒绝上传，前端提示用户清理。

---

## 13. 导出模块设计

### 13.1 生产包结构（对齐需求 10.9）

```text
第01集-{集名}.zip
├── 01-单集剧本.md
├── 02-分镜脚本.xlsx
├── 03-即梦提示词.md
├── 04-制作进度.xlsx
├── 角色参考/
├── 场景参考/
└── 镜头素材/
    ├── S01-C01/
    │   ├── 视频提示词.txt
    │   ├── 首帧提示词.txt
    │   └── 参考资产/
    └── S01-C02/
```

### 13.2 导出流水线

1. 校验：检查缺失项（无提示词、无时长、连续性冲突），返回警告。
2. 用户可忽略警告继续。
3. 服务端：加载全量数据 → 组装 MD → 组装 XLSX（ExcelJS）→ 生成 TXT → archiver 打 ZIP → 上传 exports 桶。
4. 返回下载链接（预签名 URL，24h 有效）。

### 13.3 格式模板

- **MD**：使用 Handlebars 或自定义拼接，保证章节顺序稳定。
- **XLSX**：单个 sheet 一表格，列头对齐需求 12.3 表。
- **TXT**：单镜头一文件，仅纯提示词文本，方便复制。

---

## 14. 非功能保障

### 14.1 性能

| 指标 | 目标 | 手段 |
|---|---|---|
| 普通编辑响应 | <200ms | 前端乐观更新 + 后端 debounced 保存 |
| 项目列表加载 | <1s | 分页 + 列表投影只查必要字段 |
| AI 短任务 | <10s | 提示词生成、局部编辑 |
| AI 长任务 | <5min | 剧本、分镜、规划均使用异步任务 |
| 打开项目页 | <2s | 懒加载 SourceDocument、历史版本、结果文件 |

### 14.2 数据可靠性

- 所有 AI 写入前后保留输入快照（`AITask.input_ref` / `output_ref`）。
- 关键实体软删除，`ExportBatch` 支持重跑。
- Postgres 定时逻辑备份 + 对象存储版本化。

### 14.3 安全

- 无账号系统阶段：服务端从配置取得默认 Workspace/User，所有 API 强制附加 `workspace_id` 与 `owner_id` 归属条件；客户端不得指定归属 ID。
- API Key 通过环境变量注入，禁止提交仓库。
- 上传 MIME 白名单：`video/mp4`、`image/png`、`image/jpeg`、`image/webp`。
- 单文件大小限制：视频 200MB、图片 20MB。
- 生成结果 URL 使用预签名，禁止直接暴露公共 URL。

### 14.4 可观测性

- 结构化日志字段：`traceId`、`projectId`、`taskId`、`kind`、`provider`、`durationMs`、`cost`。
- 关键指标：AI 任务成功率、平均耗时、平均 token、失败原因分布。
- 前端错误上报 Sentry（可选）。

---

## 15. 关键流程时序

### 15.1 从故事创意到首个镜头提示词

```text
User -> Web: 创建项目（含创意）
Web -> API: POST /projects
API -> DB: insert Project + SourceDocument
API -> Queue: novel_generation task
API -> Web: {projectId, taskId}
Web -> SSE: /tasks/:id/stream
Queue -> Gateway: invoke(novel, claude)
Gateway -> Claude: HTTP
Claude -> Gateway: JSON
Gateway -> Schema: validate
Gateway -> DB: update SourceDocument
Queue -> SSE: event=done
Web: 用户确认 -> POST /analyze
（后续 planning / script / shot 同步骤，均异步）
User -> Web: 点击"生成提示词"
Web -> API: POST /shots/:id/prompt/generate
API -> Adapter(Seedance): buildVideoPrompt
API -> Gateway: invoke(prompt, gpt56)
API -> DB: insert PromptVersion
API -> Web: 返回 promptId 与文本
User -> Web: 点击"复制到即梦"
```

### 15.2 失败反馈闭环

```text
User -> Web: 上传结果截图 + 勾选失败原因
Web -> API: POST /shots/:id/results + /shots/:id/feedback
API -> DB: insert GenerationResult
API -> Adapter: optimize(prevPrompt, feedback)
Adapter -> Gateway: invoke(prompt_optimize, claude)
API -> DB: insert PromptVersion (parent = prev)
API -> Web: 返回 diff + new prompt
```

### 15.3 上游修改影响传播

```text
User: 修改角色标志物
Web -> API: PATCH /characters/:id
API -> DB: update Character
API -> Reference: query 引用者
API -> Web: 返回影响列表（8 shots, 8 prompts）
User: 选择"同步未锁定"
Web -> API: POST /impact/apply
API -> Queue: impact_sync task
Queue -> 逐个未锁定引用者: regenerate prompt
```

---

## 16. 目录结构建议

```text
AI_content/
├── docs/
│   ├── MVP_REQUIREMENTS.md
│   ├── TECHNICAL_DESIGN.md
│   ├── AGENTS.md
│   └── CLAUDE.md
├── app/                          # Next.js App Router
│   ├── (public)/
│   ├── projects/
│   └── api/                      # Route Handlers
├── src/
│   ├── modules/
│   │   ├── identity/
│   │   ├── ingestion/
│   │   ├── bible/
│   │   ├── planning/
│   │   ├── script/
│   │   ├── shot/
│   │   ├── prompt/
│   │   ├── production/
│   │   ├── versioning/
│   │   └── export/
│   ├── ai/
│   │   ├── gateway/
│   │   ├── providers/
│   │   │   ├── claude.ts
│   │   │   └── gpt56.ts
│   │   ├── adapters/
│   │   │   └── seedance.ts
│   │   └── schemas/              # 各 AI 任务的 Zod Schema
│   ├── shared/
│   │   ├── db/                   # Prisma client
│   │   ├── queue/                # BullMQ
│   │   ├── storage/              # MinIO/S3
│   │   ├── logger/
│   │   └── config/
│   └── ui/
│       ├── components/
│       └── hooks/
├── prisma/
│   └── schema.prisma
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── config/
│   └── ai-providers.json
├── docker-compose.yml
└── package.json
```

---

## 17. 环境变量与配置

```text
# 应用
NODE_ENV=development
APP_URL=http://localhost:3000

# 数据库
DATABASE_URL=postgresql://user:pass@localhost:5432/ai_content

# Redis
REDIS_URL=redis://localhost:6379

# 对象存储
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_REGION=us-east-1
S3_BUCKETS_REFERENCES=references
S3_BUCKETS_RESULTS=results
S3_BUCKETS_EXPORTS=exports

# AI 供应商
CLAUDE_API_KEY=...
CLAUDE_BASE_URL=https://api.anthropic.com
GPT56_API_KEY=...
GPT56_BASE_URL=https://api.openai.com/v1
AI_PROVIDER_CONFIG_PATH=./config/ai-providers.json

# 单项目容量
PROJECT_QUOTA_BYTES=1073741824
```

启动时使用 Zod 校验环境变量，缺失关键项直接拒绝启动。

---

## 18. 测试策略

### 18.1 分层

- **单元测试**：Vitest；模块内纯函数、适配器、状态机、Schema 校验。
- **集成测试**：Vitest + testcontainers；Prisma + Postgres + Redis 真实容器。
- **端到端测试**：Playwright；覆盖 MVP 验收标准第 18 章 12 条路径。

### 18.2 AI 相关测试

- Gateway 层使用 mock 提供者，返回固定 JSON。
- 校验器测试用样本数据覆盖成功、失败、修复重试。
- 适配器测试断言字段顺序、字数、负面注入。

### 18.3 关键测试用例

| 用例 | 覆盖需求 |
|---|---|
| 创建项目后原始输入不因 AI 失败丢失 | FR-PROJ-001 / 16.3 |
| 局部 AI 编辑不覆盖锁定内容 | FR-SCRIPT-003 / 7.4 |
| 上游修改触发影响提示 | 场景 E / 15.3 |
| 失败反馈生成新版本并保留旧版本 | 场景 C / FR-PROD-003 |
| 导出 ZIP 包含 MD/XLSX/TXT 三种格式 | FR-EXPORT-001 |
| 中断后继续制作定位到下一个待生成镜头 | 场景 D / FR-PROJ-002 |

---

## 19. 阶段化交付计划

对齐需求文档第 19 章推荐开发顺序：

### M0 决策与设计（准备阶段）
- 输出：TECHNICAL_DESIGN.md（本文档）、Figma 稿、AI Prompt 模板库 v1、Prisma schema 草稿。

### M1 项目骨架
- 完成 identity、bible、planning、script、shot 的数据表与人工编辑闭环。
- 集成 Next.js + Prisma + Postgres + Redis + MinIO 一站式开发环境。

### M2 AI 主链路
- 完成 AI 模型网关、Seedance 适配器、结构化输出校验。
- 跑通"故事创意 → 小说章节 → 项目设定 → 剧集规划 → 剧本 → 分镜 → 提示词"完整链路。

### M3 生产闭环
- 完成 production 模块、失败反馈优化、镜头状态机、进度汇总。

### M4 交付与质量
- 完成 export 模块（XLSX + MD + TXT + ZIP）、连续性检查、影响传播、锁定/版本恢复、示例项目。

---

## 20. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| Seedance 官网规则不明确 | 高 | 高 | 适配器接口先落地；先做通用提示词兜底 |
| AI 结构化输出不稳定 | 高 | 高 | Schema 校验 + 有限次修复 + 记录失败样本 |
| 长小说超 token | 中 | 中 | 分段处理 + 摘要 + pgvector 可选 |
| 单项目 1GB 容量不足 | 中 | 中 | 用户可导出后清理；上传前预校验 |
| 无账号导致数据丢失 | 中 | 中 | 定期本地备份 + 导出功能引导 |
| 供应商切换出错 | 低 | 高 | Gateway 层完善单元测试 + 灰度切换 |
| 导出 ZIP 生成慢 | 低 | 中 | 异步任务化 + 结果缓存 |
| 影响传播计算性能 | 低 | 中 | Reference 表建索引 + 分页展示 |

---

## 21. 未决技术项

1. Seedance 2.0 官方 API/规则的最终确认（需产品调研；通过适配器配置迭代，不阻塞工程骨架）。
2. `Claude` 与 `GPT-5.6` 具体版本号（Claude Sonnet/Opus、GPT-5.6 mini/standard）。
3. 是否引入 pgvector（取决于目标小说长度）。
4. 前端是否引入 tRPC（可提升类型安全，但增加一层学习成本）。
5. 是否引入 Sentry（涉及生产部署阶段）。

以上项不阻塞 MVP 骨架开发，可在 M2 之前决定。

---

## 22. 结语

本技术方案严格对齐 [MVP_REQUIREMENTS.md](./MVP_REQUIREMENTS.md) V0.2 的所有 FR、非功能需求与已确认决策。若实现过程与本文档冲突，应按 AI 开发执行约束（需求 21 章第 8 条）先记录冲突、影响与建议，再修改文档或代码。

配套文档：
- [AGENTS.md](./AGENTS.md)：AI Agent 分工、协作与提示词规范。
- [CLAUDE.md](./CLAUDE.md)：使用 Claude 进行项目开发的协作指南。
