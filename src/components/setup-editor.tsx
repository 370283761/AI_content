"use client";

import { Lock, LockOpen, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SaveIndicator } from "@/src/components/save-indicator";
import { StageStepper } from "@/src/components/stage-stepper";
import { useAutoSave } from "@/src/hooks/use-auto-save";

type Bible = { logline: string; theme: string; tone: string; worldbuilding: string; coreConflict: string; mainGoal: string; immutableFacts: string[]; lockedFields: string[] };
type Style = { templateName: string; texture: string; colorLighting: string; composition: string; aspectRatio: string; negativePrompt: string; lockedFields: string[] };
type Character = { id: string; name: string; age: string | null; identity: string; role: string; personality: string; goal: string; visualPrompt: string; lockedFields: string[] };
type Relationship = { id: string; type: string; strength: number; from: { name: string }; to: { name: string } };
type Asset = { id: string; name: string; description: string; visualPrompt: string };
type Project = { id: string; name: string; storyBible: Bible; styleProfile: Style; characters: Character[]; relationships: Relationship[]; locations: Asset[]; props: Asset[] };

async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const result = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(result?.error?.message ?? "请求失败");
  return result;
}

export function SetupEditor({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<"story" | "characters" | "style">("story");
  const [bible, setBible] = useState<Bible | null>(null);
  const [style, setStyle] = useState<Style | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void api(`/api/projects/${projectId}`).then((data: Project) => {
      setProject(data); setBible(data.storyBible); setStyle(data.styleProfile);
    }).catch((error: Error) => setMessage(error.message));
  }, [projectId]);

  const storySave = useAutoSave(bible, async (value) => {
    if (!value) return;
    const body = { ...value } as Partial<Bible>;
    delete body.lockedFields;
    value.lockedFields.forEach((field) => delete body[field as keyof Bible]);
    await api(`/api/projects/${projectId}/bible/story`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  }, Boolean(bible));
  const styleSave = useAutoSave(style, async (value) => {
    if (!value) return;
    const body = { ...value } as Partial<Style>;
    delete body.lockedFields;
    value.lockedFields.forEach((field) => delete body[field as keyof Style]);
    await api(`/api/projects/${projectId}/bible/style`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  }, Boolean(style));

  async function toggleLock(kind: "story" | "style", field: string) {
    const current = kind === "story" ? bible : style;
    if (!current) return;
    const locked = !current.lockedFields.includes(field);
    const result = await api(`/api/projects/${projectId}/bible/${kind}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ field, locked }) });
    if (kind === "story") setBible(result); else setStyle(result);
  }

  async function addCharacter(formData: FormData) {
    try {
      const character = await api(`/api/projects/${projectId}/characters`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: formData.get("name"), age: formData.get("age") || null, identity: formData.get("identity"), role: formData.get("role"), personality: formData.get("personality"), goal: formData.get("goal"), visualPrompt: formData.get("visualPrompt") }),
      });
      setProject((current) => current ? { ...current, characters: [...current.characters, character] } : current);
      setMessage("角色已创建");
    } catch (error) { setMessage(error instanceof Error ? error.message : "创建失败"); }
  }

  async function deleteCharacter(id: string) {
    try {
      await api(`/api/characters/${id}`, { method: "DELETE" });
      setProject((current) => current ? { ...current, characters: current.characters.filter((item) => item.id !== id) } : current);
    } catch (error) { setMessage(error instanceof Error ? error.message : "删除失败"); }
  }

  async function editCharacter(character: Character) {
    const identity = window.prompt("角色身份", character.identity);
    if (identity === null) return;
    const personality = window.prompt("角色性格", character.personality);
    if (personality === null) return;
    const goal = window.prompt("人物目标", character.goal);
    if (goal === null) return;
    try {
      const updated = await api(`/api/characters/${character.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ identity, personality, goal }) });
      setProject((current) => current ? { ...current, characters: current.characters.map((item) => item.id === character.id ? updated : item) } : current);
    } catch (error) { setMessage(error instanceof Error ? error.message : "角色更新失败"); }
  }

  async function toggleCharacterLock(character: Character, field: string) {
    try {
      const updated = await api(`/api/characters/${character.id}/lock`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ field, locked: !character.lockedFields.includes(field) }) });
      setProject((current) => current ? { ...current, characters: current.characters.map((item) => item.id === character.id ? updated : item) } : current);
    } catch (error) { setMessage(error instanceof Error ? error.message : "锁定失败"); }
  }

  async function deleteRelationship(id: string) {
    await api(`/api/relationships/${id}`, { method: "DELETE" });
    setProject((current) => current ? { ...current, relationships: current.relationships.filter((item) => item.id !== id) } : current);
  }

  async function manageAsset(kind: "locations" | "props", asset: Asset, operation: "edit" | "delete") {
    try {
      if (operation === "delete") {
        await api(`/api/${kind}/${asset.id}`, { method: "DELETE" });
        setProject((current) => current ? { ...current, [kind]: current[kind].filter((item) => item.id !== asset.id) } : current);
        return;
      }
      const description = window.prompt("描述", asset.description);
      if (description === null) return;
      const updated = await api(`/api/${kind}/${asset.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ description }) });
      setProject((current) => current ? { ...current, [kind]: current[kind].map((item) => item.id === asset.id ? updated : item) } : current);
    } catch (error) { setMessage(error instanceof Error ? error.message : "资产操作失败"); }
  }

  async function addRelationship(formData: FormData) {
    try {
      const relationship = await api(`/api/projects/${projectId}/relationships`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fromId: formData.get("fromId"), toId: formData.get("toId"), type: formData.get("type"), strength: Number(formData.get("strength")), trajectory: formData.get("trajectory") }) });
      setProject((current) => current ? { ...current, relationships: [...current.relationships, relationship] } : current);
    } catch (error) { setMessage(error instanceof Error ? error.message : "创建关系失败"); }
  }

  async function addAsset(kind: "locations" | "props", formData: FormData) {
    try {
      const asset = await api(`/api/projects/${projectId}/${kind}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: formData.get("name"), description: formData.get("description"), visualPrompt: formData.get("visualPrompt") }) });
      setProject((current) => current ? { ...current, [kind]: [...current[kind], asset] } : current);
    } catch (error) { setMessage(error instanceof Error ? error.message : "创建资产失败"); }
  }

  const score = useMemo(() => {
    if (!bible || !style || !project) return 0;
    const values = [bible.logline, bible.theme, bible.tone, bible.worldbuilding, bible.coreConflict, bible.mainGoal, style.templateName, style.texture, style.colorLighting, style.negativePrompt];
    return Math.round((values.filter(Boolean).length / values.length) * 70 + Math.min(project.characters.length, 3) * 10);
  }, [bible, style, project]);

  if (!project || !bible || !style) return <div className="card empty"><strong>正在加载项目设定…</strong>{message}</div>;
  return (
    <>
      <StageStepper active="setup" projectId={projectId} />
      <div className="page-head">
        <div><h1 className="page-title">项目设定</h1><p className="page-copy">先固定不会轻易变化的故事、角色和视觉事实。</p></div>
        <div className="inline-actions"><SaveIndicator retry={tab === "style" ? styleSave.retry : storySave.retry} state={tab === "style" ? styleSave.state : storySave.state} /><Link className="button" href={`/projects/${projectId}/planning`}>下一步：剧集规划</Link></div>
      </div>
      <div className="tabs">
        <button className={`tab ${tab === "story" ? "active" : ""}`} onClick={() => setTab("story")}>故事圣经</button>
        <button className={`tab ${tab === "characters" ? "active" : ""}`} onClick={() => setTab("characters")}>角色与关系</button>
        <button className={`tab ${tab === "style" ? "active" : ""}`} onClick={() => setTab("style")}>视觉圣经</button>
      </div>
      {message && <div className="warning" style={{ marginBottom: 14 }}>{message}</div>}
      {tab === "story" && <div className="bible-grid">
        {([
          ["logline", "一句话故事", false], ["theme", "主题", false], ["tone", "基调", false], ["coreConflict", "核心冲突", false], ["mainGoal", "主线目标", false], ["worldbuilding", "世界观", true],
        ] as const).map(([field, label, full]) => <div className={`card bible-field ${full ? "full" : ""}`} key={field}>
          <button className={`lock ${bible.lockedFields.includes(field) ? "locked" : ""}`} onClick={() => void toggleLock("story", field)} title="锁定字段">{bible.lockedFields.includes(field) ? <Lock size={12} /> : <LockOpen size={12} />}</button>
          <div className="field" style={{ margin: 0 }}><label>{label}</label><textarea className="textarea" disabled={bible.lockedFields.includes(field)} value={bible[field]} onChange={(event) => setBible({ ...bible, [field]: event.target.value })} /></div>
        </div>)}
        <div className="card bible-field full"><div className="field" style={{ margin: 0 }}><label>不可改变事实（每行一条）</label><textarea className="textarea" value={bible.immutableFacts.join("\n")} onChange={(event) => setBible({ ...bible, immutableFacts: event.target.value.split("\n").filter(Boolean) })} /></div></div>
      </div>}
      {tab === "style" && <div className="bible-grid">
        {([ ["templateName","风格模板"], ["aspectRatio","画面比例"], ["texture","画面质感"], ["colorLighting","色彩与光线"], ["composition","构图倾向"], ["negativePrompt","项目级负面约束"] ] as const).map(([field,label]) => <div className={`card bible-field ${field === "negativePrompt" ? "full" : ""}`} key={field}>
          <button className={`lock ${style.lockedFields.includes(field) ? "locked" : ""}`} onClick={() => void toggleLock("style", field)}>{style.lockedFields.includes(field) ? <Lock size={12} /> : <LockOpen size={12} />}</button>
          <div className="field" style={{ margin: 0 }}><label>{label}</label><textarea className="textarea" disabled={style.lockedFields.includes(field)} value={style[field]} onChange={(event) => setStyle({ ...style, [field]: event.target.value })} /></div>
        </div>)}
      </div>}
      {tab === "characters" && <div className="grid" style={{ gridTemplateColumns: "1fr 340px", alignItems: "start" }}>
        <div className="grid">
          <div className="grid characters">
          {project.characters.map((character) => <article className="card character-card" key={character.id}><div className="character-head"><div><span className="tag">{character.role}</span><h3>{character.name} · {character.age || "年龄待定"}</h3></div><div className="inline-actions"><button className="button secondary small" onClick={() => void editCharacter(character)}>编辑</button><button className="button danger small" onClick={() => void deleteCharacter(character.id)}><Trash2 size={13} /></button></div></div><p className="page-copy">{character.identity || "身份待补充"}</p><p><strong>性格：</strong>{character.personality || "待补充"}</p><p><strong>目标：</strong>{character.goal || "待补充"}</p><div className="help">固定视觉描述：{character.visualPrompt || "待补充"}</div><button className={`lock ${character.lockedFields.includes("visualPrompt") ? "locked" : ""}`} style={{position:"static",marginTop:10}} onClick={() => void toggleCharacterLock(character,"visualPrompt")}>{character.lockedFields.includes("visualPrompt")?<Lock size={12}/>:<LockOpen size={12}/>} 固定视觉描述</button></article>)}
          {project.characters.length === 0 && <div className="card empty"><strong>还没有角色</strong>从主角开始建立角色圣经。</div>}
          </div>
          <div className="card card-pad"><h3>角色关系</h3>{project.relationships.map((relationship)=><div className="inline-actions" style={{padding:"8px 0",borderBottom:"1px solid var(--line)",justifyContent:"space-between"}} key={relationship.id}><div className="meta"><strong>{relationship.from.name} → {relationship.to.name}</strong><span>{relationship.type}</span><span>强度 {relationship.strength}</span></div><button className="button danger small" onClick={()=>void deleteRelationship(relationship.id)}><Trash2 size={12}/></button></div>)}{project.relationships.length===0&&<p className="page-copy">还没有人物关系。</p>}</div>
          <div className="card card-pad"><h3>场景与道具资产</h3><div className="bible-grid">{(["locations","props"] as const).map((kind)=><div key={kind}><strong>{kind==="locations"?"地点":"道具"}</strong>{project[kind].map((asset)=><div className="inline-actions" style={{justifyContent:"space-between",marginTop:8}} key={asset.id}><span className="page-copy">{asset.name} · {asset.description || "描述待补充"}</span><span><button className="button ghost small" onClick={()=>void manageAsset(kind,asset,"edit")}>编辑</button><button className="button ghost small" onClick={()=>void manageAsset(kind,asset,"delete")}>删除</button></span></div>)}</div>)}</div></div>
        </div>
        <div className="grid"><form action={addCharacter} className="card form-section">
          <h3 style={{ marginTop: 0 }}><Plus size={16} /> 新增角色</h3>
          <div className="field"><label>姓名</label><input className="input" name="name" required /></div>
          <div className="bible-grid"><div className="field"><label>年龄</label><input className="input" name="age" /></div><div className="field"><label>角色类型</label><select className="select" name="role"><option value="protagonist">主角</option><option value="antagonist">反派</option><option value="supporting">配角</option></select></div></div>
          <div className="field"><label>身份</label><input className="input" name="identity" /></div><div className="field"><label>性格</label><textarea className="textarea" name="personality" /></div><div className="field"><label>人物目标</label><textarea className="textarea" name="goal" /></div><div className="field"><label>固定视觉描述</label><textarea className="textarea" name="visualPrompt" /></div><button className="button" type="submit">创建角色</button>
        </form>
        {project.characters.length>=2&&<form action={addRelationship} className="card form-section"><h3 style={{marginTop:0}}>新增角色关系</h3><div className="field"><label>起点角色</label><select className="select" name="fromId">{project.characters.map((character)=><option value={character.id} key={character.id}>{character.name}</option>)}</select></div><div className="field"><label>目标角色</label><select className="select" name="toId">{project.characters.map((character)=><option value={character.id} key={character.id}>{character.name}</option>)}</select></div><div className="field"><label>关系类型</label><input className="input" name="type" placeholder="盟友 / 对手 / 亲人" required/></div><div className="field"><label>强度</label><input className="input" defaultValue="50" min="0" max="100" name="strength" type="number"/></div><div className="field"><label>变化轨迹</label><textarea className="textarea" name="trajectory"/></div><button className="button">创建关系</button></form>}
        {(["locations","props"] as const).map((kind)=><form action={(data)=>addAsset(kind,data)} className="card form-section" key={kind}><h3 style={{marginTop:0}}>新增{kind==="locations"?"地点":"道具"}</h3><div className="field"><label>名称</label><input className="input" name="name" required/></div><div className="field"><label>描述</label><textarea className="textarea" name="description"/></div><div className="field"><label>固定视觉描述</label><textarea className="textarea" name="visualPrompt"/></div><button className="button">创建{kind==="locations"?"地点":"道具"}</button></form>)}</div>
      </div>}
      <div className="card card-pad" style={{ marginTop: 16 }}><strong>设定完整度 {score}%</strong><div className="progress"><i style={{ width: `${score}%` }} /></div><span className="help">建议至少完成故事核心、视觉基线和 1 个主角后进入下一步。</span></div>
    </>
  );
}
