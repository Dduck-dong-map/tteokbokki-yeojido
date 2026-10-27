"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import TteokMap from "@/components/map/TteokMap";
import { activeFilterCount, applyFilters, distanceM, parseFilters, serializeFilters, type Filters } from "@/lib/filters";
import type { Store } from "@/lib/types";
import { BottomNav, SampleRibbon } from "../ui";
import FilterSheet from "./FilterSheet";
import StoreCard from "./StoreCard";

type LatLng = { lat: number; lng: number };

export default function MapHome({ stores, recentReports, sample }: { stores: Store[]; recentReports: number; sample: boolean }) {
  const params = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(params.toString())), [params]);
  const now = useMemo(() => new Date(), []);
  const shown = useMemo(() => applyFilters(stores, filters, now), [stores, filters, now]);

  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [trail, setTrail] = useState<string[]>([]); // 카드에서 넘겨 본 가게들 (이전 버튼)
  const [me, setMe] = useState<LatLng | null>(null);
  const [focus, setFocus] = useState<(LatLng & { zoom?: number; n: number }) | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // 필터는 주소에 담는다 → 주소를 그대로 공유하면 같은 지도가 열린다
  const setFilters = useCallback((f: Filters) => {
    const qs = serializeFilters(f);
    const pal = new URLSearchParams(window.location.search).get("pal");
    const q = new URLSearchParams(qs);
    if (pal) q.set("pal", pal);
    window.history.replaceState(null, "", q.size ? `?${q}` : window.location.pathname);
  }, []);

  const store = shown.find((s) => s.id === selected) ?? null;
  const flyTo = (p: LatLng & { zoom?: number }) => setFocus((f) => ({ ...p, n: (f?.n ?? 0) + 1 }));

  const select = (id: string | null) => {
    setSelected(id);
    setTrail([]);
  };

  const goNext = () => {
    if (!store) return;
    const seen = new Set([...trail, store.id]);
    const next = shown.filter((s) => !seen.has(s.id)).sort((a, b) => distanceM(store, a) - distanceM(store, b))[0];
    if (!next) return flash("이 조건의 가게를 다 봤어요");
    setTrail([...trail, store.id]);
    setSelected(next.id);
    flyTo({ lat: next.lat, lng: next.lng });
  };
  const goPrev = () => {
    const prev = trail.at(-1);
    if (!prev) return;
    setTrail(trail.slice(0, -1));
    setSelected(prev);
    const p = shown.find((s) => s.id === prev);
    if (p) flyTo({ lat: p.lat, lng: p.lng });
  };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

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

  const nFilters = activeFilterCount(filters);
  const quick = (key: "openNow" | "solo", label: string) => (
    <button
      type="button"
      onClick={() => setFilters({ ...filters, [key]: !filters[key] })}
      aria-pressed={filters[key]}
      className={`h-8 shrink-0 rounded-full border px-3 text-[13px] font-medium ${
        filters[key] ? "border-primary bg-primary text-onprimary" : "border-chipline bg-surface text-ink2"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative mx-auto flex h-dvh max-w-[480px] flex-col overflow-hidden bg-paper">
      <header className="z-10 flex items-center justify-between bg-bar px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo_red.png" alt="떡볶여지도" className="h-8 w-auto [filter:var(--logo-filter)]" />
        <span className="text-[12px] text-ink3">
          최근 7일 제보·수정 <b className="text-ink2">{recentReports}건</b>
        </span>
      </header>

      <div className="z-10 flex gap-1.5 overflow-x-auto border-b border-line bg-bar px-4 py-2 [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setSheet(true)}
          className={`h-8 shrink-0 rounded-full border px-3 text-[13px] font-bold ${
            nFilters ? "border-primary bg-primary text-onprimary" : "border-ink2 bg-surface text-ink"
          }`}
        >
          취향 필터{nFilters ? ` ${nFilters}` : ""}
        </button>
        {(["떡", "스타일", "맵기", "가격"] as const).map((l) => (
          <button key={l} type="button" onClick={() => setSheet(true)} className="h-8 shrink-0 rounded-full border border-chipline bg-surface px-3 text-[13px] text-ink2">
            {l} ▾
          </button>
        ))}
        {quick("openNow", "영업 중")}
        {quick("solo", "혼밥")}
      </div>

      <div className="relative flex-1" style={{ ["--attrib-bottom" as string]: store ? "196px" : "0px" }}>
        <TteokMap stores={shown} selectedId={selected} onSelect={select} me={me} focus={focus} />

        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex flex-col items-center gap-1.5">
          <span className="rounded-full bg-surface/95 px-3 py-1 text-[13px] font-semibold shadow-sm">
            {shown.length ? `조건에 맞는 가게 ${shown.length}곳` : "조건에 맞는 가게가 없어요"}
          </span>
          {sample && <SampleRibbon />}
          {toast && <span className="rounded-full bg-ink px-3 py-1.5 text-[13px] text-paper">{toast}</span>}
        </div>

        <div className={`absolute right-3 z-10 flex flex-col gap-2.5 transition-[bottom] ${store ? "bottom-[212px]" : "bottom-4"}`}>
          <button type="button" onClick={locate} aria-label="내 위치" className="grid h-11 w-11 place-items-center rounded-full border border-chipline bg-surface text-loc shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          </button>
          <Link href="/report" className="grid h-14 w-14 place-items-center rounded-full bg-fab text-[13px] font-bold leading-tight text-onfab shadow-lg" aria-label="제보하기">
            제보
          </Link>
        </div>

        {store && (
          <div className="absolute inset-x-3 bottom-3 z-20">
            <StoreCard key={store.id} store={store} me={me} onNext={goNext} onPrev={goPrev} hasPrev={trail.length > 0} />
          </div>
        )}

        {sheet && <FilterSheet value={filters} count={(f) => applyFilters(stores, f, now).length} onChange={setFilters} onClose={() => setSheet(false)} />}
      </div>

      <BottomNav active="map" />
    </div>
  );
}
