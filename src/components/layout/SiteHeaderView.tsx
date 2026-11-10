import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand";
import { NAV } from "./nav";
import type { SiteHeaderViewProps } from "./types";

// 768 이상에서만 보이는 위 헤더 (웹 1차 기획 3.2): 로고 · 검색칸 슬롯 · 메뉴 셋 · 「＋ 맛집 등록」.
// 그리기만 한다. 활성 메뉴·검색 제출·검색칸은 컨테이너(SiteHeader.tsx)가 props 로 넘긴다. 폰에서는 BottomNav 가 같은 일을 한다.
export default function SiteHeaderView({ active, onSearchSubmit, search }: SiteHeaderViewProps) {
  return (
    <header className="sticky top-0 z-40 hidden h-14 items-center gap-3 border-b border-border bg-background px-4 md:flex xl:gap-5 xl:px-5">
      <Link href="/" aria-label="떡볶여지도 첫 화면으로" className="shrink-0">
        <Logo />
      </Link>
      {/* 목록이 보이는 화면에서는 쓰는 대로 걸러지고, 목록이 없는 화면에서는 Enter 를 누르면 지도로 간다 (판단은 컨테이너) */}
      <form role="search" className="min-w-0 max-w-[320px] flex-1" onSubmit={onSearchSubmit}>
        {search}
      </form>
      <nav aria-label="메뉴" className="ml-auto flex shrink-0 items-center gap-0.5 text-[14px]">
        {NAV.map((n) => {
          const isActive = active === n.key;
          return (
            <Link
              key={n.key}
              href={n.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-lg px-2 py-1.5 whitespace-nowrap hover:bg-muted xl:px-3",
                isActive ? "font-bold text-foreground" : "text-muted-foreground",
              )}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      {/* 고추장 포인트는 로고·도장·등록 버튼에만 (기획안 v5 8절) — 경고색(destructive)이 아니라 brand-red */}
      <Link
        href="/register"
        className="grid h-[38px] shrink-0 place-items-center rounded-xl bg-brand-red px-3 text-[14px] font-bold whitespace-nowrap text-brand-red-foreground hover:opacity-90 xl:px-4"
      >
        ＋ 맛집 등록
      </Link>
    </header>
  );
}
