"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Bounds, Focus } from "@/components/map/TteokMap";
import { DEFAULT_FILTERS, activeFilterCount, applyFilters, byRecentlyConfirmed, distanceM, matchQuery, parseFilters, serializeFilters, type Filters } from "@/lib/filters";
import { useIsWide } from "@/lib/screen";
import { setSearch, useSearch } from "@/lib/search";
import type { Store } from "@/lib/types";
import MapShellView from "./MapShellView";
import type { LatLng, SheetState } from "./types";

// 지도 홈 컨테이너 (리팩토링 계획 2026-11-09 · 7-1 형태 2).
// 상태·주소·브라우저 API 는 전부 여기서 끝내고, 그리는 일은 MapShellView 가 props 만 받아서 한다.
//
//   주소(/, /store/[id], ?rice=…&store=…)      브라우저(geolocation · matchMedia · history)
//          │ useSearchParams · usePathname              │ locate · 첫 위치 effect · setFilters
//          ▼                                            ▼
//   ┌──────────────────── MapShell (상태) ─────────────────────┐
//   │ 선택 가게 selected = routeId ?? picked                    │
//   │ 필터 filters(주소) → filtered → 검색 shown → 범위 inView  │
//   │ 정렬 effSort → list · 시트 sheet · 필터칸 filterOpen       │
//   │ 내 위치 me · 지도 초점 focus · 범위 bounds · 토스트 toast  │
//   └───────────┬───────────────────────────────┬─────────────┘
//               │ props + onX                   │ children (가게 상세)
//               ▼                               ▼
//   ┌──────── MapShellView (틀: 폭 3단) ──────────────────────┐
//   │ 폰 <768  : 지도 전체 + 아래 시트(peek/half/full) + 메뉴    │
//   │ 패널 768~: 왼쪽 패널(목록 ↔ 상세) + 큰 지도                │
//   │ 3단 ≥1280: 목록 + 상세 + 큰 지도                           │
//   │   └ TteokMap(shown · selectedId · focus · me)              │
//   │       → onSelectFromMap · onBoundsChange · onMapSettled    │
//   └────────────────────────────────────────────────────────┘
//
// 찾는 순서는 그대로다(슬랙 10-28): 접속 즉시 주변 가게 → 검색 → 가게 선택 → 상세 → 길찾기.

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

// 지도 틀 (웹 1차 기획 3.2 · 지도 홈 + 가게 상세가 함께 쓴다). 폭 3단의 배치는 MapShellView 가 맡는다.
// nowIso = 서버가 잰 현재 시각. 클라이언트에서 new Date() 로 다시 재면 서버 HTML 과 「확인 N일 전」이 달라질 수 있다 (가이드 2.2절)
export default function MapShell({ stores, recentReports, nowIso, children }: { stores: Store[]; recentReports: number; nowIso: string; children: React.ReactNode }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const wide = useIsWide();
  const routeId = /^\/store\/([^/]+)$/.exec(pathname)?.[1] ?? null; // 지금 열린 가게 상세
  const askedStore = params.get("store"); // 작은 지도 「지도 크게 보기」에서 온 가게

  const filters = useMemo(() => parseFilters(new URLSearchParams(params.toString())), [params]);
  const now = useMemo(() => new Date(nowIso), [nowIso]);
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
  const [mapSettled, setMapSettled] = useState(false); // 로딩 화면을 걷을 때

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
  const effSort = sort ?? (me ? "near" : "recent");
  // 가까운순도 지도 범위와 상관없이 조건에 맞는 가게를 모두 가까운 차례로 보여 준다 (11-26: 내 위치로 확대된 지도에 걸려 요일 필터 결과가 2~3곳만 보였다)
  const nearAll = effSort === "near" && !!me;
  const inView = useMemo(() => (bounds && !searching && !nearAll ? shown.filter((s) => s.lng >= bounds.w && s.lng <= bounds.e && s.lat >= bounds.s && s.lat <= bounds.n) : shown), [shown, bounds, searching, nearAll]);
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

  // 사용자가 직접 누른 때만 부른다(「내 위치」 · 「가까운순」). 받으면 then, 못 받으면 failMsg 를 띄운다
  const askLocation = (then: (here: LatLng) => void, failMsg: string) => {
    if (!navigator.geolocation) return flash("이 브라우저는 위치를 못 받아요");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        setMe(here);
        then(here);
      },
      () => flash(failMsg),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };
  const locate = () => askLocation((here) => flyTo({ ...here, zoom: 15 }), "위치를 못 받았어요. 지도를 직접 움직여 주세요");
  // 「가까운순」은 위치가 없어도 누를 수 있다 → 그 자리에서 위치를 묻고, 받으면 정렬만 바꾼다(지도는 옮기지 않는다: 목록이 지도 범위를 따라가서 가게가 사라질 수 있다)
  const changeSort = (key: "near" | "recent") => {
    if (key === "near" && !me) return askLocation(() => setSort("near"), "위치를 못 받아 가까운순으로 볼 수 없어요");
    setSort(key);
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
    const rows = [...(listRef.current?.querySelectorAll<HTMLElement>("li > button") ?? [])];
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
  const onHandleDown = (e: React.PointerEvent) => {
    dragY.current = e.clientY;
  };
  const onHandleUp = (e: React.PointerEvent) => {
    if (dragY.current === null) return;
    const dy = e.clientY - dragY.current;
    dragY.current = null;
    if (dy < -30) step(1);
    else if (dy > 30) step(-1);
    else setSheet((st) => (st === "full" ? "half" : st === "half" ? "full" : "half"));
  };
  const onHandleCancel = () => {
    dragY.current = null;
  };

  const openFilterAt = (sectionId?: string) => {
    setFilterOpen(true);
    if (sectionId) requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView({ block: "start" }));
  };

  const nFilters = activeFilterCount(filters);

  return (
    <MapShellView
      stores={stores}
      shown={shown}
      list={list}
      inViewCount={inView.length}
      searching={searching}
      query={q}
      recentReports={recentReports}
      now={now}
      selectedId={selected}
      routeId={routeId}
      wide={wide}
      sheet={sheet}
      mapOn={mapOn}
      mapSettled={mapSettled}
      start={start}
      focus={focus}
      me={me}
      toast={toast}
      sort={effSort}
      filters={filters}
      filterCount={nFilters}
      filterChips={FILTER_CHIPS.map((c) => ({ id: c.id, label: c.label, on: c.on(filters) }))}
      filterOpen={filterOpen}
      countWith={(f: Filters) => applyFilters(stores, f, now).length}
      onPick={pick}
      onSelectFromMap={selectFromMap}
      onBoundsChange={setBounds}
      onMapSettled={() => setMapSettled(true)}
      onSortChange={changeSort}
      onSheetChange={setSheet}
      onFilterOpen={openFilterAt}
      onFilterClose={() => setFilterOpen(false)}
      onFiltersChange={setFilters}
      onResetAll={resetAll}
      onLocate={locate}
      onShowAll={() => setFocus((f) => ({ n: (f?.n ?? 0) + 1, bounds: boundsOf(shown) }))}
      listRef={listRef}
      onListKeyDown={onListKey}
      onHandlePointerDown={onHandleDown}
      onHandlePointerUp={onHandleUp}
      onHandlePointerCancel={onHandleCancel}
    >
      {children}
    </MapShellView>
  );
}

function boundsOf(stores: Store[]): Bounds {
  const lats = stores.map((s) => s.lat);
  const lngs = stores.map((s) => s.lng);
  return { w: Math.min(...lngs), e: Math.max(...lngs), s: Math.min(...lats), n: Math.max(...lats) };
}
