"use client";

import { Archive, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProjectSettingsActions({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function patch(body: Record<string, unknown>) { setBusy(true); const response = await fetch(`/api/projects/${projectId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); setBusy(false); if (!response.ok) alert("操作失败，请重试"); return response.ok; }
  async function rename() { const name = window.prompt("新的项目名称", projectName); if (name && await patch({ name })) router.refresh(); }
  async function archive() { if (window.confirm("归档后项目会从默认列表隐藏，但数据不会删除。") && await patch({ status: "archived" })) router.push("/projects"); }
  return <div className="inline-actions"><button className="button secondary small" disabled={busy} onClick={() => void rename()}><Pencil size={12}/> 重命名</button><button className="button danger small" disabled={busy} onClick={() => void archive()}><Archive size={12}/> 归档</button></div>;
}
