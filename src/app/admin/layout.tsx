import type { Metadata } from "next";
// 어드민은 자체 남색 테마라 Pretendard 를 그대로 쓴다 (서비스 화면은 조선100년체, app/layout.tsx)
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./admin-navy.css";
import "./admin-extra.css";

// 운영 어드민 (기획: docs/기획/어드민기획_v1_2026-10-27.md)
// 디자인 = Admin Navy. 서비스 화면(한지)과 섞이지 않게 .admin-root 안에서만 스타일이 듣는다.
export const metadata: Metadata = {
  title: { default: "운영", template: "%s · 운영 | 떡볶여지도" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="admin-root">{children}</div>;
}
