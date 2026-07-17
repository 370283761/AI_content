"use client";

import { BookOpenText, Lightbulb, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ProjectShell } from "@/src/components/project-shell";

const sources = [
  { key: "idea", title: "故事创意", copy: "用一句创意或梗概开始", icon: Lightbulb },
  { key: "novel_generated", title: "生成小说", copy: "先保存章节生成参数", icon: WandSparkles },
  { key: "pasted", title: "粘贴小说", copy: "导入已有小说正文", icon: BookOpenText },
] as const;

export default function NewProjectPage() {
  const router = useRouter();
  const [sourceKind, setSourceKind] = useState<(typeof sources)[number]["key"]>("idea");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(formData: FormData) {
    setSubmitting(true);
    setError("");
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        genre: formData.get("genre"),
        sourceKind,
        sourceContent: formData.get("sourceContent") ?? "",
        params: {
          targetEpisodeLength: Number(formData.get("targetEpisodeLength")),
          aspectRatio: formData.get("aspectRatio"),
          style: formData.get("style"),
          ...(sourceKind === "novel_generated" ? {
            targetChapters: Number(formData.get("targetChapters")),
            targetWordsPerChapter: Number(formData.get("targetWordsPerChapter")),
            audienceHint: formData.get("audienceHint"),
          } : {}),
        },
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error?.message ?? "创建失败");
      setSubmitting(false);
      return;
    }
    router.push(`/projects/${result.id}/setup`);
  }

  return (
    <ProjectShell>
      <div className="page-head"><div><h1 className="page-title">创建视频剧集</h1><p className="page-copy">M1 会完整保存原始输入和参数，不执行真实 AI 生成。</p></div></div>
      <form action={submit} className="form-grid">
        <section className="card form-section">
          <div className="source-tabs">
            {sources.map(({ key, title, copy, icon: Icon }) => (
              <button className={`source-tab ${sourceKind === key ? "active" : ""}`} key={key} onClick={() => setSourceKind(key)} type="button">
                <Icon size={18} /><strong>{title}</strong><span className="help">{copy}</span>
              </button>
            ))}
          </div>
          <div className="field"><label htmlFor="name">项目名称</label><input className="input" id="name" name="name" placeholder="例如：被夺走婚礼后，我重启人生" required /></div>
          <div className="field"><label htmlFor="genre">题材</label><input className="input" defaultValue="动漫短剧" id="genre" name="genre" required /></div>
          <div className="field">
            <label htmlFor="sourceContent">{sourceKind === "pasted" ? "小说正文" : sourceKind === "idea" ? "故事创意" : "章节创作要求"}</label>
            <textarea className="textarea" id="sourceContent" name="sourceContent" placeholder={sourceKind === "pasted" ? "粘贴小说正文…" : "描述主角、冲突、转折与希望传达的情绪…"} required={sourceKind !== "novel_generated"} />
            <span className="help">原始输入会单独保存，后续 AI 输出不会覆盖它。</span>
          </div>
          {sourceKind === "novel_generated" && (
            <div className="bible-grid">
              <div className="field"><label>目标章节数</label><input className="input" defaultValue="3" min="1" max="20" name="targetChapters" type="number" /></div>
              <div className="field"><label>单章目标字数</label><input className="input" defaultValue="1500" min="300" name="targetWordsPerChapter" type="number" /></div>
              <div className="field full"><label>目标受众</label><input className="input" name="audienceHint" placeholder="例如：18-30 岁女性观众" /></div>
            </div>
          )}
          <div className="bible-grid">
            <div className="field"><label>单集目标时长</label><select className="select" defaultValue="60" name="targetEpisodeLength"><option value="30">30 秒</option><option value="60">60 秒</option><option value="90">90 秒</option></select></div>
            <div className="field"><label>画面比例</label><select className="select" defaultValue="9:16" name="aspectRatio"><option>9:16</option><option>16:9</option><option>1:1</option></select></div>
            <div className="field full"><label>视觉风格</label><select className="select" defaultValue="二次元赛璐璐" name="style"><option>二次元赛璐璐</option><option>国风动漫</option><option>写实电影感</option></select></div>
          </div>
          {error && <div className="warning">{error}</div>}
          <div style={{ marginTop: 20 }}><button className="button" disabled={submitting} type="submit">{submitting ? "正在创建…" : "创建并进入项目设定"}</button></div>
        </section>
        <aside className="card form-section">
          <h3 style={{ marginTop: 0 }}>创建后会得到</h3>
          <ul className="check-list">
            <li>✓ 独立保存的原始故事输入</li><li>✓ 故事、角色与视觉圣经</li><li>✓ 第一季内容容器</li><li>✓ 60 秒单集与 8–15 镜头工作流</li><li>✓ 刷新后可继续的持久化项目</li>
          </ul>
        </aside>
      </form>
    </ProjectShell>
  );
}
