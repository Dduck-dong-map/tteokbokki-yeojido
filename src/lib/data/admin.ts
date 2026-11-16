import { randomUUID } from "node:crypto";
import { won } from "../filters";
import { DAY_NAMES } from "../freshness";
import { GRADES, MAX_TASTES, RICE_CAKES, SHOP_TYPES, SIDES, SPICE_LEVELS, STYLES, TASTES, USAGES } from "../taxonomy";
import type { Change, Fail, HistoryItem, HistoryKind, Hours, MenuItem, Store, StoreStatus } from "../types";
import { GU_SLUGS } from "../wiki";
import { REGIONS } from "./sample-stores";
import { type Db, hash, isoDay, load, mutate } from "./db";

// 운영 어드민의 가게 관리 (11-15). 화면 = /admin/stores · /admin/candidates · /admin/logs, 부르는 곳 = app/admin/actions.ts.
// 이용자 쓰기 규칙(db.ts: 하루 한도·중복 막기·「확인 중」)은 운영자에게 걸지 않는다. 대신 모든 변경은 이력(store_logs)에 남긴다.
// 가게는 지우지 않는다 — 숨김·폐업으로 내리고 언제든 되살린다 (어드민 기획 REQ-AD-09).

export const ADMIN_NICK = "운영자";
const ADMIN_MARK = () => ({ device: hash("admin"), ip: hash("admin") });

// 운영자가 고칠 수 있는 칸. id·상태·예시 여부·이용자 기록(별점·확인 표·사진)은 따로 다룬다.
export type AdminStoreInput = Pick<
  Store,
  "name" | "grade" | "lat" | "lng" | "address" | "gu" | "dong" | "rice" | "style" | "spice" | "taste" | "sides" | "usage" | "price" | "priceCheckedAt" | "menu" | "lastConfirmedAt"
> & { spiceLabel?: string; shopType?: Store["shopType"]; hours?: Hours; memo?: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export const SLUG = /^[a-z0-9][a-z0-9-]{1,47}$/;
const GU_KEYS = new Set([...REGIONS.map((r) => r.gu), ...Object.values(GU_SLUGS), "etc"]);
const inKeys = (obj: object, v: unknown) => typeof v === "string" && Object.prototype.hasOwnProperty.call(obj, v);
const allIn = (obj: object, arr: unknown) => Array.isArray(arr) && arr.every((v) => inKeys(obj, v));
const validDate = (v: unknown) => typeof v === "string" && DATE.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime());

// 빈 칸·틀린 값을 찾는다. 통과하면 null
export function checkAdminStore(s: Partial<AdminStoreInput>): string | null {
  if (typeof s.name !== "string" || !s.name.trim() || s.name.trim().length > 60) return "가게 이름을 1~60자로 적어 주세요";
  if (!inKeys(GRADES, s.grade)) return "등재 등급을 골라 주세요";
  if (typeof s.address !== "string" || !s.address.trim()) return "주소를 적어 주세요";
  if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng) || s.lat! < 33 || s.lat! > 39 || s.lng! < 124 || s.lng! > 132) return "위도·경도가 한국 안이 아니에요 (예: 37.5172, 127.0473)";
  if (typeof s.gu !== "string" || !GU_KEYS.has(s.gu)) return "구를 골라 주세요";
  if (typeof s.dong !== "string" || !s.dong.trim()) return "동을 적어 주세요";
  if (!allIn(RICE_CAKES, s.rice)) return "떡 종류를 다시 골라 주세요";
  if (!inKeys(STYLES, s.style)) return "스타일을 골라 주세요";
  if (!Number.isInteger(s.spice) || s.spice! < 1 || s.spice! > 5) return "맵기를 1~5 중에 골라 주세요";
  if (s.spiceLabel !== undefined && (typeof s.spiceLabel !== "string" || s.spiceLabel.length > 20)) return "가게 맵기 이름은 20자까지예요";
  if (!allIn(TASTES, s.taste) || s.taste!.length > MAX_TASTES) return `맛 결은 ${MAX_TASTES}개까지 골라요`;
  if (!allIn(SIDES, s.sides)) return "같이 먹기를 다시 골라 주세요";
  if (s.shopType !== undefined && !inKeys(SHOP_TYPES, s.shopType)) return "가게 유형을 다시 골라 주세요";
  if (!allIn(USAGES, s.usage)) return "이용을 다시 골라 주세요";
  if (!Number.isInteger(s.price) || s.price! < 500 || s.price! > 100_000) return "대표 떡볶이 1인분 가격을 500~100,000원으로 적어 주세요";
  if (!validDate(s.priceCheckedAt)) return "가격 확인일을 골라 주세요";
  if (!validDate(s.lastConfirmedAt)) return "마지막 확인일을 골라 주세요";
  if (!Array.isArray(s.menu) || s.menu.length > 40) return "메뉴는 40개까지예요";
  for (const m of s.menu) {
    if (!m || typeof m.name !== "string" || !m.name.trim() || m.name.length > 40) return "메뉴 이름을 1~40자로 적어 주세요";
    if (!Number.isInteger(m.price) || m.price < 0 || m.price > 500_000) return `「${m.name}」 가격을 다시 적어 주세요`;
  }
  if (s.hours !== undefined) {
    const h = s.hours;
    if (!h || !Array.isArray(h.days) || !h.days.length || !h.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) return "여는 요일을 하나 이상 골라 주세요";
    if (!TIME.test(h.open) || !TIME.test(h.close) || h.open === h.close) return "여는 시간·닫는 시간을 다시 적어 주세요";
  }
  if (s.memo !== undefined && (typeof s.memo !== "string" || s.memo.length > 500)) return "소개글은 500자까지예요";
  return null;
}

// 화면에서 온 값에서 고칠 수 있는 칸만 꺼낸다 (상태·예시 여부·별점 같은 칸이 끼어 들어오지 않게). 빈 글·null 은 없는 값.
const INPUT_KEYS = [
  "name", "grade", "lat", "lng", "address", "gu", "dong", "rice", "style", "spice", "spiceLabel", "taste", "sides", "shopType", "usage",
  "price", "priceCheckedAt", "menu", "hours", "lastConfirmedAt", "memo",
] as const satisfies readonly (keyof AdminStoreInput)[];
export function pickInput(raw: unknown): Partial<AdminStoreInput> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const r = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of INPUT_KEYS) if (r[k] !== undefined && r[k] !== null && r[k] !== "") out[k] = r[k];
  return out as Partial<AdminStoreInput>;
}

// 저장 모양으로 다듬기 (앞뒤 빈칸 · 빈 글은 없는 값 · 요일 정렬). checkAdminStore 를 통과한 값만 넣는다.
function tidy(s: AdminStoreInput): AdminStoreInput {
  return {
    name: s.name.trim(),
    grade: s.grade,
    lat: Math.round(s.lat * 1e7) / 1e7,
    lng: Math.round(s.lng * 1e7) / 1e7,
    address: s.address.trim(),
    gu: s.gu,
    dong: s.dong.trim(),
    rice: [...new Set(s.rice)],
    style: s.style,
    spice: s.spice,
    spiceLabel: s.spiceLabel?.trim() || undefined,
    taste: [...new Set(s.taste)],
    sides: [...new Set(s.sides)],
    shopType: s.shopType,
    usage: [...new Set(s.usage)],
    price: s.price,
    priceCheckedAt: s.priceCheckedAt,
    menu: s.menu.map((m) => ({ name: m.name.trim(), price: m.price })),
    hours: s.hours ? { days: [...new Set(s.hours.days)].sort(), open: s.hours.open, close: s.hours.close } : undefined,
    lastConfirmedAt: s.lastConfirmedAt,
    memo: s.memo?.trim() || undefined,
  };
}

// ───────── 바뀐 것 적기 (이력 한 줄) ─────────

const list = (labels: Record<string, string>, v?: readonly string[]) => (v?.length ? v.map((x) => labels[x] ?? x).join("·") : "없음");
const hoursText = (h?: Hours) => (h ? `${h.days.map((d) => DAY_NAMES[d]).join("")} ${h.open}~${h.close}` : "모름");
const menuText = (m: MenuItem[]) => m.map((x) => `${x.name} ${won(x.price)}`).join(", ") || "없음";
const guName = (gu: string) => REGIONS.find((r) => r.gu === gu)?.name ?? (gu === "etc" ? "기타" : gu);

const FIELDS: { key: keyof AdminStoreInput; label: string; text: (s: AdminStoreInput) => string }[] = [
  { key: "name", label: "이름", text: (s) => s.name },
  { key: "grade", label: "가게 종류", text: (s) => GRADES[s.grade] },
  { key: "shopType", label: "가게 유형", text: (s) => (s.shopType ? SHOP_TYPES[s.shopType] : "없음") },
  { key: "address", label: "주소", text: (s) => s.address },
  { key: "gu", label: "구", text: (s) => guName(s.gu) },
  { key: "dong", label: "동", text: (s) => s.dong },
  { key: "lat", label: "위치", text: (s) => `${s.lat.toFixed(6)}, ${s.lng.toFixed(6)}` },
  { key: "rice", label: "떡", text: (s) => list(RICE_CAKES, s.rice) },
  { key: "style", label: "스타일", text: (s) => STYLES[s.style] },
  { key: "spice", label: "맵기", text: (s) => `${s.spice} · ${SPICE_LEVELS[s.spice].ref}` },
  { key: "spiceLabel", label: "가게 맵기 이름", text: (s) => s.spiceLabel ?? "없음" },
  { key: "taste", label: "맛 결", text: (s) => list(TASTES, s.taste) },
  { key: "sides", label: "같이 먹기", text: (s) => list(SIDES, s.sides) },
  { key: "usage", label: "이용", text: (s) => list(USAGES, s.usage) },
  { key: "price", label: "대표 가격", text: (s) => won(s.price) },
  { key: "priceCheckedAt", label: "가격 확인일", text: (s) => s.priceCheckedAt },
  { key: "menu", label: "메뉴", text: (s) => menuText(s.menu) },
  { key: "hours", label: "영업시간", text: (s) => hoursText(s.hours) },
  { key: "lastConfirmedAt", label: "마지막 확인", text: (s) => s.lastConfirmedAt },
  { key: "memo", label: "소개글", text: (s) => s.memo ?? "없음" },
];

const inputOf = (s: Store): AdminStoreInput => ({
  name: s.name, grade: s.grade, lat: s.lat, lng: s.lng, address: s.address, gu: s.gu, dong: s.dong, rice: s.rice, style: s.style, spice: s.spice,
  spiceLabel: s.spiceLabel, taste: s.taste ?? [], sides: s.sides ?? [], shopType: s.shopType, usage: s.usage ?? [], price: s.price,
  priceCheckedAt: s.priceCheckedAt, menu: s.menu ?? [], hours: s.hours, lastConfirmedAt: s.lastConfirmedAt, memo: s.memo,
});

export function diffStore(before: AdminStoreInput, after: AdminStoreInput): Change[] {
  const out: Change[] = [];
  for (const f of FIELDS) {
    const from = f.text(before);
    const to = f.text(after);
    if (from !== to) out.push({ field: f.label, from, to });
  }
  return out;
}

function addLog(db: Db, storeId: string, kind: HistoryKind, changes?: Change[], who = ADMIN_NICK) {
  db.logs.push({ id: randomUUID(), storeId, at: new Date().toISOString(), who, ...ADMIN_MARK(), kind, changes });
}

const fail = (error: string, status = 422): Fail => ({ ok: false, error, status });

// ───────── 읽기 (숨긴·폐업·예시 가게까지 전부) ─────────

export const adminReadStores = async () => (await load()).stores;
export const adminReadStore = async (id: string) => (await load()).stores.find((s) => s.id === id);

export type AdminLog = HistoryItem & { storeId: string; storeName: string };
export async function adminReadLogs(opts: { storeId?: string; limit?: number } = {}): Promise<AdminLog[]> {
  const db = await load();
  const names = new Map(db.stores.map((s) => [s.id, s.name]));
  return db.logs
    .filter((l) => !opts.storeId || l.storeId === opts.storeId)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, opts.limit ?? 300)
    .map(({ id, at, who, kind, changes, storeId }) => ({ id, at, who, kind, changes, storeId, storeName: names.get(storeId) ?? storeId }));
}

// ───────── 쓰기 ─────────

export function adminSaveStore(id: string, raw: unknown) {
  return mutate((db): { ok: true; changes: number } | Fail => {
    const s = db.stores.find((x) => x.id === id);
    if (!s) return fail("가게를 찾지 못했어요", 404);
    const input = pickInput(raw);
    const error = checkAdminStore(input);
    if (error) return fail(error);
    const next = tidy(input as AdminStoreInput);
    const before = inputOf(s);
    const changes = diffStore(before, next);
    if (!changes.length) return fail("바뀐 내용이 없어요");
    Object.assign(s, next);
    // 비운 칸은 지운다 (Object.assign 은 undefined 를 그대로 넣는다)
    for (const k of ["spiceLabel", "shopType", "hours", "memo"] as const) if (next[k] === undefined) delete s[k];
    if (next.memo !== before.memo) {
      s.introAt = next.memo ? isoDay() : undefined;
      s.introBy = next.memo ? (before.memo ? s.introBy : ADMIN_NICK) : undefined;
      if (!next.memo) {
        delete s.introAt;
        delete s.introBy;
      }
    }
    addLog(db, id, "edit", changes);
    return { ok: true, changes: changes.length };
  });
}

function newId(db: Db, wanted?: string) {
  if (wanted) return db.stores.some((s) => s.id === wanted) ? null : wanted;
  for (;;) {
    const id = `s-${randomUUID().slice(0, 8)}`;
    if (!db.stores.some((s) => s.id === id)) return id;
  }
}

// 직접 등록. id 를 비우면 s-xxxxxxxx 로 만든다. 운영자가 확인하고 넣는 가게라 「확인 중」(createdAt) 없이 바로 보인다.
export function adminCreateStore(raw: unknown, wantedId?: string, who = ADMIN_NICK) {
  return mutate((db): { ok: true; id: string } | Fail => {
    if (wantedId !== undefined && wantedId !== "" && !SLUG.test(wantedId)) return fail("주소 이름(id)은 영어 소문자·숫자·- 로 2~48자예요");
    if (wantedId === "new") return fail("주소 이름(id)으로 new 는 쓸 수 없어요");
    const input = pickInput(raw);
    const error = checkAdminStore(input);
    if (error) return fail(error);
    const id = newId(db, wantedId || undefined);
    if (!id) return fail(`이미 같은 주소 이름(id)의 가게가 있어요: ${wantedId}`, 409);
    const next = tidy(input as AdminStoreInput);
    const store: Store = { id, ...next, status: "active" };
    for (const k of ["spiceLabel", "shopType", "hours", "memo"] as const) if (store[k] === undefined) delete store[k];
    db.stores.push(store);
    addLog(db, id, "new", undefined, who);
    return { ok: true, id };
  });
}

const STATUS_TEXT: Record<StoreStatus, string> = { active: "보임", hidden: "숨김", closed: "폐업" };

export function adminSetStatus(id: string, status: StoreStatus, reason?: string) {
  return mutate((db): { ok: true } | Fail => {
    const s = db.stores.find((x) => x.id === id);
    if (!s) return fail("가게를 찾지 못했어요", 404);
    if (!(status in STATUS_TEXT)) return fail("상태를 다시 골라 주세요");
    const now = s.status ?? "active";
    if (now === status) return fail(`이미 「${STATUS_TEXT[status]}」 상태예요`);
    s.status = status;
    const changes = [{ field: "상태", from: STATUS_TEXT[now], to: STATUS_TEXT[status] + (reason?.trim() ? ` (${reason.trim().slice(0, 40)})` : "") }];
    addLog(db, id, status === "active" ? "edit" : status, changes);
    return { ok: true };
  });
}

export function adminConfirm(id: string) {
  return mutate((db): { ok: true; at: string } | Fail => {
    const s = db.stores.find((x) => x.id === id);
    if (!s) return fail("가게를 찾지 못했어요", 404);
    const today = isoDay();
    if (s.lastConfirmedAt === today) return fail("오늘 이미 확인했어요", 409);
    s.lastConfirmedAt = today;
    addLog(db, id, "still");
    return { ok: true, at: today };
  });
}

// 자료 묶음(lib/data/datasets.ts)에서 가게 넣기. 이미 있는 id 와 빈 칸이 남은 가게는 건너뛴다 (덮어쓰지 않는다).
export type ImportResult = { ok: true; added: string[]; skipped: { id: string; why: string }[] };
export function adminImport(rows: { id: string; store?: Partial<AdminStoreInput>; missing?: string[] }[], who: string) {
  return mutate((db): ImportResult => {
    const added: string[] = [];
    const skipped: ImportResult["skipped"] = [];
    for (const r of rows) {
      if (db.stores.some((s) => s.id === r.id)) skipped.push({ id: r.id, why: "이미 있음" });
      else if (!r.store || r.missing?.length) skipped.push({ id: r.id, why: `빈 칸: ${r.missing?.join("·") ?? "전부"}` });
      else {
        const input = pickInput(r.store);
        const error = checkAdminStore(input);
        if (error) skipped.push({ id: r.id, why: error });
        else {
          const store: Store = { id: r.id, ...tidy(input as AdminStoreInput), status: "active" };
          for (const k of ["spiceLabel", "shopType", "hours", "memo"] as const) if (store[k] === undefined) delete store[k];
          db.stores.push(store);
          addLog(db, r.id, "new", undefined, who);
          added.push(r.id);
        }
      }
    }
    return { ok: true, added, skipped };
  });
}
