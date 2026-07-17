import type { SaveState } from "@/src/hooks/use-auto-save";

const labels: Record<SaveState, string> = {
  idle: "等待编辑",
  saving: "保存中…",
  saved: "已保存",
  error: "保存失败，点击重试",
};

export function SaveIndicator({ state, retry }: { state: SaveState; retry?: () => void }) {
  return <button className={`save-state ${state}`} onClick={state === "error" ? retry : undefined} type="button">{labels[state]}</button>;
}
