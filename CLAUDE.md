# CLAUDE.md — AI 视频剧集创作平台开发流程

> 文档用途：定义 Claude（及所有 AI 编码助手）在本项目的开发流程、工作规范与协作约束。
>
> 当前版本：V0.2（对齐设计原则 7 步开发流程）
> 更新时间：2026-07-16
> 对齐文档：[MVP_REQUIREMENTS.md](./docs/MVP_REQUIREMENTS.md)、[TECHNICAL_DESIGN.md](./docs/TECHNICAL_DESIGN.md)、[AGENTS.md](./AGENTS.md)

---

## 0. 核心文档体系

本项目采用**需求驱动 + 文档先行**的开发模式，所有开发行为必须基于以下文档：

| 文档 | 用途 | 更新时机 |
|---|---|---|
| [README.md](./README.md) | 项目介绍、快速启动、功能概览 | 新增大功能、部署变更 |
| [功能清单.md](./功能清单.md) | 功能点清单（编号 + 简短描述），用于快速查询与回归 | 每次功能交付 |
| [项目结构.md](./项目结构.md) | 目录结构、模块职责、关键文件索引 | 模块调整、重构 |
| [本地开发环境.md](./本地开发环境.md) | 本地启动、端口、数据库、组件地址、常见问题 | 环境依赖变更 |
| [测试用例.md](./测试用例.md) | 测试用例清单（含 Python 脚本路径） | 每次功能交付附测试 |
| [docs/MVP_REQUIREMENTS.md](./docs/MVP_REQUIREMENTS.md) | 完整产品需求与验收标准 | 需求评审后 |
| [docs/TECHNICAL_DESIGN.md](./docs/TECHNICAL_DESIGN.md) | 架构、数据模型、API 契约 | 架构变更 |
| [AGENTS.md](./AGENTS.md) | AI Agent 输入输出规范 | Agent Schema 变更 |
| **本文档 CLAUDE.md** | 开发流程、工作约束、协作规范 | 流程优化 |

---

## 1. 七步开发流程

所有需求从接收到交付，必须严格遵循以下流程：

```text
需求确认 → 需求拆解 → 需求实现 → 需求归档 → 需求自测 → 提交变更 → 回归检查
   ↓          ↓          ↓          ↓          ↓          ↓          ↓
  Step 1    Step 2    Step 3    Step 4    Step 5    Step 6    Step 7
```

### 当前任务跟踪方式

- 当前仓库未连接外部 issue tracker，使用 [功能清单.md](./功能清单.md) 作为本地任务跟踪主表。
- 产品功能使用 `FUNC-*` 编号；基线、架构、基础设施与测试任务使用 `BASE-*`、`ARCH-*`、`INFRA-*`、`DATA-*`、`UI-*`、`E2E-*` 等编号。
- 开始任务前将状态改为 `🚧 开发中`；验收和提交完成后改为 `✅ 已完成` 并填写 commit SHA。
- 未来接入 GitHub/GitLab/Jira 等任务系统时，应更新本节与任务跟踪说明，不保留双重状态源。

---

### Step 1: 需求确认和历史反馈

**目标**：明确需求边界、避免理解偏差、识别历史冲突。

**操作清单**：

1. **理解用户意图**
   - 用户使用的术语是否与系统一致？（参考 [MVP_REQUIREMENTS.md 第 6 章术语表](./docs/MVP_REQUIREMENTS.md#6-核心概念与术语)）
   - 需求描述是否清晰？若有歧义，**必须主动向用户确认**，不得猜测。

2. **查询历史变更**
   ```bash
   # 查询相关文件的历史变更
   git log --oneline --follow -- <文件路径>
   git log --grep="<关键词>" --oneline
   ```
   - 检查是否有相关 commit，避免重复实现或冲突修改。

3. **查阅功能描述**
   - 阅读 [README.md](./README.md) 了解现有功能概览。
   - 查阅 [功能清单.md](./功能清单.md) 确认功能编号与依赖关系。
   - 若需求涉及已有功能，明确是「新增」「修改」还是「重构」。

4. **确认范围与 FR 编号**
   - 若需求属于 MVP 范围，从 [MVP_REQUIREMENTS.md](./docs/MVP_REQUIREMENTS.md) 中找到对应 FR 编号（如 `FR-PROJ-001`）。
   - 若超出 MVP 范围或与已确认决策（第 20 章）冲突，**立即提示用户**。

5. **输出需求确认清单**
   - 在开始编码前，简要输出：
     - 需求类型（新增/修改/重构）
     - 涉及模块（如 `identity`、`prompt`）
     - 相关 FR 编号
     - 历史相关 commit（如有）
     - 需要确认的歧义点（如有）

**验收标准**：用户明确回复"确认"或"开始"，或需求描述无歧义。

---

### Step 2: 需求拆解

**目标**：将需求拆解为**可独立交付的最小功能点**，便于并行开发与增量验证。

**拆解原则**：

1. **单一职责**：每个子任务只完成一件事。
2. **可独立验证**：每个子任务完成后可单独测试。
3. **顺序依赖**：明确哪些任务必须串行，哪些可以并行。
4. **时间可控**：单个子任务的开发 + 自测时间不超过 2 小时。

**拆解模板**：

```markdown
### 需求：[需求标题]（FR-XXX-YYY）

**子任务**：
- [ ] Task-1: [描述]（依赖：无 | Task-X）
- [ ] Task-2: [描述]（依赖：Task-1）
- [ ] Task-3: [描述]（依赖：无，可并行）

**涉及文件**：
- `src/modules/<module>/<file>.ts`
- `app/api/<path>/route.ts`
- `prisma/schema.prisma`

**验收标准**：
- [ ] 测试通过：`pnpm test -- <test-file>`
- [ ] Lint 通过：`pnpm lint`
- [ ] 文档同步：[功能清单.md](./功能清单.md)
```

**输出物**：一份结构化的任务清单（可使用 TodoWrite 工具跟踪进度）。

---

### Step 3: 需求实现

**目标**：按拆解后的子任务逐个完成编码与单元测试。

**实现约束**：

1. **先读后写**
   - 修改既有代码前，**必须先阅读相关文件**，理解现有逻辑。
   - 禁止"从零编造"或"猜测性编码"。

2. **遵守技术方案**
   - 数据模型变更：先更新 [TECHNICAL_DESIGN.md 第 5 章](./docs/TECHNICAL_DESIGN.md#5-数据模型设计)，再修改 `prisma/schema.prisma`。
   - API 新增：对照 [TECHNICAL_DESIGN.md 第 9.2 章](./docs/TECHNICAL_DESIGN.md#92-核心接口清单) 确认路径与语义。
   - AI Agent 变更：同步更新 [AGENTS.md](./AGENTS.md) 与 `src/ai/schemas/`。

3. **遵守已确认决策**
   - [MVP_REQUIREMENTS.md 第 20 章](./docs/MVP_REQUIREMENTS.md#20-已确认的产品决策) 的 10 项决策**禁止擅自修改**。
   - 若实现中发现冲突，**停止编码，记录冲突，请示用户**。

4. **锁定与状态机**
   - 任何写入操作涉及锁定字段，必须先调用 `lockGuard`。
   - 状态机变更（如 `draft → pending → confirmed → locked`）必须显式处理。

5. **AI 输出必须校验**
   - 所有 AI 模型输出必须走 `schema.safeParse()`，未通过校验的结果**禁止写入数据库**。
   - Seedance 平台规则只能出现在 `src/ai/adapters/seedance.ts`。

6. **代码风格**
   - ESLint + Prettier 强制约束。
   - TypeScript strict 模式，禁止 `any`（如必须使用需注释）。
   - 文件命名：kebab-case；类型：PascalCase；函数/变量：camelCase。

7. **逐个文件交付**
   - 不一次性输出大量代码；按文件逐个展示改动。
   - 关键改动附加简短设计说明。

**验收标准**：
- [ ] 代码可编译（`pnpm typecheck`）
- [ ] Lint 通过（`pnpm lint`）
- [ ] 单元测试编写并通过（`pnpm test`）
- [ ] 关键逻辑附注释

---

### Step 4: 需求归档

**目标**：将变更信息持久化到 git 与文档，便于未来查阅与回归。

**归档清单**：

1. **Git Commit**
   - 提交信息遵循 Conventional Commits：
     ```
     feat(shot): 新增镜头拆分 API
     fix(prompt): 修复 Seedance 负面约束合并逻辑
     docs(agents): 补充 OptimizerAgent 输出 Schema
     refactor(bible): 提取 lockGuard 为独立模块
     test(export): 新增 ZIP 结构验证测试
     ```
   - 每个 commit 应引用相关 FR 编号（在 message body 中）：
     ```
     feat(shot): 新增镜头拆分 API
     
     - 对齐 FR-SHOT-001
     - 输入单集剧本，输出 8-15 个结构化镜头
     - 包含连续性字段供 ContinuityAgent 使用
     ```

2. **同步文档**

| 变更类型 | 需同步文档 |
|---|---|
| 新增功能 | [功能清单.md](./功能清单.md) + [README.md](./README.md) |
| 修改数据模型 | [TECHNICAL_DESIGN.md 第 5 章](./docs/TECHNICAL_DESIGN.md#5-数据模型设计) |
| 新增/修改 API | [TECHNICAL_DESIGN.md 第 9 章](./docs/TECHNICAL_DESIGN.md#9-api-契约) |
| 新增/修改 Agent | [AGENTS.md](./AGENTS.md) + `src/ai/schemas/*.ts` |
| 新增模块/目录 | [项目结构.md](./项目结构.md) |
| 环境变量变更 | [本地开发环境.md](./本地开发环境.md) |
| 开发流程调整 | [CLAUDE.md](./CLAUDE.md)（本文档） |

3. **功能清单更新示例**

```markdown
## 功能清单

### 镜头管理
- **FUNC-001**: 创建项目 ✅ (commit: a1b2c3d)
- **FUNC-002**: 故事分析 ✅ (commit: e4f5g6h)
- **FUNC-003**: 拆分镜头 ✅ (commit: i7j8k9l) ← 新增
```

**验收标准**：
- [ ] Git commit 已提交，message 符合规范
- [ ] 相关文档已同步更新
- [ ] [功能清单.md](./功能清单.md) 已追加新功能编号

---

### Step 5: 需求自测

**目标**：在本地环境完整验证功能，确保可交付。

**5.1 环境准备**

参考 [本地开发环境.md](./本地开发环境.md)：

```bash
# 启动依赖
docker compose up -d

# 数据库迁移
pnpm prisma migrate dev

# 启动开发服务器
pnpm dev
```

- 确认端口：`http://localhost:3000`（前端 + API）
- 确认数据库：`postgresql://localhost:5432/ai_content`
- 确认 Redis：`redis://localhost:6379`
- 确认 MinIO：`http://localhost:9000`（Console: `http://localhost:9001`）

**5.2 确认测试范围**

根据需求类型确定测试范围：

| 需求类型 | 测试范围 |
|---|---|
| 新增 API | 该 API 的正常/异常流程 + 归属校验 |
| 修改业务逻辑 | 受影响的所有下游接口 |
| 数据模型变更 | 所有引用该表的 CRUD 操作 |
| AI Agent 变更 | Schema 校验 + 修复重试 + 成本记录 |
| 前端组件 | 该组件的交互与状态变更 |

**5.3 测试用例执行**

1. **单元测试**
   ```bash
   pnpm test -- src/modules/<module>
   ```

2. **集成测试**（若已编写）
   ```bash
   pnpm test:int -- <test-file>
   ```

3. **手工测试**（API）
   - 使用 Postman / curl / httpie 测试 API 端点。
   - 验证请求/响应 Schema。
   - 验证错误处理（如 400/401/403/404/500）。

4. **手工测试**（前端）
   - 打开 `http://localhost:3000`。
   - 按用户旅程操作，验证交互与数据流转。

5. **测试用例归档**

将测试步骤与预期结果记录到 [测试用例.md](./测试用例.md)：

```markdown
### TC-003: 拆分镜头

**前置条件**：项目已创建，单集剧本已生成

**步骤**：
1. POST /api/episodes/:id/split-shots
2. 请求 body: { sceneIds: [...] }

**预期**：
- 返回 200
- shots 数组长度 8-15
- 每个 shot 包含 order, sceneOrder, durationSecEst 等字段

**Python 脚本**：`tests/api/test_shot_split.py::test_split_shots_success`
```

**5.4 高级测试工具**（可选）

- **n8n**：API 工作流自动化测试。
- **Playwright**：端到端 UI 自动化测试。

**验收标准**：
- [ ] 单元测试全部通过
- [ ] 手工测试覆盖正常 + 异常流程
- [ ] 测试用例已归档到 [测试用例.md](./测试用例.md)
- [ ] Python 测试脚本已提交到 `tests/` 目录
- [ ] 如有未知风险，已在测试报告中明确指出

---

### Step 6: 提交变更

**目标**：将本地变更提交到远程仓库。

**提交前自查**：

```markdown
- [ ] 我读了相关既有代码吗？
- [ ] 我遵守了已确认的产品决策吗？（第 20 章）
- [ ] AI 输出走了 Schema 校验吗？
- [ ] 我是否触碰了锁定字段？如触碰了，是否走 lockGuard？
- [ ] 平台规则是否只出现在适配器里？
- [ ] 是否为该功能编写了测试？
- [ ] 是否运行了 `pnpm lint` 与 `pnpm typecheck`？
- [ ] 相关文档是否同步更新？
- [ ] Git commit message 是否符合规范？
```

**提交流程**：

```bash
# 1. 暂存变更
git add <files>

# 2. 提交（附 FR 编号）
git commit -m "feat(module): 功能描述

- 对齐 FR-XXX-YYY
- 详细变更说明
"

# 3. 推送到远程
git push origin feat/<branch-name>

# 4. 创建 PR（如适用）
gh pr create --title "feat: 功能标题" --body "关闭 #issue-number"
```

**验收标准**：
- [ ] 代码已推送到远程仓库
- [ ] PR 已创建（若使用 PR 流程）

---

### Step 7: 回归检查

**目标**：确认新功能未破坏已有功能。

**回归策略**：

1. **影响范围分析**

| 变更类型 | 回归范围 |
|---|---|
| 新增独立 API | 无需回归（除非共享模块） |
| 修改共享模块（如 `lockGuard`） | 所有调用该模块的功能 |
| 数据模型字段新增 | 所有读写该表的 API |
| 数据模型字段删除/重命名 | **全量回归** |
| AI Agent Schema 变更 | 调用该 Agent 的所有业务流程 |
| 状态机变更 | 所有涉及该状态的功能 |

2. **执行回归测试**

   a. **自动化测试**（优先）
   ```bash
   pnpm test          # 全量单元测试
   pnpm test:int      # 全量集成测试
   pnpm test:e2e      # 端到端测试（覆盖 MVP 12 条验收标准）
   ```

   b. **手工回归**（若自动化未覆盖）
   - 从 [功能清单.md](./功能清单.md) 中筛选受影响功能。
   - 从 [测试用例.md](./测试用例.md) 中找到对应测试用例。
   - 逐个执行并记录结果。

3. **回归报告**

若发现回归问题：
- **立即停止交付**。
- 记录问题：`git commit -m "fix: 修复回归问题 XXX"`。
- 重新执行 Step 5 自测。

若无回归问题：
- 在 PR 或 commit message 中注明"回归通过"。
- 附测试覆盖范围（如"单元测试 100%，手工测试核心流程 3 条"）。

**验收标准**：
- [ ] 自动化测试全部通过
- [ ] 手工回归测试（若需要）已完成
- [ ] 无新增回归问题
- [ ] 测试报告已归档

---

## 2. 常用命令速查

以下命令在开发中频繁使用，建议熟记或设置别名：

```bash
# 依赖管理
pnpm install                      # 安装依赖
pnpm add <package>                # 新增依赖
pnpm add -D <package>             # 新增开发依赖

# 数据库
pnpm prisma generate              # 生成 Prisma Client
pnpm prisma migrate dev --name <name>  # 创建迁移
pnpm prisma studio                # 打开数据库 GUI

# 开发
pnpm dev                          # 启动开发服务器
pnpm build                        # 生产构建
pnpm start                        # 启动生产服务器

# 代码质量
pnpm lint                         # ESLint 检查
pnpm lint:fix                     # 自动修复 Lint 问题
pnpm typecheck                    # TypeScript 类型检查
pnpm format                       # Prettier 格式化

# 测试
pnpm test                         # 运行所有单元测试
pnpm test -- <pattern>            # 运行匹配模式的测试
pnpm test:watch                   # 监听模式
pnpm test:int                     # 集成测试
pnpm test:e2e                     # 端到端测试

# Docker
docker compose up -d              # 启动所有服务
docker compose down               # 停止所有服务
docker compose logs <service>     # 查看服务日志
docker compose restart <service>  # 重启服务

# Git
git log --oneline --follow -- <file>  # 查看文件历史
git log --grep="<keyword>"            # 搜索 commit
git diff <commit1> <commit2>          # 对比两个 commit
```

---

## 3. 禁止事项

以下行为在本项目中**严格禁止**，违反将导致代码被拒绝合并：

1. **跳过 Schema 校验**直接将 AI 模型输出写入数据库。
2. **擅自修改已确认决策**（[MVP_REQUIREMENTS.md 第 20 章](./docs/MVP_REQUIREMENTS.md#20-已确认的产品决策)）。
3. **Seedance 规则散落到业务代码**（只能出现在 `src/ai/adapters/seedance.ts`）。
4. **覆盖锁定字段**（未经 `lockGuard` 检查）。
5. **静默传播影响**（上游变更未提示用户）。
6. **在业务代码里写死模型 ID/URL/Key**（必须走配置）。
7. **整包发送项目上下文**给 AI 模型（成本失控）。
8. **前端直接调用 AI 模型**（必须经服务端网关）。
9. **提交 API Key**（使用 `.env`，仅提交 `.env.example`）。
10. **跳过自测**直接提交代码。

---

## 4. 与 Claude 协作的最佳实践

### 4.1 请求 Claude 前（工程师）

- 明确任务边界（新增/修改/重构？哪个模块？）
- 附上相关文件路径或当前内容
- 提供最小可复现问题（若是修复）
- 说明期望输出格式（代码/分析/方案对比？）

### 4.2 Claude 应该做的

1. **Step 1 需求确认阶段**
   - 复述任务目标与约束
   - 查询相关 commit log（如 `git log --grep`）
   - 从 [功能清单.md](./功能清单.md) 查询功能依赖
   - 列出需要确认的歧义点

2. **Step 2 需求拆解阶段**
   - 输出结构化任务清单
   - 明确依赖关系与并行任务
   - 列出涉及文件与验收标准

3. **Step 3 需求实现阶段**
   - 先读取相关既有代码
   - 逐个文件输出改动
   - 关键设计附简短说明
   - 编写单元测试

4. **Step 4 需求归档阶段**
   - 生成符合规范的 commit message
   - 列出需要同步的文档清单
   - 更新 [功能清单.md](./功能清单.md)

5. **Step 5 需求自测阶段**
   - 生成测试用例（Markdown + Python 脚本）
   - 执行 `pnpm lint` 和 `pnpm typecheck`
   - 附测试覆盖说明

6. **Step 7 回归检查阶段**
   - 分析影响范围
   - 建议回归测试清单
   - 若自动化测试通过，明确说明

### 4.3 Claude 不应该做的

1. 未经确认直接假设需求细节
2. 一次性输出大量代码（应逐文件）
3. 修改文档时不附 commit 示例
4. 跳过自测直接提交代码
5. 静默创建新文件（应先询问必要性）
6. 引入新依赖时不说明理由
7. 横跨多个不相关模块的大改动（除非明确要求）

---

## 5. 快速索引

| 我想 | 去看 |
|---|---|
| 了解项目是什么 | [README.md](./README.md) |
| 快速查功能点 | [功能清单.md](./功能清单.md) |
| 查目录结构 | [项目结构.md](./项目结构.md) |
| 本地启动项目 | [本地开发环境.md](./本地开发环境.md) |
| 查测试用例 | [测试用例.md](./测试用例.md) |
| 了解产品需求 | [docs/MVP_REQUIREMENTS.md](./docs/MVP_REQUIREMENTS.md) |
| 了解技术架构 | [docs/TECHNICAL_DESIGN.md](./docs/TECHNICAL_DESIGN.md) |
| 了解 AI Agent 规范 | [AGENTS.md](./AGENTS.md) |
| 了解开发流程 | [CLAUDE.md](./CLAUDE.md)（本文档） |
| 查已确认的产品决策 | [MVP_REQUIREMENTS.md 第 20 章](./docs/MVP_REQUIREMENTS.md#20-已确认的产品决策) |
| 查 MVP 验收标准 | [MVP_REQUIREMENTS.md 第 18 章](./docs/MVP_REQUIREMENTS.md#18-mvp-发布验收标准) |

---

## 6. 版本历史

- **V0.2**（2026-07-16）：对齐设计原则，重构为 7 步开发流程，新增文档体系。
- **V0.1**（2026-07-16）：初始版本，基于技术方案派生。
