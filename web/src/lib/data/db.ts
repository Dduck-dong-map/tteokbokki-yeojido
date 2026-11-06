import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { distanceM, won } from "../filters";
import { GRADES, RICE_CAKES, SPICE_LEVELS, STYLES, USAGES } from "../taxonomy";
import type { Change, HistoryItem, HistoryKind, Review, Store } from "../types";
import { DAILY_LIMIT, DUP_RADIUS_M, HIDE_AT, MAX_PHOTOS, VERIFY_YES, isPending, parseAddress, type FlagReason, type NewStoreInput, type StorePatch } from "../wiki";
import { SAMPLE_HISTORY, SAMPLE_NEW, SAMPLE_REVIEWS, SAMPLE_STORES } from "./sample-stores";

// 저장소: 지금은 서버 폴더의 JSON 파일 하나다 (web/.data/db.json · 깃에 안 올라간다).
// 계정 없이 흐름 전체를 시험하려고 이렇게 뒀고, Supabase 키를 받으면 이 파일 안만 바꾼다.
// 주의: Vercel 에서는 파일이 오래 남지 않는다 → 공개 출시 전에 반드시 바꿔야 한다.
// 파일을 지우면 예시 데이터로 다시 시작한다.

export const DATA_DIR = process.env.DATA_DIR ?? (process.env.VERCEL ? "/tmp/ddy-data" : path.join(process.cwd(), ".data"));
const DB_FILE = path.join(DATA_DIR, "db.json");
export const PHOTO_DIR = path.join(DATA_DIR, "photos");

export type Who = { nick: string; device: string; ip: string };

// 기기·접속 위치는 해시로만 남기고 화면에 내보내지 않는다
type Mark = { device: string; ip: string };
type LogRow = HistoryItem & Mark & { storeId: string };
type ReviewRow = Review & Mark & { storeId: string; hidden?: boolean; flags?: Mark[] };
type VoteRow = Mark & { storeId: string; ok: boolean; at: string };
type FlagRow = Mark & { storeId: string; reason: FlagReason; at: string };
type Db = { stores: Store[]; logs: LogRow[]; reviews: ReviewRow[]; votes: VoteRow[]; flags: FlagRow[] };

const isoDay = (t = Date.now()) => new Date(t + 9 * 3_600_000).toISOString().slice(0, 10);
const daysAgo = (n: number) => isoDay(Date.now() - n * 86_400_000);
const SEED_MARK: Mark = { device: "seed", ip: "seed" };

function seed(): Db {
  const stores: Store[] = SAMPLE_STORES.map((s) => {
    const fresh = SAMPLE_NEW[s.id];
    return fresh ? { ...s, createdAt: daysAgo(fresh.daysAgo), lastConfirmedAt: daysAgo(fresh.daysAgo), by: fresh.by, verify: fresh.verify } : { ...s };
  });
  return {
    stores,
    logs: [
      ...Object.entries(SAMPLE_NEW).map(([storeId, n]) => ({ ...SEED_MARK, id: `seed-new-${storeId}`, storeId, at: `${daysAgo(n.daysAgo)}T12:00:00+09:00`, who: n.by, kind: "new" as const })),
      ...SAMPLE_HISTORY.map((h, i) => ({ ...SEED_MARK, id: `seed-log-${i}`, storeId: h.storeId, at: `${daysAgo(h.daysAgo)}T12:00:00+09:00`, who: h.who, kind: "edit" as const, changes: h.changes })),
    ],
    reviews: SAMPLE_REVIEWS.map((r, i) => ({ ...SEED_MARK, id: `seed-rev-${i}`, storeId: r.storeId, at: `${daysAgo(r.daysAgo)}T12:00:00+09:00`, who: r.who, stars: r.stars, spice: r.spice, text: r.text })),
    votes: [],
    flags: [],
  };
}

async function load(): Promise<Db> {
  try {
    return JSON.parse(await readFile(DB_FILE, "utf8")) as Db;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return seed();
    throw e;
  }
}

async function save(db: Db) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(db));
  // 윈도에서는 다른 요청이 읽는 중이면 이름 바꾸기가 잠깐 막힌다
  for (let i = 0; ; i++) {
    try {
      return await rename(tmp, DB_FILE);
    } catch (e) {
      if (i >= 12) throw e;
      await new Promise((r) => setTimeout(r, 40 * (i + 1)));
    }
  }
}

// 쓰기는 한 번에 하나씩 (읽고 → 고치고 → 저장). 개발 서버는 모듈을 다시 불러오므로 줄은 전역에 둔다.
const g = globalThis as unknown as { __ddyQueue?: Promise<unknown> };
function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = (g.__ddyQueue ?? Promise.resolve()).catch(() => undefined).then(async () => {
    const db = await load();
    const out = await fn(db);
    await save(db);
    return out;
  });
  g.__ddyQueue = run;
  return run;
}

export function hash(v: string) {
  return createHash("sha256").update(`${process.env.HASH_SALT ?? "ddy"}:${v}`).digest("hex").slice(0, 24);
}

const mark = (who: Who): Mark => ({ device: hash(who.device), ip: hash(who.ip) });
const same = (a: Mark, b: Mark) => a.device === b.device || a.ip === b.ip;
const log = (db: Db, storeId: string, who: { nick: string } & Mark, kind: HistoryKind, changes?: Change[]) =>
  db.logs.push({ id: randomUUID(), storeId, at: new Date().toISOString(), who: who.nick, device: who.device, ip: who.ip, kind, changes });

function overDailyLimit(db: Db, m: Mark) {
  const from = Date.now() - 86_400_000;
  return db.logs.filter((l) => (l.kind === "new" || l.kind === "edit") && same(l, m) && new Date(l.at).getTime() > from).length >= DAILY_LIMIT;
}

const LIMIT_MSG = "오늘은 등록·수정을 많이 해 주셨어요. 내일 다시 부탁드려요";

// ───────── 읽기 ─────────

export const readStores = async () => (await load()).stores;

export const readStore = async (id: string) => (await load()).stores.find((s) => s.id === id);

export async function readReviews(storeId: string): Promise<Review[]> {
  return (await load()).reviews
    .filter((r) => r.storeId === storeId && !r.hidden)
    .sort((a, b) => b.at.localeCompare(a.at))
    .map(({ id, at, who, stars, spice, text }) => ({ id, at, who, stars, spice, text }));
}

export async function readHistory(storeId: string): Promise<HistoryItem[]> {
  return (await load()).logs
    .filter((l) => l.storeId === storeId)
    .sort((a, b) => b.at.localeCompare(a.at))
    .map(({ id, at, who, kind, changes }) => ({ id, at, who, kind, changes }));
}

export async function readRecentCount(days = 7) {
  const from = Date.now() - days * 86_400_000;
  return (await load()).logs.filter((l) => (l.kind === "new" || l.kind === "edit") && new Date(l.at).getTime() > from).length;
}

// ───────── 쓰기 ─────────
// 결과는 { ok: true, … } 또는 { ok: false, error, existing? } 로 돌려준다

type Fail = { ok: false; error: string; existing?: string; status: number };
const fail = (error: string, status = 422, existing?: string): Fail => ({ ok: false, error, status, existing });
const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

function slugFor(db: Db) {
  for (;;) {
    const id = `s-${randomUUID().slice(0, 8)}`;
    if (!db.stores.some((s) => s.id === id)) return id;
  }
}

export function addStore(input: NewStoreInput, who: Who) {
  return mutate((db): { ok: true; id: string } | Fail => {
    const m = mark(who);
    if (overDailyLimit(db, m)) return fail(LIMIT_MSG, 429);
    const name = input.name.trim();
    if (!input.notDuplicate) {
      const dup = db.stores.find((s) => s.status !== "hidden" && distanceM(s, input) <= DUP_RADIUS_M && (norm(s.name).includes(norm(name)) || norm(name).includes(norm(s.name))));
      if (dup) return fail(`이미 지도에 있는 가게 같아요: ${dup.name}`, 409, dup.id);
    }

    const today = isoDay();
    const id = slugFor(db);
    const address = input.address.trim();
    const menu = input.menu.map((x) => ({ name: x.name.trim(), price: x.price }));
    const intro = input.memo?.trim();
    const store: Store = {
      id,
      name,
      grade: input.grade,
      lat: input.lat,
      lng: input.lng,
      address,
      ...parseAddress(address),
      rice: input.rice,
      style: input.style,
      spice: input.spice,
      taste: [],
      sides: [],
      usage: [],
      price: menu[0].price,
      priceCheckedAt: today,
      menu,
      hours: input.hours,
      lastConfirmedAt: today,
      rating: input.stars ? { avg: input.stars, count: 1 } : undefined,
      status: "active",
      createdAt: today,
      by: who.nick,
      verify: { yes: 0, no: 0 },
      photos: input.photos,
      ...(intro ? { memo: intro, introBy: who.nick, introAt: today } : {}),
    };
    db.stores.push(store);
    log(db, id, { nick: who.nick, ...m }, "new");
    if (input.stars) db.reviews.push({ ...m, id: randomUUID(), storeId: id, at: new Date().toISOString(), who: who.nick, stars: input.stars });
    return { ok: true, id };
  });
}

const hoursText = (h: Store["hours"]) => (h ? `${h.open}~${h.close} (${h.days.length}일)` : "없음");
const menuText = (menu: Store["menu"]) => menu.map((x) => `${x.name} ${won(x.price)}`).join(", ");

export function editStore(id: string, patch: StorePatch, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    const s = db.stores.find((x) => x.id === id);
    if (!s) return fail("가게를 찾지 못했어요", 404);
    const m = mark(who);
    if (overDailyLimit(db, m)) return fail(LIMIT_MSG, 429);

    const changes: Change[] = [];
    const note = (field: string, from: string, to: string) => from !== to && changes.push({ field, from, to });

    if (patch.name !== undefined && patch.name.trim() !== s.name) {
      note("이름", s.name, patch.name.trim());
      s.name = patch.name.trim();
    }
    if (patch.address !== undefined && patch.address.trim() !== s.address) {
      note("주소", s.address, patch.address.trim());
      s.address = patch.address.trim();
      Object.assign(s, parseAddress(s.address));
    }
    if (patch.lat !== undefined && patch.lng !== undefined && distanceM(s, { lat: patch.lat, lng: patch.lng }) > 5) {
      changes.push({ field: "위치", from: "이전 위치", to: `${Math.round(distanceM(s, { lat: patch.lat, lng: patch.lng }))}m 옮김` });
      s.lat = patch.lat;
      s.lng = patch.lng;
    }
    if (patch.grade !== undefined) {
      note("가게 종류", GRADES[s.grade], GRADES[patch.grade]);
      s.grade = patch.grade;
    }
    if (patch.rice !== undefined) {
      const text = (v: Store["rice"]) => v.map((x) => RICE_CAKES[x]).join("·");
      note("떡", text(s.rice), text(patch.rice));
      s.rice = patch.rice;
    }
    if (patch.style !== undefined) {
      note("스타일", STYLES[s.style], STYLES[patch.style]);
      s.style = patch.style;
    }
    if (patch.spice !== undefined) {
      note("맵기", `${s.spice} · ${SPICE_LEVELS[s.spice].ref}`, `${patch.spice} · ${SPICE_LEVELS[patch.spice].ref}`);
      s.spice = patch.spice;
    }
    if (patch.menu !== undefined) {
      const menu = patch.menu.map((x) => ({ name: x.name.trim(), price: x.price }));
      if (menuText(s.menu) !== menuText(menu)) {
        note("대표 가격", won(s.price), won(menu[0].price));
        note("메뉴", menuText(s.menu), menuText(menu));
        s.menu = menu;
        s.price = menu[0].price;
        s.priceCheckedAt = isoDay();
      }
    }
    if (patch.hours !== undefined) {
      const next = patch.hours ?? undefined;
      if (JSON.stringify(s.hours ?? null) !== JSON.stringify(next ?? null)) {
        changes.push({ field: "영업시간", from: hoursText(s.hours), to: hoursText(next) });
        s.hours = next;
      }
    }
    if (patch.usage !== undefined) {
      const text = (v: Store["usage"]) => v.map((x) => USAGES[x]).join("·") || "없음";
      note("이용", text(s.usage), text(patch.usage));
      s.usage = patch.usage;
    }
    if (patch.memo !== undefined && patch.memo.trim() !== (s.memo ?? "")) {
      note("소개글", s.memo || "없음", patch.memo.trim() || "없음");
      if (!s.memo) s.introBy = who.nick;
      s.memo = patch.memo.trim() || undefined;
      s.introAt = isoDay();
      if (!s.memo) s.introBy = undefined;
    }
    if (patch.addPhotos?.length) {
      const photos = [...(s.photos ?? []), ...patch.addPhotos].slice(0, MAX_PHOTOS * 4);
      changes.push({ field: "사진", from: `${s.photos?.length ?? 0}장`, to: `${photos.length}장` });
      s.photos = photos;
    }
    if (!changes.length) return fail("바뀐 내용이 없어요");

    s.lastConfirmedAt = isoDay(); // 고친 사람이 곧 확인한 사람이다
    log(db, id, { nick: who.nick, ...m }, "edit", changes);
    return { ok: true };
  });
}

export function confirmStill(id: string, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    const s = db.stores.find((x) => x.id === id);
    if (!s) return fail("가게를 찾지 못했어요", 404);
    const m = mark(who);
    const today = isoDay();
    if (db.logs.some((l) => l.storeId === id && l.kind === "still" && l.at.slice(0, 10) === today && same(l, m))) return fail("오늘은 이미 확인해 주셨어요", 409);
    s.lastConfirmedAt = today;
    log(db, id, { nick: who.nick, ...m }, "still");
    return { ok: true };
  });
}

// 「맞아요」「달라요」: 같은 기기·같은 접속 위치는 가게마다 한 표
export function verifyStore(id: string, ok: boolean, who: Who) {
  return mutate((db): { ok: true; yes: number; no: number; status: Store["status"] } | Fail => {
    const s = db.stores.find((x) => x.id === id);
    if (!s) return fail("가게를 찾지 못했어요", 404);
    if (!isPending(s, new Date())) return fail("이미 확인이 끝난 가게예요", 409);
    const m = mark(who);
    if (db.votes.some((v) => v.storeId === id && same(v, m))) return fail("이미 알려 주셨어요. 고마워요!", 409);
    db.votes.push({ ...m, storeId: id, ok, at: new Date().toISOString() });
    const verify = { yes: s.verify?.yes ?? 0, no: s.verify?.no ?? 0 };
    if (ok) verify.yes += 1;
    else verify.no += 1;
    s.verify = verify;
    if (verify.no >= HIDE_AT) {
      s.status = "hidden";
      log(db, id, { nick: "지도", ...SEED_MARK }, "hidden");
    } else if (ok && verify.yes === VERIFY_YES) {
      s.lastConfirmedAt = isoDay();
      log(db, id, { nick: "지도", ...SEED_MARK }, "verified");
    }
    return { ok: true, ...verify, status: s.status };
  });
}

export function reviewStore(id: string, input: { stars: number; text?: string }, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    const s = db.stores.find((x) => x.id === id);
    if (!s) return fail("가게를 찾지 못했어요", 404);
    const m = mark(who);
    const old = db.reviews.find((r) => r.storeId === id && same(r, m));

    // 별점: 기기마다 한 표. 다시 쓰면 이전 표를 빼고 더한다.
    const rating = { total: (s.rating?.avg ?? 0) * (s.rating?.count ?? 0), count: s.rating?.count ?? 0 };
    if (old?.stars) {
      rating.total -= old.stars;
      rating.count -= 1;
    }
    rating.total += input.stars;
    rating.count += 1;
    s.rating = rating.count ? { avg: Math.round((rating.total / rating.count) * 10) / 10, count: rating.count } : undefined;

    const text = input.text?.trim() || undefined;
    const row: ReviewRow = { ...m, id: old?.id ?? randomUUID(), storeId: id, at: new Date().toISOString(), who: who.nick, stars: input.stars, spice: old?.spice, text }; // 예전 맵기 표는 그대로 남긴다
    if (old) db.reviews[db.reviews.indexOf(old)] = row;
    else db.reviews.push(row);
    return { ok: true };
  });
}

// 신고: 같은 기기·접속 위치는 가게마다 한 번. 3명이 쌓이면 지도에서 내린다.
export function flagStore(id: string, reason: FlagReason, who: Who) {
  return mutate((db): { ok: true; status: Store["status"] } | Fail => {
    const s = db.stores.find((x) => x.id === id);
    if (!s) return fail("가게를 찾지 못했어요", 404);
    const m = mark(who);
    if (db.flags.some((f) => f.storeId === id && same(f, m))) return fail("이미 신고해 주셨어요. 고마워요!", 409);
    db.flags.push({ ...m, storeId: id, reason, at: new Date().toISOString() });
    const flags = db.flags.filter((f) => f.storeId === id);
    if (flags.length >= HIDE_AT && (s.status ?? "active") === "active") {
      const closed = flags.filter((f) => f.reason === "closed").length;
      s.status = closed * 2 > flags.length ? "closed" : "hidden"; // 신고 대부분이 폐업이면 「문 닫음」
      log(db, id, { nick: "지도", ...SEED_MARK }, s.status);
    }
    return { ok: true, status: s.status };
  });
}

export function flagReview(reviewId: string, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    const r = db.reviews.find((x) => x.id === reviewId);
    if (!r) return fail("후기를 찾지 못했어요", 404);
    const m = mark(who);
    const flags = r.flags ?? [];
    if (flags.some((f) => same(f, m))) return fail("이미 신고해 주셨어요. 고마워요!", 409);
    r.flags = [...flags, m];
    if (r.flags.length >= HIDE_AT) r.hidden = true;
    return { ok: true };
  });
}
