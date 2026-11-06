"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TteokMap, { type Bounds, type Focus } from "@/components/map/TteokMap";
import SearchBox from "@/components/SearchBox";
import { DEFAULT_FILTERS, activeFilterCount, applyFilters, byRecentlyConfirmed, distanceM, matchQuery, parseFilters, serializeFilters, type Filters } from "@/lib/filters";
import { useIsWide } from "@/lib/screen";
import { setSearch, useSearch } from "@/lib/search";
import type { Store } from "@/lib/types";
import { BottomNav, Logo, SampleRibbon } from "../ui";
import FilterSheet from "./FilterSheet";
import StoreRow from "./StoreRow";

type LatLng = { lat: number; lng: number };
type SheetState = "peek" | "half" | "full";
const SHEET_H: Record<SheetState, string> = { peek: "64px", half: "44%", full: "calc(100% - 8px)" };
const ORDER: SheetState[] = ["peek", "half", "full"];

// 패널 위 칩 (웹 1차 기획 3.2): 누르면 필터 칸이 열리고 그 부분으로 간다
const FILTER_CHIPS = [
  { id: "filter-rice", label: "떡", on: (f: Filters) => f.rice.length > 0 },
  { id: "filter-style", label: "스타일", on: (f: Filters) => f.style.length > 0 },
  { id: "filter-spice", label: "맵기", on: (f: Filters) => f.spice[0] !== 1 || f.spice[1] !== 5 },
  { id: "filter-price", label: "가격", on: (f: Filters) => !!f.priceMax },
];

// 현재 주소의 필터는 그대로 두고, 작은 지도에서 넘어올 때 붙는 store 값만 뺀다
function keepFilters() {
  const q = new URLSearchParams(window.location.search);
  q.delete("store");
  return q.size ? `?${q}` : "";
}

// 지도 틀 (웹 1차 기획 3.2 · 지도 홈 + 가게 상세가 함께 쓴다).
//   모바일 < 768 : 지도 전체 + 아래 시트 + 아래 메뉴. 가게 상세는 지도를 숨기고 페이지 전체로.
//   패널형 768~1279 : 왼쪽 패널 + 큰 지도. 가게를 고르면 패널이 상세로 바뀐다.
//   3단 ≥ 1280 : 왼쪽 목록 + (고르면) 상세 + 큰 지도.
// 찾는 순서는 그대로다(슬랙 10-28): 접속 즉시 주변 가게 → 검색 → 가게 선택 → 상세 → 길찾기.
export default function MapShell({ stores, recentReports, sample, children }: { stores: Store[]; recentReports: number; sample: boolean; children: React.ReactNode }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const wide = useIsWide();
  const routeId = /^\/store\/([^/]+)$/.exec(pathname)?.[1] ?? null; // 지금 열린 가게 상세
  const askedStore = params.get("store"); // 작은 지도 「지도 크게 보기」에서 온 가게

  const filters = useMemo(() => parseFilters(new URLSearchParams(params.toString())), [params]);
  const now = useMemo(() => new Date(), []);
  const q = useSearch();
  const [sort, setSort] = useState<"near" | "recent" | null>(null); // null = 위치 있으면 가까운순, 없으면 최근 확인순
  const [sheet, setSheet] = useState<SheetState>("half");
  const [filterOpen, setFilterOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(askedStore);
  const [me, setMe] = useState<LatLng | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const selected = routeId ?? picked;

  // 처음 보여 줄 곳: 가게 주소로 바로 들어왔으면 그 가게 (AC-W03), 작은 지도에서 왔으면 17배. 지도가 처음 켜질 때만 쓰인다.
  const startStore = stores.find((x) => x.id === (routeId ?? askedStore));
  const start = startStore ? { lat: startStore.lat, lng: startStore.lng, zoom: routeId ? 16 : 17 } : undefined;

  // 폰의 가게 상세에서는 큰 지도를 띄울 필요가 없다. 한 번 켠 뒤에는 지도 자리를 기억하도록 그대로 둔다.
  const wantMap = wide || !routeId;
  const [mapOn, setMapOn] = useState(wantMap);
  if (wantMap && !mapOn) setMapOn(true);

  // 다른 가게로 옮기면 지도가 따라간다: PC 상세 · 뒤로 가기 · 「지도 크게 보기」
  const [seen, setSeen] = useState({ routeId, askedStore });
  if (seen.routeId !== routeId || seen.askedStore !== askedStore) {
    setSeen({ routeId, askedStore });
    const id = (wide && routeId) || askedStore;
    const s = id ? stores.find((x) => x.id === id) : undefined;
    if (s) setFocus((f) => ({ lat: s.lat, lng: s.lng, zoom: id === askedStore ? 17 : undefined, n: (f?.n ?? 0) + 1 }));
    if (askedStore) setPicked(askedStore);
  }

  const filtered = useMemo(() => applyFilters(stores, filters, now), [stores, filters, now]);
  const shown = useMemo(() => filtered.filter((s) => matchQuery(s, q)), [filtered, q]);
  // 검색할 때는 지도 범위와 상관없이 찾는다. 지도를 확대해 둔 채 다른 동네를 찾아도 나와야 한다
  const searching = q.trim().length > 0;
  const inView = useMemo(() => (bounds && !searching ? shown.filter((s) => s.lng >= bounds.w && s.lng <= bounds.e && s.lat >= bounds.s && s.lat <= bounds.n) : shown), [shown, bounds, searching]);
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
    const cur = new URLSearchParams(window.location.search);
    const u = new URLSearchParams(qs);
    for (const k of ["pal", "zoom"]) {
      const v = cur.get(k);
      if (v) u.set(k, v);
    }
    window.history.replaceState(null, "", u.size ? `?${u}` : window.location.pathname);
  }, []);
  const resetAll = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };
  const flyTo = (p: LatLng & { zoom?: number }) => setFocus((f) => ({ ...p, n: (f?.n ?? 0) + 1 }));

  const locate = () => {
    if (!navigator.geolocation) return flash("이 브라우저는 위치를 못 받아요");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        setMe(here);
        flyTo({ ...here, zoom: 15 });
      },
      () => flash("위치를 못 받았어요. 지도를 직접 움직여 주세요"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // 처음 위치: 폰은 지도 홈에 들어오면 한 번 묻고, PC는 묻지 않는다(「내 위치」를 눌렀을 때만, REQ-W11).
  // 이미 허용한 기기는 PC에서도 조용히 받는다. 가게로 바로 들어온 경우에는 지도를 옮기지 않는다.
  const asked = useRef(false);
  useEffect(() => {
    if (routeId || asked.current || !navigator.geolocation) return;
    asked.current = true;
    const take = () =>
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const here = { lat: p.coords.latitude, lng: p.coords.longitude };
          setMe(here);
          if (!askedStore) setFocus((f) => ({ ...here, zoom: 15, n: (f?.n ?? 0) + 1 }));
        },
        () => undefined,
        { enableHighAccuracy: true, timeout: 8000 },
      );
    if (!window.matchMedia("(min-width: 768px)").matches) return take();
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((p) => p.state === "granted" && take())
      .catch(() => undefined);
  }, [routeId, askedStore]);

  // 목록에서 고르기.
  // 폰: 지도가 그 가게로 가고 선택 표시, 선택된 줄을 다시 누르면 상세. PC: 바로 상세 패널.
  const openStore = (id: string) => router.push(`/store/${id}${keepFilters()}`);
  const pick = (s: Store) => {
    if (wide) return openStore(s.id);
    if (selected === s.id) return openStore(s.id);
    setPicked(s.id);
    flyTo({ lat: s.lat, lng: s.lng });
    if (sheet === "full") setSheet("half");
  };
  // 지도에서 도장을 누르면: 폰은 접힌 시트를 반쯤 올리고 목록이 그 가게로 스크롤, PC는 상세 패널
  const selectFromMap = (id: string | null) => {
    if (wide) {
      if (id) openStore(id);
      else setPicked(null);
      return;
    }
    setPicked(id);
    if (id && sheet === "peek") setSheet("half");
  };
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!selected) return;
    const el = listRef.current?.querySelector(`#row-${CSS.escape(selected)}`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected, sheet]);

  // PC 키보드: 목록 위아래 이동 · Esc 로 필터·상세 닫기 (REQ-W11)
  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const rows = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="button"]') ?? [])];
    const i = rows.indexOf(document.activeElement as HTMLElement);
    const next = rows[e.key === "ArrowDown" ? i + 1 : Math.max(0, i - 1)];
    if (next) {
      e.preventDefault();
      next.focus();
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !window.matchMedia("(min-width: 768px)").matches) return;
      if (filterOpen) setFilterOpen(false);
      else if (routeId) router.push(`/${keepFilters()}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filterOpen, routeId, router]);

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

  const openFilterAt = (sectionId?: string) => {
    setFilterOpen(true);
    if (sectionId) requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView({ block: "start" }));
  };

  const nFilters = activeFilterCount(filters);
  const filterProps = { value: filters, count: (f: Filters) => applyFilters(stores, f, now).length, onChange: setFilters, onClose: () => setFilterOpen(false) };

  return (
    <div className="md:flex md:h-[calc(100dvh-56px)]" style={{ ["--sheet-h" as string]: SHEET_H[sheet] }}>
      {/* 폰에서 가게 상세를 열면 이 칸 전체를 숨기고, 768 이상에서는 칸을 풀어 패널·지도가 나란히 선다 */}
      <div className={`relative flex h-dvh flex-col overflow-hidden bg-paper md:contents ${routeId ? "max-md:hidden" : ""}`}>
        <header className="z-10 flex items-center justify-between bg-bar px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-1 md:hidden">
          <Logo />
          <span className="text-[12px] text-ink3">
            최근 7일 등록·수정 <b className="text-ink2">{recentReports}건</b>
          </span>
        </header>

        {/* 검색 + 필터 버튼 하나 (슬랙 10-28: 처음부터 많은 선택을 요구하지 않기). 768 이상은 검색이 위 헤더로 올라간다 */}
        <div className="z-10 flex gap-2 border-b border-line bg-bar px-4 py-2 md:hidden">
          <SearchBox />
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className={`relative h-11 shrink-0 rounded-xl border px-3 text-[13px] font-bold ${nFilters ? "border-primary bg-primary text-onprimary" : "border-chipline bg-surface text-ink"}`}
          >
            필터
            {nFilters > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 text-[11px] text-onaccent">{nFilters}</span>}
          </button>
        </div>

        <div className="relative flex-1 md:contents">
          {/* 큰 지도 */}
          <div className="absolute inset-0 [--attrib-bottom:calc(var(--sheet-h)-4px)] md:relative md:inset-auto md:order-3 md:min-w-0 md:flex-1 md:[--attrib-bottom:0px]">
            {mapOn && <TteokMap stores={shown} selectedId={selected} onSelect={selectFromMap} me={me} focus={focus} onBoundsChange={setBounds} start={start} />}

            <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex flex-col items-center gap-1.5">
              {sample && <SampleRibbon />}
              {toast && <span className="rounded-full bg-ink px-3 py-1.5 text-[13px] text-paper">{toast}</span>}
            </div>

            {/* 시트를 다 올리면 지도 버튼은 숨긴다(검색창 위로 올라가지 않게) */}
            <div className={`absolute right-3 bottom-[calc(var(--sheet-h)+12px)] z-10 flex flex-col gap-2.5 transition-[bottom,opacity] md:bottom-[84px] ${sheet === "full" ? "max-md:pointer-events-none max-md:opacity-0" : ""}`}>
              <button type="button" onClick={locate} aria-label="내 위치" title="내 위치" className="grid h-11 w-11 place-items-center rounded-full border border-chipline bg-surface text-loc shadow-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
              </button>
              <Link href="/register" className="grid h-14 w-14 place-items-center rounded-full bg-fab text-[13px] font-bold leading-tight text-onfab shadow-lg md:hidden" aria-label="맛집 등록">
                등록
              </Link>
            </div>
          </div>

          {/* 가게 목록: 폰은 아래 시트, 768 이상은 왼쪽 패널. 패널형에서 상세를 열면 상세가 이 자리를 차지한다 */}
          <section
            className={`absolute inset-x-0 bottom-0 z-20 flex h-[var(--sheet-h)] flex-col rounded-t-2xl border-t border-line bg-surface shadow-[0_-6px_24px_var(--cardshadow)] transition-[height] duration-200 md:static md:order-1 md:h-full md:w-[360px] md:shrink-0 md:rounded-none md:border-t-0 md:border-r md:shadow-none md:transition-none ${
              routeId ? "md:max-xl:hidden xl:w-[360px]" : "xl:w-[400px]"
            }`}
            aria-label="가게 목록"
          >
            {/* 768 이상: 패널 위 칩 */}
            <div className="hidden shrink-0 flex-wrap gap-1.5 border-b border-line px-4 py-2.5 md:flex">
              <button type="button" onClick={() => (filterOpen ? setFilterOpen(false) : openFilterAt())} aria-expanded={filterOpen} className={`h-8 rounded-full border px-3 text-[13px] font-bold ${nFilters || filterOpen ? "border-primary bg-primary text-onprimary" : "border-chipline bg-surface text-ink"}`}>
                필터{nFilters > 0 && ` ${nFilters}`}
              </button>
              {FILTER_CHIPS.map((c) => (
                <button key={c.id} type="button" onClick={() => openFilterAt(c.id)} aria-pressed={c.on(filters)} className={`h-8 rounded-full border px-3 text-[13px] ${c.on(filters) ? "border-primary font-bold text-ink" : "border-chipline bg-surface text-ink2"}`}>
                  {c.label}
                </button>
              ))}
            </div>

            {filterOpen && wide ? (
              <FilterSheet {...filterProps} inline />
            ) : (
              <>
                <div
                  className="shrink-0 cursor-grab touch-none select-none px-4 pt-2 pb-1 md:cursor-auto md:touch-auto md:select-auto md:py-2.5"
                  onPointerDown={(e) => (dragY.current = e.clientY)}
                  onPointerUp={onHandleUp}
                  onPointerCancel={() => (dragY.current = null)}
                >
                  <span className="mx-auto mb-2 block h-1 w-10 rounded-full bg-chipline md:hidden" />
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="min-w-0 text-[14px] font-bold">
                      {inView.length ? `${searching ? "검색으로" : "현재 지도에서"} 찾은 가게 ${inView.length}곳` : shown.length ? "이 지도 안에는 가게가 없어요" : "조건에 맞는 가게가 없어요"}
                    </h2>
                    <div className="flex shrink-0 gap-1 text-[12px]" onPointerDown={(e) => e.stopPropagation()}>
                      {(["near", "recent"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          disabled={k === "near" && !me}
                          onClick={() => setSort(k)}
                          aria-pressed={effSort === k}
                          className={`hit rounded-full px-2.5 py-1 whitespace-nowrap ${effSort === k ? "bg-ink text-paper" : "text-ink3 disabled:opacity-40"}`}
                        >
                          {k === "near" ? "가까운순" : "최근 확인순"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)] ${sheet === "peek" ? "max-md:hidden" : ""}`}>
                  {list.length > 0 ? (
                    <ul ref={listRef} className="divide-y divide-line" onKeyDown={onListKey}>
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
              </>
            )}
          </section>

          {filterOpen && !wide && <FilterSheet {...filterProps} />}
        </div>

        <BottomNav active="map" />
      </div>

      {/* 가게 상세: 폰은 페이지 전체, 768 이상은 패널. 가게를 옮기면 스크롤이 맨 위로 돌아가도록 다시 만든다 */}
      <div
        key={routeId ?? "home"}
        className={routeId ? "bg-surface md:order-2 md:h-full md:w-[360px] md:shrink-0 md:overflow-y-auto md:border-r md:border-line md:shadow-[4px_0_16px_var(--cardshadow)] xl:w-[420px]" : "hidden"}
      >
        {children}
      </div>
    </div>
  );
}

function boundsOf(stores: Store[]): Bounds {
  const lats = stores.map((s) => s.lat);
  const lngs = stores.map((s) => s.lng);
  return { w: Math.min(...lngs), e: Math.max(...lngs), s: Math.min(...lats), n: Math.max(...lats) };
}
