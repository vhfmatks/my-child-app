import { ImageResponse } from "next/og";

export const alt = "성장 리포트 - 우리 아이의 성장 나침반";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// 정적 export(GitHub Pages)에서 빌드 시점에 PNG로 미리 생성.
export const dynamic = "force-static";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden",
        flexDirection: "column", justifyContent: "center", padding: "72px 88px", color: "#fff9ec",
        background: "linear-gradient(135deg, #28234e 0%, #554a83 55%, #df9b9b 100%)",
      }}
    >
      <div style={{ position: "absolute", right: 92, top: 55, fontSize: 105, color: "#ffe69a" }}>☾</div>
      <div style={{ position: "absolute", left: 92, top: 78, fontSize: 40, color: "#ffe69a" }}>✦</div>
      <div style={{ position: "absolute", right: 246, top: 168, fontSize: 28, color: "#ffe69a" }}>✧</div>
      <div style={{ display: "flex", color: "#ffe1a0", fontSize: 28, fontWeight: 700, marginBottom: 22 }}>재미로 보는 우리 아이의 성장 나침반</div>
      <div style={{ display: "flex", fontSize: 78, fontWeight: 800, letterSpacing: -5 }}>성장 리포트</div>
      <div style={{ display: "flex", fontSize: 34, marginTop: 20, color: "#f8eeda" }}>아이의 강점과 가능성을 함께 발견해요</div>
      <div style={{ display: "flex", position: "absolute", bottom: 66, fontSize: 23, color: "#e8dff3" }}>✦ 사주와 성향을 함께 보는 참고용 리포트</div>
    </div>,
    size,
  );
}
