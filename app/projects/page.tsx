import Link from "next/link";

import { ProjectShell } from "@/src/components/project-shell";
import { listProjects } from "@/src/modules/projects/service";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <ProjectShell actions={<Link className="button small" href="/projects/new">+ 新建项目</Link>}>
      <div className="page-head">
        <div><h1 className="page-title">我的视频剧集</h1><p className="page-copy">从最近停下的位置继续，把故事稳定推进到可生产镜头。</p></div>
      </div>
      {projects.length === 0 ? (
        <div className="card empty"><strong>还没有项目</strong>从一个故事创意或小说正文开始。<div style={{ marginTop: 18 }}><Link className="button" href="/projects/new">创建项目</Link></div></div>
      ) : (
        <div className="grid projects-grid">
          {projects.map((project) => (
            <article className="card project-card" key={project.id}>
              <div className="project-cover"><strong>{project.genre}</strong><span>{project.sourceKind}</span></div>
              <div className="project-body">
                <h2 style={{ margin: "0 0 7px", fontSize: 18 }}>{project.name}</h2>
                <div className="meta"><span>阶段：{project.lastStage}</span><span>{project.episodeCount} 集</span><span>{project._count.characters} 角色</span></div>
                <div className="progress"><i style={{ width: `${project.completion}%` }} /></div>
                <div className="inline-actions" style={{ justifyContent: "space-between" }}>
                  <span className="help">更新于 {new Date(project.updatedAt).toLocaleDateString("zh-CN")}</span>
                  <Link className="button small" href={`/projects/${project.id}`}>继续制作</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </ProjectShell>
  );
}
