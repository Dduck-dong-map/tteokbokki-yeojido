import Link from "next/link";
import { Suspense } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { Icon } from "@/components/admin/Icon";

// 어드민 화면 틀: 브랜드 · 헤더 · 아이콘 레일 · 보조 메뉴 · 내용 (Admin Navy 셸)
// 실제 운영 전에는 여기서 Supabase 로그인 + 운영자 역할을 확인하고, 아니면 /admin/login 으로 보낸다(REQ-AD-01).
export default function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="app">
      <div className="brand">
        <div className="brand__mark" title="떡볶여지도">떡</div>
      </div>
      <header className="header">
        <span className="header__title">
          <b>떡볶여지도</b> 운영
        </span>
        <span className="badge">시안 · 예시 데이터</span>
        <span className="header__spacer" />
        <Link href="/" className="header__action" target="_blank">
          <Icon name="map" />
          <span className="header__who">서비스 보기</span>
        </Link>
        <button type="button" className="header__action" aria-label="알림">
          <Icon name="bell" />
        </button>
        <span className="header__action">
          <span className="header__avatar">이</span>
          <span className="header__who">이시영 · 관리자</span>
        </span>
      </header>
      <Suspense fallback={<nav className="rail" />}>
        <AdminNav />
      </Suspense>
      <main className="content">{children}</main>
    </div>
  );
}
