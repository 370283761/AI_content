# ADR-0003：使用 ContentVersion 与 PromptVersion

- 状态：Accepted
- 日期：2026-07-16

## 背景

剧本、镜头和提示词需要重新生成、撤销、恢复和影响追踪。原地覆盖无法解释内容来源，也无法把外部生成结果关联到实际使用的提示词。

## 决策

### ContentVersion

用于 Scene、Shot 以及需要历史恢复的其他结构化内容：

```text
id
projectId
entityType
entityId
versionNo
parentId
snapshotJson
reason
source: user | ai | restore | sync
aiTaskId?
createdAt
```

MVP 必须为 Scene 和 Shot 建立完整版本；StoryBible、Character、Episode 可在功能实现时接入同一机制。

### PromptVersion

提示词作为独立领域对象保存：

```text
id
shotId
versionNo
parentId
platform
videoPrompt
firstFramePrompt
negativePrompt
shotSnapshotJson
reason
model
aiTaskId?
createdAt
```

### 恢复规则

- 重新生成创建新版本，不覆盖旧版本。
- 恢复旧版本时复制旧快照成为最新版本。
- GenerationResult 必须绑定实际提交时的 PromptVersion。
- 恢复或上游同步后重新计算下游 Reference 的 stale 状态。

## 结果

- 所有 AI 生成与人工恢复可追踪。
- 提示词 V1、V2 与外部生成结果保持准确关系。
- 存储量增加，但符合 MVP 可审计和可恢复目标。
