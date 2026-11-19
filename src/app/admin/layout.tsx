import type { Metadata } from "next";

// 운영 어드민 (기획: docs/기획/어드민기획_v1_2026-10-27.md)
// 11-19 부터 서비스 화면과 같은 스택(Tailwind · ui/ 부품 · 디자인 토큰)으로 그린다. 전용 CSS(.admin-root)는 없앴다.
export const metadata: Metadata = {
  title: { default: "운영", template: "%s · 운영 | 떡볶여지도" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  // 표가 많아 낱말 중간에서 줄을 바꾸지 않는다(body 의 overflow-wrap: anywhere 를 되돌린다).
  // 관리자 화면은 제목(h1~h3)도 본문 글꼴 Pretendard — 조선100년체(1.1MB)를 받지 않는다 (docs/design-system/README.md 「글꼴」)
  return <div className="min-h-dvh bg-background font-sans text-body-small text-foreground [overflow-wrap:normal] [&_:is(h1,h2,h3)]:font-sans">{children}</div>;
}
