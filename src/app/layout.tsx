import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
// 본문 글꼴 Pretendard: 화면에 나온 글자가 든 조각만 받는다 (11-13 수정판, 예전 280~415KB)
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { cn } from "@/lib/utils";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// 글꼴 (11-13 수정판): 제목 = 조선100년체, 본문·작은 글자 = Pretendard(위 import), 이름 「떡볶여지도」만 을지로10년후체 서브셋.
// 이름을 tokens.css 의 --font-family-base · --font-family-wordmark 값과 같게 고정한다(지도 MapLibre 도 이 이름으로 부른다).
// 조선100년체는 라이선스상 파일 수정 금지라 원본 그대로, 로고·브랜드명·슬로건에는 쓰지 않는다.
const ChosunCentennial = localFont({
  src: "./fonts/ChosunCentennial.woff2",
  weight: "400",
  // 미리 받지 않는다: 제목이 실제로 나오는 화면에서만 받는다 (관리자 화면 등은 0KB, 11-13 점검 「모든 페이지 1,164KB」)
  preload: false,
  variable: "--font-chosun",
  declarations: [{ prop: "font-family", value: "ChosunCentennial" }],
  adjustFontFallback: "Times New Roman",
});
const TteokWordmark = localFont({
  src: "./fonts/TteokWordmark.woff2",
  weight: "400",
  variable: "--font-tteok-wordmark",
  declarations: [{ prop: "font-family", value: "TteokWordmark" }],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "떡볶여지도 · 떡볶이를 사랑하는 사람들의 지도", template: "%s | 떡볶여지도" },
  description: "떡 종류와 맵기까지 골라 찾는 분식 맛집 지도. 가입 없이 바로 보고, 누구나 등록해요.",
  applicationName: "떡볶여지도",
  appleWebApp: { capable: true, title: "떡볶여지도", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content", // 안드로이드 키보드가 올라오면 화면 높이를 줄여 입력칸·단추가 가려지지 않게 한다
  themeColor: "#F3F1EE", // tokens.css --background-primary (지도 종이)
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={cn(ChosunCentennial.variable, TteokWordmark.variable)}>
      <body className="min-h-dvh antialiased">
        {children}
      </body>
    </html>
  );
}
