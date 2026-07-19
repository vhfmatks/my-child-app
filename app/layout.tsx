import type { Metadata, Viewport } from "next";
import "./globals.css";

// 정적 export(GitHub Pages)에는 요청 헤더가 없으므로 base URL 을 빌드 시점에 결정한다.
// 우선순위: NEXT_PUBLIC_SITE_URL → GitHub Pages URL → 로컬.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.GITHUB_PAGES === "true" ? "https://vhfmatks.github.io/my-child-app" : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "성장 리포트", template: "%s | 성장 리포트" },
  applicationName: "성장 리포트",
  description: "우리 아이의 타고난 결과 강점을 따뜻하게 살펴보는 성장 나침반",
  openGraph: {
    type: "website", locale: "ko_KR", siteName: "성장 리포트",
    title: "성장 리포트 | 우리 아이의 성장 나침반",
    description: "사주와 성향을 함께 살펴보며 아이의 강점과 성장 힌트를 발견해요.",
  },
  twitter: {
    card: "summary_large_image", title: "성장 리포트 | 우리 아이의 성장 나침반",
    description: "사주와 성향을 함께 살펴보며 아이의 강점과 성장 힌트를 발견해요.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2a2551",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
