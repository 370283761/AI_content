"use client";

import { useEffect, useState } from "react";

import { StageStepper } from "@/src/components/stage-stepper";

type Shot = { id: string; order: number; durationEst: number; productionStatus: string; fields: { action?: string; shotSize?: string; cameraMovement?: string; location?: string; expression?: string; lighting?: string; dialogueOrNarration?: string } };

export function ProductionWorkbench({ projectId, episodeId, title, shots }: { projectId: string; episodeId: string; title: string; shots: Shot[] }) {
  const [selected, setSelected] = useState(shots[0] ?? null);
  useEffect(() => { void fetch(`/api/projects/${projectId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ lastStage: "production" }) }); }, [projectId]);
  return <>
    <StageStepper active="production" episodeId={episodeId} projectId={projectId} />
    <div className="page-head"><div><h1 className="page-title">{title} · 生产工作台</h1><p className="page-copy">M1 使用本地镜头结构预览工作台；提示词生成与即梦反馈将在后续里程碑接入。</p></div><span className="tag">人工数据模式</span></div>
    <div className="workbench">
      <aside className="workbench-left"><strong>镜头清单</strong>{shots.map((shot)=><button className={`scene-item ${selected?.id===shot.id?"active":""}`} key={shot.id} onClick={()=>setSelected(shot)}><strong>SHOT {String(shot.order).padStart(2,"0")}</strong><span>{shot.durationEst}s · {shot.productionStatus}</span></button>)}</aside>
      <section className="workbench-center">{selected?<><div className="preview"><div style={{textAlign:"center"}}><strong style={{fontSize:24}}>SHOT {String(selected.order).padStart(2,"0")}</strong><p>{selected.fields.action || "镜头动作待完善"}</p></div></div><div className="card card-pad" style={{marginTop:16}}><span className="tag">结构化镜头</span><h3>{selected.fields.location || "地点待补充"} · {selected.fields.shotSize?.toUpperCase()}</h3><p>{selected.fields.cameraMovement} · {selected.fields.expression} · {selected.fields.lighting}</p><p className="page-copy">{selected.fields.dialogueOrNarration || "无对白/旁白"}</p></div></>:<div className="empty">还没有镜头数据</div>}</section>
      <aside className="workbench-right"><h3>即梦交接（M2/M3）</h3><div className="warning">下一阶段会在这里生成视频提示词、首帧提示词，并记录复制、提交和生成结果。</div><h3>本集进度</h3><div className="metric-grid"><div className="metric"><strong>{shots.length}</strong><span>总镜头</span></div><div className="metric"><strong>{shots.reduce((sum,shot)=>sum+shot.durationEst,0)}s</strong><span>总时长</span></div></div></aside>
    </div>
  </>;
}
