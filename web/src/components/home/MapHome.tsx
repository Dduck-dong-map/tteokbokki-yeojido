"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TteokMap, { type Bounds, type Focus } from "@/components/map/TteokMap";
import { DEFAULT_FILTERS, activeFilterCount, applyFilters, byRecentlyConfirmed, distanceM, matchQuery, parseFilters, serializeFilters, type Filters } from "@/lib/filters";
import type { Store } from "@/lib/types";
import { BottomNav, SampleRibbon } from "../ui";
import FilterSheet from "./FilterSheet";
import StoreRow from "./StoreRow";

type LatLng = { lat: number; lng: number };
type SheetState = "peek" | "half" | "full";
const SHEET_H: Record<SheetState, string> = { peek: "64px", half: "44%", full: "calc(100% - 8px)" };
const ORDER: SheetState[] = ["peek", "half", "full"];

// 지도 홈 (슬랙 10-28 결정 · 기획 팀장): 접속 즉시 주변 가게 → 검색 → 가게 선택 → 상세 → 길찾기.
// 필터는 원할 때만(버튼 하나), 아래에는 가게 목록 시트가 처음부터 반쯤 올라와 있다(거지맵 목록 참고).
export default function MapHome({ stores, recentReports, sample }: { stores: Store[]; recentReports: number; sample: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const filters = useMemo(() => parseFilters(new URLSearchParams(params.toString())), [params]);
  const now = useMemo(() => new Date(), []);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"near" | "recent" | null>(null); // null = 위치 있으면 가까운순, 없으면 최근 확인순
  const [sheet, setSheet] = useState<SheetState>("half");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [me, setMe] = useState<LatLng | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => applyFilters(stores, filters, now), [stores, filters, now]);
  const shown = useMemo(() => filtered.filter((s) => matchQuery(s, q)), [filtered, q]);
  const inView = useMemo(() => (bounds ? shown.filter((s) => s.lng >= bounds.w && s.lng <= bounds.e && s.lat >= bounds.s && s.lat <= bounds.n) : shown), [shown, bounds]);
  const effSort = sort ?? (me ? "near" : "recent");
  const list = useMemo(() => {
    const arr = [...inView];
    if (effSort === "near" && me) arr.sort((a, b) => distanceM(me, a) - distanceM(me, b));
    else arr.sort(byRecentlyConfirmed);
    return arr;
  }, [inView, effSort, me]);

  // 필터는 주소에 담는다 → 주소를 그대로 공유하면 같은 지도가 열린다
  const setFilters = useCallback((f: Filters) => {
    const qs = serializeFilters(f);
    const pal = new URLSearchParams(window.location.search).get("pal");
    const u = new URLSearchParams(qs);
    if (pal) u.set("pal", pal);
    window.history.replaceState(null, "", u.size ? `?${u}` : window.location.pathname);
  }, []);
  const resetAll = () => {
    setFilters(DEFAULT_FILTERS);
    setQ("");
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };
  const flyTo = (p: LatLng & { zoom?: number }) => setFocus((f) => ({ ...p, n: (f?.n ?? 0) + 1 }));

  const locate = (silent = false) => {
    if (!navigator.geolocation) return silent ? undefined : flash("이 브라우저는 위치를 못 받아요");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        setMe(here);
        flyTo({ ...here, zoom: 15 });
      },
      () => !silent && flash("위치를 못 받았어요. 지도를 직접 움직여 주세요"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };
  // 처음 들어오면 위치를 한 번 묻는다. 거절하면 기본 중심(마포·서대문) 그대로.
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        setMe(here);
        setFocus((f) => ({ ...here, zoom: 15, n: (f?.n ?? 0) + 1 }));
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  // 목록에서 고르기: 지도가 그 가게로 가고 선택 표시, 선택된 줄을 다시 누르면 상세
  const pick = (s: Store) => {
    if (selected === s.id) return router.push(`/store/${s.id}`);
    setSelected(s.id);
    flyTo({ lat: s.lat, lng: s.lng });
    if (sheet === "full") setSheet("half");
  };
  // 지도에서 도장을 누르면 접힌 시트를 반쯤 올리고, 목록이 그 가게로 스크롤
  const selectFromMap = (id: string | null) => {
    setSelected(id);
    if (id && sheet === "peek") setSheet("half");
  };
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!selected) return;
    const el = listRef.current?.querySelector(`#row-${CSS.escape(selected)}`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected, sheet]);

  // 시트: 손잡이를 누르면 반 ↔ 전체, 끌면 한 단계씩
  const dragY = useRef<number | null>(null);
  const step = (dir: 1 | -1) => setSheet((st) => ORDER[Math.min(2, Math.max(0, ORDER.indexOf(st) + dir))]);
  const onHandleUp = (e: React.PointerEvent) => {
    if (dragY.current === null) return;
    const dy = e.clientY - dragY.current;
    dragY.current = null;
    if (dy < -30) step(1);
    else if (dy > 30) step(-1);
    else setSheet((st) => (st === "full" ? "half" : st === "half" ? "full" : "half"));
  };

  const nFilters = activeFilterCount(filters);
  const sheetH = SHEET_H[sheet];

  return (
    <div className="relative mx-auto flex h-dvh max-w-[480px] flex-col overflow-hidden bg-paper">
      <header className="z-10 flex items-center justify-between bg-bar px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo_red.png" alt="떡볶여지도" className="h-8 w-auto [filter:var(--logo-filter)]" />
        <span className="text-[12px] text-ink3">
          최근 7일 제보·수정 <b className="text-ink2">{recentReports}건</b>
        </span>
      </header>

      {/* 검색 + 필터 버튼 하나 (슬랙 10-28: 처음부터 많은 선택을 요구하지 않기) */}
      <div className="z-10 flex gap-2 border-b border-line bg-bar px-4 py-2">
        <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-chipline bg-surface px-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0 text-ink3" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="가게 이름이나 동네로 찾기"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink3"
            aria-label="가게 검색"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="검색어 지우기" className="text-ink3">
              ×
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className={`relative h-10 shrink-0 rounded-xl border px-3 text-[13px] font-bold ${nFilters ? "border-primary bg-primary text-onprimary" : "border-chipline bg-surface text-ink"}`}
        >
          필터
          {nFilters > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 text-[11px] text-onaccent">{nFilters}</span>}
        </button>
      </div>

      <div className="relative flex-1" style={{ ["--attrib-bottom" as string]: `calc(${sheetH} - 4px)` }}>
        <TteokMap stores={shown} selectedId={selected} onSelect={selectFromMap} me={me} focus={focus} onBoundsChange={setBounds} />

        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex flex-col items-center gap-1.5">
          {sample && <SampleRibbon />}
          {toast && <span className="rounded-full bg-ink px-3 py-1.5 text-[13px] text-paper">{toast}</span>}
        </div>

        {/* 시트를 다 올리면 지도 버튼은 숨긴다(검색창 위로 올라가지 않게) */}
        <div className={`absolute right-3 z-10 flex flex-col gap-2.5 transition-[bottom,opacity] ${sheet === "full" ? "pointer-events-none opacity-0" : ""}`} style={{ bottom: `calc(${sheetH} + 12px)` }}>
          <button type="button" onClick={() => locate()} aria-label="내 위치" className="grid h-11 w-11 place-items-center rounded-full border border-chipline bg-surface text-loc shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </button>
          <Link href="/report" className="grid h-14 w-14 place-items-center rounded-full bg-fab text-[13px] font-bold leading-tight text-onfab shadow-lg" aria-label="제보하기">
            제보
          </Link>
        </div>

        {/* 가게 목록 시트 */}
        <section
          className="absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t border-line bg-surface shadow-[0_-6px_24px_var(--cardshadow)] transition-[height] duration-200"
          style={{ height: sheetH }}
          aria-label="가게 목록"
        >
          <div
            className="shrink-0 cursor-grab touch-none select-none px-4 pt-2 pb-1"
            onPointerDown={(e) => (dragY.current = e.clientY)}
            onPointerUp={onHandleUp}
            onPointerCancel={() => (dragY.current = null)}
          >
            <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-chipline" />
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold">
                {inView.length ? `현재 지도에서 찾은 가게 ${inView.length}곳` : shown.length ? "이 지도 안에는 가게가 없어요" : "조건에 맞는 가게가 없어요"}
              </h2>
              <div className="flex gap-1 text-[12px]" onPointerDown={(e) => e.stopPropagation()}>
                {(["near", "recent"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    disabled={k === "near" && !me}
                    onClick={() => setSort(k)}
                    aria-pressed={effSort === k}
                    className={`rounded-full px-2.5 py-1 ${effSort === k ? "bg-ink text-paper" : "text-ink3 disabled:opacity-40"}`}
                  >
                    {k === "near" ? "가까운순" : "최근 확인순"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {sheet !== "peek" && (
            <div className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
              {list.length > 0 ? (
                <ul ref={listRef} className="divide-y divide-line">
                  {list.map((s) => (
                    <StoreRow key={s.id} store={s} me={me} now={now} selected={selected === s.id} onPick={() => pick(s)} />
                  ))}
                </ul>
              ) : shown.length > 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-[14px] text-ink2">지도를 움직이거나, 가게가 있는 곳으로 가 보세요.</p>
                  <button
                    type="button"
                    onClick={() => setFocus((f) => ({ n: (f?.n ?? 0) + 1, bounds: boundsOf(shown) }))}
                    className="mt-3 h-11 rounded-xl border border-ink2 bg-surface px-5 text-[14px] font-bold"
                  >
                    가게 {shown.length}곳 모두 보기
                  </button>
                </div>
              ) : (
                <div className="px-6 py-8 text-center">
                  <p className="text-[15px] font-bold">{q ? "검색어나 필터를 바꿔 보세요" : "필터를 조금 풀어 보세요"}</p>
                  <p className="mt-1 text-[13px] text-ink3">조건을 지우면 가게 {stores.length}곳이 다시 보여요</p>
                  <button type="button" onClick={resetAll} className="mt-4 h-11 rounded-xl bg-accent px-5 text-[14px] font-bold text-onaccent">
                    {nFilters ? "필터 초기화" : "검색어 지우기"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {filterOpen && <FilterSheet value={filters} count={(f) => applyFilters(stores, f, now).length} onChange={setFilters} onClose={() => setFilterOpen(false)} />}
      </div>

      <BottomNav active="map" />
    </div>
  );
}

function boundsOf(stores: Store[]): Bounds {
  const lats = stores.map((s) => s.lat);
  const lngs = stores.map((s) => s.lng);
  return { w: Math.min(...lngs), e: Math.max(...lngs), s: Math.min(...lats), n: Math.max(...lats) };
}
