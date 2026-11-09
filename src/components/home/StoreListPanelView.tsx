import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FilterSheetView from "./FilterSheetView";
import StoreRowView from "./StoreRowView";
import type { MapShellViewProps, SortKey } from "./types";

// 가게 목록 칸 — 폰은 아래 시트, 768 이상은 왼쪽 패널 (웹 1차 기획 3.2 · M-W-01).
// MapShellView 에서 떼어 낸 섹션 View. props 는 MapShellViewProps 의 부분집합(계약에서 파생, 새 계약 아님).
export type StoreListPanelViewProps = Pick<
  MapShellViewProps,
  | "stores" | "shown" | "list" | "inViewCount" | "searching" | "query" | "routeId" | "selectedId" | "wide" | "sheet" | "me" | "now"
  | "sort" | "canSortNear" | "filters" | "filterCount" | "filterChips" | "filterOpen" | "countWith"
  | "onPick" | "onSortChange" | "onSheetChange" | "onFilterOpen" | "onFilterClose" | "onFiltersChange" | "onResetAll" | "onShowAll"
  | "listRef" | "onListKeyDown" | "onHandlePointerDown" | "onHandlePointerUp" | "onHandlePointerCancel"
>;

const SORTS: { key: SortKey; label: string }[] = [
  { key: "near", label: "가까운순" },
  { key: "recent", label: "최근 확인순" },
];

export default function StoreListPanelView({
  list, shown, stores, inViewCount, searching, query, selectedId, routeId, wide, sheet, me, now, sort, canSortNear,
  filters, filterCount, filterChips, filterOpen, countWith,
  onPick, onSortChange, onSheetChange, onFilterOpen, onFilterClose, onFiltersChange, onResetAll, onShowAll,
  listRef, onListKeyDown, onHandlePointerDown, onHandlePointerUp, onHandlePointerCancel,
}: StoreListPanelViewProps) {
  const filterOn = filterCount > 0;
  // 손잡이: 컨테이너가 포인터 셋을 주면 끌기·탭 판정을 컨테이너가 한다(Pointer 우선). 없으면 탭 = 반 ↔ 전체 토글만.
  const drag = !!onHandlePointerDown;
  const toggleSheet = () => onSheetChange(sheet === "full" ? "half" : "full");
  const title = inViewCount ? `${searching ? "검색으로" : "현재 지도에서"} 찾은 가게 ${inViewCount}곳` : shown.length ? "이 지도 안에는 가게가 없어요" : "조건에 맞는 가게가 없어요";

  return (
    <section
      aria-label="가게 목록"
      className={cn(
        "absolute inset-x-0 bottom-0 z-20 flex h-[var(--sheet-h)] flex-col rounded-t-2xl border-t border-border bg-card shadow-lg transition-[height] duration-200",
        "md:static md:order-1 md:h-full md:w-[360px] md:shrink-0 md:rounded-none md:border-t-0 md:border-r md:shadow-none md:transition-none",
        routeId ? "md:max-xl:hidden xl:w-[360px]" : "xl:w-[400px]",
      )}
    >
      {/* 768 이상: 패널 위 칩 — 누르면 필터 칸이 열리고 그 부분으로 간다 */}
      <div className="hidden shrink-0 flex-wrap gap-1.5 border-b border-border px-4 py-2.5 md:flex">
        <Button
          type="button"
          variant={filterOn || filterOpen ? "default" : "outline"}
          aria-expanded={filterOpen}
          onClick={() => (filterOpen ? onFilterClose() : onFilterOpen())}
          className={cn("h-8 rounded-full px-3 text-[13px] font-bold", !(filterOn || filterOpen) && "border-input bg-card text-foreground")}
        >
          필터{filterOn && ` ${filterCount}`}
        </Button>
        {filterChips.map((c) => (
          <Button
            key={c.id}
            type="button"
            variant="outline"
            aria-pressed={c.on}
            onClick={() => onFilterOpen(c.id)}
            className={cn("h-8 rounded-full px-3 text-[13px]", c.on ? "border-primary font-bold text-foreground" : "border-input bg-card font-normal text-muted-foreground")}
          >
            {c.label}
          </Button>
        ))}
      </div>

      {filterOpen && wide ? (
        <FilterSheetView inline value={filters} resultCount={countWith(filters)} onChange={onFiltersChange} onClose={onFilterClose} />
      ) : (
        <>
          {/* 손잡이 칸: 폰에서 끌면 한 단계씩, 탭하면 반 ↔ 전체 (판정은 컨테이너의 onHandlePointer*). 정렬 단추는 끌기에서 뺀다 */}
          <div
            className={cn("shrink-0 px-4 pt-2 pb-1 md:cursor-auto md:touch-auto md:select-auto md:py-2.5", drag && "cursor-grab touch-none select-none")}
            onPointerDown={onHandlePointerDown}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerCancel}
          >
            <button
              type="button"
              // 끌기 모드(onHandlePointerDown 있음)에서는 탭도 컨테이너의 PointerUp 이 처리하므로 onClick 을 걸지 않는다(두 번 토글 방지)
              onClick={drag ? undefined : toggleSheet}
              aria-label={sheet === "full" ? "목록 접기" : "목록 펼치기"}
              className="hit mx-auto mb-2 block h-1 w-10 rounded-full bg-input md:hidden"
            />
            <div className="flex items-center justify-between gap-2">
              <h2 className="min-w-0 text-[14px] font-bold text-foreground break-keep [overflow-wrap:anywhere]">{title}</h2>
              <div className="flex shrink-0 gap-1 text-[12px]" onPointerDown={(e) => e.stopPropagation()}>
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    disabled={s.key === "near" && !canSortNear}
                    onClick={() => onSortChange(s.key)}
                    aria-pressed={sort === s.key}
                    className={cn("hit rounded-full px-2.5 py-1 whitespace-nowrap", sort === s.key ? "bg-foreground text-background" : "text-muted-foreground/70 disabled:opacity-40")}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 가게 줄 칸. 폰에서 시트를 접으면(peek) 제목만 남긴다 */}
          <div className={cn("min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)] md:bg-card", sheet === "peek" && "max-md:hidden")}>
            {list.length > 0 ? (
              <ul ref={listRef} onKeyDown={onListKeyDown} className="divide-y divide-border">
                {list.map((s) => (
                  <StoreRowView key={s.id} store={s} me={me} now={now} selected={selectedId === s.id} onPick={() => onPick(s)} />
                ))}
              </ul>
            ) : shown.length > 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-[14px] text-muted-foreground">지도를 움직이거나, 가게가 있는 곳으로 가 보세요.</p>
                <Button type="button" variant="outline" onClick={onShowAll} className="mt-3 h-11 rounded-xl border-muted-foreground px-5 text-[14px] font-bold">
                  가게 {shown.length}곳 모두 보기
                </Button>
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-[15px] font-bold text-foreground">{query ? "검색어나 필터를 바꿔 보세요" : "필터를 조금 풀어 보세요"}</p>
                <p className="mt-1 text-[13px] text-muted-foreground/70">조건을 지우면 가게 {stores.length}곳이 다시 보여요</p>
                <Button type="button" onClick={onResetAll} className="mt-4 h-11 rounded-xl px-5 text-[14px] font-bold">
                  {filterOn ? "필터 초기화" : "검색어 지우기"}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
