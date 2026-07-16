# ADR-0001：MVP 采用 Next.js 模块化单体

- 状态：Accepted
- 日期：2026-07-16

## 背景

MVP 需要同时交付创作页面、REST API、AI 队列任务、对象存储和导出能力。团队规模与初期流量尚不需要微服务，但业务模块需要保持清晰边界。

## 决策

- 使用 Next.js App Router 和 Route Handlers 交付 Web 与 API。
- 业务逻辑放在 `src/modules/`，API 层只负责校验、资源归属和 DTO 转换。
- AI 供应商、队列、数据库、存储通过 `src/shared/` 与 `src/ai/` 封装。
- BullMQ Worker 可以独立进程运行，但与 Web 应用共享同一代码库和领域服务。
- 模块之间通过公开 service 接口协作，不跨模块直接访问内部 repository。

## 结果

- 降低部署和联调复杂度。
- 保留未来按模块拆分服务的可能性。
- 禁止在 MVP 阶段提前拆分微服务。
