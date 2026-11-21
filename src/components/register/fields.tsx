"use client";

import { useRef, useState } from "react";
import TteokMap, { type Bounds } from "@/components/map/TteokMap";
import { MapPin, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { won } from "@/lib/filters";
import { DAY_NAMES } from "@/lib/freshness";
import { randomNick, setNick, uploadPhoto, useMe } from "@/lib/me";
import { SPICE_LEVELS, type Spice } from "@/lib/taxonomy";
import type { Hours, MenuItem, Store } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MAX_INTRO, MAX_MENU, MAX_PHOTOS, STAR_WORDS, checkIntro } from "@/lib/wiki";
import { SpiceStamp } from "@/components/brand";

// 맛집 등록 · 정보 고치기(· 평가 남기기의 StarInput·NickField)가 함께 쓰는 입력칸들.
// 색은 shadcn 변수(border-input · bg-card · text-foreground · text-muted-foreground …)만 쓴다.
// 입력칸은 디자인 시스템 TextField 의 칸(Input · Textarea 의 variant="field": 56px · 18px)이다. 18px 이라 아이폰 사파리가 화면을 확대하지 않는다.
// 고르는 단추는 ui/chip, 누르는 단추는 ui/button 을 쓴다. 별점 · 맵기 칸 · 숨긴 파일 선택만 날 요소로 남긴다(자리마다 까닭을 적었다).

// 고르는 칩(떡 · 스타일 · 등급 · 이용). 켜짐은 Chip 이 aria-pressed 와 체크 아이콘으로 알린다. 누를 때마다 onClick 을 그대로 부른다
export function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Chip size="lg" selected={on} onClick={onClick}>
      {children}
    </Chip>
  );
}

export function StarInput({ value, onChange, hint = "안 골라도 돼요" }: { value?: number; onChange: (v?: number) => void; hint?: string }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="가게 평점">
      {([1, 2, 3, 4, 5] as const).map((v) => (
        // eslint-disable-next-line no-restricted-syntax -- 별점 고르기: role="radio" 인 별 다섯 개 (brand/StarGlyph 색)
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          aria-label={`별 ${v}개`}
          onClick={() => onChange(value === v ? undefined : v)}
          className={cn("grid h-11 w-10 place-items-center text-heading-2 leading-none", value && v <= value ? "text-star" : "text-input")}
        >
          ★
        </button>
      ))}
      <span className="ml-1 min-w-0 truncate text-caption text-muted-foreground/70">{value ? STAR_WORDS[value] : hint}</span>
    </div>
  );
}

export function SpiceInput({ value, onChange }: { value?: number; onChange: (v: Spice) => void }) {
  return (
    <div className="flex justify-between gap-1">
      {([1, 2, 3, 4, 5] as Spice[]).map((lv) => (
        // eslint-disable-next-line no-restricted-syntax -- 맵기 칸: Chip(shape="tile")은 도장 속 고추 그림을 20px 로 키워 버린다
        <button key={lv} type="button" onClick={() => onChange(lv)} aria-pressed={value === lv} className={cn("flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl border py-2", value === lv ? "border-primary" : "border-transparent")}>
          <SpiceStamp n={lv} size={32} />
          <span className="text-center text-caption break-keep text-muted-foreground/70 [overflow-wrap:anywhere]">{SPICE_LEVELS[lv].ref.replace(" 정도", "")}</span>
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
          {i === 0 && (
            <p className="mb-1 text-caption font-bold">
              대표 메뉴 <span className="font-normal text-muted-foreground/70">가격이 지도에 나와요</span>
            </p>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={m.name}
              onChange={(e) => set(i, { name: e.target.value })}
              maxLength={30}
              placeholder={i === 0 ? "예: 떡볶이 1인분" : "예: 모둠튀김"}
              aria-label="메뉴 이름"
              variant="field"
              className="min-w-0 flex-1"
            />
            <Input
              value={m.price || ""}
              onChange={(e) => set(i, { price: Number(e.target.value.replace(/\D/g, "")) })}
              inputMode="numeric"
              placeholder="가격"
              aria-label="가격(원)"
              variant="field"
              className="w-28 shrink-0 text-right"
            />
            {i > 0 && (
              <Button type="button" variant="text" size="icon-xl" onClick={() => onChange(menu.filter((_, k) => k !== i))} aria-label="이 메뉴 빼기" className="text-muted-foreground">
                <X aria-hidden="true" />
              </Button>
            )}
          </div>
          {i === 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {PRICE_HINTS.map((p) => (
                // 누를 때마다 그 값으로 채운다(다시 눌러도 그대로)
                <Chip key={p} size="sm" shape="pill" selected={m.price === p} onClick={() => set(0, { price: p })}>
                  {won(p)}
                </Chip>
              ))}
            </div>
          )}
        </div>
      ))}
      {menu.length < MAX_MENU && (
        <Button type="button" variant="outlined" size="md" onClick={() => onChange([...menu, { name: "", price: 0 }])} className="w-full border-dashed text-muted-foreground">
          <Plus strokeWidth={2} aria-hidden="true" />
          다른 메뉴 더하기
        </Button>
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
          <div key={id} className="relative aspect-square overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${id}`} alt="올린 사진" className="h-full w-full object-cover" />
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => onChange(ids.filter((x) => x !== id))} aria-label="이 사진 빼기" className="hit absolute top-1 right-1 rounded-full bg-foreground/70 text-background hover:bg-foreground hover:text-background">
              <X className="size-4" strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        ))}
        {ids.length < MAX_PHOTOS && (
          <label
            className={cn("grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed bg-card px-1 text-center text-caption text-muted-foreground/70", over ? "border-primary" : "border-input")}
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
            <span className="flex flex-col items-center">
              {busy ? (
                "올리는 중…"
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
                  사진
                </span>
              )}
              {!busy && <span className="mt-1 hidden text-caption break-keep md:block">끌어다 놓거나 누르기</span>}
            </span>
            {/* eslint-disable-next-line no-restricted-syntax -- 숨긴 파일 선택: 바깥 label 이 눌리는 칸이라 꾸밈이 없다 */}
            <input ref={input} type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={(e) => pick(e.target.files)} />
          </label>
        )}
      </div>
      <p className="mt-2 text-body-small break-keep text-muted-foreground/70 [overflow-wrap:anywhere]">{hint}</p>
      {error && <p className="mt-1 text-body-small text-spicytext">{error}</p>}
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
      {/* 경고 때 빨간 테두리는 Textarea 의 aria-invalid 스타일이 맡는다. rows 가 먹도록 field-sizing 은 fixed 로 */}
      <Textarea
        id={id}
        ref={box}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={MAX_INTRO}
        rows={6}
        placeholder="어떤 떡볶이예요? 왜 추천하나요?"
        aria-invalid={!!warning}
        variant="field"
        className="field-sizing-fixed"
      />
      <p className="flex justify-between gap-3 text-body-small text-muted-foreground/70">
        <span className={cn("min-w-0 break-keep [overflow-wrap:anywhere]", warning && "font-semibold text-spicytext")}>{warning ?? "글자만 · 전화번호·링크는 안 돼요"}</span>
        <span className="shrink-0">
          {value.length} / {MAX_INTRO}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {INTRO_STARTS.map((t) => (
          <Button
            key={t}
            type="button"
            variant="outlined"
            size="compact"
            onClick={() => {
              onChange(`${value}${value && !value.endsWith("\n") ? "\n" : ""}${t} `.slice(0, MAX_INTRO));
              box.current?.focus();
            }}
          >
            {t}
          </Button>
        ))}
      </div>
      <p className="text-body-small text-muted-foreground/70">누구나 고칠 수 있고, 고친 내용은 이력에 남아요.</p>
    </div>
  );
}

// 가입 없이 쓰는 닉네임: 자동으로 지어 주고, 바꿔도 된다
export function NickField() {
  const me = useMe();
  return (
    <div className="text-body-small text-muted-foreground/70">
      <label htmlFor="nick" className="break-keep [overflow-wrap:anywhere]">
        닉네임 <span>가입 없이 이 이름으로 올라가요</span>
      </label>
      <div className="mt-1 flex items-center gap-2">
        <Input id="nick" value={me.nick} onChange={(e) => setNick(e.target.value.slice(0, 16))} maxLength={16} variant="field" className="min-w-0 flex-1" />
        <Button type="button" variant="outlined" size="md" onClick={() => setNick(randomNick())} className="px-4">
          다시 짓기
        </Button>
      </div>
    </div>
  );
}

// 지도를 움직여 가운데 핀을 가게 위에 맞춘다
// goTo: 밖에서 정한 자리(주소로 찾은 곳)로 지도를 옮긴다. n 이 바뀔 때마다 한 번. hint: 그때 핀 아래에 보여 줄 말
export function MapPicker({
  stores, start, onChange, tall = false, goTo, hint,
}: {
  stores: Store[];
  start?: { lat: number; lng: number };
  onChange: (p: { lat: number; lng: number }) => void;
  tall?: boolean;
  goTo?: { lat: number; lng: number; n: number } | null;
  hint?: string | null;
}) {
  const [focus, setFocus] = useState<{ n: number; lat: number; lng: number; zoom: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [wide, setWide] = useState(false); // 아직 넓게 보는 중 (그림 지도) → 더 확대해 달라고 안내한다
  const [went, setWent] = useState(goTo?.n);
  if (goTo && goTo.n !== went) {
    setWent(goTo.n);
    setMsg(null);
    setFocus((f) => ({ n: (f?.n ?? 0) + 1, lat: goTo.lat, lng: goTo.lng, zoom: 17 }));
  }
  const onBounds = (b: Bounds) => {
    onChange({ lat: (b.s + b.n) / 2, lng: (b.w + b.e) / 2 });
    // 세로로 250m 넘게 보이면(대략 16.5배 아래) 건물 · 상호가 안 보여 핀이 수십 m 씩 어긋난다.
    // 넓게 찍은 좌표는 조회 화면에서 확대했을 때 다른 건물 위에 놓인다 (11-21)
    setWide((b.n - b.s) * 111_320 > 250);
  };
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
      <div className={cn("relative h-56 overflow-hidden rounded-2xl border border-input", tall && "md:h-[330px]")}>
        <TteokMap stores={stores} selectedId={null} onSelect={() => undefined} me={null} focus={focus} onBoundsChange={onBounds} zoomAtCenter start={{ lat: start?.lat ?? 37.5555, lng: start?.lng ?? 126.928, zoom: start ? 17 : 15 }} />
        {/* 가운데 핀(lucide MapPin): 끝이 지도 한가운데를 가리킨다. 속은 등록 버튼과 같은 제보 갈색(fill-report), 선은 그 위 글자색(currentColor).
            MapPin 의 끝은 그림 칸 아래에서 1/12 위라 그만큼(40px 의 1/12 ≈ 3px) 덜 올린다 */}
        <MapPin
          aria-hidden="true"
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 left-1/2 z-10 size-10 -translate-x-1/2 -translate-y-[calc(100%-3px)] fill-report text-report-foreground"
        />
        {/* 지도 위에 뜨는 단추: 카드 면 + elevation-1 */}
        <Button type="button" variant="outlined" size="compact" onClick={locate} className="absolute top-2 right-2 z-10 bg-card shadow-elevation-1">
          내 위치로
        </Button>
      </div>
      <p className="mt-1.5 text-body-small text-muted-foreground/70">{msg ?? (wide ? "지도를 더 확대해서 핀을 가게 건물 위에 정확히 맞춰 주세요" : (hint ?? "지도를 움직여 핀을 가게 자리에 맞춰 주세요"))}</p>
    </div>
  );
}

const DEFAULT_HOURS: Hours = { days: [1, 2, 3, 4, 5, 6], open: "11:00", close: "20:00" };

export function HoursField({ value, onChange }: { value: Hours | null; onChange: (h: Hours | null) => void }) {
  if (!value)
    return (
      <Button type="button" variant="outlined" size="md" onClick={() => onChange(DEFAULT_HOURS)} className="w-full border-dashed text-muted-foreground">
        <Plus strokeWidth={2} aria-hidden="true" />
        영업시간 채우기
      </Button>
    );
  const toggle = (d: number) => onChange({ ...value, days: value.days.includes(d) ? value.days.filter((x) => x !== d) : [...value.days, d].sort() });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between gap-1">
        {DAY_NAMES.map((n, d) => (
          // 일곱 칸이 한 줄에 들어가게(360 폭) 좌우 여백을 없애고 폭을 똑같이 나눈다. 켜짐 체크는 작게(12px)
          <Chip key={n} selected={value.days.includes(d)} onClick={() => toggle(d)} className="min-w-0 flex-1 gap-0 px-0 [&_svg]:size-3">
            {n}
          </Chip>
        ))}
      </div>
      {/* 시간 칸 글자는 16px(폰 자동 확대 하한) — 18px 이면 360 폭에서 시계 아이콘에 밀려 시각이 잘린다 */}
      <div className="flex items-center gap-1.5 text-body-small">
        <Input type="time" value={value.open} onChange={(e) => onChange({ ...value, open: e.target.value })} aria-label="여는 시간" variant="field" className="min-w-0 flex-1 px-2 text-body-medium [&::-webkit-calendar-picker-indicator]:ms-0.5" />
        <span className="text-muted-foreground/70">~</span>
        <Input type="time" value={value.close} onChange={(e) => onChange({ ...value, close: e.target.value })} aria-label="닫는 시간" variant="field" className="min-w-0 flex-1 px-2 text-body-medium [&::-webkit-calendar-picker-indicator]:ms-0.5" />
        <Button type="button" variant="text" size="compact" onClick={() => onChange(null)} className="shrink-0 px-2">
          모름
        </Button>
      </div>
    </div>
  );
}
