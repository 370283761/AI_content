"use client";

import { ArrowDown, ArrowUp, Clapperboard, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { StageStepper } from "@/src/components/stage-stepper";

type Episode = { id: string; order: number; title: string; hook: string; goal: string; conflict: string; mainPlot: string; cliffhanger: string; targetDuration: number; scenes: Array<{ durationEst: number; shots: unknown[] }> };

async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const result = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(result?.error?.message ?? "请求失败");
  return result;
}

export function PlanningEditor({ projectId, initialEpisodes }: { projectId: string; initialEpisodes: Episode[] }) {
  const [episodes, setEpisodes] = useState(initialEpisodes);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function addEpisode(formData: FormData) {
    try {
      const episode = await api(`/api/projects/${projectId}/episodes`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: formData.get("title"), hook: formData.get("hook"), goal: formData.get("goal"), conflict: formData.get("conflict"), mainPlot: formData.get("mainPlot"), cliffhanger: formData.get("cliffhanger"), targetDuration: Number(formData.get("targetDuration")) }) });
      setEpisodes((items) => [...items, { ...episode, scenes: [] }]);
      await api(`/api/projects/${projectId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ lastStage: "planning" }) });
      setMessage("分集已创建");
    } catch (error) { setMessage(error instanceof Error ? error.message : "创建失败"); }
  }

  async function move(episode: Episode, order: number) {
    if (order < 1 || order > episodes.length) return;
    await api(`/api/episodes/${episode.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ order }) });
    const items = episodes.filter((item) => item.id !== episode.id);
    items.splice(order - 1, 0, episode);
    setEpisodes(items.map((item, index) => ({ ...item, order: index + 1 })));
    router.refresh();
  }

  async function editEpisode(episode: Episode) {
    const title = window.prompt("分集标题", episode.title);
    if (!title) return;
    const conflict = window.prompt("核心冲突", episode.conflict);
    if (conflict === null) return;
    const updated = await api(`/api/episodes/${episode.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, conflict }) });
    setEpisodes((items)=>items.map((item)=>item.id===episode.id?{...item,...updated}:item));
  }

  return <>
    <StageStepper active="planning" projectId={projectId} />
    <div className="page-head"><div><h1 className="page-title">剧集规划</h1><p className="page-copy">人工建立分集卡片，明确每集钩子、冲突和结尾悬念。</p></div></div>
    {message && <div className="warning" style={{ marginBottom: 14 }}>{message}</div>}
    <div className="grid" style={{ gridTemplateColumns: "1fr 350px", alignItems: "start" }}>
      <div className="episode-grid">
        {episodes.map((episode) => {
          const duration = episode.scenes.reduce((sum, scene) => sum + scene.durationEst, 0);
          const shots = episode.scenes.reduce((sum, scene) => sum + scene.shots.length, 0);
          return <article className="card episode-card" key={episode.id}><div className="episode-index">EP {String(episode.order).padStart(2,"0")}</div><h2>{episode.title}</h2><p><strong>开场钩子：</strong>{episode.hook || "待补充"}</p><p><strong>核心冲突：</strong>{episode.conflict || "待补充"}</p><p><strong>主要剧情：</strong>{episode.mainPlot || "待补充"}</p><p><strong>结尾悬念：</strong>{episode.cliffhanger || "待补充"}</p><div className="meta"><span>目标 {episode.targetDuration}s</span><span>当前 {duration}s</span><span>{shots} 镜头</span></div><div className="inline-actions" style={{ marginTop: 14 }}><button className="button secondary small" disabled={episode.order === 1} onClick={() => void move(episode, episode.order - 1)}><ArrowUp size={13} /></button><button className="button secondary small" disabled={episode.order === episodes.length} onClick={() => void move(episode, episode.order + 1)}><ArrowDown size={13} /></button><button className="button secondary small" onClick={()=>void editEpisode(episode)}>编辑分集</button><Link className="button small" href={`/projects/${projectId}/episodes/${episode.id}/script`}><Clapperboard size={13} /> 编辑剧本</Link></div></article>;
        })}
        {episodes.length === 0 && <div className="card empty"><strong>还没有分集</strong>创建第一集，建议目标时长设为 60 秒。</div>}
      </div>
      <form action={addEpisode} className="card form-section">
        <h3 style={{ marginTop: 0 }}><Plus size={16} /> 新建分集卡</h3>
        <div className="field"><label>标题</label><input className="input" name="title" required /></div><div className="field"><label>开场钩子</label><textarea className="textarea" name="hook" /></div><div className="field"><label>本集目标</label><textarea className="textarea" name="goal" /></div><div className="field"><label>核心冲突</label><textarea className="textarea" name="conflict" /></div><div className="field"><label>主要剧情</label><textarea className="textarea" name="mainPlot" /></div><div className="field"><label>结尾悬念</label><textarea className="textarea" name="cliffhanger" /></div><div className="field"><label>目标时长（秒）</label><input className="input" defaultValue="60" min="15" max="180" name="targetDuration" type="number" /></div><button className="button" type="submit">创建分集</button>
      </form>
    </div>
  </>;
}
