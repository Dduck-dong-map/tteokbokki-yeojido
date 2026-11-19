import Link from "next/link";
import { Suspense } from "react";
import AdminNav from "@/components/admin/AdminNav";
import { Icon } from "@/components/admin/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// 어드민 화면 틀: 브랜드 · 헤더 · 아이콘 레일 · 보조 메뉴 · 내용
// 레일 · 헤더는 뒤집힌 면(bg-inverse), 보조 메뉴는 카드 면, 내용은 쪽 바탕. 보조 메뉴는 1024px(lg) 미만에서 숨긴다. (min-[900px] 처럼 px 로 쓴 임의 폭은 rem 인 sm · lg 와 순서가 섞여 쓰지 않는다)
// 권한은 화면마다 따로 본다 (lib/admin/access.ts · 레이아웃은 페이지와 따로 그려져서 여기서 막으면 새어 나간다 — Next 문서 Data Security).
const HEADER_ACTION = "flex h-8 shrink-0 items-center gap-2 rounded-control px-2 whitespace-nowrap text-inverse-foreground hover:bg-inverse-foreground/10 focus-visible:outline-2 focus-visible:outline-inverse-action";

export default function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="grid h-dvh grid-cols-[3.5rem_1fr] grid-rows-[3rem_1fr] overflow-hidden sm:grid-cols-[4rem_1fr] lg:grid-cols-[4rem_11.25rem_1fr] print:block print:h-auto">
      <div className="row-start-1 flex items-center justify-center bg-inverse print:hidden">
        <div className="grid size-7 place-items-center rounded-control bg-brand-red text-caption text-primary-foreground" title="떡볶여지도">
          떡
        </div>
      </div>
      <header className="col-start-2 col-end-[-1] row-start-1 flex items-center gap-4 bg-inverse px-5 text-inverse-foreground print:hidden">
        <span className="text-body-small whitespace-nowrap">
          <b className="font-semibold">떡볶여지도</b> 운영
        </span>
        {/* 시안 메뉴는 개발 서버에서만 보인다 (AdminNav 의 HIDE_MOCK) — 이 표시도 그때만 */}
        {process.env.NODE_ENV !== "production" && (
          <Badge className="hidden h-6 rounded-badge bg-inverse-foreground/10 px-2 text-caption text-inverse-foreground sm:inline-flex" title="가게 관리 · 후보 가져오기 · 운영 기록은 실제 DB 를 읽고 고쳐요. 나머지 화면은 아직 시안이에요.">
            가게는 실제 DB · 나머지는 시안
          </Badge>
        )}
        <span className="flex-1" />
        <Link href="/" className={HEADER_ACTION} target="_blank">
          <Icon name="map" />
          <span className="hidden sm:inline">서비스 보기</span>
        </Link>
        <Button type="button" variant="ghost" size="icon" aria-label="알림" className="text-inverse-foreground hover:bg-inverse-foreground/10 hover:text-inverse-foreground">
          <Icon name="bell" />
        </Button>
        <span className={HEADER_ACTION}>
          <span className="grid size-6.5 place-items-center rounded-full bg-primary text-caption text-primary-foreground">이</span>
          <span className="hidden sm:inline">이시영 · 관리자</span>
        </span>
      </header>
      <Suspense fallback={<nav className="row-start-2 bg-inverse" />}>
        <AdminNav />
      </Suspense>
      <main className="col-start-2 col-end-[-1] row-start-2 overflow-y-auto p-4 lg:col-start-3 lg:p-6 print:overflow-visible print:p-0">{children}</main>
    </div>
  );
}
