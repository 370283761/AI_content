import Link from "next/link";

import { SiteHeader } from "@/src/components/site-header";

export default function HomePage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="hero">
        <section>
          <div className="tag">面向动漫短剧创作者</div>
          <h1>把一个故事，推进成<span>可生产的视频剧集</span></h1>
          <p>结构化管理故事圣经、角色设定、分集剧本和镜头，最终形成可复制到即梦的生产上下文。M1 先让人工创作闭环稳定、可保存、可继续。</p>
          <div className="hero-actions">
            <Link className="button" href="/projects/new">创建第一部剧集</Link>
            <Link className="button secondary" href="/projects">查看项目</Link>
          </div>
          <div className="proof">
            <div><strong>60s</strong><span>单集目标时长</span></div>
            <div><strong>8–15</strong><span>建议镜头数量</span></div>
            <div><strong>5 阶段</strong><span>完整创作旅程</span></div>
          </div>
        </section>
        <section className="hero-board" aria-label="分镜工作台预览">
          <div className="fake-window">
            <div className="meta">EP01 · 婚礼前夜 · 分镜工作台</div>
            {["建立场景与人物状态", "冲突动作与特写", "反转后的结尾悬念", "承接下一镜的连续性"].map((name, index) => (
              <div className="fake-shot" key={name}>
                <div className="fake-image" />
                <div className="fake-lines"><strong>SHOT {String(index + 1).padStart(2, "0")} · {name}</strong><i /><i /></div>
                <span className="tag">{index + 3}s</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
