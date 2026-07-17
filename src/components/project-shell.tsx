"use client";

import { BookOpen, Clapperboard, LayoutDashboard, ListVideo, Settings2, Video } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ProjectShellProps = {
  projectId?: string;
  projectName?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function ProjectShell({ projectId, projectName, children, actions }: ProjectShellProps) {
  const pathname = usePathname();
  const base = projectId ? `/projects/${projectId}` : "/projects";
  const items = projectId
    ? [
        { href: base, label: "项目概览", icon: LayoutDashboard },
        { href: `${base}/setup`, label: "项目设定", icon: BookOpen },
        { href: `${base}/planning`, label: "剧集规划", icon: ListVideo },
      ]
    : [{ href: "/projects", label: "全部项目", icon: LayoutDashboard }];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">幕</span>
          <span>幕次 MuCi<small>VIDEO STORY STUDIO</small></span>
        </Link>
        <div className="nav-label">工作空间</div>
        {items.map(({ href, label, icon: Icon }) => (
          <Link className={`nav-item ${pathname === href ? "active" : ""}`} href={href} key={href}>
            <Icon size={17} /> {label}
          </Link>
        ))}
        {projectId && (
          <>
            <div className="nav-label">生产阶段</div>
            <div className="nav-item"><Clapperboard size={17} /> 单集剧本</div>
            <div className="nav-item"><Video size={17} /> 分镜与生产</div>
            <div className="nav-item"><Settings2 size={17} /> 项目设置</div>
          </>
        )}
        <div className="sidebar-bottom">M1 · 人工创作闭环<br />自动保存 · 字段锁定 · 数据持久化</div>
      </aside>
      <main className="app-main">
        <header className="app-topbar">
          <div><strong>{projectName ?? "项目空间"}</strong><div className="help">动漫短剧创作工作台</div></div>
          <div className="inline-actions">{actions}<Link className="button secondary small" href="/projects">所有项目</Link></div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
