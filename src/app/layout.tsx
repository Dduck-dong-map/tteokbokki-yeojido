import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { USING_SAMPLE_DATA } from "@/lib/data";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "떡볶여지도 · 떡볶이를 사랑하는 사람들의 지도", template: "%s | 떡볶여지도" },
  description: "떡 종류와 맵기까지 골라 찾는 분식 맛집 지도. 가입 없이 바로 보고, 누구나 등록해요.",
  applicationName: "떡볶여지도",
  appleWebApp: { capable: true, title: "떡볶여지도", statusBarStyle: "default" },
  // 예시 데이터로 돌 때는 검색엔진에 올리지 않는다
  robots: USING_SAMPLE_DATA ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content", // 안드로이드 키보드가 올라오면 화면 높이를 줄여 입력칸·단추가 가려지지 않게 한다
  themeColor: "#ffffff", // globals.css --background (T2 흰 바탕)
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="min-h-dvh antialiased">
        {children}
      </body>
    </html>
  );
}
