"use client";

import { DEFAULT_FILTERS, type Filters } from "@/lib/filters";
import { PRICE_STEPS, RICE_CAKES, SPICE_LEVELS, STYLES, keysOf, type Spice } from "@/lib/taxonomy";
import { SpiceStamp } from "../ui";

type Props = {
  value: Filters;
  count: (f: Filters) => number; // 고를 때마다 "가게 N곳"을 바로 보여 준다
  onChange: (f: Filters) => void;
  onClose: () => void;
  inline?: boolean; // 768 이상: 패널 안에 펼치는 칸 (웹 1차 기획 3.2)
};

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`h-11 rounded-full border px-3.5 text-[14px] font-medium transition-colors md:h-9 ${
        on ? "border-primary bg-primary text-onprimary" : "border-chipline bg-surface text-ink2"
      }`}
    >
      {children}
    </button>
  );
}

function Section({ id, title, hint, children }: { id?: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-2 border-b border-line py-4 last:border-0">
      <h3 className="mb-2.5 text-[14px] font-bold">
        {title}
        {hint && <span className="ml-2 text-[12px] font-normal text-ink3">{hint}</span>}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

export default function FilterSheet({ value: f, count, onChange, onClose, inline = false }: Props) {
  const n = count(f);
  const setSpice = (lv: Spice) => {
    // 한 번 누르면 그 단계만, 이어서 누르면 그 사이 범위
    const [lo, hi] = f.spice;
    const single = lo === hi;
    const next: [Spice, Spice] = lo === 1 && hi === 5 ? [lv, lv] : single && lv !== lo ? [Math.min(lo, lv) as Spice, Math.max(lo, lv) as Spice] : [lv, lv];
    onChange({ ...f, spice: single && lv === lo ? [1, 5] : next });
  };

  return (
    <div className={inline ? "min-h-0 flex-1 overflow-y-auto" : "absolute inset-0 z-30 flex flex-col justify-end bg-black/30"} onClick={inline ? undefined : onClose}>
      <div
        className={inline ? "bg-surface px-4 pb-3 pt-3" : "sheet-up max-h-[86%] overflow-y-auto rounded-t-2xl bg-surface px-5 pb-3"}
        onClick={(e) => e.stopPropagation()}
        role={inline ? "region" : "dialog"}
        aria-label="취향 필터"
      >
        {!inline && (
          <div className="sticky top-0 -mx-5 flex items-center justify-between bg-surface px-5 pt-3 pb-2">
            <span className="mx-auto mb-1 block h-1 w-10 rounded-full bg-chipline" />
          </div>
        )}
        <div className="flex items-baseline justify-between">
          <h2 className="text-[18px] font-bold">오늘은 어떤 떡?</h2>
          <button type="button" className="hit text-[13px] text-ink3 underline" onClick={() => onChange(DEFAULT_FILTERS)}>
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
              const on = lv >= f.spice[0] && lv <= f.spice[1] && !(f.spice[0] === 1 && f.spice[1] === 5);
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setSpice(lv)}
                  aria-pressed={on}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 ${on ? "border-primary" : "border-transparent"}`}
                >
                  <SpiceStamp n={lv} size={30} />
                  <span className="text-[11px] leading-tight text-ink3">{SPICE_LEVELS[lv].ref.replace(" 정도", "")}</span>
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

        {/* 0곳이면 초기화 버튼 (슬랙 10-28, 기획 팀장: 결과가 없을 때 초기화할 수 있게). 버튼은 항상 아래에 붙어 보인다 */}
        <div className={`sticky bottom-0 bg-surface pt-2 pb-[calc(env(safe-area-inset-bottom)+4px)] ${inline ? "-mx-4 px-4" : "-mx-5 px-5"}`}>
        {n === 0 ? (
          <div className="flex gap-2">
            <p className="grid h-12 flex-1 place-items-center rounded-xl bg-chip text-[14px] text-ink2">조건에 맞는 가게가 없어요</p>
            <button type="button" onClick={() => onChange(DEFAULT_FILTERS)} className="h-12 rounded-xl bg-accent px-5 text-[15px] font-bold text-onaccent">
              필터 초기화
            </button>
          </div>
        ) : (
          <button type="button" onClick={onClose} className="h-12 w-full rounded-xl bg-accent text-[16px] font-bold text-onaccent">
            가게 {n}곳 보기
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
