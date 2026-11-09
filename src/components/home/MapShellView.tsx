import Link from "next/link";
import { LocateFixed } from "lucide-react";
import { Logo, SampleRibbon } from "@/components/brand";
import { BottomNav } from "@/components/layout";
import MapLoading from "@/components/loading/MapLoading";
import TteokMap from "@/components/map/TteokMap";
import SearchBox from "@/components/SearchBox";
import { cn } from "@/lib/utils";
import FilterSheetView from "./FilterSheetView";
import StoreListPanelView from "./StoreListPanelView";
import type { MapShellViewProps, SheetState } from "./types";

// 지도 틀 (웹 1차 기획 3.2 · 지도 홈 + 가게 상세가 함께 쓴다).
//   폰 < 768      : 지도 전체 + 아래 시트 + 아래 메뉴. 가게 상세는 지도를 숨기고 페이지 전체로.
//   패널형 768~1279 : 왼쪽 패널 + 큰 지도. 가게를 고르면 패널이 상세로 바뀐다.
//   3단 ≥ 1280     : 왼쪽 목록 + (고르면) 상세 + 큰 지도.
// 상태·라우터·위치·폭 읽기는 전부 컨테이너(MapShell.tsx). 여기서는 받은 값을 그린다. now 도 컨테이너가 한 번 정해 넘긴다.

// 시트 높이 (접힘 · 반 · 전체) — CSS 변수 --sheet-h 로 지도 단추·저작권 표시도 같이 밀린다
const SHEET_H: Record<SheetState, string> = { peek: "64px", half: "44%", full: "calc(100% - 8px)" };

export default function MapShellView(p: MapShellViewProps) {
  const { shown, recentReports, sample, selectedId, routeId, wide, sheet, mapOn, mapSettled, start, focus, me, toast, filterCount, filterOpen, children } = p;

  return (
    <div className="md:flex md:h-[calc(100dvh-56px)]" style={{ ["--sheet-h" as string]: SHEET_H[sheet] }}>
      {/* 폰에서 가게 상세를 열면 이 칸 전체를 숨기고, 768 이상에서는 칸을 풀어 패널·지도가 나란히 선다 */}
      <div className={cn("relative flex h-dvh flex-col overflow-hidden bg-background md:contents", routeId && "max-md:hidden")}>
        <header className="z-10 flex items-center justify-between bg-card px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-1 md:hidden">
          <Logo />
          <span className="text-[12px] text-muted-foreground/70">
            최근 7일 등록·수정 <b className="text-muted-foreground">{recentReports}건</b>
          </span>
        </header>

        {/* 검색 + 필터 단추 하나 (슬랙 10-28: 처음부터 많은 선택을 요구하지 않기). 768 이상은 검색이 위 헤더로 올라간다 */}
        <div className="z-10 flex gap-2 border-b border-border bg-card px-4 py-2 md:hidden">
          <SearchBox />
          <button
            type="button"
            onClick={() => p.onFilterOpen()}
            className={cn(
              "relative h-11 shrink-0 rounded-xl border px-3 text-[13px] font-bold",
              filterCount ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-foreground",
            )}
          >
            필터
            {filterCount > 0 && <span className="ml-1 rounded-full bg-primary-foreground px-1.5 text-[11px] text-primary">{filterCount}</span>}
          </button>
        </div>

        <div className="relative flex-1 md:contents">
          {/* 큰 지도 */}
          <div className="absolute inset-0 [--attrib-bottom:calc(var(--sheet-h)-4px)] md:relative md:inset-auto md:order-3 md:min-w-0 md:flex-1 md:[--attrib-bottom:0px]">
            {mapOn && (
              <TteokMap stores={shown} selectedId={selectedId} onSelect={p.onSelectFromMap} me={me} focus={focus} onBoundsChange={p.onBoundsChange} onSettled={p.onMapSettled} start={start} />
            )}
            <MapLoading settled={mapSettled} />

            <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex flex-col items-center gap-1.5">
              {sample && <SampleRibbon />}
              {toast && (
                <span role="status" className="rounded-full bg-foreground px-3 py-1.5 text-[13px] text-background">
                  {toast}
                </span>
              )}
            </div>

            {/* 시트를 다 올리면 지도 단추는 숨긴다(검색창 위로 올라가지 않게) */}
            <div
              className={cn(
                "absolute right-3 bottom-[calc(var(--sheet-h)+12px)] z-10 flex flex-col gap-2.5 transition-[bottom,opacity] md:bottom-[84px]",
                sheet === "full" && "max-md:pointer-events-none max-md:opacity-0",
              )}
            >
              <button
                type="button"
                onClick={p.onLocate}
                aria-label="내 위치"
                title="내 위치"
                className="grid h-11 w-11 place-items-center rounded-full border border-input bg-card text-[var(--loc)] shadow-md"
              >
                <LocateFixed size={20} strokeWidth={2.2} aria-hidden="true" />
              </button>
              <Link
                href="/register"
                aria-label="맛집 등록"
                className="grid h-14 w-14 place-items-center rounded-full bg-brand-red text-[13px] leading-tight font-bold text-brand-red-foreground shadow-lg md:hidden"
              >
                등록
              </Link>
            </div>
          </div>

          {/* 가게 목록: 폰은 아래 시트, 768 이상은 왼쪽 패널. 패널형에서 상세를 열면 상세가 이 자리를 차지한다 */}
          <StoreListPanelView {...p} />

          {/* 폰 전용 필터 시트 */}
          {filterOpen && !wide && <FilterSheetView value={p.filters} resultCount={p.countWith(p.filters)} onChange={p.onFiltersChange} onClose={p.onFilterClose} />}
        </div>

        <BottomNav active="map" />
      </div>

      {/* 가게 상세: 폰은 페이지 전체, 768 이상은 패널. 가게를 옮기면 스크롤이 맨 위로 돌아가도록 다시 만든다 */}
      <div
        key={routeId ?? "home"}
        className={cn(
          routeId ? "bg-card md:order-2 md:h-full md:w-[360px] md:shrink-0 md:overflow-y-auto md:border-r md:border-border md:shadow-lg xl:w-[420px]" : "hidden",
        )}
      >
        {children}
      </div>
    </div>
  );
}
