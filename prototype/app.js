// PROTOTYPE: Three production-workspace variants, switchable with ?variant=A|B|C.
// This file intentionally keeps data and UI logic together. Do not promote it to production.

const sampleSource = `婚礼前夜，林晚从一场噩梦中惊醒。镜子里的她穿着婚纱，银色项链贴在锁骨上——这是她二十七岁那年，被父亲逼迫嫁给顾沉的那一天。

上一世，她为了家族利益完成婚约，却在一年后发现母亲的死亡并非意外。继母苏蓉销毁证据，父亲对此保持沉默，而她最信任的未婚夫顾沉早已知情。

化妆师推门进来，提醒婚礼还有十分钟开始。林晚看着镜中的自己，缓慢取下头纱。她没有哭，只是拿起母亲留下的旧手机。已经停用三年的号码，忽然收到一条消息：想知道你母亲为什么死，今晚十一点，旧码头见。

林晚站起身，将头纱放在桌上：“这场婚礼，到此为止。”`;

const episodes = [
  { n: 1, title: "婚礼前夜", hook: "林晚在婚礼开始前十分钟醒来，发现自己重生。", conflict: "她必须在父亲和宾客赶来之前决定是否再次走进婚礼大厅。", cliff: "母亲的旧手机收到神秘消息：今晚十一点，旧码头见。", duration: 60, shots: 12 },
  { n: 2, title: "当众退婚", hook: "婚礼进行曲响起，林晚却穿着黑色西装走进大厅。", conflict: "父亲试图用母亲留下的股份逼她完成婚约。", cliff: "顾沉低声告诉她：那条短信是我发的。", duration: 58, shots: 11 },
  { n: 3, title: "交易条件", hook: "顾沉承认自己知道母亲死亡的线索。", conflict: "林晚不愿再次信任顾沉，却必须借助他的证据。", cliff: "监控画面里出现了本不该在现场的父亲。", duration: 62, shots: 13 },
  { n: 4, title: "消失的录像", hook: "林晚潜入集团档案室寻找原始监控。", conflict: "继母苏蓉提前清空了所有资料。", cliff: "被撕掉的一页上写着林晚的名字。", duration: 60, shots: 12 },
  { n: 5, title: "继母的警告", hook: "苏蓉第一次撕下温柔伪装。", conflict: "她用林晚弟弟的安全换取手机和证据。", cliff: "弟弟主动出现，却称苏蓉才是救他的人。", duration: 59, shots: 11 },
  { n: 6, title: "被改写的记忆", hook: "弟弟的证词与林晚上一世的记忆完全相反。", conflict: "林晚开始怀疑自己掌握的真相。", cliff: "心理医生的录音证明她曾被长期用药。", duration: 63, shots: 13 },
  { n: 7, title: "父亲的沉默", hook: "林晚把监控截图放在父亲面前。", conflict: "父亲承认在现场，却拒绝说出真正原因。", cliff: "父亲递给她一把母亲保险柜的钥匙。", duration: 60, shots: 12 },
  { n: 8, title: "保险柜", hook: "保险柜里没有证据，只有一份未签字的股权协议。", conflict: "协议显示母亲准备把全部股份交给陌生人。", cliff: "受让人的签名是顾沉的父亲。", duration: 61, shots: 12 },
  { n: 9, title: "旧码头真相", hook: "所有人同时赶到短信约定的旧码头。", conflict: "林晚必须判断谁在利用她逼出最后证据。", cliff: "顾沉替她挡下一击，苏蓉却喊出母亲还活着。", duration: 65, shots: 14 },
  { n: 10, title: "第二次选择", hook: "母亲出现，承认假死是为了保护林晚。", conflict: "林晚必须在复仇、家族和自己的人生之间选择。", cliff: "她撕毁股权协议，走向属于自己的新生活。", duration: 68, shots: 14 }
];

const basePrompt = `现代豪华酒店化妆间，夜晚。27 岁中国女性林晚，黑色自然长直发，冷感鹅蛋脸，穿简洁白色缎面婚纱，佩戴银色水滴项链。她坐在化妆镜前，短暂失神后缓慢抬头，目光从震惊转为冷静坚定。高质量二维动漫短剧，精细赛璐璐上色，冷色低饱和，克制的商业空间布光，浅景深，竖屏 9:16。保持人物脸型、发型、婚纱和银色项链与参考设定一致；画面中不出现字幕、水印或多余人物。`;

const shotSeed = [
  ["01", 3, "化妆间建立镜头", "全景 · 缓慢推进", "豪华酒店化妆间，林晚背对镜头坐在化妆镜前。", "adopted"],
  ["02", 4, "林晚从梦中惊醒", "中近景 · 固定机位", "林晚骤然睁眼，急促呼吸，镜中灯光轻微闪烁。", "adopted"],
  ["03", 4, "确认自己重生", "面部特写 · 缓慢推近", "林晚看着镜中的自己，震惊逐渐转为冷静。", "submitted"],
  ["04", 5, "触摸母亲项链", "手部特写 · 固定机位", "手指触碰银色水滴项链，确认熟悉的触感。", "needs_work"],
  ["05", 4, "摘下白色头纱", "中景 · 侧向跟随", "林晚缓慢摘下头纱，将它放在桌面。", "todo"],
  ["06", 5, "化妆师推门提醒", "双人中景 · 小幅摇镜", "化妆师推门进入，提醒婚礼还有十分钟。", "todo"],
  ["07", 4, "镜中短暂对视", "过肩镜头 · 固定机位", "林晚透过镜子与化妆师短暂对视，保持沉默。", "todo"],
  ["08", 5, "拿起母亲旧手机", "近景 · 向下摇镜", "林晚从抽屉中拿出一部旧手机，屏幕突然亮起。", "todo"],
  ["09", 5, "神秘短信出现", "手机特写 · 固定机位", "屏幕收到未知号码短信，通知今晚十一点旧码头见。", "todo"],
  ["10", 6, "林晚做出决定", "中近景 · 缓慢环绕", "她合上手机，眼神坚定，站起身。", "todo"],
  ["11", 6, "换上黑色西装", "动作蒙太奇 · 快切", "林晚脱下婚纱外层，换上剪裁利落的黑色西装外套。", "todo"],
  ["12", 5, "走向婚礼大厅", "背面全景 · 跟拍", "林晚推门离开化妆间，走廊尽头灯光明亮。", "todo"]
];

const state = {
  route: location.hash.slice(1) || "landing",
  sourceType: "novel",
  source: sampleSource,
  analyzed: false,
  settingsTab: "story",
  selectedEpisode: 1,
  selectedScene: 1,
  selectedShot: 3,
  modal: null,
  failureReasons: [],
  promptVersion: 1,
  locks: { premise: true, goal: false, fact: true, linwan: true, guchen: false, surong: false, visual: true },
  characterAge: 27,
  scriptDialogue: "这场婚礼，到此为止。",
  scriptHistory: [],
  shots: shotSeed.map(([id, duration, title, camera, action, status], index) => ({
    id, duration, title, camera, action, status, scene: index < 7 ? 1 : index < 11 ? 2 : 3,
    character: index === 5 ? "林晚、化妆师" : "林晚",
    outfit: index === 10 || index === 11 ? "黑色西装外套" : "白色缎面婚纱",
    emotion: index < 3 ? "震惊转为克制" : index < 8 ? "冷静、警觉" : "坚定",
    prompt: `${basePrompt} 当前镜头：${action} 摄影要求：${camera}，持续 ${duration} 秒。`,
    versions: 1
  })),
  boardDrawer: false,
  exported: false
};

const routeMeta = {
  projects: ["项目", "我的剧集"], create: ["项目", "创建新项目"], settings: ["重生后我拒绝豪门婚约", "项目设定"],
  episodes: ["重生后我拒绝豪门婚约", "剧集规划"], script: ["第 1 集 · 婚礼前夜", "单集剧本"],
  shots: ["第 1 集 · 婚礼前夜", "分镜编辑"], production: ["第 1 集 · 婚礼前夜", "即梦生产"], export: ["第 1 集 · 婚礼前夜", "交付与导出"]
};

const statusMeta = {
  todo: ["待生成", ""], submitted: ["已提交", "blue"], generated: ["已生成", "orange"], adopted: ["已采用", "green"], needs_work: ["待修改", "red"], discarded: ["已废弃", ""]
};

function navigate(route) {
  state.route = route;
  state.modal = null;
  state.boardDrawer = false;
  location.hash = route;
  window.scrollTo(0, 0);
  render();
}

function getVariant() {
  const value = new URLSearchParams(location.search).get("variant") || "B";
  return ["A", "B", "C"].includes(value) ? value : "A";
}

function setVariant(value) {
  const url = new URL(location.href);
  url.searchParams.set("variant", value);
  history.replaceState({}, "", url);
  render();
}

function cycleVariant(direction) {
  const values = ["A", "B", "C"];
  const next = (values.indexOf(getVariant()) + direction + values.length) % values.length;
  setVariant(values[next]);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function tagStatus(status) {
  const [label, color] = statusMeta[status] || [status, ""];
  return `<span class="tag ${color}"><i class="status-dot"></i>${label}</span>`;
}

function toast(message) {
  const root = document.getElementById("toast-root");
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  root.appendChild(node);
  setTimeout(() => node.remove(), 2400);
}

function shell(content, options = {}) {
  const meta = routeMeta[state.route] || ["幕次", "原型"];
  const current = state.route;
  const steps = [
    ["settings", "项目设定"], ["episodes", "剧集规划"], ["script", "单集剧本"], ["shots", "分镜编辑"], ["production", "即梦生产"], ["export", "交付导出"]
  ];
  const order = steps.map(([id]) => id);
  const currentIndex = order.indexOf(current);
  return `<div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">幕</div><div><div class="brand-name">幕次 MuCi</div><div class="brand-sub">AI SERIES STUDIO</div></div></div>
      <div class="nav-label">工作区</div>
      <button class="nav-item ${current === "projects" ? "active" : ""}" data-nav="projects"><span class="nav-icon">⌂</span>我的项目</button>
      <button class="nav-item ${current === "create" ? "active" : ""}" data-nav="create"><span class="nav-icon">＋</span>创建新项目</button>
      <div class="nav-label">当前项目</div>
      <button class="nav-item ${current === "settings" ? "active" : ""}" data-nav="settings"><span class="nav-icon">◇</span>项目设定</button>
      <button class="nav-item ${current === "episodes" ? "active" : ""}" data-nav="episodes"><span class="nav-icon">≋</span>剧集规划</button>
      <button class="nav-item ${current === "script" ? "active" : ""}" data-nav="script"><span class="nav-icon">文</span>单集剧本</button>
      <button class="nav-item ${current === "shots" ? "active" : ""}" data-nav="shots"><span class="nav-icon">▦</span>分镜编辑</button>
      <button class="nav-item ${current === "production" ? "active" : ""}" data-nav="production"><span class="nav-icon">▶</span>即梦生产</button>
      <button class="nav-item ${current === "export" ? "active" : ""}" data-nav="export"><span class="nav-icon">⇩</span>交付导出</button>
      <div class="sidebar-bottom"><div class="prototype-badge">PROTOTYPE · 本地模拟</div><div class="user-chip"><div class="avatar">林</div><div>创作者体验账号<br><span class="tiny muted">刷新后重置数据</span></div></div></div>
    </aside>
    <main class="main">
      <header class="topbar"><div class="crumbs"><span>${meta[0]}</span><span>／</span><strong>${meta[1]}</strong></div><div class="top-actions"><span class="save-state"><i class="save-dot"></i>所有修改已保存</span><button class="btn small" data-nav="export">预览交付物</button></div></header>
      <div class="content ${options.wide ? "wide" : ""}">
        ${currentIndex >= 0 ? `<div class="stepper">${steps.map(([id, label], i) => `<div class="step ${i < currentIndex ? "done" : ""} ${i === currentIndex ? "active" : ""}" data-num="${i + 1}" data-nav="${id}">${label}</div>`).join("")}</div>` : ""}
        ${content}
      </div>
    </main>
    ${renderModal()}
  </div>`;
}

function renderLanding() {
  return `<div class="hero">
    <section class="hero-copy">
      <div class="eyebrow">PROTOTYPE · AI VIDEO SERIES STUDIO</div>
      <h1>把故事，变成<br><span>可生成的视频剧集。</span></h1>
      <p>从小说分析、角色设定到分镜与即梦提示词，一条清楚、可控、能持续迭代的 AI 动漫剧集生产流程。</p>
      <div class="row" style="margin-top:28px"><button class="btn primary" data-nav="create">开始创建剧集 →</button><button class="btn" data-nav="projects">使用示例项目体验</button></div>
      <div class="hero-proof"><div class="proof-item"><strong>10–20 分钟</strong><span>获得首版单集生产方案</span></div><div class="proof-item"><strong>8–15 镜头</strong><span>逐镜头即梦提示词</span></div><div class="proof-item"><strong>全程可控</strong><span>确认、锁定与版本迭代</span></div></div>
    </section>
    <section class="hero-board"><div class="fake-window"><div class="fake-bar"><i></i><i></i><i></i></div><div class="row between" style="margin-bottom:16px"><div><div class="tiny muted">第 1 集 · 婚礼前夜</div><h2 style="margin:3px 0">即梦生产进度</h2></div><span class="tag green">3/12 已采用</span></div>
      ${shotSeed.slice(0,5).map((s, i) => `<div class="fake-shot"><div class="fake-image"></div><div class="fake-lines"><strong class="small">镜头 ${s[0]} · ${s[2]}</strong><i></i><i></i></div>${tagStatus(s[5])}</div>`).join("")}
      <div class="alert green" style="margin-top:16px">✓ 角色面部、婚纱和银色项链已引用项目固定设定</div>
    </div></section>
  </div>`;
}

function renderProjects() {
  return shell(`<div class="page-head"><div><div class="eyebrow">WORKSPACE</div><h1>我的剧集</h1><p class="subhead">继续创作，或者从一段新的故事开始。</p></div><button class="btn primary" data-nav="create">＋ 创建新项目</button></div>
    <div class="projects-grid">
      <article class="card project-card" data-nav="settings"><div class="project-cover"><span class="tag" style="background:rgba(255,255,255,.15);color:white">都市 · 动漫短剧</span><span class="cover-num">EP 01 / 10</span><h2 style="position:absolute;left:18px;bottom:9px">重生后我拒绝豪门婚约</h2></div><div class="project-body"><div class="row between"><span class="small muted">即梦生产 · 3/12 镜头</span><strong class="small">42%</strong></div><div class="progress" style="margin:9px 0 13px"><i style="width:42%"></i></div><div class="row between"><span class="tag green">继续：镜头 04</span><span class="tiny muted">12 分钟前</span></div></div></article>
      <article class="card project-card"><div class="project-cover" style="background:linear-gradient(135deg,#473c57,#b29bb1)"><span class="tag" style="background:rgba(255,255,255,.15);color:white">国风 · 动漫</span><span class="cover-num">EP 00 / 12</span><h2 style="position:absolute;left:18px;bottom:9px">山海夜行录</h2></div><div class="project-body"><div class="row between"><span class="small muted">项目设定 · 待确认</span><strong class="small">12%</strong></div><div class="progress" style="margin:9px 0 13px"><i style="width:12%;background:#8e6e9b"></i></div><div class="row between"><span class="tag orange">3 项冲突待确认</span><span class="tiny muted">昨天</span></div></div></article>
      <article class="card new-card" data-nav="create"><div><div class="plus">＋</div><h3>创建新剧集</h3><p class="small muted">从小说或故事创意开始</p></div></article>
    </div>`);
}

function renderCreate() {
  return shell(`<div class="page-head"><div><div class="eyebrow">NEW PROJECT</div><h1>从哪里开始这个故事？</h1><p class="subhead">先提供最必要的信息，更多创作偏好可以稍后调整。</p></div></div>
    <div class="create-layout"><section class="card card-pad">
      <div class="source-tabs">
        <button class="source-tab ${state.sourceType === "novel" ? "active" : ""}" data-source="novel"><strong>从小说改编</strong><span class="tiny muted">粘贴章节，提取人物与剧情</span></button>
        <button class="source-tab ${state.sourceType === "idea" ? "active" : ""}" data-source="idea"><strong>从故事创意开始</strong><span class="tiny muted">从一句想法扩展剧集</span></button>
        <button class="source-tab" data-action="example"><strong>使用示例项目</strong><span class="tiny muted">直接体验完整生产流程</span></button>
      </div>
      <div class="grid-2"><div class="field"><label>项目名称</label><input class="input" value="重生后我拒绝豪门婚约"></div><div class="field"><label>内容题材</label><select class="select"><option>都市逆袭短剧</option><option>悬疑短剧</option><option>国风动漫</option></select></div></div>
      <div class="field" style="margin-top:16px"><label>${state.sourceType === "novel" ? "小说正文" : "故事创意"}</label><textarea class="textarea" style="min-height:250px" id="source-input">${escapeHtml(state.source)}</textarea><span class="help">当前约 ${state.source.length} 字。原文会独立保存，不会被 AI 分析结果覆盖。</span></div>
      <div class="grid-3" style="margin-top:16px"><div class="field"><label>单集时长</label><select class="select"><option>60 秒</option><option>30 秒</option><option>90 秒</option></select></div><div class="field"><label>画面比例</label><select class="select"><option>9:16 竖屏</option><option>16:9 横屏</option></select></div><div class="field"><label>视觉风格</label><select class="select"><option>二次元赛璐璐</option><option>国风动漫</option><option>3D 动画</option></select></div></div>
      <div class="row between" style="margin-top:22px"><button class="btn ghost">高级创作偏好⌄</button><button class="btn primary" data-action="analyze">开始分析故事 →</button></div>
    </section><aside class="card card-pad analysis-aside"><div class="eyebrow">本阶段交付</div><h2>项目分析草案</h2><p class="small muted">系统将从输入内容中整理可确认的创作事实。</p><ul class="check-list"><li><span class="check">✓</span>故事摘要与核心卖点</li><li><span class="check">✓</span>主要人物与人物关系</li><li><span class="check">✓</span>核心冲突与主线目标</li><li><span class="check">✓</span>推荐剧集结构与镜头数</li><li><span class="check">✓</span>矛盾、缺失信息与风险提醒</li></ul><div class="alert" style="margin-top:16px">下一步你只需要逐项修改、确认和锁定，不需要自己从空白开始写设定。</div></aside></div>`);
}

function lockButton(key) {
  return `<button class="lock ${state.locks[key] ? "locked" : ""}" data-lock="${key}">${state.locks[key] ? "🔒 已锁定" : "🔓 锁定"}</button>`;
}

function storySettings() {
  return `<div class="bible-grid"><article class="card bible-card full">${lockButton("premise")}<div class="tiny muted">一句话故事</div><h2 style="margin-top:7px">重生回婚礼当天的豪门继承人，为查清母亲死亡真相，当众撕毁婚约并夺回自己的人生。</h2><div class="row"><span class="tag green">来自原文</span><span class="tag">已确认</span></div></article>
    <article class="card bible-card">${lockButton("goal")}<div class="tiny muted">主角核心目标</div><h3 style="margin-top:8px">摆脱家族控制，调查母亲死亡真相</h3><p class="small muted">外在目标与角色成长线的共同驱动力。</p><div class="row"><button class="btn small">编辑</button><button class="btn small ghost">重新生成</button></div></article>
    <article class="card bible-card">${lockButton("fact")}<div class="tiny muted">不可改变的事实</div><h3 style="margin-top:8px">母亲留下的银色项链是贯穿全剧的关键物证</h3><p class="small muted">该事实被 8 个镜头和 8 条提示词引用。</p><span class="tag green">已确认</span></article>
    <article class="card bible-card full"><div class="tiny muted">核心冲突</div><p style="font-size:15px;line-height:1.7;margin:8px 0 13px">林晚必须利用自己不再信任的未婚夫，抢在继母销毁证据前查清母亲死亡真相，同时挣脱父亲以家族利益为名的控制。</p><div class="row"><span class="tag">家族控制</span><span class="tag">信任危机</span><span class="tag">身份成长</span></div></article></div>`;
}

function characterCard(name, role, key, tone, details) {
  return `<article class="card character-card"><div class="character-portrait ${tone}">${lockButton(key)}</div><div class="row between"><div><h3>${name}</h3><span class="tag green">${role}</span></div><button class="btn small">编辑</button></div><dl class="character-meta">${details.map(([k,v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl><div class="divider"></div><button class="btn small" data-action="copy-character">复制固定视觉描述</button></article>`;
}

function characterSettings() {
  return `<div class="character-grid">${characterCard("林晚", "主角", "linwan", "", [["年龄", `<input id="character-age" class="input" style="padding:4px 7px;width:55px" value="${state.characterAge}"> 岁`],["身份","林氏集团继承人"],["外貌","黑色长直发，冷感鹅蛋脸"],["本集造型","白色婚纱 → 黑色西装"],["标志物","银色水滴项链"],["禁止变化","发色、项链、年龄感"]])}${characterCard("顾沉", "关键角色", "guchen", "dark", [["年龄","30 岁"],["身份","顾氏集团继承人"],["性格","冷静、隐忍、目的不明"],["常用服装","深灰色定制西装"],["标志物","黑色机械腕表"],["禁止变化","短发、腕表、身高差"]])}${characterCard("苏蓉", "主要对手", "surong", "warm", [["年龄","48 岁"],["身份","林晚继母"],["性格","温柔表象、强控制欲"],["常用服装","米白色高级套装"],["标志物","祖母绿戒指"],["禁止变化","短卷发、戒指、妆容"]])}</div>`;
}

function visualSettings() {
  return `<div class="grid-2"><article class="card card-pad selected-outline">${lockButton("visual")}<div class="character-portrait" style="height:220px"></div><div class="eyebrow" style="margin-top:15px">SELECTED STYLE</div><h2>二次元赛璐璐</h2><p class="small muted">现代都市动漫短剧，冷色低饱和，精细线稿与赛璐璐上色，克制的商业空间布光，浅景深，纵向构图。</p><div class="row"><span class="tag green">9:16</span><span class="tag">冷色低饱和</span><span class="tag">动漫质感</span></div></article><section class="stack"><article class="card card-pad"><h3>项目级视觉约束</h3><div class="field"><label>画面风格</label><textarea class="textarea">现代都市动漫短剧，低饱和冷色调，精细线稿与赛璐璐上色，克制的商业空间布光，浅景深，竖屏构图。</textarea></div><div class="field"><label>排除内容</label><textarea class="textarea" style="min-height:85px">避免写实真人皮肤、过度饱和、字幕、水印、画面文字、多余人物和肢体变形。</textarea></div></article><div class="alert green">✓ 该视觉设定会自动注入所有镜头提示词。</div></section></div>`;
}

function renderSettings() {
  const tab = state.settingsTab;
  return shell(`<div class="page-head"><div><div class="eyebrow">STEP 1 · PROJECT BIBLE</div><h1>先把不能漂移的内容定下来</h1><p class="subhead">这些已确认设定将成为后续剧本、分镜和提示词的共同事实来源。</p></div><button class="btn primary" data-nav="episodes">确认设定，规划剧集 →</button></div>
    <div class="settings-layout"><section><div class="tabs"><button class="tab ${tab === "story" ? "active" : ""}" data-settings-tab="story">故事设定</button><button class="tab ${tab === "characters" ? "active" : ""}" data-settings-tab="characters">角色设定 · 3</button><button class="tab ${tab === "visual" ? "active" : ""}" data-settings-tab="visual">视觉风格</button></div>${tab === "story" ? storySettings() : tab === "characters" ? characterSettings() : visualSettings()}</section>
    <aside><article class="card quality-card"><div class="eyebrow">设定完整度</div><div class="score-ring"><strong>88%</strong></div><ul class="check-list"><li><span class="check">✓</span>故事主线已确认</li><li><span class="check">✓</span>3 个主要角色已建立</li><li><span class="check">✓</span>视觉风格已锁定</li><li><span style="color:#b4662d">!</span>顾沉的真实动机尚未确认</li></ul><div class="alert" style="margin-top:14px">年龄冲突已解决：原文中的“26 岁”被确认为回忆时间点，当前年龄固定为 27 岁。</div></article></aside></div>`);
}

function renderEpisodes() {
  return shell(`<div class="page-head"><div><div class="eyebrow">STEP 2 · SEASON PLAN</div><h1>十集，完成一次命运改写</h1><p class="subhead">先看清整季结构，再聚焦制作第 1 集。</p></div><button class="btn primary" data-nav="script">制作第 1 集剧本 →</button></div>
    <div class="episode-summary"><article class="card story-curve"><div class="row between"><div><h3>整季张力曲线</h3><span class="tiny muted">重生觉醒 → 调查受阻 → 真相反转 → 主动选择</span></div><span class="tag green">10 集 · 约 10 分钟</span></div><div class="curve"><svg viewBox="0 0 800 100" preserveAspectRatio="none"><path d="M0,78 C70,78 80,56 150,57 S250,75 315,42 S410,22 480,49 S585,72 645,26 S730,35 800,9" fill="none" stroke="#2f8a68" stroke-width="4"/><path d="M0,100 L0,78 C70,78 80,56 150,57 S250,75 315,42 S410,22 480,49 S585,72 645,26 S730,35 800,9 L800,100Z" fill="rgba(47,138,104,.10)"/></svg></div><div class="curve-labels"><span>退婚</span><span>结盟</span><span>证据消失</span><span>记忆反转</span><span>真相揭露</span></div></article><article class="card card-pad"><h3>连续性检查</h3><ul class="check-list"><li><span class="check">✓</span>主角目标贯穿 10 集</li><li><span class="check">✓</span>银色项链在第 1、4、9 集出现</li><li><span style="color:#b4662d">!</span>第 3 集出现监控截图，建议在第 2 集提前铺垫来源</li></ul><button class="btn small" style="margin-top:12px">查看全部 3 条建议</button></article></div>
    <div class="episode-grid">${episodes.map(ep => `<article class="card episode-card ${ep.n === state.selectedEpisode ? "selected" : ""}" data-episode="${ep.n}"><div class="episode-index">EPISODE ${String(ep.n).padStart(2,"0")}</div><h2>${ep.title}</h2><p><strong>开场钩子：</strong>${ep.hook}</p><p><strong>核心冲突：</strong>${ep.conflict}</p><div class="alert ${ep.n === 1 ? "green" : ""}"><strong>结尾悬念：</strong>${ep.cliff}</div><div class="metrics"><span>◷ ${ep.duration} 秒</span><span>▦ ${ep.shots} 镜头</span><span>◎ ${ep.n < 4 ? "第一幕" : ep.n < 8 ? "第二幕" : "第三幕"}</span></div>${ep.n === 1 ? `<button class="btn primary small" data-nav="script">进入剧本制作</button>` : `<button class="btn small">编辑本集</button>`}</article>`).join("")}</div>`);
}

function renderScript() {
  return shell(`<div class="page-head"><div><div class="eyebrow">STEP 3 · EPISODE SCRIPT</div><h1>第 1 集 · 婚礼前夜</h1><p class="subhead">目标时长 60 秒。选中或直接编辑内容，再用右侧 AI 做局部调整。</p></div><button class="btn primary" data-nav="shots">确认剧本，生成分镜 →</button></div>
    <div class="script-layout"><aside class="card scene-nav"><div class="row between" style="padding:6px 8px 10px"><strong class="small">场景</strong><button class="btn small icon">＋</button></div>${[[1,"酒店化妆间","夜 · 34 秒"],[2,"酒店走廊","夜 · 18 秒"],[3,"婚礼大厅门外","夜 · 8 秒"]].map(s => `<button class="scene-item ${state.selectedScene===s[0]?"active":""}" data-scene="${s[0]}"><strong>${s[0]}. ${s[1]}</strong><span>${s[2]}</span></button>`).join("")}<div class="divider"></div><div class="tiny muted" style="padding:8px">预计总时长：60 秒<br>对白：14 秒 · 旁白：8 秒</div></aside>
    <article class="card script-paper"><div class="script-title"><div class="tiny muted">第 1 集</div><h2>婚礼前夜</h2></div><div class="scene-heading">场景 1 · 酒店化妆间 · 夜 · 34 秒</div>
      <div class="script-block"><div class="script-label">画面</div><div class="script-text" contenteditable="true">化妆镜上的灯一盏盏亮着。林晚穿着白色婚纱，猛然从梦中惊醒。她急促呼吸，抬头看向镜子。</div></div>
      <div class="script-block"><div class="script-label">旁白</div><div class="script-text" contenteditable="true">上一世，就是今天。她走进那场婚姻，也走进了所有人为她准备好的陷阱。</div></div>
      <div class="script-block"><div class="script-label">动作与情绪</div><div class="script-text" contenteditable="true">林晚触碰锁骨上的银色项链。震惊在几秒内退去，眼神变得冷静。她缓慢取下头纱，放在桌面。</div></div>
      <div class="script-block dialogue"><strong>化妆师</strong><div class="script-text" contenteditable="true">林小姐，婚礼还有十分钟开始。</div></div>
      <div class="script-block dialogue selected-outline"><strong>林晚</strong><div class="script-text" id="main-dialogue" contenteditable="true">${state.scriptDialogue}</div></div>
      <div class="script-block"><div class="script-label">画面</div><div class="script-text" contenteditable="true">抽屉里的旧手机突然亮起。未知号码发来一条短信：想知道你母亲为什么死，今晚十一点，旧码头见。</div></div>
      <div class="alert green">场景目标：完成“重生确认 → 拒绝婚礼 → 谜团出现”的情绪转折。</div>
    </article><aside class="card ai-tools"><div class="eyebrow">LOCAL AI TOOLS</div><h3>局部优化</h3><p class="tiny muted">当前已选择林晚的对白。</p>${[["dialogue","优化对白"],["conflict","加强冲突"],["shorten","缩短内容"],["narration","改成旁白"],["rewrite","保持原意重写"]].map(([a,l]) => `<button class="tool-button" data-script-action="${a}">✦ ${l}</button>`).join("")}<button class="tool-button" data-script-action="undo" ${state.scriptHistory.length ? "" : "disabled"}>↶ 恢复上一版</button><div class="divider"></div><h3>时长预算</h3><div class="time-stat"><div><strong>60s</strong><span>预计画面</span></div><div><strong>60s</strong><span>目标时长</span></div><div><strong>14s</strong><span>对白</span></div><div><strong>12</strong><span>建议镜头</span></div></div><div class="alert" style="margin-top:13px">提示：场景 1 包含 3 个连续动作，拆分镜头时应避免放入同一次生成。</div></aside></div>`);
}

function shotCard(shot) {
  return `<article class="card shot-card ${Number(shot.id) === state.selectedShot ? "active" : ""}" data-shot="${Number(shot.id)}"><div class="shot-num"><strong>${shot.id}</strong><span>${shot.duration} 秒</span></div><div class="shot-thumb"></div><div class="shot-info"><h3>${shot.title}</h3><p>${shot.action}</p><div class="row"><span class="tag">${shot.camera}</span><span class="tag">${shot.character}</span></div></div><div>${tagStatus(shot.status)}</div></article>`;
}

function selectedShot() {
  return state.shots.find(s => Number(s.id) === state.selectedShot) || state.shots[0];
}

function renderShotDetails(shot, production = false) {
  return `<div class="detail-preview"></div><div class="row between"><div><div class="tiny muted">镜头 ${shot.id} · ${shot.duration} 秒</div><h2>${shot.title}</h2></div>${tagStatus(shot.status)}</div><div class="detail-grid"><div class="detail-box"><span>景别与运镜</span><strong>${shot.camera}</strong></div><div class="detail-box"><span>角色与造型</span><strong>${shot.character} · ${shot.outfit}</strong></div><div class="detail-box"><span>动作</span><strong>${shot.action}</strong></div><div class="detail-box"><span>情绪</span><strong>${shot.emotion}</strong></div></div><div class="alert ${Number(shot.id) === 4 ? "red" : "green"}">${Number(shot.id) === 4 ? "! 与下一镜头存在服装连续性风险：请确认换装是否发生在画面内。" : "✓ 角色、造型和场景与相邻镜头一致。"}</div><div class="row between" style="margin:15px 0 8px"><h3 style="margin:0">即梦视频提示词 · V${shot.versions}</h3><button class="btn small" data-action="copy-prompt">复制</button></div><div class="prompt-box">${shot.prompt}</div>${production ? "" : `<div class="row" style="margin-top:12px"><button class="btn small" data-action="regen-prompt">重新生成</button><button class="btn small" data-action="split-shot">拆分镜头</button><button class="btn small">🔒 锁定</button></div>`}`;
}

function renderShots() {
  const shot = selectedShot();
  return shell(`<div class="page-head"><div><div class="eyebrow">STEP 4 · SHOT DESIGN</div><h1>把一集变成 12 个可生成任务</h1><p class="subhead">每个镜头都应只有清晰的主体、动作、镜头语言和连续性条件。</p></div><div class="row"><button class="btn">连续性检查 · 2</button><button class="btn primary" data-nav="production">确认分镜，进入生产 →</button></div></div><div class="shots-layout"><section class="shot-list">${state.shots.map(shotCard).join("")}</section><aside class="card shot-details">${renderShotDetails(shot)}</aside></div>`, {wide:true});
}

function productionHeader() {
  const counts = Object.fromEntries(Object.keys(statusMeta).map(k => [k, state.shots.filter(s => s.status === k).length]));
  return `<div class="production-head"><div><div class="eyebrow">STEP 5 · JIMENG PRODUCTION</div><h1>第 1 集生产工作台</h1><p class="subhead">复制提示词到即梦，回填结果，逐镜头完成视频素材。</p></div><div class="prod-stats"><div class="stat-pill"><strong>${state.shots.length}</strong><span>总镜头</span></div><div class="stat-pill"><strong>${counts.adopted}</strong><span>已采用</span></div><div class="stat-pill"><strong>${counts.todo}</strong><span>待生成</span></div><div class="stat-pill"><strong>${counts.needs_work}</strong><span>待修改</span></div></div></div>`;
}

function productionControls(shot) {
  return `<div class="row wrap"><button class="btn primary" data-action="copy-prompt">复制视频提示词</button><button class="btn" data-action="submit-shot">标记已提交</button><button class="btn" data-action="failure">记录生成问题</button><button class="btn lime" data-action="adopt-shot">标记采用，下一镜头 →</button></div>`;
}

function productionWizard() {
  const shot = selectedShot();
  return `<div class="wizard-layout"><aside class="card wizard-rail"><div class="row between" style="padding:5px 8px 11px"><strong class="small">镜头队列</strong><span class="tiny muted">${state.shots.filter(s=>s.status==="adopted").length}/${state.shots.length}</span></div>${state.shots.map(s => `<button class="rail-shot ${Number(s.id)===state.selectedShot?"active":""}" data-shot="${Number(s.id)}"><span class="rail-num">${s.id}</span><span><strong class="small">${s.title}</strong><span class="tiny muted" style="display:block">${s.duration} 秒 · ${s.camera.split(" · ")[0]}</span></span>${tagStatus(s.status)}</button>`).join("")}</aside><section class="card wizard-main"><div class="row between" style="margin-bottom:13px"><div><span class="tag green">当前任务</span><h2 style="margin:8px 0 0">镜头 ${shot.id} · ${shot.title}</h2></div><span class="small muted">步骤 1/3：复制并生成</span></div><div class="video-stage"><span class="play">▶</span></div><div class="row between" style="margin:15px 0 8px"><h3 style="margin:0">即梦提示词 · V${shot.versions}</h3><button class="btn small" data-action="copy-prompt">复制</button></div><div class="prompt-large">${shot.prompt}</div>${productionControls(shot)}</section><aside class="card wizard-side"><div class="eyebrow">REFERENCE</div><h3>本镜头参考</h3><div class="asset-thumb"></div><strong class="small">林晚 · 本集固定造型</strong><p class="tiny muted">白色缎面婚纱，黑色长直发，银色水滴项链。</p><div class="divider"></div><h3>连续性</h3><p class="small muted">延续上一镜头坐姿和婚纱造型；下一镜头继续保持镜前位置。</p><div class="alert green">✓ 已引用角色与视觉圣经</div></aside></div>`;
}

function productionWorkbench() {
  const shot = selectedShot();
  return `<div class="workbench"><aside class="workbench-left"><div class="row between" style="margin:4px 4px 10px"><strong class="small">镜头</strong><span class="tiny muted">场景 1</span></div>${state.shots.map(s => `<button class="rail-shot ${Number(s.id)===state.selectedShot?"active":""}" data-shot="${Number(s.id)}"><span class="rail-num">${s.id}</span><span><strong class="small">${s.title}</strong><span class="tiny muted" style="display:block">${s.duration}s · ${s.versions} 版</span></span><span class="status-dot" style="color:${s.status==="adopted"?"#2f8a68":s.status==="needs_work"?"#c44b42":"#829089"}"></span></button>`).join("")}</aside><section class="workbench-center"><div class="wb-stage"><div class="wb-preview"><span class="play">▶</span></div><div class="wb-structure"><div class="row between"><div><div class="tiny muted">镜头 ${shot.id} · ${shot.duration} 秒</div><h2>${shot.title}</h2></div>${tagStatus(shot.status)}</div><div class="detail-grid"><div class="detail-box"><span>主体</span><strong>${shot.character}</strong></div><div class="detail-box"><span>造型</span><strong>${shot.outfit}</strong></div><div class="detail-box"><span>动作</span><strong>${shot.action}</strong></div><div class="detail-box"><span>摄影</span><strong>${shot.camera}</strong></div></div><div class="field"><label>动作描述</label><textarea class="textarea" style="min-height:78px">${shot.action}</textarea></div><div class="field" style="margin-top:10px"><label>连续性要求</label><textarea class="textarea" style="min-height:72px">保持林晚面部、发型、坐姿、婚纱和银色项链与上一镜头一致。</textarea></div></div></div><div class="wb-prompt"><div class="row between" style="margin-bottom:8px"><strong class="small">即梦视频提示词 · V${shot.versions}</strong><button class="btn small" data-action="copy-prompt">复制</button></div><div class="prompt-box" style="max-height:105px">${shot.prompt}</div><div style="margin-top:10px">${productionControls(shot)}</div></div></section><aside class="workbench-right"><div class="eyebrow">ASSETS & HISTORY</div><h3>参考资产</h3><div class="asset-thumb"></div><div class="row between"><span class="small">林晚角色参考</span><span class="tag green">已锁定</span></div><div class="asset-thumb" style="background:linear-gradient(155deg,#655f57,#c7c1b2)"></div><div class="row between"><span class="small">酒店化妆间</span><span class="tag">场景</span></div><div class="divider"></div><h3>生成记录</h3><ul class="check-list"><li><span class="check">✓</span>V1 已于 10:28 提交即梦</li><li><span style="color:#b4662d">!</span>结果 01：运镜不明显</li></ul><button class="btn small" data-action="failure">＋ 回填新结果</button></aside></div>`;
}

function productionBoard() {
  const groups = [["todo","待生成"],["submitted","已提交"],["needs_work","待修改"],["adopted","已采用"]];
  return `<div class="board">${groups.map(([key,label]) => { const list = state.shots.filter(s => s.status === key || (key === "submitted" && s.status === "generated")); return `<section class="board-col"><div class="board-head"><span>${label}</span><span class="count">${list.length}</span></div>${list.length ? list.map(s => `<article class="task-card ${Number(s.id)===state.selectedShot&&state.boardDrawer?"active":""}" data-board-shot="${Number(s.id)}"><div class="task-preview"></div><div class="row between"><h3>镜头 ${s.id} · ${s.title}</h3><span class="tiny muted">${s.duration}s</span></div><p>${s.action}</p><div class="row between"><span class="tag">V${s.versions}</span>${tagStatus(s.status)}</div></article>`).join("") : `<div class="empty-mini">暂无镜头</div>`}</section>`; }).join("")}</div>${state.boardDrawer ? `<aside class="board-drawer"><button class="btn small icon" style="float:right" data-action="close-drawer">×</button>${renderShotDetails(selectedShot(), true)}<div style="margin-top:14px">${productionControls(selectedShot())}</div></aside>` : ""}`;
}

function variantSwitcher() {
  const variant = getVariant();
  const names = { A: "步骤向导", B: "专业工作台", C: "生产任务板" };
  return `<div class="variant-switcher"><button data-variant-cycle="-1">←</button><div class="variant-label"><strong>${variant}</strong> — ${names[variant]}<br><span style="color:#9cad9f">方向键切换方案</span></div><button data-variant-cycle="1">→</button></div>`;
}

function renderProduction() {
  const variant = getVariant();
  const body = variant === "A" ? productionWizard() : variant === "B" ? productionWorkbench() : productionBoard();
  return shell(`${productionHeader()}${body}${variantSwitcher()}`, {wide:true});
}

function renderExport() {
  const adopted = state.shots.filter(s => s.status === "adopted").length;
  return shell(`<div class="page-head"><div><div class="eyebrow">STEP 6 · DELIVERY</div><h1>第 1 集视频生产包</h1><p class="subhead">在线项目持续沉淀资产；生产包可以交给即梦操作人员独立执行。</p></div><button class="btn primary" data-action="export-package">生成并下载生产包</button></div><div class="export-layout"><section class="stack"><article class="card card-pad"><div class="row between"><div><h2>第01集-婚礼前夜.zip</h2><p class="small muted">预计 8.4 MB · 最后更新刚刚</p></div><span class="tag ${adopted===state.shots.length?"green":"orange"}">${adopted}/${state.shots.length} 镜头已采用</span></div><div class="progress" style="margin:12px 0"><i style="width:${Math.round(adopted/state.shots.length*100)}%"></i></div><div class="alert">仍有 ${state.shots.length-adopted} 个镜头未标记为采用。你仍然可以导出当前进度，缺失项会在制作进度表中注明。</div></article><article class="card"><div class="deliverable"><div class="file-icon">MD</div><div><strong class="small">01-单集剧本.md</strong><div class="tiny muted">3 个场景 · 60 秒结构化剧本</div></div><span class="tag green">完整</span></div><div class="deliverable"><div class="file-icon">XLSX</div><div><strong class="small">02-分镜脚本.xlsx</strong><div class="tiny muted">${state.shots.length} 个镜头 · 连续性与摄影信息</div></div><span class="tag green">完整</span></div><div class="deliverable"><div class="file-icon">MD</div><div><strong class="small">03-即梦提示词.md</strong><div class="tiny muted">按镜头排列的视频与首帧提示词</div></div><span class="tag green">完整</span></div><div class="deliverable"><div class="file-icon">XLSX</div><div><strong class="small">04-制作进度.xlsx</strong><div class="tiny muted">状态、版本、生成次数与失败原因</div></div><span class="tag green">完整</span></div><div class="deliverable"><div class="file-icon">TXT</div><div><strong class="small">单镜头提示词</strong><div class="tiny muted">每个镜头的视频与首帧提示词 TXT</div></div><span class="tag green">完整</span></div></article></section><aside class="card package-tree"><div class="eyebrow">PACKAGE PREVIEW</div><div class="tree-folder">▾ 第01集-婚礼前夜/</div><div class="tree-file">├── 01-单集剧本.md</div><div class="tree-file">├── 02-分镜脚本.xlsx</div><div class="tree-file">├── 03-即梦提示词.md</div><div class="tree-file">├── 04-制作进度.xlsx</div><div class="tree-file">├── 角色参考/</div><div class="tree-file">│　├── 林晚-角色卡.png</div><div class="tree-file">│　├── 顾沉-角色卡.png</div><div class="tree-file">│　└── 苏蓉-角色卡.png</div><div class="tree-file">├── 场景参考/</div><div class="tree-file">└── 镜头素材/</div>${state.shots.slice(0,4).map(s=>`<div class="tree-file">　　├── S01-C${s.id}/</div>`).join("")}<div class="tree-file">　　└── ...</div></aside></div>`);
}

function renderModal() {
  if (!state.modal) return "";
  if (state.modal === "analyzing") return `<div class="modal-backdrop"><div class="modal" style="text-align:center"><div class="loader"></div><h2>正在理解你的故事</h2><p class="muted">识别人物、关系、冲突与可改编结构…</p><div class="progress"><i style="width:72%"></i></div><p class="tiny muted" style="margin-top:11px">原始文本已经保存，可以安全离开此步骤。</p></div></div>`;
  if (state.modal === "impact") return `<div class="modal-backdrop"><div class="modal"><div class="eyebrow">IMPACT CHECK</div><h2>角色设定修改会影响下游内容</h2><p class="muted">你将林晚的年龄从 27 岁修改为 ${state.characterAge} 岁。</p><div class="grid-3" style="margin:18px 0"><div class="detail-box"><span>受影响</span><strong>8 个镜头</strong></div><div class="detail-box"><span>受影响</span><strong>8 条提示词</strong></div><div class="detail-box"><span>保持不变</span><strong>2 个锁定镜头</strong></div></div><div class="alert">同步更新只作用于未锁定内容。已锁定镜头会保留旧设定，并显示差异提醒。</div><div class="modal-actions"><button class="btn" data-action="cancel-modal">取消</button><button class="btn" data-action="save-upstream">仅保存设定</button><button class="btn primary" data-action="sync-impact">同步更新未锁定内容</button></div></div></div>`;
  if (state.modal === "failure") return `<div class="modal-backdrop"><div class="modal"><div class="eyebrow">GENERATION FEEDBACK</div><h2>这次生成哪里不对？</h2><p class="small muted">选择问题后，系统会保留当前版本并生成有针对性的 V${selectedShot().versions + 1}。</p><div class="failure-list">${["人脸不一致","人物数量错误","动作错误或变形","服装变化","场景漂移","运镜不明显","风格不统一","出现文字或水印"].map(reason=>`<div class="failure-option ${state.failureReasons.includes(reason)?"selected":""}" data-failure-reason="${reason}"><span>${state.failureReasons.includes(reason)?"✓":"○"}</span>${reason}</div>`).join("")}</div><div class="field"><label>补充说明（可选）</label><textarea class="textarea" style="min-height:70px" placeholder="例如：画面里多出一名女性，主角婚纱变成了黑色礼服"></textarea></div><div class="modal-actions"><button class="btn" data-action="cancel-modal">取消</button><button class="btn primary" data-action="optimize-prompt" ${state.failureReasons.length?"":"disabled"}>生成优化版本</button></div></div></div>`;
  if (state.modal === "exported") return `<div class="modal-backdrop"><div class="modal" style="text-align:center"><div style="width:62px;height:62px;border-radius:50%;background:var(--green-soft);color:var(--green);display:grid;place-items:center;font-size:28px;margin:0 auto 16px">✓</div><h2>生产包已生成</h2><p class="muted">原型已模拟完成导出。正式产品将在这里下载 ZIP 文件。</p><div class="alert green" style="text-align:left">包含剧本 MD、分镜 XLSX、即梦提示词 MD/TXT、制作进度和镜头素材目录。</div><div class="modal-actions"><button class="btn primary" data-action="cancel-modal">完成</button></div></div></div>`;
  return "";
}

function render() {
  const app = document.getElementById("app");
  const routes = { landing: renderLanding, projects: renderProjects, create: renderCreate, settings: renderSettings, episodes: renderEpisodes, script: renderScript, shots: renderShots, production: renderProduction, export: renderExport };
  app.innerHTML = (routes[state.route] || renderLanding)();
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) return navigate(nav.dataset.nav);

  const source = event.target.closest("[data-source]");
  if (source) { state.sourceType = source.dataset.source; return render(); }

  const settingsTab = event.target.closest("[data-settings-tab]");
  if (settingsTab) { state.settingsTab = settingsTab.dataset.settingsTab; return render(); }

  const lock = event.target.closest("[data-lock]");
  if (lock) { state.locks[lock.dataset.lock] = !state.locks[lock.dataset.lock]; toast(state.locks[lock.dataset.lock] ? "已锁定，后续 AI 不会自动覆盖" : "已解锁，可以继续编辑"); return render(); }

  const episode = event.target.closest("[data-episode]");
  if (episode) { state.selectedEpisode = Number(episode.dataset.episode); return render(); }

  const scene = event.target.closest("[data-scene]");
  if (scene) { state.selectedScene = Number(scene.dataset.scene); toast(`已切换到场景 ${state.selectedScene}`); return render(); }

  const shot = event.target.closest("[data-shot]");
  if (shot) { state.selectedShot = Number(shot.dataset.shot); return render(); }

  const boardShot = event.target.closest("[data-board-shot]");
  if (boardShot) { state.selectedShot = Number(boardShot.dataset.boardShot); state.boardDrawer = true; return render(); }

  const cycle = event.target.closest("[data-variant-cycle]");
  if (cycle) return cycleVariant(Number(cycle.dataset.variantCycle));

  const failureReason = event.target.closest("[data-failure-reason]");
  if (failureReason) {
    const reason = failureReason.dataset.failureReason;
    state.failureReasons = state.failureReasons.includes(reason) ? state.failureReasons.filter(x => x !== reason) : [...state.failureReasons, reason];
    return render();
  }

  const scriptAction = event.target.closest("[data-script-action]");
  if (scriptAction) {
    const action = scriptAction.dataset.scriptAction;
    if (action === "undo") {
      if (state.scriptHistory.length) state.scriptDialogue = state.scriptHistory.pop();
      toast("已恢复上一版对白");
      return render();
    }
    state.scriptHistory.push(state.scriptDialogue);
    const choices = {
      dialogue: "婚礼照常开始，只是新娘不会再是我。",
      conflict: "你们想要的婚礼，今天不会发生。谁拦我，我就让谁先失去一切。",
      shorten: "婚礼取消。",
      narration: "这一世，她不会再走进那场婚礼。",
      rewrite: "从现在开始，我不再替任何人完成这场婚礼。"
    };
    state.scriptDialogue = choices[action];
    toast("只改写了当前选中的对白，可随时恢复");
    return render();
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;
  const type = action.dataset.action;
  if (type === "example") return navigate("settings");
  if (type === "analyze") {
    state.source = document.getElementById("source-input")?.value || state.source;
    state.modal = "analyzing"; render();
    setTimeout(() => { state.analyzed = true; state.modal = null; state.settingsTab = "story"; navigate("settings"); toast("故事分析完成：识别 3 个主要角色和 1 项年龄冲突"); }, 1500);
  }
  if (type === "copy-character") { navigator.clipboard?.writeText("27 岁中国女性，黑色自然长直发，冷感鹅蛋脸，佩戴银色水滴项链。保持发型、年龄感和项链一致。"); toast("角色固定视觉描述已复制"); }
  if (type === "copy-prompt") { navigator.clipboard?.writeText(selectedShot().prompt); toast(`镜头 ${selectedShot().id} 的 V${selectedShot().versions} 提示词已复制`); }
  if (type === "regen-prompt") { const s=selectedShot(); s.versions++; s.prompt += " 强化要求：主体动作单一明确，镜头运动稳定连续。"; toast(`已生成提示词 V${s.versions}，旧版本仍然保留`); render(); }
  if (type === "split-shot") {
    const index = state.shots.findIndex(s => Number(s.id) === state.selectedShot);
    const base = state.shots[index];
    const clone = { ...base, title: `${base.title} · 后半段`, action: "延续上一镜头姿态，完成动作的后半段。", duration: Math.max(2, Math.ceil(base.duration/2)), status: "todo", versions: 1 };
    base.duration = Math.max(2, Math.floor(base.duration/2)); base.title += " · 前半段";
    state.shots.splice(index+1, 0, clone);
    state.shots.forEach((s,i)=>s.id=String(i+1).padStart(2,"0"));
    toast("镜头已拆分为两个独立生成任务"); render();
  }
  if (type === "submit-shot") { selectedShot().status = "submitted"; toast("已标记提交即梦，等待回填结果"); render(); }
  if (type === "failure") { state.failureReasons = []; state.modal = "failure"; render(); }
  if (type === "adopt-shot") {
    selectedShot().status = "adopted";
    const currentIndex = state.shots.findIndex(s=>Number(s.id)===state.selectedShot);
    const next = state.shots.slice(currentIndex+1).find(s=>s.status!=="adopted");
    if (next) state.selectedShot = Number(next.id);
    toast("已采用，已定位到下一个待处理镜头"); render();
  }
  if (type === "optimize-prompt") {
    const s = selectedShot(); s.versions++; s.status = "needs_work";
    s.prompt += ` 优化约束：${state.failureReasons.map(r => r === "人物数量错误" ? "画面中仅出现指定人物" : r === "服装变化" ? `全程固定${s.outfit}` : r === "运镜不明显" ? `明确执行${s.camera}` : `避免${r}`).join("；")}。`;
    state.modal = null; toast(`已保留旧版并生成 V${s.versions}，修改点已写入提示词`); render();
  }
  if (type === "cancel-modal") { state.modal = null; render(); }
  if (type === "save-upstream") { state.modal = null; toast("已保存角色设定，下游内容被标记为可能过期"); render(); }
  if (type === "sync-impact") { state.modal = null; state.shots.forEach(s=>{ if(s.status!=="adopted") s.prompt=s.prompt.replace(/27 岁/g,`${state.characterAge} 岁`); }); toast("已同步更新未锁定的 8 个镜头和提示词"); render(); }
  if (type === "close-drawer") { state.boardDrawer = false; render(); }
  if (type === "export-package") { state.exported = true; state.modal = "exported"; render(); }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "character-age") {
    const next = Number(event.target.value);
    if (next && next !== state.characterAge) { state.characterAge = next; state.modal = "impact"; render(); }
  }
});

window.addEventListener("hashchange", () => {
  state.route = location.hash.slice(1) || "landing";
  render();
});

window.addEventListener("keydown", (event) => {
  if (state.route !== "production" || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  const target = event.target;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) return;
  cycleVariant(event.key === "ArrowRight" ? 1 : -1);
});

render();
