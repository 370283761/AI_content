# AGENTS.md

> 文档用途：定义 AI 视频剧集创作平台内所有 AI Agent 的分工、协作、输入输出契约、提示词规范与失败处理策略。
>
> 当前版本：V0.1
> 更新时间：2026-07-16
> 对齐：[docs/MVP_REQUIREMENTS.md](./docs/MVP_REQUIREMENTS.md) V0.2、[docs/TECHNICAL_DESIGN.md](./docs/TECHNICAL_DESIGN.md) V0.1

---

## 1. Agent 体系概览

本项目所有 AI 能力通过统一的**模型网关**（`ai-gateway`）调用，业务模块只与内部 Agent 接口对话，不直接与模型供应商耦合。

```text
┌──────────────────────────────────────────────────────────────┐
│                        业务模块                              │
│  ingestion · bible · planning · script · shot · production   │
└──────────────────────────────────────────────────────────────┘
                            │  Agent 内部接口
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                       Agent 编排层                           │
│  NovelistAgent · AnalystAgent · PlannerAgent · WriterAgent   │
│  StoryboardAgent · PromptSmithAgent · ContinuityAgent        │
│  OptimizerAgent · ImpactAgent                                │
└──────────────────────────────────────────────────────────────┘
                            │  统一网关调用
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     AI Gateway（多供应商）                   │
│         Claude · GPT-5.6 · 结构化输出校验 · 重试             │
└──────────────────────────────────────────────────────────────┘
```

### 1.1 设计原则

1. **单一职责**：每个 Agent 只负责一类任务；不做跨阶段的复合决策。
2. **结构化输入输出**：所有输入输出都必须有 Zod Schema；不接受自由文本作为核心数据。
3. **最小上下文**：只注入完成任务所需的最少信息（对齐需求 14.2）。
4. **锁定友好**：业务服务持久化前必须调用 `lockGuard`；不得覆盖已锁定字段。
5. **可追踪**：每次调用生成 `AITask` 记录，含输入快照、输出、模型、耗时、成本。
6. **可替换**：Agent 与模型供应商解耦；切换 Claude/GPT-5.6 无需改业务。

---

## 2. Agent 清单

| Agent | 职责 | 首选模型 | 备选模型 | 输出模式 |
|---|---|---|---|---|
| NovelistAgent | 生成小说章节 | Claude | GPT-5.6 | 结构化章节 JSON |
| AnalystAgent | 故事结构分析 | Claude | GPT-5.6 | 结构化分析 JSON |
| PlannerAgent | 整季与分集规划 | Claude | GPT-5.6 | 分集卡片数组 |
| WriterAgent | 单集剧本生成 | Claude | GPT-5.6 | 结构化场景数组 |
| LocalEditAgent | 局部剧本编辑 | Claude | GPT-5.6 | 局部改写文本 |
| StoryboardAgent | 剧本 → 分镜拆解 | Claude | GPT-5.6 | 结构化镜头数组 |
| ContinuityAgent | 连续性检查 | Claude | GPT-5.6 | 问题列表 |
| PromptSmithAgent | 生成 Seedance 提示词 | GPT-5.6 | Claude | 视频/首帧提示词 |
| OptimizerAgent | 失败反馈优化提示词 | Claude | GPT-5.6 | 新提示词 + diff |
| ImpactAgent | 影响传播分析与同步 | Claude | GPT-5.6 | 影响列表 + 建议 |

---

## 3. Agent 详细规范

以下每个 Agent 均遵循统一模板：**职责 → 触发时机 → 输入 → 输出 Schema → 提示词骨架 → 失败处理 → 验收要点**。

### 3.1 NovelistAgent

- **职责**：根据故事创意、题材、目标章节数与风格模板生成小说章节内容（对齐 FR-SRC-002）。
- **触发**：`POST /api/projects/:id/novel/generate`。
- **输入**：
  ```ts
  {
    idea: string;
    genre: string;                    // 动漫短剧 / 都市逆袭 / 末日 ...
    targetChapters: number;           // 目标章节数
    targetWordsPerChapter: number;    // 单章目标字数
    stylePreference: string;          // 二次元赛璐璐 / 国风动漫 ...
    audienceHint?: string;
  }
  ```
- **输出 Schema**：
  ```ts
  z.object({
    title: z.string(),
    logline: z.string(),
    chapters: z.array(z.object({
      order: z.number(),
      title: z.string(),
      summary: z.string(),
      content: z.string(),        // 章节正文
      wordCount: z.number(),
    })).min(1),
  });
  ```
- **系统提示词骨架**：
  ```
  你是资深短剧小说家，为{genre}题材创作可以转换为动漫短剧的小说章节。
  必须严格按 JSON Schema 输出，不得包含 Markdown 或注释。
  单章字数控制在 {targetWordsPerChapter} 字左右。
  语言应画面感强、对白节奏紧凑，方便后续拆分镜头。
  ```
- **失败处理**：Schema 校验失败 → 修复重试 2 次；仍失败 → 保留原始文本给用户人工调整。
- **验收要点**：生成章节可直接进入 AnalystAgent；保留原始创意不被覆盖。

### 3.2 AnalystAgent

- **职责**：故事结构分析（对齐 FR-SRC-003），输出故事摘要、角色、关系、冲突、卖点、推荐剧集结构、冲突/缺失点。
- **触发**：`POST /api/projects/:id/analyze`。
- **输入**：
  ```ts
  {
    sourceKind: 'novel_generated' | 'pasted' | 'idea';
    sourceContent: string;
    projectParams: { targetEpisodeLength: number; aspectRatio: string; style: string; };
  }
  ```
- **输出 Schema**：
  ```ts
  z.object({
    summary: z.string(),
    characters: z.array(z.object({
      name: z.string(),
      age: z.string().optional(),
      identity: z.string(),
      role: z.enum(['protagonist','antagonist','supporting']),
      personality: z.string(),
      goal: z.string(),
      appearanceHints: z.string(),
      relationHints: z.array(z.string()),
      sourceFacts: z.array(z.string()),  // 引自原文的事实
      inferredFacts: z.array(z.string()), // AI 推断
    })),
    relationships: z.array(z.object({ from: z.string(), to: z.string(), type: z.string() })),
    coreConflict: z.string(),
    sellingPoints: z.array(z.string()),
    recommendedStructure: z.object({
      episodeCount: z.number(),
      shotsPerEpisode: z.tuple([z.number(), z.number()]),
    }),
    issues: z.array(z.object({ kind: z.string(), message: z.string() })), // 冲突/缺失
  });
  ```
- **提示词要点**：明确区分「原文事实」与「AI 推断」，缺失信息不得凭空补全。
- **验收**：输出可直接映射为 StoryBible + Character + Relationship 结构。

### 3.3 PlannerAgent

- **职责**：生成整季故事弧与分集卡片（FR-PLAN-001/002），并做剧情一致性检查（FR-PLAN-003）。
- **触发**：`POST /api/projects/:id/plan/generate`；单集重生成 `POST /api/episodes/:id/regenerate`。
- **输入**：
  ```ts
  {
    storyBible: StoryBibleSnapshot;
    characters: CharacterSnapshot[];
    projectParams: ProjectParams;
    lockedEpisodes?: EpisodeId[];  // 已锁定的分集，不得覆盖
    mode: 'full' | 'single';
    targetEpisodeId?: string;
  }
  ```
- **输出 Schema**：
  ```ts
  z.object({
    season: z.object({
      arc: z.string(),
      characterGrowth: z.array(z.string()),
      foreshadowings: z.array(z.string()),
    }),
    episodes: z.array(z.object({
      order: z.number(),
      title: z.string(),
      hook: z.string(),
      goal: z.string(),
      conflict: z.string(),
      mainPlot: z.string(),
      cliffhanger: z.string(),
      durationSecEst: z.number(),
      shotCountEst: z.number(),
    })),
    consistencyIssues: z.array(z.object({
      kind: z.enum([
        'conflict_with_bible',
        'unknown_info_usage',
        'unsourced_prop_or_char',
        'foreshadow_missing',
        'weak_conflict',
      ]),
      episodeOrder: z.number(),
      message: z.string(),
    })),
  });
  ```
- **失败处理**：单集重生成不得改动 `lockedEpisodes`；否则视为违规重试。
- **验收**：可直接映射为 Season + Episode；一致性问题可展示但不阻塞。

### 3.4 WriterAgent

- **职责**：生成单集结构化剧本（FR-SCRIPT-001）。
- **输入**：`{ episodeSnapshot, seasonPlan, relatedCharacters, styleProfile, targetDurationSec }`。
- **输出 Schema**：
  ```ts
  z.object({
    scenes: z.array(z.object({
      order: z.number(),
      title: z.string(),
      location: z.string(),
      time: z.string(),
      durationSecEst: z.number(),
      characters: z.array(z.string()),      // 角色 id 或姓名
      visualDescription: z.string(),
      actions: z.array(z.string()),
      dialogues: z.array(z.object({ speaker: z.string(), line: z.string() })),
      narration: z.string().optional(),
      emotionalGoal: z.string(),
    })).min(1),
    metrics: z.object({
      totalDurationSecEst: z.number(),
      dialogueDurationSecEst: z.number(),
      suggestedShotCount: z.number(),
    }),
    warnings: z.array(z.string()),   // 时长超标、人物缺失、情节断裂
  });
  ```
- **提示词要点**：生成结构化场景数组，禁止输出长段文章；引用未确认角色时给出警告。
- **验收**：总时长在目标区间；每个场景可独立进入 StoryboardAgent。

### 3.5 LocalEditAgent

- **职责**：局部改写场景片段（FR-SCRIPT-003）。
- **输入**：`{ sceneSnapshot, selectedFieldPath, operation, userNote? }`。
  - `operation ∈ { 'optimize_dialogue', 'strengthen_conflict', 'shorten', 'add_suspense', 'to_narration', 'rewrite_preserve_meaning' }`
- **输出 Schema**：仅返回目标字段的新值，不得越界修改其他字段。
- **约束**：
  - 目标字段若被锁定 → 拒绝执行并返回 `LOCKED_FIELD` 错误。
  - AI 输出必须仅覆盖 `selectedFieldPath` 指定的字段。
  - 保留旧值一份用于撤销（业务层负责持久化）。

### 3.6 StoryboardAgent

- **职责**：将单集剧本拆为镜头（FR-SHOT-001），每个镜头包含结构化字段。
- **输入**：`{ episodeScript, characters, locations, styleProfile }`。
- **输出 Schema**（对齐需求 10.6 与 10.7）：
  ```ts
  z.object({
    shots: z.array(z.object({
      order: z.number(),
      sceneOrder: z.number(),
      durationSecEst: z.number(),
      characters: z.array(z.object({ id: z.string(), currentCostume: z.string() })),
      location: z.string(),
      shotSize: z.enum(['ecu','cu','ms','ws','ews']),
      angle: z.string(),
      cameraMovement: z.string(),
      action: z.string(),
      expression: z.string(),
      lighting: z.string(),
      styleNote: z.string(),
      dialogueOrNarration: z.string().optional(),
      continuityFromPrev: z.string().optional(),
      continuityToNext: z.string().optional(),
      exclude: z.array(z.string()),
      riskHints: z.array(z.string()),
    })).min(8).max(15),
  });
  ```
- **验收**：每集镜头数在 8~15 之间；相邻镜头之间的连续性字段可用于后续 ContinuityAgent。

### 3.7 ContinuityAgent

- **职责**：连续性检查（FR-SHOT-003）与生成风险提示（FR-SHOT-004）。
- **输入**：`{ shotsInEpisode, characters, locations }`。
- **输出**：
  ```ts
  z.object({
    issues: z.array(z.object({
      shotOrder: z.number(),
      kind: z.enum([
        'character_inconsistent',
        'costume_hair_prop_change',
        'time_light_jump',
        'action_state_break',
        'unknown_character_or_prop',
        'action_overload',
        'too_many_characters',
        'duration_content_mismatch',
        'motion_action_conflict',
      ]),
      message: z.string(),
      severity: z.enum(['info','warn','error']),
    })),
  });
  ```
- **约束**：结果是建议，不阻塞用户；`severity=error` 仅用于导出前警告。

### 3.8 PromptSmithAgent

- **职责**：为镜头生成即梦（Seedance 2.0）视频提示词与首帧提示词（FR-PROMPT-002/003）。
- **触发**：`POST /api/shots/:id/prompt/generate`。
- **协作**：**必须先经过 SeedanceAdapter 组装结构化字段**，再由 Agent 负责语言润色与平台合规检查。
- **输入**：`{ shotFieldsSnapshot, characterVisual, locationSnapshot, styleProfile, seedanceCaps }`。
- **输出 Schema**：
  ```ts
  z.object({
    videoPrompt: z.string(),
    firstFramePrompt: z.string(),
    negative: z.string(),
    durationSec: z.number(),
    aspectRatio: z.string(),
    fieldOrder: z.array(z.string()),   // 用于追踪字段顺序
    snapshot: z.record(z.any()),       // 生成时字段快照
  });
  ```
- **约束**：
  - 平台特定规则（字段顺序、字数、负面模板）由 Adapter 提供，Agent 不得自行改写。
  - 提示词长度不得超过 Seedance 上限（暂定 500 tokens）。
  - 输出必须包含负面约束合并结果。

### 3.9 OptimizerAgent

- **职责**：基于失败原因优化提示词（FR-PROD-003）。
- **触发**：`POST /api/shots/:id/feedback`。
- **输入**：
  ```ts
  {
    previousPrompt: PromptVersionSnapshot;
    failures: Array<'face_inconsistent'|'wrong_character_count'|'action_error'|'costume_change'|'wrong_scene'|'weak_camera'|'style_off'|'unwanted_text'|'other'>;
    userNote?: string;
  }
  ```
- **输出**：与 PromptSmithAgent 相同的输出 Schema，另外增加：
  ```ts
  {
    diff: Array<{ field: string; before: string; after: string; reason: string }>;
  }
  ```
- **约束**：
  - 优化必须显式引用失败原因；不允许无原因大改。
  - 保留原提示词作为父版本。
  - `diff` 用于前端展示修改点。

### 3.10 ImpactAgent

- **职责**：上游修改的影响分析与同步（对齐场景 E）。
- **触发**：`PATCH /api/characters/:id` 等上游修改后，服务层调用。
- **输入**：`{ changedEntityType, changedEntityId, changedFields, references }`。
- **输出**：
  ```ts
  z.object({
    affected: z.array(z.object({
      type: z.enum(['shot','prompt','scene']),
      id: z.string(),
      locked: z.boolean(),
      recommendedAction: z.enum(['regenerate','update_snapshot','ignore']),
      reason: z.string(),
    })),
    summary: z.object({
      total: z.number(),
      locked: z.number(),
      shots: z.number(),
      prompts: z.number(),
      scenes: z.number(),
    }),
  });
  ```
- **约束**：
  - 锁定项一律建议 `ignore` 并显示差异，不得静默重生成。
  - 同步动作由业务模块基于建议触发 `impact_sync` 任务。

---

## 4. 统一约定

### 4.1 输入组装（Context Assembly）

- 所有 Agent 输入均由业务模块组装，网关不主动查询数据库。
- 组装时必须包含实体的**版本快照 ID** 或时间戳，便于事后追溯。
- 快照数据大小控制：
  - StoryBible 快照：<= 2KB
  - 单角色快照：<= 1KB
  - 单场景快照：<= 3KB
  - 单镜头快照：<= 1KB
  - 长小说：分块引用 + 摘要，不整体传入。

### 4.2 输出校验（Schema Validation）

- 每个 Agent 定义在 `src/ai/schemas/{agent}.ts`。
- 网关调用 `schema.safeParse(rawJson)`：
  - 成功 → 交付业务模块。
  - 失败 → 记录错误，进入修复流程。

### 4.3 修复策略

```text
第一次失败: 附带错误路径 + 期望结构提示，要求模型仅返回修复后的 JSON。
第二次失败: 加强提示，要求模型只输出 JSON 且不带 Markdown。
第三次失败: 停止重试，`AITask.status = failed`，前端展示"AI 生成异常，请重试或修改输入"。
```

### 4.4 令牌与成本

- 每次调用记录 `promptTokens`、`outputTokens`、`costCents`。
- 单项目预算超限时，Agent 拒绝执行并返回 `QUOTA_EXCEEDED`。
- 长任务分段调用时，每段单独记账。

### 4.5 供应商路由

- 默认路由由 `config/ai-providers.json` 定义。
- 业务代码可通过 `provider` 参数强制切换（例如某任务失败后重试用备选）。
- 切换时必须共享同一份 Schema；如两家模型对 JSON 稳定性差异较大，可在 Agent 内做输出后处理。

### 4.6 提示词模板管理

- 模板文件路径：`src/ai/prompts/{agent}.md`。
- 模板变量使用 `{{var}}` 占位。
- 修改模板必须走 PR 审阅，并附回归样本对比。
- 模板变更后，`AITask` 记录新版本号，便于对比效果差异。

### 4.7 锁定守卫（Lock Guard）

- AI 网关只返回已通过 Schema 校验的结果，不直接写业务表。
- 业务服务在持久化 AI 输出或批量同步前调用：
  ```ts
  lockGuard(entity, incomingPatch) -> { allowedFields, rejectedFields }
  ```
- `entity.contentStatus = locked` 时拒绝全部业务字段更新。
- 其他状态按 `entity.lockedFields` 中的字段路径拒绝对应更新。
- 拒绝字段不写入数据库；返回给上层用于展示"AI 试图修改锁定内容"。

### 4.8 日志与追踪

- 每次调用附加 `traceId`（贯穿前端 → API → 队列 → 网关）。
- 关键日志字段：`traceId`、`agent`、`taskId`、`provider`、`model`、`inputHash`、`outputHash`、`durationMs`、`cost`、`schemaOk`。

---

## 5. 协作流程示例

### 5.1 完整创作链路

```text
[NovelistAgent 生成小说]
   → 保存 SourceDocument
[AnalystAgent 分析]
   → 生成 StoryBible + Character + Relationship
[用户确认 + 锁定关键字段]
[PlannerAgent 生成整季与分集]
   → 生成 Season + Episode，一致性问题清单
[用户选择一集]
[WriterAgent 生成剧本]
   → 生成 Scene 数组
[LocalEditAgent 用于局部改写]
[StoryboardAgent 拆分镜头]
   → 生成 Shot 数组
[ContinuityAgent 检查连续性]
[PromptSmithAgent 生成 Seedance 提示词]
   → 生成 PromptVersion (v1)
[用户复制到即梦生成]
[用户回填 GenerationResult + 失败原因]
[OptimizerAgent 优化提示词]
   → 生成 PromptVersion (v2)
[导出模块打包 ZIP]
```

### 5.2 上游修改影响传播

```text
[用户 PATCH Character 标志物]
[ImpactAgent 分析影响]
   → 8 shots / 8 prompts，其中 2 锁定
[前端展示影响列表]
[用户点击"同步未锁定"]
[业务模块调度 impact_sync 队列]
[队列逐个调用 PromptSmithAgent 或 OptimizerAgent]
```

---

## 6. Agent 版本与演进

- 每个 Agent 的 Schema 与 Prompt 单独版本化，例如 `PromptSmithAgent@2026-08-01`。
- Schema 破坏性变更必须同步升级业务模块。
- 模板迭代应保留至少 2 个历史版本，便于 A/B 对比。
- 供应商切换、模型升级需附回归测试报告。

---

## 7. 禁止事项

1. **不得跳过 Schema 校验**直接把模型输出写入数据库。
2. **不得越界修改**：LocalEditAgent 只能改选中字段；OptimizerAgent 只能改提示词字段。
3. **不得覆盖锁定内容**：所有写入必须先经 `lockGuard`。
4. **不得静默重生成下游**：影响传播必须由用户显式确认。
5. **不得在业务代码里写死模型 ID / URL / Key**：所有配置通过网关与 `config/ai-providers.json`。
6. **不得整包发送项目上下文**：避免成本失控与内容漂移。
7. **不得输出含 Markdown 或注释的 JSON**：模型必须返回纯 JSON。
8. **不得在客户端直接调用模型**：所有 AI 调用经服务端网关。

---

## 8. 待办与演进方向

1. Seedance 2.0 官方规则确定后，完善 `PromptSmithAgent` 与 SeedanceAdapter 的字段顺序与字数限制。
2. 增加 `SummaryAgent` 用于长小说分段与摘要。
3. 增加 `ExampleProjectAgent` 生成示例项目内容，用于新用户引导。
4. 增加 `EvalHarness`：用固定输入回归各 Agent 输出，防止模板漂移。
5. Claude 与 GPT-5.6 的多版本 A/B 评估流程。
