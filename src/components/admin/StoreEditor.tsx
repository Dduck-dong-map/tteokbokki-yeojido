"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type ReactNode } from "react";
import { confirmStore, createStore, saveStore, setStoreStatus } from "@/app/admin/actions";
import { canGeocode, geocode } from "@/components/map/geocode";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextAreaField, TextField } from "@/components/ui/text-field";
import type { AdminLog, AdminStoreInput } from "@/lib/data/admin";
import type { Research } from "@/lib/data/datasets";
import { DAY_NAMES } from "@/lib/freshness";
import { GRADES, MAX_TASTES, RICE_CAKES, SHOP_TYPES, SIDES, SPICE_LEVELS, STYLES, TASTES, USAGES, keysOf, type Spice } from "@/lib/taxonomy";
import type { Region, Store, StoreStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { parseAddress } from "@/lib/wiki";
import { CELL_MAIN, CELL_NUM, CELL_WRAP, Field, KeyValue, LINK, Notice, Panel, Stamp, StatusBadge, TableFrame } from "./bits";
import { CheckField, PickSelect, Toast, type Option } from "./controls";
import { Icon } from "./Icon";

type Tab = "basic" | "taste" | "menu" | "hours" | "history";
const TABS: { key: Tab; label: string }[] = [
  { key: "basic", label: "기본 정보" },
  { key: "taste", label: "맛 태그" },
  { key: "menu", label: "메뉴·가격" },
  { key: "hours", label: "영업시간" },
  { key: "history", label: "변경 이력" },
];
const KIND_TEXT: Record<string, string> = { new: "등록", edit: "수정", still: "확인", hidden: "숨김", closed: "폐업", verified: "확인 완료" };
const STATUS_TEXT: Record<StoreStatus, string> = { active: "지도에 보임", hidden: "숨김", closed: "폐업" };

// 고르는 칸의 보기 (PickSelect). "" 은 「없음」이거나 아직 안 고른 것
const GRADE_OPTIONS: Option<Store["grade"]>[] = keysOf(GRADES).map((g) => ({ value: g, label: GRADES[g] }));
const SHOP_TYPE_OPTIONS: Option<NonNullable<Store["shopType"]> | "">[] = [{ value: "", label: "없음" }, ...keysOf(SHOP_TYPES).map((g) => ({ value: g, label: SHOP_TYPES[g] }))];
const STYLE_OPTIONS: Option<Draft["style"]>[] = keysOf(STYLES).map((k) => ({ value: k, label: STYLES[k] }));
const HIDE_REASONS = ["등재 기준 미달", "사장님 요청", "정보 확인 중", "중복 가게"];
const CLOSE_REASONS = ["폐업 확인", "이전(다른 곳으로 옮김)", "장기 휴업"];
// 폼 2열 (768 미만은 한 줄). 한 줄을 다 쓰는 칸은 md:col-span-2
const FORM_GRID = "grid gap-4 md:grid-cols-2";

// 저장이 막혔을 때 어느 칸인지 (F012 「저장되지 않고 그 칸이 표시된다」). 서버 검사 문구(lib/data/admin.ts checkAdminStore)의 앞머리로 찾는다.
// 그 칸이 있는 탭으로 옮기고, 칸 아래에 같은 문구를 보인다
type FieldKey = "name" | "grade" | "address" | "latlng" | "gu" | "dong" | "style" | "spice" | "price";
const FIELD_OF: [string, Tab, FieldKey][] = [
  ["가게 이름", "basic", "name"],
  ["등재 등급", "basic", "grade"],
  ["주소를", "basic", "address"],
  ["위도·경도", "basic", "latlng"],
  ["구를", "basic", "gu"],
  ["동을", "basic", "dong"],
  ["스타일", "taste", "style"],
  ["맵기를", "taste", "spice"],
  ["대표 떡볶이", "menu", "price"],
];
const fieldOf = (error: string | null) => (error ? FIELD_OF.find(([head]) => error.startsWith(head)) : undefined);

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const today = () => new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);

// 화면에서 고치는 모양 (숫자 칸은 글자로 들고 있다가 저장할 때 바꾼다)
type Draft = {
  id: string;
  name: string;
  grade: Store["grade"];
  shopType: Store["shopType"] | "";
  address: string;
  gu: string;
  dong: string;
  lat: string;
  lng: string;
  rice: Store["rice"];
  style: Store["style"] | "";
  spice: Spice | 0;
  spiceLabel: string;
  taste: Store["taste"];
  sides: Store["sides"];
  usage: Store["usage"];
  price: string;
  priceCheckedAt: string;
  menu: { name: string; price: string }[];
  hasHours: boolean;
  hours: { days: number[]; open: string; close: string };
  lastConfirmedAt: string;
  memo: string;
};

function toDraft(s: Partial<AdminStoreInput> & { id?: string }): Draft {
  return {
    id: s.id ?? "",
    name: s.name ?? "",
    grade: s.grade ?? "specialist",
    shopType: s.shopType ?? "",
    address: s.address ?? "",
    gu: s.gu ?? "",
    dong: s.dong ?? "",
    lat: s.lat !== undefined ? String(s.lat) : "",
    lng: s.lng !== undefined ? String(s.lng) : "",
    rice: s.rice ?? [],
    style: s.style ?? "",
    spice: s.spice ?? 0,
    spiceLabel: s.spiceLabel ?? "",
    taste: s.taste ?? [],
    sides: s.sides ?? [],
    usage: s.usage ?? [],
    price: s.price !== undefined ? String(s.price) : "",
    priceCheckedAt: s.priceCheckedAt ?? today(),
    menu: (s.menu ?? []).map((m) => ({ name: m.name, price: String(m.price) })),
    hasHours: !!s.hours,
    hours: s.hours ?? { days: [1, 2, 3, 4, 5, 6], open: "11:00", close: "20:00" },
    lastConfirmedAt: s.lastConfirmedAt ?? today(),
    memo: s.memo ?? "",
  };
}

const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(/,/g, "")));
function toInput(d: Draft) {
  return {
    name: d.name,
    grade: d.grade,
    shopType: d.shopType || undefined,
    address: d.address,
    gu: d.gu,
    dong: d.dong,
    lat: num(d.lat),
    lng: num(d.lng),
    rice: d.rice,
    style: d.style || undefined,
    spice: d.spice || undefined,
    spiceLabel: d.spiceLabel,
    taste: d.taste,
    sides: d.sides,
    usage: d.usage,
    price: num(d.price),
    priceCheckedAt: d.priceCheckedAt,
    menu: d.menu.filter((m) => m.name.trim() || m.price.trim()).map((m) => ({ name: m.name, price: num(m.price) ?? 0 })),
    hours: d.hasHours ? d.hours : undefined,
    lastConfirmedAt: d.lastConfirmedAt,
    memo: d.memo,
  };
}

type Props = {
  initial: Store | null; // null = 직접 등록
  template?: Partial<AdminStoreInput>; // 리서치 자료로 채워서 등록할 때
  templateId?: string;
  research?: Research;
  regions: Region[];
  history: AdminLog[];
  exists?: boolean; // 채워서 등록하려는 id 가 이미 DB 에 있음
};

// M-AD-04 가게 편집 (11-15 실제 저장). 태그는 정해진 보기에서만 고른다(기획안 7절). 저장 = 변경 이력 (REQ-AD-09)
export default function StoreEditor({ initial, template, templateId, research, regions, history, exists }: Props) {
  const router = useRouter();
  const isNew = !initial;
  const [start, setStart] = useState(() => toDraft(initial ?? { ...template, id: templateId }));
  const [d, setD] = useState<Draft>(start);
  const [tab, setTab] = useState<Tab>("basic");
  const uid = useId();
  // 내리기 확인 팝업: 열림과 종류를 따로 든다 (닫히는 동안 제목 · 보기가 바뀌지 않게)
  const [confirmKind, setConfirmKind] = useState<"hidden" | "closed">("hidden");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [geoNote, setGeoNote] = useState<string | null>(null); // 주소로 좌표 찾기 결과 (11-21)
  const [busy, startBusy] = useTransition();
  const dirty = JSON.stringify(d) !== JSON.stringify(start);
  const bad = fieldOf(error)?.[2];
  const errorAt = (key: FieldKey) => (bad === key ? (error ?? undefined) : undefined);
  // 저장이 막히면 그 칸이 있는 탭을 연다
  const refuse = (message: string) => {
    setError(message);
    const at = fieldOf(message);
    if (at) setTab(at[1]);
  };
  const status = initial?.status ?? "active";

  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2800);
  };

  const save = () =>
    startBusy(async () => {
      setError(null);
      if (isNew) {
        const r = await createStore(toInput(d), d.id);
        if (!r.ok) return refuse(r.error);
        router.push(`/admin/stores/${r.id}?saved=1`);
        return;
      }
      const r = await saveStore(initial.id, toInput(d));
      if (!r.ok) return refuse(r.error);
      setStart(d);
      flash(`저장했어요 · 바뀐 칸 ${r.changes}개가 이력에 남았어요`);
      router.refresh();
    });

  const act = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, ok: string) =>
    startBusy(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) return setError(r.error);
      flash(ok);
      router.refresh();
    });

  // 주소 → 좌표 (네이버 지도 Geocoding · components/map/geocode.ts, 11-21). 채운 뒤 「이 좌표를 지도에서 보기」로 가게 위인지 본다
  const findLatLng = async () => {
    if (!d.address.trim()) return setGeoNote("주소를 먼저 넣어 주세요");
    setGeoNote("주소로 찾는 중…");
    const p = await geocode(d.address);
    if (!p) return setGeoNote("주소로 못 찾았어요. 지도 앱에서 가게를 길게 눌러 나온 숫자를 넣어 주세요");
    set({ lat: p.lat.toFixed(6), lng: p.lng.toFixed(6) });
    setGeoNote("주소 자리로 채웠어요. 아래 링크로 가게 위인지 확인해 주세요");
  };

  // 주소를 고치면 구·동을 주소 글에서 다시 짐작한다 (비어 있을 때만 채움). 좌표가 비어 있으면 주소로 찾아 채운다
  const guessFromAddress = () => {
    const { gu, dong } = parseAddress(d.address);
    set({ gu: d.gu || (gu !== "etc" ? gu : ""), dong: d.dong || (/(동|가)$/.test(dong) ? dong : "") });
    if (canGeocode && !d.lat.trim() && !d.lng.trim()) void findLatLng();
  };

  const latN = num(d.lat);
  const lngN = num(d.lng);
  const mapLink = latN && lngN ? `https://www.openstreetmap.org/?mlat=${latN}&mlon=${lngN}#map=18/${latN}/${lngN}` : null;

  const askDown = (kind: "hidden" | "closed") => {
    setReason("");
    setConfirmKind(kind);
    setConfirmOpen(true);
  };
  const guOptions: Option[] = [...regions.map((r) => ({ value: r.gu, label: r.name })), { value: "etc", label: "기타" }];
  // 숨기기는 이유가 꼭 있어야 하고(고르기 전 안내 글), 폐업은 안 적어도 된다(「적지 않음」이 보기)
  const reasonOptions: Option[] = confirmKind === "hidden" ? HIDE_REASONS.map((r) => ({ value: r, label: r })) : [{ value: "", label: "적지 않음" }, ...CLOSE_REASONS.map((r) => ({ value: r, label: r }))];
  const researchRows: [ReactNode, ReactNode][] = research
    ? [
        ["근거", research.basis ?? "—"],
        ...(research.gapNotes?.length ? [["빈칸 재조사", research.gapNotes.map((n, i) => <div key={i}>{n}</div>)] as [ReactNode, ReactNode]] : []),
        ...(research.hoursNote ? [["영업시간 메모", research.hoursNote] as [ReactNode, ReactNode]] : []),
        ...(research.statusNote ? [["상태 메모", research.statusNote] as [ReactNode, ReactNode]] : []),
        ["최근 근거", research.lastEvidence ?? "—"],
        ["좌표", research.geo === "building" ? "건물 번호까지 (OpenStreetMap)" : research.geo === "rough" ? "길 근처까지 — 핀 확인 필요" : "못 찾음"],
        [
          "출처",
          research.sources.map((u) => (
            <div key={u} className="truncate">
              <a href={u} target="_blank" rel="noreferrer" className={LINK}>
                {decodeURIComponent(u).replace(/^https?:\/\//, "").slice(0, 70)}
              </a>
            </div>
          )),
        ],
      ]
    : [];

  return (
    <>
      {exists && templateId && (
        <Notice tone="warning">
          이 가게(<b>{templateId}</b>)는 이미 DB 에 있어요.{" "}
          <Link href={`/admin/stores/${templateId}`} className={LINK}>
            그 가게 편집으로 가기
          </Link>
        </Notice>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-4">
        {/* 탭이 폭을 넘으면 이 틀 안에서 옆으로 민다 (켜진 탭의 밑줄이 잘리지 않게 아래를 띄운다) */}
        <div className="overflow-x-auto pb-1.5">
          <TabsList variant="line">
            {TABS.filter((t) => !isNew || t.key !== "history").map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="flex-none px-3">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <Panel
          footer={
            tab !== "history" ? (
              <>
                <span className="mr-auto text-caption text-muted-foreground">{dirty ? "저장하지 않은 변경이 있어요" : isNew ? "칸을 채우고 등록하세요" : "바뀐 것 없음"}</span>
                <Button
                  type="button"
                  variant="outlined"
                  size="md"
                  disabled={!dirty || busy}
                  onClick={() => {
                    setD(start);
                    setError(null);
                  }}
                >
                  되돌리기
                </Button>
                <Button type="button" variant="filled" size="md" disabled={busy || (!isNew && !dirty) || (isNew && !!exists)} onClick={save}>
                  {busy ? "저장 중…" : isNew ? "등록" : "저장"}
                </Button>
              </>
            ) : undefined
          }
        >
          {/* 어느 칸인지 아는 오류는 그 칸 아래에 보인다. 그 밖의 오류만 위에 띄운다 */}
          {error && !bad && <Notice tone="danger">{error}</Notice>}

          <TabsContent value="basic" className={FORM_GRID}>
            <TextField label="가게 이름" required error={errorAt("name")} value={d.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />
            <TextField
              label="주소 이름 (id)"
              className="font-mono"
              value={isNew ? d.id : initial.id}
              disabled={!isNew}
              placeholder="비우면 자동 (예: gn-ruby)"
              onChange={(e) => set({ id: e.target.value.toLowerCase() })}
              help={isNew ? "서비스 주소 /store/<id> 에 쓰여요. 영어 소문자·숫자·- 만." : "만든 뒤에는 바꾸지 않아요 (공유된 주소가 깨지지 않게)."}
            />
            <Field label="등재 등급" required error={errorAt("grade")} htmlFor={`${uid}-grade`} hint="「메뉴에 있음」은 작은 도장, 필터에서 끌 수 있어요.">
              <PickSelect id={`${uid}-grade`} size="field" value={d.grade} onChange={(v) => set({ grade: v })} options={GRADE_OPTIONS} />
            </Field>
            <Field label="가게 유형" htmlFor={`${uid}-shop`}>
              <PickSelect id={`${uid}-shop`} size="field" value={d.shopType ?? ""} onChange={(v) => set({ shopType: v })} options={SHOP_TYPE_OPTIONS} />
            </Field>
            <TextField
              fieldClassName="md:col-span-2"
              label="주소"
              required
              error={errorAt("address")}
              value={d.address}
              onChange={(e) => set({ address: e.target.value })}
              onBlur={guessFromAddress}
              placeholder="서울 강남구 압구정로50길 22"
              help={canGeocode ? "주소를 넣고 칸을 나오면 좌표가 비어 있을 때 네이버 지도로 찾아 채워요." : "지금은 좌표를 직접 넣어요 (네이버 지도 키가 없어 주소로 못 찾아요)."}
            />
            <Field label="구" required error={errorAt("gu")} htmlFor={`${uid}-gu`}>
              <PickSelect id={`${uid}-gu`} size="field" value={d.gu} onChange={(v) => set({ gu: v })} options={guOptions} placeholder="고르세요" />
            </Field>
            <TextField label="동" required error={errorAt("dong")} value={d.dong} onChange={(e) => set({ dong: e.target.value })} placeholder="신사동" />
            <Field
              label="위도 · 경도"
              required
              error={errorAt("latlng")}
              hint={
                <>
                  {geoNote && <span className="block">{geoNote}</span>}
                  {mapLink ? (
                    <a href={mapLink} target="_blank" rel="noreferrer" className={cn(LINK, "inline-flex items-center gap-1")}>
                      이 좌표를 지도에서 보기 <Icon name="external" />
                    </a>
                  ) : (
                    !geoNote && "지도 앱에서 가게를 길게 눌러 나온 숫자를 넣어요."
                  )}
                </>
              }
            >
              <div className="flex items-center gap-2">
                <Input variant="field" className="font-mono" inputMode="decimal" value={d.lat} onChange={(e) => set({ lat: e.target.value })} placeholder="37.5246" aria-label="위도" />
                <Input variant="field" className="font-mono" inputMode="decimal" value={d.lng} onChange={(e) => set({ lng: e.target.value })} placeholder="127.0376" aria-label="경도" />
                {canGeocode && (
                  <Button type="button" variant="outlined" size="md" onClick={() => void findLatLng()} className="shrink-0">
                    주소로 찾기
                  </Button>
                )}
              </div>
            </Field>
            <TextField
              label="마지막 확인일"
              required
              type="date"
              className="font-mono"
              value={d.lastConfirmedAt}
              onChange={(e) => set({ lastConfirmedAt: e.target.value })}
              help="180일이 넘으면 흐리게, 365일이 넘으면 지도에서 내려가요."
            />
            <TextAreaField fieldClassName="md:col-span-2" label="소개글 (서비스에 그대로 보여요)" value={d.memo} maxLength={500} onChange={(e) => set({ memo: e.target.value })} placeholder="비워 두면 안 보여요" />
          </TabsContent>

          <TabsContent value="taste" className="flex flex-col gap-4">
            <Field label="떡 · 여러 개">
              <div className="flex flex-wrap gap-2">
                {keysOf(RICE_CAKES).map((k) => (
                  <Chip key={k} size="lg" selected={d.rice.includes(k)} onChange={() => set({ rice: toggle(d.rice, k) })}>
                    {RICE_CAKES[k]}
                  </Chip>
                ))}
              </div>
            </Field>
            <div className={FORM_GRID}>
              <Field label="스타일 · 하나" required error={errorAt("style")} htmlFor={`${uid}-style`}>
                <PickSelect id={`${uid}-style`} size="field" value={d.style} onChange={(v) => set({ style: v })} options={STYLE_OPTIONS} placeholder="고르세요" />
              </Field>
              <Field label="맵기 · 신라면 = 3" required error={errorAt("spice")} hint={d.spice ? SPICE_LEVELS[d.spice].ref : "대표 메뉴 기준으로 골라요"}>
                <div className="flex flex-wrap gap-2">
                  {([1, 2, 3, 4, 5] as Spice[]).map((n) => (
                    <Chip key={n} size="lg" selected={d.spice === n} onChange={() => set({ spice: n })} aria-label={`맵기 ${n} · ${SPICE_LEVELS[n].ref}`} title={SPICE_LEVELS[n].ref}>
                      <Stamp n={n} />
                    </Chip>
                  ))}
                </div>
              </Field>
              <TextField label="가게가 부르는 맵기 이름" value={d.spiceLabel} maxLength={20} onChange={(e) => set({ spiceLabel: e.target.value })} placeholder="예: 초보맛 · 1단계" />
            </div>
            <Field label={`맛 결 · 최대 ${MAX_TASTES}개`}>
              <div className="flex flex-wrap gap-2">
                {keysOf(TASTES).map((k) => (
                  <Chip key={k} size="lg" selected={d.taste.includes(k)} disabled={!d.taste.includes(k) && d.taste.length >= MAX_TASTES} onChange={() => set({ taste: toggle(d.taste, k) })}>
                    {TASTES[k]}
                  </Chip>
                ))}
              </div>
            </Field>
            <div className={FORM_GRID}>
              <Field label="같이 먹기">
                <div className="flex flex-wrap gap-2">
                  {keysOf(SIDES).map((k) => (
                    <Chip key={k} size="lg" selected={d.sides.includes(k)} onChange={() => set({ sides: toggle(d.sides, k) })}>
                      {SIDES[k]}
                    </Chip>
                  ))}
                </div>
              </Field>
              <Field label="이용">
                <div className="flex flex-wrap gap-2">
                  {keysOf(USAGES).map((k) => (
                    <Chip key={k} size="lg" selected={d.usage.includes(k)} onChange={() => set({ usage: toggle(d.usage, k) })}>
                      {USAGES[k]}
                    </Chip>
                  ))}
                </div>
              </Field>
            </div>
          </TabsContent>

          <TabsContent value="menu" className="flex flex-col gap-4">
            <div className={FORM_GRID}>
              <TextField
                label="대표 떡볶이 1인분 (필터·도장에 쓰는 값)"
                required
                error={errorAt("price")}
                className="font-mono"
                inputMode="numeric"
                value={d.price}
                onChange={(e) => set({ price: e.target.value.replace(/[^\d]/g, "") })}
                placeholder="5000"
                help="여럿이 나눠 먹는 냄비·안주만 있으면 1인분으로 나눈 값을 넣고, 메뉴에는 실제 가격을 적어요."
              />
              <TextField label="가격 확인일" required type="date" className="font-mono" value={d.priceCheckedAt} onChange={(e) => set({ priceCheckedAt: e.target.value })} />
            </div>
            <TableFrame compact>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>메뉴</TableHead>
                    <TableHead className={cn(CELL_NUM, "w-36")}>가격 (원)</TableHead>
                    <TableHead className="w-28">
                      <span className="sr-only">순서 바꾸기 · 빼기</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.menu.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input className="h-10 min-w-32 bg-card text-body-small" value={m.name} aria-label={`메뉴 ${i + 1} 이름`} onChange={(e) => set({ menu: d.menu.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-10 bg-card text-right font-mono text-body-small"
                          inputMode="numeric"
                          value={m.price}
                          aria-label={`메뉴 ${i + 1} 가격`}
                          onChange={(e) => set({ menu: d.menu.map((x, j) => (j === i ? { ...x, price: e.target.value.replace(/[^\d]/g, "") } : x)) })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="text"
                            size="icon-md"
                            disabled={i === 0}
                            aria-label={`메뉴 ${i + 1} 위로`}
                            onClick={() => {
                              const m2 = [...d.menu];
                              [m2[i - 1], m2[i]] = [m2[i], m2[i - 1]];
                              set({ menu: m2 });
                            }}
                          >
                            <Icon name="arrow-up" className="size-icon-sm" />
                          </Button>
                          <Button type="button" variant="text" size="icon-md" aria-label={`메뉴 ${i + 1} 빼기`} onClick={() => set({ menu: d.menu.filter((_, j) => j !== i) })}>
                            <Icon name="close" className="size-icon-sm" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableFrame>
            <div>
              <Button type="button" variant="outlined" size="compact" onClick={() => set({ menu: [...d.menu, { name: "", price: "" }] })}>
                <Icon name="plus" /> 메뉴 더하기
              </Button>
            </div>
            <p className="text-body-small text-muted-foreground">맨 위 메뉴가 대표 메뉴예요. 이용자가 메뉴를 고치면 대표 가격은 맨 위 메뉴 가격으로 바뀌어요.</p>
          </TabsContent>

          <TabsContent value="hours" className="flex flex-col gap-4">
            <CheckField checked={!d.hasHours} onChange={() => set({ hasHours: !d.hasHours })}>
              영업시간을 아직 몰라요 (가게 상세에 「아직 몰라요」로 나와요)
            </CheckField>
            {d.hasHours && (
              <div className={FORM_GRID}>
                <Field label="여는 요일">
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES.map((n, i) => (
                      <Chip key={n} size="lg" selected={d.hours.days.includes(i)} onChange={() => set({ hours: { ...d.hours, days: toggle(d.hours.days, i).sort() } })}>
                        {n}
                      </Chip>
                    ))}
                  </div>
                </Field>
                <Field label="여는 시간 ~ 닫는 시간" hint="닫는 시간이 여는 시간보다 이르면 자정을 넘기는 가게로 봐요. 요일마다 다른 시간은 아직 한 줄로만 적어요.">
                  <div className="flex items-center gap-2">
                    <Input variant="field" type="time" className="font-mono" aria-label="여는 시간" value={d.hours.open} onChange={(e) => set({ hours: { ...d.hours, open: e.target.value } })} />
                    <span aria-hidden="true">~</span>
                    <Input variant="field" type="time" className="font-mono" aria-label="닫는 시간" value={d.hours.close} onChange={(e) => set({ hours: { ...d.hours, close: e.target.value } })} />
                  </div>
                </Field>
              </div>
            )}
          </TabsContent>

          {!isNew && (
            <TabsContent value="history">
              {history.length ? (
                <TableFrame compact>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-36">언제</TableHead>
                        <TableHead className="w-28">누가</TableHead>
                        <TableHead className="w-20">무엇을</TableHead>
                        <TableHead>이전 → 새 값</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-mono text-muted-foreground">
                            {new Date(h.at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </TableCell>
                          <TableCell>{h.who}</TableCell>
                          <TableCell className={CELL_MAIN}>{KIND_TEXT[h.kind] ?? h.kind}</TableCell>
                          <TableCell className={CELL_WRAP}>
                            {h.changes?.length ? (
                              h.changes.map((c, i) => (
                                <div key={i}>
                                  <b>{c.field}</b> <span className="text-muted-foreground">{c.from}</span> → {c.to}
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableFrame>
              ) : (
                <p className="text-muted-foreground">아직 이력이 없어요.</p>
              )}
            </TabsContent>
          )}
        </Panel>
      </Tabs>

      {initial && (
        <Panel title="확인과 내리기" className="mt-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span>
              마지막 확인 <b>{initial.lastConfirmedAt}</b>
            </span>
            <span className="flex-1" />
            <Button type="button" variant="outlined" size="compact" disabled={busy} onClick={() => act(() => confirmStore(initial.id), "확인일을 오늘로 새로 고쳤어요")}>
              <Icon name="check" /> 오늘 확인함
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>
              지금 <b>{STATUS_TEXT[status]}</b>
              <span className="text-muted-foreground"> · 지우지 않아요. 내려도 언제든 되살릴 수 있어요</span>
            </span>
            <span className="flex-1" />
            {status !== "active" && (
              <Button type="button" variant="tonal" size="compact" disabled={busy} onClick={() => act(() => setStoreStatus(initial.id, "active"), "되살렸어요 · 지도에 다시 보여요")}>
                되살리기
              </Button>
            )}
            {status !== "hidden" && (
              <Button type="button" variant="outlined" size="compact" disabled={busy} onClick={() => askDown("hidden")}>
                숨기기
              </Button>
            )}
            {status !== "closed" && (
              <Button type="button" variant="destructive" size="compact" disabled={busy} onClick={() => askDown("closed")}>
                폐업 처리
              </Button>
            )}
          </div>
        </Panel>
      )}

      {research && (
        <Panel
          className="mt-4"
          title="리서치 근거"
          actions={<StatusBadge tone={research.confidence === "high" ? "success" : "warning"}>확신도 {research.confidence === "high" ? "높음" : research.confidence === "medium" ? "보통" : research.confidence ?? "?"}</StatusBadge>}
        >
          <KeyValue items={researchRows} />
        </Panel>
      )}

      {initial && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              {/* 팝업은 어드민 틀 밖에 그려진다 — 어드민 제목 글꼴(Pretendard)을 여기서 준다 */}
              <DialogTitle className="font-sans">{confirmKind === "closed" ? "폐업 처리할까요?" : "숨길까요?"}</DialogTitle>
              <DialogDescription>「{initial.name}」이 지도·목록·검색에서 내려가요. 가게 정보와 이력은 남고, 「되살리기」로 다시 올릴 수 있어요.</DialogDescription>
            </DialogHeader>
            <Field label="이유" required={confirmKind === "hidden"} htmlFor={`${uid}-reason`}>
              <PickSelect id={`${uid}-reason`} size="field" value={reason} onChange={setReason} options={reasonOptions} placeholder={confirmKind === "hidden" ? "고르세요" : undefined} />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outlined" size="md" onClick={() => setConfirmOpen(false)}>
                취소
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="md"
                disabled={busy || (confirmKind === "hidden" && !reason)}
                onClick={() => {
                  const kind = confirmKind;
                  setConfirmOpen(false);
                  act(() => setStoreStatus(initial.id, kind, reason), kind === "closed" ? "폐업 처리했어요 · 되살리기 가능" : "숨겼어요 · 되살리기 가능");
                }}
              >
                {confirmKind === "closed" ? "폐업 처리" : "숨기기"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {toast && <Toast>{toast}</Toast>}
    </>
  );
}
