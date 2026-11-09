"use client";

import type { ReactNode } from "react";
import { SpiceStamp } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DEFAULT_FILTERS, type Filters } from "@/lib/filters";
import { PRICE_STEPS, RICE_CAKES, SPICE_LEVELS, STYLES, keysOf, type Spice } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import type { FilterSheetViewProps } from "./types";

// 취향 필터 (웹 1차 기획 3.2): 폰은 아래에서 올라오는 시트(shadcn Sheet), 768 이상은 패널 안 칸(inline).
// 열림 여부는 계약에 없다 → inline 이 아니면 항상 열린 것으로 그리고, 닫힘은 onClose 로만 알린다.
// 아래 두 헬퍼는 값→값 계산일 뿐 상태가 아니다.
const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

// 맵기: 한 번 누르면 그 단계만, 이어서 다른 단계를 누르면 그 사이 범위, 같은 단계를 다시 누르면 전체(1~5)
function nextSpice([lo, hi]: Filters["spice"], lv: Spice): Filters["spice"] {
  const single = lo === hi;
  if (single && lv === lo) return [1, 5];
  if (lo === 1 && hi === 5) return [lv, lv];
  if (single) return [Math.min(lo, lv) as Spice, Math.max(lo, lv) as Spice];
  return [lv, lv];
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Button
      type="button"
      variant={on ? "default" : "outline"}
      aria-pressed={on}
      onClick={onClick}
      className={cn("h-11 rounded-full px-3.5 text-[14px] font-medium md:h-9", !on && "border-input bg-card text-muted-foreground")}
    >
      {children}
    </Button>
  );
}

function Section({ id, title, hint, children }: { id?: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-2 border-b border-border py-4 last:border-0">
      <h3 className="mb-2.5 text-[14px] font-bold text-foreground">
        {title}
        {hint && <span className="ml-2 text-[12px] font-normal text-muted-foreground/70">{hint}</span>}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

// 시트와 패널 칸이 같이 쓰는 속 내용
function FilterBody({ value: f, resultCount: n, inline = false, onChange, onClose }: FilterSheetViewProps) {
  const allSpice = f.spice[0] === 1 && f.spice[1] === 5;
  return (
    <>
      <div className="flex items-baseline justify-between">
        {inline ? (
          <h2 className="text-[18px] font-bold text-foreground">오늘은 어떤 떡?</h2>
        ) : (
          <SheetTitle className="text-[18px] font-bold text-foreground">오늘은 어떤 떡?</SheetTitle>
        )}
        <button type="button" onClick={() => onChange(DEFAULT_FILTERS)} className="hit text-[13px] text-muted-foreground/70 underline">
          처음으로
        </button>
      </div>

      <Section id="filter-rice" title="떡" hint="여러 개">
        {keysOf(RICE_CAKES).map((k) => (
          <Chip key={k} on={f.rice.includes(k)} onClick={() => onChange({ ...f, rice: toggle(f.rice, k) })}>
            {RICE_CAKES[k]}
          </Chip>
        ))}
      </Section>

      <Section id="filter-style" title="스타일" hint="여러 개">
        {keysOf(STYLES).map((k) => (
          <Chip key={k} on={f.style.includes(k)} onClick={() => onChange({ ...f, style: toggle(f.style, k) })}>
            {STYLES[k]}
          </Chip>
        ))}
      </Section>

      <Section id="filter-spice" title="맵기" hint="신라면 = 3 · 두 번 누르면 범위">
        <div className="flex w-full items-end justify-between gap-1">
          {([1, 2, 3, 4, 5] as Spice[]).map((lv) => {
            const on = !allSpice && lv >= f.spice[0] && lv <= f.spice[1];
            return (
              <button
                key={lv}
                type="button"
                onClick={() => onChange({ ...f, spice: nextSpice(f.spice, lv) })}
                aria-pressed={on}
                className={cn("flex min-h-11 flex-1 flex-col items-center gap-1 rounded-xl border py-2", on ? "border-primary" : "border-transparent")}
              >
                <SpiceStamp n={lv} size={30} />
                <span className="text-[11px] leading-tight text-muted-foreground/70">{SPICE_LEVELS[lv].ref.replace(" 정도", "")}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section id="filter-price" title="1인분 가격">
        {PRICE_STEPS.map((p) => (
          <Chip key={p} on={f.priceMax === p} onClick={() => onChange({ ...f, priceMax: f.priceMax === p ? null : p })}>
            {(p / 1000).toLocaleString()}천 원 이하
          </Chip>
        ))}
      </Section>

      <Section title="더 고르기">
        <Chip on={f.openNow} onClick={() => onChange({ ...f, openNow: !f.openNow })}>
          지금 영업 중
        </Chip>
        <Chip on={f.solo} onClick={() => onChange({ ...f, solo: !f.solo })}>
          혼밥 가능
        </Chip>
        <Chip on={!f.showMenuGrade} onClick={() => onChange({ ...f, showMenuGrade: !f.showMenuGrade })}>
          떡볶이 집만 (메뉴에 있음 빼기)
        </Chip>
      </Section>

      {/* 0곳이면 초기화 단추 (슬랙 10-28, 기획 팀장: 결과가 없을 때 초기화할 수 있게). 단추는 항상 아래에 붙어 보인다 */}
      <div className={cn("sticky bottom-0 bg-card pt-2 pb-[calc(env(safe-area-inset-bottom)+4px)]", inline ? "-mx-4 px-4" : "-mx-5 px-5")}>
        {n === 0 ? (
          <div className="flex gap-2">
            <p className="grid h-12 flex-1 place-items-center rounded-xl bg-muted text-[14px] text-muted-foreground">조건에 맞는 가게가 없어요</p>
            <Button type="button" onClick={() => onChange(DEFAULT_FILTERS)} className="h-12 rounded-xl px-5 text-[15px] font-bold">
              필터 초기화
            </Button>
          </div>
        ) : (
          <Button type="button" onClick={onClose} className="h-12 w-full rounded-xl text-[16px] font-bold">
            가게 {n}곳 보기
          </Button>
        )}
      </div>
    </>
  );
}

export default function FilterSheetView(props: FilterSheetViewProps) {
  if (props.inline) {
    return (
      <div role="region" aria-label="취향 필터" className="min-h-0 flex-1 overflow-y-auto bg-card px-4 pt-3 pb-3">
        <FilterBody {...props} />
      </div>
    );
  }
  return (
    <Sheet open onOpenChange={(o) => !o && props.onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        aria-label="취향 필터"
        className="max-h-[86dvh] gap-0 overflow-y-auto rounded-t-2xl border-border bg-card px-5 pb-3 text-foreground"
      >
        <div className="sticky top-0 z-10 -mx-5 flex justify-center bg-card px-5 pt-3 pb-2">
          <SheetClose aria-label="필터 닫기" className="hit block h-1 w-10 rounded-full bg-input" />
        </div>
        <FilterBody {...props} />
      </SheetContent>
    </Sheet>
  );
}
