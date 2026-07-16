# ADR-0005：镜头生产状态机

- 状态：Accepted
- 日期：2026-07-16

## 背景

镜头的创作确认状态和外部即梦生成进度是不同概念。生产状态必须准确反映提示词提交、结果回填、采用与重做过程。

## 状态

```text
todo        待生成
submitted   已人工提交到即梦
generated   已回填视频或截图结果
adopted     已采用
needs_work  待修改
discarded   已废弃
```

## 允许转移

| 当前状态 | 允许转移 | 条件 |
|---|---|---|
| todo | submitted | 必须指定提交使用的 PromptVersion |
| submitted | generated | 必须上传或登记 GenerationResult |
| submitted | todo | 用户撤销提交记录 |
| generated | adopted | 用户确认采用 |
| generated | needs_work | 用户记录失败原因或要求修改 |
| generated | discarded | 用户明确废弃结果 |
| needs_work | todo | 新 PromptVersion 已生成或用户手动确认重试 |
| adopted | needs_work | 用户显式重新打开镜头 |
| discarded | needs_work | 用户显式恢复废弃镜头 |

其他转移默认拒绝并返回 `INVALID_PRODUCTION_TRANSITION`。

## 附加规则

- `submittedPromptVersionId` 记录本次提交使用的提示词版本。
- 一个 Shot 可有多个 GenerationResult；每个结果绑定 PromptVersion。
- PromptVersion 优化成功后不会自动标记 adopted。
- 内容生命周期状态与生产状态分别存储和校验。

## 结果

- 生产统计、失败闭环和继续制作定位具备确定语义。
- E2E 和单元测试可以覆盖全部允许与禁止转移。
