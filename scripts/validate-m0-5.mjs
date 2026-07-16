import { readFile, readdir } from "node:fs/promises";

const failures = [];

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const [requirements, technical, agents, features, prototype, prototypeNotes] = await Promise.all([
  read("docs/MVP_REQUIREMENTS.md"),
  read("docs/TECHNICAL_DESIGN.md"),
  read("AGENTS.md"),
  read("功能清单.md"),
  read("prototype/app.js"),
  read("prototype/PROTOTYPE_NOTES.md"),
]);

const adrFiles = (await readdir(new URL("../docs/adr", import.meta.url))).filter((file) => /^\d{4}-.+\.md$/.test(file));
const functionIds = new Set(features.match(/FUNC-\d+/g) ?? []);

assert(requirements.includes("状态：已确认（M0.5 基线）"), "MVP 需求未标记为 M0.5 已确认基线");
assert(technical.includes("状态：已确认（M0.5 架构基线"), "技术设计未标记为 M0.5 已确认基线");
assert(technical.includes("content_status") && technical.includes("locked_fields"), "技术设计缺少内容状态与字段锁定分离");
assert(technical.includes("ContentVersion"), "技术设计缺少 ContentVersion");
assert(technical.includes("todo ─提交─> submitted"), "技术设计缺少冻结后的镜头生产状态机");
assert(agents.includes("AI 网关只返回已通过 Schema 校验的结果，不直接写业务表"), "Agent 规范未明确网关与 lockGuard 边界");
assert(functionIds.size === 44, `功能清单应包含 44 个功能，当前为 ${functionIds.size}`);
assert(!features.includes("| 🚧 | FR-"), "仍有功能被错误标记为开发中");
assert(adrFiles.length >= 6, `至少需要 6 个 Accepted ADR，当前为 ${adrFiles.length}`);
assert(!/灵梦|LINGMENG|真人短剧|电影感真人|\.pdf|\.docx/.test(prototype), "原型仍包含过时平台、风格或导出格式");
assert(!/灵梦/.test(prototypeNotes), "原型说明仍包含过时平台名称");
assert(prototype.includes('get("variant") || "B"'), "正式生产工作台默认布局不是 B");

if (failures.length) {
  console.error("M0.5 baseline validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`M0.5 baseline validation passed: ${functionIds.size} functions, ${adrFiles.length} ADRs.`);
