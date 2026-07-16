# ADR-0002：内容生命周期与字段级锁定分离

- 状态：Accepted
- 日期：2026-07-16

## 背景

需求同时要求内容经历草稿、确认、锁定等阶段，并允许用户只锁定角色标志物、外貌等具体字段。单一 `lock_status` 无法同时准确表达实体状态和字段保护。

## 决策

关键内容对象使用两个独立属性：

```text
contentStatus: draft | pending | confirmed | locked
lockedFields: string[]
```

- `contentStatus` 表达对象是否可以作为下游生成依据。
- `lockedFields` 保存字段路径，例如 `visual.iconicItems`。
- `locked` 表示对象整体锁定；此时所有可编辑字段视为锁定。
- `lockGuard(entity, incomingPatch)` 返回允许与拒绝字段。
- AI 网关只负责调用和 Schema 校验，不直接写业务表。
- 业务服务在持久化 AI 或用户批量更新前调用 `lockGuard`。
- 用户直接修改已锁定字段前必须显式解锁；解锁与修改均记录版本。

## 结果

- 局部 AI 编辑不会越界覆盖已确认内容。
- 字段级锁定可以在不同实体间复用。
- Prisma 模型和 Zod DTO 必须同时体现这两个属性。
