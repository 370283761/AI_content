import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-mark">幕</span>
        幕次 MuCi
      </Link>
      <nav className="nav-actions">
        <Link className="button secondary" href="/projects">项目空间</Link>
        <Link className="button" href="/projects/new">开始创作</Link>
      </nav>
    </header>
  );
}
