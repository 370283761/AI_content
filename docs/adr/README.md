# Architecture Decision Records

本目录记录已经确认、会约束后续实现的架构与产品技术决策。

状态说明：

- `Accepted`：已确认，开发必须遵守。
- `Superseded`：已被后续 ADR 替代。
- `Proposed`：提案，尚不可作为实现依据。

当前决策：

| ADR | 决策 | 状态 |
|---|---|---|
| [0001](./0001-modular-monolith.md) | MVP 采用 Next.js 模块化单体 | Accepted |
| [0002](./0002-content-status-and-field-locking.md) | 内容生命周期与字段级锁定分离 | Accepted |
| [0003](./0003-versioning-model.md) | 使用 ContentVersion 与 PromptVersion | Accepted |
| [0004](./0004-single-tenant-workspace.md) | 本地单租户使用默认 Workspace/User | Accepted |
| [0005](./0005-shot-production-state-machine.md) | 镜头生产状态机与转移规则 | Accepted |
| [0006](./0006-production-workbench-layout.md) | 生产页采用专业工作台为主布局 | Accepted |

如实现与 Accepted ADR 冲突，应先新增 ADR 说明替代原因，不得静默改变行为。
