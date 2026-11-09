"use client";

import { useRef, useState } from "react";
import TteokMap, { type Bounds } from "@/components/map/TteokMap";
import { won } from "@/lib/filters";
import { DAY_NAMES } from "@/lib/freshness";
import { randomNick, setNick, uploadPhoto, useMe } from "@/lib/me";
import { SPICE_LEVELS, type Spice } from "@/lib/taxonomy";
import type { Hours, MenuItem, Store } from "@/lib/types";
import { MAX_INTRO, MAX_MENU, MAX_PHOTOS, STAR_WORDS, checkIntro } from "@/lib/wiki";
import { SpiceStamp } from "@/components/brand";

// 맛집 등록 · 정보 고치기가 함께 쓰는 입력칸들. 입력 글자는 16px (더 작으면 아이폰 사파리가 화면을 저절로 확대한다)

export const INPUT = "mt-1 h-12 w-full rounded-xl border border-chipline bg-surface px-3 text-[16px] text-ink";

export function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`h-11 rounded-full border px-4 text-[14px] font-medium md:h-10 ${on ? "border-primary bg-primary text-onprimary" : "border-chipline bg-surface text-ink2"}`}
    >
      {children}
    </button>
  );
}

export function StarInput({ value, onChange, hint = "안 골라도 돼요" }: { value?: number; onChange: (v?: number) => void; hint?: string }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="가게 평점">
      {([1, 2, 3, 4, 5] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          aria-label={`별 ${v}개`}
          onClick={() => onChange(value === v ? undefined : v)}
          className={`grid h-11 w-10 place-items-center text-[28px] leading-none ${value && v <= value ? "text-[#D98E04]" : "text-chipline"}`}
        >
          ★
        </button>
      ))}
      <span className="ml-1 shrink-0 whitespace-nowrap text-[13px] text-ink3">{value ? STAR_WORDS[value] : hint}</span>
    </div>
  );
}

export function SpiceInput({ value, onChange }: { value?: number; onChange: (v: Spice) => void }) {
  return (
    <div className="flex justify-between gap-1">
      {([1, 2, 3, 4, 5] as Spice[]).map((lv) => (
        <button key={lv} type="button" onClick={() => onChange(lv)} aria-pressed={value === lv} className={`flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 ${value === lv ? "border-primary" : "border-transparent"}`}>
          <SpiceStamp n={lv} size={32} />
          <span className="text-[11px] leading-tight text-ink3">{SPICE_LEVELS[lv].ref.replace(" 정도", "")}</span>
        </button>
      ))}
    </div>
  );
}

const PRICE_HINTS = [3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000];

export function MenuEditor({ menu, onChange }: { menu: MenuItem[]; onChange: (m: MenuItem[]) => void }) {
  const set = (i: number, patch: Partial<MenuItem>) => onChange(menu.map((m, k) => (k === i ? { ...m, ...patch } : m)));
  return (
    <div className="flex flex-col gap-3">
      {menu.map((m, i) => (
        <div key={i}>
          {i === 0 && <p className="mb-1 text-[13px] font-bold">대표 메뉴 <span className="font-normal text-ink3">가격이 지도에 나와요</span></p>}
          <div className="flex items-center gap-2">
            <input
              value={m.name}
              onChange={(e) => set(i, { name: e.target.value })}
              maxLength={30}
              placeholder={i === 0 ? "예: 떡볶이 1인분" : "예: 모둠튀김"}
              aria-label="메뉴 이름"
              className="h-11 min-w-0 flex-1 rounded-xl border border-chipline bg-surface px-3 text-[16px] text-ink"
            />
            <input
              value={m.price || ""}
              onChange={(e) => set(i, { price: Number(e.target.value.replace(/\D/g, "")) })}
              inputMode="numeric"
              placeholder="가격"
              aria-label="가격(원)"
              className="h-11 w-24 rounded-xl border border-chipline bg-surface px-3 text-right text-[16px] text-ink"
            />
            {i > 0 && (
              <button type="button" onClick={() => onChange(menu.filter((_, k) => k !== i))} aria-label="이 메뉴 빼기" className="grid h-11 w-11 shrink-0 place-items-center text-[18px] text-ink3 md:w-7">
                ×
              </button>
            )}
          </div>
          {i === 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRICE_HINTS.map((p) => (
                <button key={p} type="button" onClick={() => set(0, { price: p })} aria-pressed={m.price === p} className={`hit h-10 rounded-full border px-2.5 text-[12px] md:h-8 ${m.price === p ? "border-primary bg-primary text-onprimary" : "border-chipline bg-surface text-ink2"}`}>
                  {won(p)}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      {menu.length < MAX_MENU && (
        <button type="button" onClick={() => onChange([...menu, { name: "", price: 0 }])} className="h-11 rounded-xl border border-dashed border-chipline text-[13px] text-ink2">
          + 다른 메뉴 더하기
        </button>
      )}
    </div>
  );
}

export function PhotoPicker({ ids, onChange, hint }: { ids: string[]; onChange: (ids: string[]) => void; hint: string }) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const pick = async (files: FileList | null) => {
    if (!files?.length || busy) return;
    setBusy(true);
    setError(null);
    const next = [...ids];
    for (const f of Array.from(files).slice(0, MAX_PHOTOS - ids.length)) {
      const r = await uploadPhoto(f);
      if ("id" in r) next.push(r.id);
      else setError(r.error);
    }
    onChange(next);
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {ids.map((id) => (
          <div key={id} className="relative aspect-square overflow-hidden rounded-xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${id}`} alt="올린 사진" className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(ids.filter((x) => x !== id))} aria-label="이 사진 빼기" className="hit absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-ink/70 text-[14px] text-paper">
              ×
            </button>
          </div>
        ))}
        {ids.length < MAX_PHOTOS && (
          <label
            className={`grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed bg-surface px-1 text-center text-[13px] text-ink3 ${over ? "border-primary" : "border-chipline"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              pick(e.dataTransfer.files);
            }}
          >
            <span>
              {busy ? "올리는 중…" : "+ 사진"}
              {!busy && <span className="mt-1 hidden text-[11px] leading-tight md:block">끌어다 놓거나 누르기</span>}
            </span>
            <input ref={input} type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={(e) => pick(e.target.files)} />
          </label>
        )}
      </div>
      <p className="mt-2 text-[12px] text-ink3">{hint}</p>
      {error && <p className="mt-1 text-[13px] text-spicytext">{error}</p>}
    </div>
  );
}

// 소개글: 가게당 한 편 · 글자만. 전화번호·링크는 쓰는 동안 바로 알려 준다 (경고창#3)
const INTRO_STARTS = ["이 집은요", "같이 먹으면 좋은 건", "이럴 때 가면 좋아요"];

export function IntroField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const box = useRef<HTMLTextAreaElement>(null);
  const warning = value ? checkIntro(value) : null;
  return (
    <div className="flex flex-col gap-2">
      <textarea
        id={id}
        ref={box}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX_INTRO}
        rows={6}
        placeholder="어떤 떡볶이예요? 왜 추천하나요?"
        aria-invalid={!!warning}
        className={`w-full rounded-xl border bg-surface px-3 py-2.5 text-[16px] leading-relaxed text-ink placeholder:text-ink3 ${warning ? "border-spicytext" : "border-chipline"}`}
      />
      <p className="flex justify-between gap-3 text-[12px] text-ink3">
        <span className={warning ? "font-semibold text-spicytext" : ""}>{warning ?? "글자만 · 전화번호·링크는 안 돼요"}</span>
        <span className="shrink-0">
          {value.length} / {MAX_INTRO}
        </span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {INTRO_STARTS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              onChange(`${value}${value && !value.endsWith("\n") ? "\n" : ""}${t} `.slice(0, MAX_INTRO));
              box.current?.focus();
            }}
            className="h-11 rounded-full border border-chipline bg-surface px-3 text-[13px] text-ink2 md:h-9"
          >
            {t}
          </button>
        ))}
      </div>
      <p className="text-[12px] text-ink3">누구나 고칠 수 있고, 고친 내용은 이력에 남아요.</p>
    </div>
  );
}

// 가입 없이 쓰는 닉네임: 자동으로 지어 주고, 바꿔도 된다
export function NickField() {
  const me = useMe();
  return (
    <div className="text-[13px] text-ink3">
      <label htmlFor="nick">닉네임 <span className="text-[12px]">가입 없이 이 이름으로 올라가요</span></label>
      <div className="mt-1 flex gap-2">
        <input id="nick" value={me.nick} onChange={(e) => setNick(e.target.value.slice(0, 16))} maxLength={16} className="h-11 min-w-0 flex-1 rounded-xl border border-chipline bg-surface px-3 text-[16px] text-ink" />
        <button type="button" onClick={() => setNick(randomNick())} className="h-11 shrink-0 rounded-xl border border-chipline bg-surface px-3 text-[13px] text-ink2">
          다시 짓기
        </button>
      </div>
    </div>
  );
}

// 지도를 움직여 가운데 핀을 가게 위에 맞춘다
export function MapPicker({ stores, start, onChange, tall = false }: { stores: Store[]; start?: { lat: number; lng: number }; onChange: (p: { lat: number; lng: number }) => void; tall?: boolean }) {
  const [focus, setFocus] = useState<{ n: number; lat: number; lng: number; zoom: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const onBounds = (b: Bounds) => onChange({ lat: (b.s + b.n) / 2, lng: (b.w + b.e) / 2 });
  const locate = () => {
    if (!navigator.geolocation) return setMsg("이 브라우저는 위치를 못 받아요");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setMsg(null);
        setFocus((f) => ({ n: (f?.n ?? 0) + 1, lat: p.coords.latitude, lng: p.coords.longitude, zoom: 17 }));
      },
      () => setMsg("위치를 못 받았어요. 지도를 직접 움직여 주세요"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };
  return (
    <div>
      <div className={`relative h-56 overflow-hidden rounded-2xl border border-chipline ${tall ? "md:h-[330px]" : ""}`}>
        <TteokMap stores={stores} selectedId={null} onSelect={() => undefined} me={null} focus={focus} onBoundsChange={onBounds} start={{ lat: start?.lat ?? 37.5555, lng: start?.lng ?? 126.928, zoom: start ? 17 : 15 }} />
        {/* 가운데 핀: 끝이 지도 한가운데를 가리킨다 */}
        <svg width="28" height="38" viewBox="0 0 28 38" aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full">
          <path d="M14 37C14 37 27 22 27 13.5a13 13 0 1 0-26 0C1 22 14 37 14 37Z" fill="var(--fab)" stroke="#fff" strokeWidth="2" />
          <circle cx="14" cy="13.5" r="4.5" fill="#fff" />
        </svg>
        <button type="button" onClick={locate} className="absolute top-2 right-2 z-10 h-11 rounded-full md:h-9 border border-chipline bg-surface px-3 text-[12px] font-semibold text-ink shadow-sm">
          내 위치로
        </button>
      </div>
      <p className="mt-1.5 text-[12px] text-ink3">{msg ?? "지도를 움직여 핀을 가게 자리에 맞춰 주세요"}</p>
    </div>
  );
}

const DEFAULT_HOURS: Hours = { days: [1, 2, 3, 4, 5, 6], open: "11:00", close: "20:00" };

export function HoursField({ value, onChange }: { value: Hours | null; onChange: (h: Hours | null) => void }) {
  if (!value)
    return (
      <button type="button" onClick={() => onChange(DEFAULT_HOURS)} className="h-11 w-full rounded-xl border border-dashed border-chipline text-[14px] text-ink2">
        + 영업시간 채우기
      </button>
    );
  const toggle = (d: number) => onChange({ ...value, days: value.days.includes(d) ? value.days.filter((x) => x !== d) : [...value.days, d].sort() });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-1">
        {DAY_NAMES.map((n, d) => (
          <button key={n} type="button" onClick={() => toggle(d)} aria-pressed={value.days.includes(d)} className={`h-11 flex-1 rounded-lg border text-[13px] md:h-9 ${value.days.includes(d) ? "border-primary bg-primary text-onprimary" : "border-chipline bg-surface text-ink3"}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[14px]">
        <input type="time" value={value.open} onChange={(e) => onChange({ ...value, open: e.target.value })} aria-label="여는 시간" className="h-11 min-w-0 flex-1 rounded-xl border border-chipline bg-surface px-3 text-[16px] text-ink" />
        <span className="text-ink3">~</span>
        <input type="time" value={value.close} onChange={(e) => onChange({ ...value, close: e.target.value })} aria-label="닫는 시간" className="h-11 min-w-0 flex-1 rounded-xl border border-chipline bg-surface px-3 text-[16px] text-ink" />
        <button type="button" onClick={() => onChange(null)} className="hit shrink-0 px-1 text-[12px] text-ink3 underline underline-offset-2">
          모름
        </button>
      </div>
    </div>
  );
}
