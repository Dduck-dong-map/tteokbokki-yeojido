import Link from "next/link";
import { Plus } from "lucide-react";
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
      <nav aria-label="메뉴" className="ml-auto flex shrink-0 items-center gap-0.5 text-caption">
        {NAV.map((n) => {
          const isActive = active === n.key;
          return (
            <Link
              key={n.key}
              href={n.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-lg px-2 py-1.5 whitespace-nowrap hover:bg-muted xl:px-3",
                // 지금 있는 메뉴 = 옥빛 옅은 바탕 + 옥빛 글자 (「선택됨」은 옥빛 한 가지, 11-13 수정판)
                isActive ? "bg-secondary font-bold text-primary hover:bg-secondary" : "text-muted-foreground",
              )}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      {/* 등록 버튼 = 제보 갈색(report, P3). 고추장 빨강(brand-red)은 이름 글씨·찜 하트 */}
      <Link
        href="/register"
        className="inline-flex h-[38px] shrink-0 items-center gap-1 rounded-xl bg-report px-3 text-caption font-bold whitespace-nowrap text-report-foreground hover:opacity-90 xl:px-4"
      >
        <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
        맛집 등록
      </Link>
    </header>
  );
}
