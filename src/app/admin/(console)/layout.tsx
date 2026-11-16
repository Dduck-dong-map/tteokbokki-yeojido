import Link from "next/link";
import { Suspense } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { Icon } from "@/components/admin/Icon";

// 어드민 화면 틀: 브랜드 · 헤더 · 아이콘 레일 · 보조 메뉴 · 내용 (Admin Navy 셸)
// 권한은 화면마다 따로 본다 (lib/admin/access.ts · 레이아웃은 페이지와 따로 그려져서 여기서 막으면 새어 나간다 — Next 문서 Data Security).
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
        <span className="badge" title="가게 관리 · 후보 가져오기 · 운영 기록은 실제 DB 를 읽고 고쳐요. 나머지 화면은 아직 시안이에요.">가게는 실제 DB · 나머지는 시안</span>
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
