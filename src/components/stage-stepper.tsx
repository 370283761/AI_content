import Link from "next/link";

const stages = [
  ["setup", "1 · 项目设定"],
  ["planning", "2 · 剧集规划"],
  ["script", "3 · 单集剧本"],
  ["shots", "4 · 分镜编辑"],
  ["production", "5 · 生产工作台"],
] as const;

export function StageStepper({ projectId, active, episodeId }: { projectId: string; active: string; episodeId?: string }) {
  return (
    <div className="stepper">
      {stages.map(([key, label]) => {
        let href = `/projects/${projectId}/${key === "setup" ? "setup" : "planning"}`;
        if (episodeId && ["script", "shots", "production"].includes(key)) href = `/projects/${projectId}/episodes/${episodeId}/${key}`;
        return <Link className={`step ${key === active ? "active" : ""}`} href={href} key={key}>{label}</Link>;
      })}
    </div>
  );
}
