import type { NextConfig } from "next";

// GitHub Pages(프로젝트 사이트) 정적 배포 설정.
// - output: "export" → next build 시 정적 사이트(out/)를 생성.
// - GitHub Actions 빌드에서만 GITHUB_PAGES=true 를 주입해 basePath 를 붙인다
//   (로컬 dev/build 는 basePath 없이 동작).
// 배포 URL: https://vhfmatks.github.io/my-child-app/
const isPages = process.env.GITHUB_PAGES === "true";
const repoBase = "/my-child-app";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: isPages ? repoBase : undefined,
  images: { unoptimized: true },
};

export default nextConfig;
