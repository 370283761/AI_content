import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "幕次 · AI 视频剧集创作平台",
  description: "从故事设定到即梦分镜生产的结构化创作工作台",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
