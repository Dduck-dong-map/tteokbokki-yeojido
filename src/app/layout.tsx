import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// shadcn/ui 테마(globals.css)는 본문 글꼴로 --font-sans 변수를 쓴다.
// 서비스 글꼴은 아직 임시라서 create-next-app 기본 글꼴(Geist)을 그대로 둔다.
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "떡볶여지도",
  description: "떡 종류·스타일·맵기 취향으로 찾는 떡볶이 지도",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
