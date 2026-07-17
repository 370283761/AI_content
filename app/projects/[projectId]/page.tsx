import Link from "next/link";
import { redirect } from "next/navigation";

import { ProjectShell } from "@/src/components/project-shell";
import { ProjectSettingsActions } from "@/src/components/project-settings-actions";
import { getProject } from "@/src/modules/projects/service";

export const dynamic = "force-dynamic";

export default async function ProjectOverview({ params }: { params: Promise<{ projectId: string }> }) {
  const project = await getProject((await params).projectId);
  const episode = project.seasons[0]?.episodes[0];
  const stagePaths: Record<string, string> = {
    setup: `/projects/${project.id}/setup`, planning: `/projects/${project.id}/planning`,
    script: episode ? `/projects/${project.id}/episodes/${episode.id}/script` : `/projects/${project.id}/planning`,
    shots: episode ? `/projects/${project.id}/episodes/${episode.id}/shots` : `/projects/${project.id}/planning`,
    production: episode ? `/projects/${project.id}/episodes/${episode.id}/production` : `/projects/${project.id}/planning`,
  };
  if (project.lastStage !== "setup") redirect(stagePaths[project.lastStage] ?? stagePaths.setup);
  return (
    <ProjectShell actions={<ProjectSettingsActions projectId={project.id} projectName={project.name} />} projectId={project.id} projectName={project.name}>
      <div className="page-head"><div><h1 className="page-title">项目概览</h1><p className="page-copy">当前完成度 {project.completion}%，继续完善设定即可进入分集规划。</p></div></div>
      <div className="grid projects-grid">
        <div className="card card-pad"><h3>原始输入</h3><p className="page-copy">{project.sources[0]?.content.slice(0, 180) || "已保存生成小说参数，等待后续 AI 能力接入。"}</p></div>
        <div className="card card-pad"><h3>项目结构</h3><div className="meta"><span>{project.characters.length} 个角色</span><span>{project.seasons[0]?.episodes.length ?? 0} 集</span></div></div>
        <div className="card card-pad"><h3>继续制作</h3><p className="page-copy">最近阶段：{project.lastStage}</p><Link className="button" href={stagePaths[project.lastStage] ?? stagePaths.setup}>进入工作台</Link></div>
      </div>
    </ProjectShell>
  );
}
