# ADR-0004：本地单租户使用默认 Workspace/User

- 状态：Accepted
- 日期：2026-07-16

## 背景

MVP 不提供注册和登录，但数据模型需要为后续多用户扩展保留归属关系。允许客户端任意传入 ownerId 会产生不必要的安全和迁移问题。

## 决策

- 建立 `Workspace` 和 `User` 表。
- 数据库种子创建一个默认 Workspace 和默认 User。
- 服务端配置保存默认 workspace/user 标识，客户端不传 ownerId。
- Project 必须关联 `workspaceId` 与 `ownerId`。
- 所有项目级查询默认附加 workspace 条件。
- API 保留资源归属校验，即使当前只有一个租户。

## 结果

- 首发无需实现鉴权页面。
- 后续增加账号和团队时无需重构项目归属关系。
- 本地备份和恢复以 Workspace 为数据边界。
