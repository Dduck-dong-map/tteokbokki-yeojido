import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { distanceM, won } from "../filters";
import { GRADES, RICE_CAKES, SPICE_LEVELS, STYLES, USAGES } from "../taxonomy";
import type { Change, Fail, HistoryItem, HistoryKind, Review, Store } from "../types";
import { DAILY_LIMIT, DAILY_LIMIT_PER_IP, DAILY_PHOTOS, DAILY_PHOTOS_PER_IP, DUP_RADIUS_M, GONE_BY_FLAGS, GONE_BY_VOTES, GONE_REASON_FIELD, HIDE_AT, MAX_PHOTOS, VERIFY_YES, isPending, parseAddress, type FlagReason, type NewStoreInput, type StorePatch } from "../wiki";
import { DAILY_COMMENTS, DAILY_COMMENTS_PER_IP, DAILY_LISTS, DAILY_LISTS_PER_IP, DAILY_POSTS, DAILY_POSTS_PER_IP, MAX_LIST_STORES, type BoardCat, type ListVisibility, type Owned, type PlaceList, type Post, type PostComment } from "../community";
import { SAMPLE_LISTS, SAMPLE_POSTS } from "./sample-community";
import { SAMPLE_HISTORY, SAMPLE_NEW, SAMPLE_REVIEWS, SAMPLE_STORES } from "./sample-stores";

// 저장소: 지금은 서버 폴더의 JSON 파일 하나다 (저장소 루트 .data/db.json · 깃에 안 올라간다).
// 계정 없이 흐름 전체를 시험하려고 이렇게 뒀고, Supabase 키를 받으면 이 파일 안만 바꾼다.
// 주의: Vercel 에서는 API 와 페이지가 임시 폴더를 함께 쓰지 못해 저장이 화면에 안 나타난다 (11-06 확인) → 공개 전에 반드시 바꿔야 한다.
// 파일을 지우면 예시 데이터로 다시 시작한다.

// DATA_DIR 은 tests/unit/db.test.ts 가 격리 확인에 쓴다
export const DATA_DIR = process.env.DATA_DIR ?? (process.env.VERCEL ? "/tmp/ddy-data" : path.join(process.cwd(), ".data"));
const DB_FILE = path.join(DATA_DIR, "db.json");
export const PHOTO_DIR = path.join(DATA_DIR, "photos");

// 예시 데이터(가게 16곳 · 글 · 리스트)를 보여 줄지 (W1-1 · W1-2). 실제 가게를 넣으면 NEXT_PUBLIC_SAMPLE_DATA=off →
// 예시를 화면에서 숨기고(지우지는 않는다) 검색엔진을 연다. 빌드 때 코드에 박히는 값이라 바꾼 뒤엔 다시 빌드한다.
export const SHOW_SAMPLES = process.env.NEXT_PUBLIC_SAMPLE_DATA !== "off";

export type Who = { nick: string; device: string; ip: string };

// 기기·접속 위치는 해시로만 남기고 화면에 내보내지 않는다
type Mark = { device: string; ip: string };
type LogRow = HistoryItem & Mark & { storeId: string };
type ReviewRow = Review & Mark & { storeId: string; hidden?: boolean; flags?: Mark[] };
type VoteRow = Mark & { storeId: string; ok: boolean; at: string };
type FlagRow = Mark & { storeId: string; reason: FlagReason; at: string };
// 떡볶이방 · 맛집 리스트 (11-08). Mark 는 쓴 사람·만든 사람 — 「내 것」을 가르는 데만 쓴다.
type PostRow = Post & Mark & { hidden?: boolean; flags?: Mark[] };
type CommentRow = PostComment & Mark & { postId: string; hidden?: boolean; flags?: Mark[] };
type ListRow = PlaceList & Mark;
type LikeRow = Mark & { listId: string; at: string };
type PostLikeRow = Mark & { postId: string; at: string };
// 길찾기 누름 (W1-4) — 성공 지표 KPI-W01. 화면에는 쓰지 않고 쌓기만 한다
export type GoApp = "naver" | "kakao";
type GoRow = Mark & { id: string; storeId: string; app: GoApp; at: string };
// 사진 올리기 한 장 = 한 줄 (11-18) — 하루 한도를 세는 데만 쓴다. id = 사진 id. 최근 24시간 줄만 남긴다
type PhotoRow = Mark & { id: string; at: string };
// 지운 글 · 댓글 · 리스트 한 개 = 한 줄 (11-19) — 하루 한도를 세는 데만 쓴다. 남아 있는 줄만 세면 쓰고 지우기를 되풀이해 한도를 넘을 수 있어서다.
// at = 처음 쓴(만든) 시각, Mark = 쓴 사람. 최근 24시간 안에 쓴 것만 남기고, 줄을 더할 때마다 오래된 줄을 지운다
export type WriteKind = "post" | "comment" | "list";
type DeletedRow = Mark & { kind: WriteKind; id: string; at: string };
export type Db = {
  stores: Store[];
  logs: LogRow[];
  reviews: ReviewRow[];
  votes: VoteRow[];
  flags: FlagRow[];
  posts: PostRow[];
  comments: CommentRow[];
  lists: ListRow[];
  likes: LikeRow[];
  postLikes: PostLikeRow[];
  goes: GoRow[];
  photoUploads: PhotoRow[];
  deletedWrites: DeletedRow[];
};

export const isoDay = (t = Date.now()) => new Date(t + 9 * 3_600_000).toISOString().slice(0, 10);
// 기록 시각은 한 서버 안에서 늘 앞으로만 간다. 같은 1ms 에 되살리기와 신고가 찍히면 restoredAt 의 `at > since` 가
// 되살린 뒤의 신고를 빼먹어서, 앞 시각과 같으면 1ms 뒤로 민다 (11-19 CI 에서 admin-status 시험이 가끔 실패).
let lastStamp = 0;
export function stamp() {
  lastStamp = Math.max(Date.now(), lastStamp + 1);
  return new Date(lastStamp).toISOString();
}
const daysAgo = (n: number) => isoDay(Date.now() - n * 86_400_000);
const isoAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const SEED_MARK: Mark = { device: "seed", ip: "seed" };

// 예전 db.json 에는 게시판·리스트 칸이 없다 → 처음 읽을 때 예시로 채운다
function withCommunity(db: Db): Db {
  if (!db.posts) {
    db.posts = SAMPLE_POSTS.map((p) => ({ ...SEED_MARK, id: p.id, at: isoAgo(p.daysAgo), who: p.who, cat: p.cat, title: p.title, body: p.body, storeId: p.storeId, comments: p.comments.length, likes: p.likes, isSample: true }));
    db.comments = SAMPLE_POSTS.flatMap((p) =>
      p.comments.map((c, i) => ({ ...SEED_MARK, id: `${p.id}-c${i}`, postId: p.id, at: isoAgo(p.daysAgo - 0.1 * (i + 1)), who: c.who, text: c.text })),
    );
  }
  db.comments ??= [];
  if (!db.lists) {
    db.lists = SAMPLE_LISTS.map((l) => ({ ...SEED_MARK, id: l.id, title: l.title, desc: l.desc, storeIds: l.storeIds, who: l.who, createdAt: isoAgo(l.daysAgo), updatedAt: isoAgo(l.daysAgo), visibility: l.visibility, likes: l.likes, isSample: true }));
  }
  db.likes ??= [];
  db.postLikes ??= []; // 글 추천 (11-08 추가)
  db.goes ??= []; // 길찾기 누름 (11-11 추가)
  db.photoUploads ??= []; // 사진 하루 한도 (11-18 추가)
  db.deletedWrites ??= []; // 지운 글 · 댓글 · 리스트도 하루 한도에 센다 (11-19 추가)
  return db;
}

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
  } as unknown as Db;
}

// 11-08: .env.local 에 DATABASE_URL 이 있으면 로컬 DB(도커 Postgres, pg.ts)에 저장한다. 없으면 지금처럼 파일.
// 아래 규칙 함수들은 저장 방식과 상관없이 그대로 쓴다.
const PG = !!process.env.DATABASE_URL;

// 배포(Vercel)에서 DATABASE_URL 이 비면 파일 모드로 /tmp 에 쓰고, 응답은 성공인데 저장이 남지 않는다 (기술 스택 9절 #2).
// HASH_SALT 와 같이 db.ts 를 불러올 때 멈춘다 → 서버가 시작하지 않는다. 로컬 개발 · E2E · 도커 앱은 VERCEL 이 없어 그대로 돈다.
if (process.env.VERCEL && !PG) throw new Error("DATABASE_URL 환경 변수가 비어 있어요. Vercel 설정에 Supabase Transaction pooler 주소(포트 6543)를 넣어 주세요 (.env.example 참고)");

// Postgres 모드에서 빈 DB 를 만났을 때 예시(가게 16곳 · 글 · 리스트)를 넣을지 (기술 스택 9절 #4).
// SEED_SAMPLES=1 일 때만 넣는다 — 운영 DB(Supabase)에 예시가 들어가지 않게. 로컬 도커 DB 를 처음 켤 때는 .env.local 에 SEED_SAMPLES=1.
// 파일 모드(개발 · E2E · 단위 시험)는 이 값과 상관없이 늘 예시로 시작한다.
const SEED_SAMPLES = process.env.SEED_SAMPLES === "1";
const blank = (): Db => ({ stores: [], logs: [], reviews: [], votes: [], flags: [], posts: [], comments: [], lists: [], likes: [], postLikes: [], goes: [], photoUploads: [], deletedWrites: [] });
// raw = null: 저장소가 아직 비어 있음 (파일 없음 · PG 는 표가 모두 빔)
const prepare = (raw: Db | null) => withCommunity(raw ?? (PG && !SEED_SAMPLES ? blank() : seed()));

// 어드민(lib/data/admin.ts)도 같은 읽기·쓰기 줄을 쓴다
export async function load(): Promise<Db> {
  if (PG) return (await import("./pg")).pgRead(prepare);
  try {
    return withCommunity(JSON.parse(await readFile(DB_FILE, "utf8")) as Db);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return withCommunity(seed());
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
const g = globalThis as unknown as { __ddyQueue?: Promise<unknown>; __ddyGen?: number };
export function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  // 쓰기는 늘 저장소를 새로 읽는다(load). 끝나면 세대 번호를 올려, 같은 요청 안의 다음 읽기(shared)가 옛 값을 쓰지 않게 한다
  const bump = () => {
    g.__ddyGen = (g.__ddyGen ?? 0) + 1;
  };
  if (PG) return import("./pg").then((m) => m.pgMutate(prepare, fn)).finally(bump);
  const run = (g.__ddyQueue ?? Promise.resolve()).catch(() => undefined).then(async () => {
    const db = await load();
    const out = await fn(db);
    await save(db);
    return out;
  }).finally(bump);
  g.__ddyQueue = run;
  return run;
}

// 요청 하나 안에서 저장소 읽기를 한 번으로 (기술 스택 9절 #6, 번들 문서 01-getting-started/06-fetching-data.md 「Reusing data with React.cache」).
// React.cache 는 요청마다 따로 기억하고 요청끼리는 나누지 않는다. 지도 홈 · 가게 상세에서 레이아웃과 페이지가 각각 읽어도 load() 는 한 번만 돈다.
// 인자 gen(쓰기 세대)이 바뀌면 다른 칸으로 기억하므로, 같은 요청에서 쓰기(mutate) 뒤에 읽으면 새로 읽는다.
// React 가 그리는 중이 아니면(route handler · 단위 시험) React.cache 는 그냥 부르기만 한다 → 매번 읽는다.
// 돌려준 Db 는 같은 요청의 여러 곳이 함께 보므로 읽기 함수에서 고치지 않는다(filter · map 으로 새 배열만).
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- gen 은 기억 칸을 가르는 열쇠로만 쓴다
const loadShared = cache((_gen: number) => load());
const shared = () => loadShared(g.__ddyGen ?? 0);

// 기기·접속 위치 해시에 섞는 소금. 배포(Vercel)에서 비어 있으면 기본값 "ddy" 로 해시가 역산될 수 있어 시작 때 멈춘다 (정리 보고서 2절 #2).
// 로컬 pnpm build · E2E(next start) 는 VERCEL 이 없어 기본값으로 돈다.
// 빈 값(HASH_SALT=)도 없는 것으로 본다 — 도커 앱 서버가 빈 값을 넘겨도 개발 서버와 같은 해시가 되고, Vercel 에서는 빈 값이면 멈춘다
const HASH_SALT = process.env.HASH_SALT || (process.env.VERCEL ? null : "ddy");
if (HASH_SALT === null) throw new Error("HASH_SALT 환경 변수가 비어 있어요. Vercel 설정에 아무도 모르는 긴 글자를 넣어 주세요 (.env.example 참고)");

export function hash(v: string) {
  return createHash("sha256").update(`${HASH_SALT}:${v}`).digest("hex").slice(0, 24);
}

const mark = (who: Who): Mark => ({ device: hash(who.device), ip: hash(who.ip) });
// 같은 사람 = 기기와 접속 위치가 모두 같을 때만 (W1-9). 같은 와이파이(교회)에 모여도 기기가 다르면 각자 한 표 · 각자 하루 한도.
// 「한 사람 한 번」(한 표 · 신고 한 번 · 평가 하나 · 아직 있어요 하루 한 번 · 길찾기 하루 한 줄)과 좋은 쪽 판정(맞아요 · 평가 · 추천)은 이 기준이다.
const same = (a: Mark, b: Mark) => a.device === b.device && a.ip === b.ip;
// 내리는 판정(달라요 · 가게 신고 · 후기 · 글 · 댓글 신고)은 사람 수가 아니라 서로 다른 접속 위치(IP) 수로 센다 (11-18 결정).
// 기기 표시는 손님이 마음대로 바꿔 보낼 수 있어, 같은 곳에서 표시만 바꾼 요청 여럿으로는 내려가지 않게 한다.
const distinctIps = (rows: Mark[]) => new Set(rows.map((r) => r.ip)).size;
// 운영자가 가게를 되살린 시각 (없으면 ""). 되살림 = 운영자 이력 중 「상태 … → 보임」 줄 (lib/data/admin.ts adminSetStatus).
// 내리는 판정은 이 뒤에 들어온 신고 · 달라요만 센다 (되살린 뒤 1건으로 곧바로 다시 내려가지 않게, F012). 예전 줄은 지우지 않고 남긴다.
const restoredAt = (db: Db, storeId: string) =>
  db.logs
    .filter((l) => l.storeId === storeId && l.kind === "edit" && l.changes?.some((c) => c.field === "상태" && c.to.startsWith("보임")))
    .reduce((a, l) => (l.at > a ? l.at : a), "");
const log = (db: Db, storeId: string, who: { nick: string } & Mark, kind: HistoryKind, changes?: Change[]) =>
  db.logs.push({ id: randomUUID(), storeId, at: stamp(), who: who.nick, device: who.device, ip: who.ip, kind, changes });
// 지도가 저절로 내릴 때(달라요 · 신고) 그 줄에 까닭을 남긴다 (11-19). 가게 상세의 안내(lib/wiki.ts goneNotice)가 이것을 읽어
// 내린 판정과 같은 기준으로 문구를 고른다. 표 구조는 그대로 두고 이력의 「바뀐 칸」(changes) 하나로 남긴다 — 변경 이력 화면에도 보인다.
const goneLog = (db: Db, storeId: string, kind: "hidden" | "closed", by: string) =>
  log(db, storeId, { nick: "지도", ...SEED_MARK }, kind, [{ field: GONE_REASON_FIELD, from: "보임", to: by }]);

// 하루 한도 (11-18 결정): 한 사람(same) 한도 + 같은 접속 위치(IP) 전체 상한. recent = 최근 24시간 줄.
// 기기 표시만 바꿔 보내면 「다른 사람」이 되어 한 사람 한도를 피할 수 있으므로, 접속 위치 상한이 그 위를 막는다.
function overDaily(recent: Mark[], m: Mark, perPerson: number, perIp: number): "me" | "ip" | null {
  if (recent.filter((r) => same(r, m)).length >= perPerson) return "me";
  if (recent.filter((r) => r.ip === m.ip).length >= perIp) return "ip";
  return null;
}
// what = 「등록·수정이」「글이」처럼 조사까지
const ipLimitMsg = (what: string) => `지금 쓰는 인터넷(와이파이)에서 오늘 ${what} 너무 많이 올라왔어요. 데이터로 바꾸거나 내일 다시 부탁드려요`;

const LIMIT_MSG = "오늘은 등록·수정을 많이 해 주셨어요. 내일 다시 부탁드려요";

// 등록·수정 한도. 넘었으면 그대로 돌려줄 실패(429), 아니면 null
function dailyLimitFail(db: Db, m: Mark): Fail | null {
  const recent = db.logs.filter((l) => (l.kind === "new" || l.kind === "edit") && within24h(l.at));
  const over = overDaily(recent, m, DAILY_LIMIT, DAILY_LIMIT_PER_IP);
  return over ? fail(over === "me" ? LIMIT_MSG : ipLimitMsg("등록·수정이"), 429) : null;
}

// ───────── 읽기 ─────────

export const readStores = async () => (await shared()).stores;

export const readStore = async (id: string) => (await shared()).stores.find((s) => s.id === id);

export async function readReviews(storeId: string): Promise<Review[]> {
  return (await shared()).reviews
    .filter((r) => r.storeId === storeId && !r.hidden)
    .sort((a, b) => b.at.localeCompare(a.at))
    .map(({ id, at, who, stars, spice, text }) => ({ id, at, who, stars, spice, text }));
}

export async function readHistory(storeId: string): Promise<HistoryItem[]> {
  return (await shared()).logs
    .filter((l) => l.storeId === storeId)
    .sort((a, b) => b.at.localeCompare(a.at))
    .map(({ id, at, who, kind, changes }) => ({ id, at, who, kind, changes }));
}

export async function readRecentCount(days = 7) {
  const from = Date.now() - days * 86_400_000;
  const db = await shared();
  // 예시를 숨기면 예시 가게의 기록도 세지 않는다
  const hidden = SHOW_SAMPLES ? null : new Set(db.stores.filter((s) => s.isSample).map((s) => s.id));
  return db.logs.filter((l) => (l.kind === "new" || l.kind === "edit") && new Date(l.at).getTime() > from && !hidden?.has(l.storeId)).length;
}

// ───────── 쓰기 ─────────
// 결과는 { ok: true, … } 또는 { ok: false, error, existing? } 로 돌려준다

const fail =(error: string, status = 422, existing?: string): Fail => ({ ok: false, error, status, existing });
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
    const over = dailyLimitFail(db, m);
    if (over) return over;
    const name = input.name.trim();
    if (!input.notDuplicate) {
      // 숨긴 예시 가게와는 겹쳐도 막지 않는다 (화면에 없는 가게를 「이미 있어요」로 안내하게 되므로)
      const dup = db.stores.find((s) => s.status !== "hidden" && (SHOW_SAMPLES || !s.isSample) && distanceM(s, input) <= DUP_RADIUS_M && (norm(s.name).includes(norm(name)) || norm(name).includes(norm(s.name))));
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
    if (input.stars) db.reviews.push({ ...m, id: randomUUID(), storeId: id, at: stamp(), who: who.nick, stars: input.stars });
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
    const over = dailyLimitFail(db, m);
    if (over) return over;

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

// 길찾기 누름 (W1-4). 같은 사람이 같은 가게를 같은 날 다시 누르면 더하지 않는다 → 「찾아가려 한 사람·날」을 센다
export function recordGo(id: string, app: GoApp, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    if (!db.stores.some((x) => x.id === id)) return fail("가게를 찾지 못했어요", 404);
    const m = mark(who);
    const today = isoDay();
    if (!db.goes.some((g) => g.storeId === id && same(g, m) && isoDay(new Date(g.at).getTime()) === today))
      db.goes.push({ ...m, id: randomUUID(), storeId: id, app, at: stamp() });
    return { ok: true };
  });
}

export function confirmStill(id: string, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    const s = db.stores.find((x) => x.id === id);
    if (!s) return fail("가게를 찾지 못했어요", 404);
    // 내려간 가게(숨김 · 문 닫음)는 받지 않는다 (11-19). 받으면 문 닫은 가게가 「최근 확인」으로 보인다
    if ((s.status ?? "active") !== "active") return fail("지도에서 내린 가게라 지금은 확인을 받지 않아요", 409);
    const m = mark(who);
    const today = isoDay();
    // 기록 시각(UTC ISO)도 한국 날짜로 바꿔 비교한다. 글자를 잘라 비교하면 한국 시간 0~9시 기록이 전날로 잡힌다 (F006)
    if (db.logs.some((l) => l.storeId === id && l.kind === "still" && isoDay(new Date(l.at).getTime()) === today && same(l, m))) return fail("오늘은 이미 확인해 주셨어요", 409);
    s.lastConfirmedAt = today;
    log(db, id, { nick: who.nick, ...m }, "still");
    return { ok: true };
  });
}

// 「맞아요」「달라요」: 같은 기기·같은 접속 위치는 가게마다 한 표.
// 맞아요(좋은 쪽)는 표 수 그대로 — 같은 와이파이에서 세 사람(기기 셋)이 눌러도 확인 끝.
// 달라요로 내리는 것은 달라요를 낸 서로 다른 접속 위치(IP)가 HIDE_AT 곳일 때다 (화면의 달라요 수 verify.no 는 표 수 그대로).
export function verifyStore(id: string, ok: boolean, who: Who) {
  return mutate((db): { ok: true; yes: number; no: number; status: Store["status"] } | Fail => {
    const s = db.stores.find((x) => x.id === id);
    if (!s) return fail("가게를 찾지 못했어요", 404);
    // 내려간 가게(숨김 · 문 닫음)는 표를 받지 않는다 (11-19). 받으면 달라요가 모여 문 닫음이 숨김으로 바뀌고 숨김 줄도 더 쌓인다
    if ((s.status ?? "active") !== "active") return fail("지도에서 내린 가게라 지금은 확인을 받지 않아요", 409);
    if (!isPending(s, new Date())) return fail("이미 확인이 끝난 가게예요", 409);
    const m = mark(who);
    if (db.votes.some((v) => v.storeId === id && same(v, m))) return fail("이미 알려 주셨어요. 고마워요!", 409);
    db.votes.push({ ...m, storeId: id, ok, at: stamp() });
    const verify = { yes: s.verify?.yes ?? 0, no: s.verify?.no ?? 0 };
    if (ok) verify.yes += 1;
    else verify.no += 1;
    s.verify = verify;
    // 되살린 가게는 되살린 뒤의 달라요만 센다 (adminSetStatus 가 verify.no 를 0 으로 돌리는 것과 같은 기준)
    const since = restoredAt(db, id);
    const noIps = distinctIps(db.votes.filter((v) => v.storeId === id && !v.ok && v.at > since));
    if (noIps >= HIDE_AT) {
      s.status = "hidden";
      goneLog(db, id, "hidden", GONE_BY_VOTES);
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
    // 내려간 가게(숨김 · 문 닫음)는 평가를 받지 않는다 (11-19)
    if ((s.status ?? "active") !== "active") return fail("지도에서 내린 가게라 지금은 평가를 받지 않아요", 409);
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
    const row: ReviewRow = { ...m, id: old?.id ?? randomUUID(), storeId: id, at: stamp(), who: who.nick, stars: input.stars, spice: old?.spice, text }; // 예전 맵기 표는 그대로 남긴다
    if (old) db.reviews[db.reviews.indexOf(old)] = row;
    else db.reviews.push(row);
    return { ok: true };
  });
}

// 신고: 같은 기기·접속 위치는 가게마다 한 번. 서로 다른 접속 위치(IP) HIDE_AT 곳에서 신고가 오면 지도에서 내린다.
export function flagStore(id: string, reason: FlagReason, who: Who) {
  return mutate((db): { ok: true; status: Store["status"] } | Fail => {
    const s = db.stores.find((x) => x.id === id);
    if (!s) return fail("가게를 찾지 못했어요", 404);
    const m = mark(who);
    if (db.flags.some((f) => f.storeId === id && same(f, m))) return fail("이미 신고해 주셨어요. 고마워요!", 409);
    db.flags.push({ ...m, storeId: id, reason, at: stamp() });
    // 운영자가 되살린 가게는 되살린 뒤에 들어온 신고만 센다 (되살린 뒤 신고 1건으로 곧바로 다시 내려가지 않게, F012 — restoredAt).
    const since = restoredAt(db, id);
    const flags = db.flags.filter((f) => f.storeId === id && f.at > since);
    const ips = distinctIps(flags);
    if (ips >= HIDE_AT && (s.status ?? "active") === "active") {
      // 폐업 과반도 접속 위치 수로 센다 (한 곳에서 「문을 닫았어요」를 여러 번 보내 과반을 만들지 못하게)
      const closedIps = distinctIps(flags.filter((f) => f.reason === "closed"));
      s.status = closedIps * 2 > ips ? "closed" : "hidden"; // 신고한 곳 대부분이 폐업이면 「문 닫음」
      goneLog(db, id, s.status, GONE_BY_FLAGS);
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
    if (distinctIps(r.flags) >= HIDE_AT) r.hidden = true; // 서로 다른 접속 위치 HIDE_AT 곳
    return { ok: true };
  });
}

// ───────── 사진 하루 한도 (11-18) ─────────
// 사진 한 장 = 한 줄(photo_uploads). 예전엔 서버 메모리에 세어 서버가 새로 뜨면(Vercel) 0 부터 다시 셌다 → 저장소에 남긴다.
// 올리기 전에 자리를 잡고(take), 저장에 실패하면 돌려준다(release) — 부르는 곳은 lib/data/photos.ts addPhoto 하나다.
// 한도에 쓰는 것은 최근 24시간 줄뿐이라 그보다 오래된 줄은 자리를 잡을 때마다 지운다 (표가 계속 커지지 않게).
export function takePhotoSlot(id: string, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    const m = mark(who);
    db.photoUploads = db.photoUploads.filter((p) => within24h(p.at));
    const over = overDaily(db.photoUploads, m, DAILY_PHOTOS, DAILY_PHOTOS_PER_IP);
    if (over) return fail(over === "me" ? "오늘은 사진을 많이 올리셨어요. 내일 다시 부탁드려요" : ipLimitMsg("사진이"), 429);
    db.photoUploads.push({ ...m, id, at: stamp() });
    return { ok: true };
  });
}

export function releasePhotoSlot(id: string) {
  return mutate((db) => {
    db.photoUploads = db.photoUploads.filter((p) => p.id !== id);
  });
}

// ═════════ 떡볶이방(게시판) · 맛집 리스트 (11-08) ═════════
// 로그인이 없으므로 「내 것」은 기기 표시가 같은지로만 가른다 (접속 위치는 같은 와이파이를 쓰는 남의 것일 수 있다).

const NO_DEVICE = hash("no-device");
const owns = (row: Mark, m: Mark) => m.device !== NO_DEVICE && row.device === m.device;
const within24h = (at: string) => new Date(at).getTime() > Date.now() - 86_400_000;
// 하루 한도에 세는 줄 = 최근 24시간 안에 쓴 것 중 남아 있는 줄 + 지운 줄 (11-19)
const recentWrites = (db: Db, kind: WriteKind, live: { at: string; device: string; ip: string }[]): Mark[] => [
  ...live.filter((r) => within24h(r.at)),
  ...db.deletedWrites.filter((d) => d.kind === kind && within24h(d.at)),
];
// 지운 것을 기록한다. 최근 24시간 안에 쓴 것만 남긴다 (그보다 오래된 것은 한도에 쓰지 않으므로 표가 계속 커지지 않게 지운다)
function noteDeleted(db: Db, kind: WriteKind, rows: (Mark & { id: string; at: string })[]) {
  db.deletedWrites = db.deletedWrites.filter((d) => within24h(d.at));
  for (const r of rows) if (within24h(r.at)) db.deletedWrites.push({ kind, id: r.id, at: r.at, device: r.device, ip: r.ip });
}
const toPost = ({ id, at, who, cat, title, body, storeId, comments, likes, isSample }: PostRow): Post => ({ id, at, who, cat, title, body, storeId, comments, likes: likes ?? 0, isSample });
const toList = ({ id, title, desc, storeIds, who, createdAt, updatedAt, visibility, likes, isSample }: ListRow): PlaceList => ({ id, title, desc, storeIds, who, createdAt, updatedAt, visibility, likes, isSample });

// ───────── 읽기 ─────────

export async function readPosts(): Promise<Post[]> {
  return (await shared()).posts.filter((p) => !p.hidden).sort((a, b) => b.at.localeCompare(a.at)).map(toPost);
}

export async function readPost(id: string): Promise<{ post: Post; comments: PostComment[] } | undefined> {
  const db = await shared();
  const p = db.posts.find((x) => x.id === id && !x.hidden);
  if (!p) return undefined;
  const comments = db.comments
    .filter((c) => c.postId === id && !c.hidden)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map(({ id, at, who, text }) => ({ id, at, who, text }));
  return { post: toPost(p), comments };
}

export async function readPublicLists(): Promise<PlaceList[]> {
  return (await shared()).lists.filter((l) => l.visibility === "public").map(toList);
}

// 링크로만 공유한 리스트도 주소를 아는 사람은 연다
export async function readList(id: string) {
  const l = (await shared()).lists.find((x) => x.id === id);
  return l ? toList(l) : undefined;
}

// 이 기기가 만든 리스트 · 쓴 글 · 쓴 댓글 · 추천한 리스트
export async function readOwned(device: string): Promise<Owned> {
  const m: Mark = { device: hash(device), ip: "" };
  if (m.device === NO_DEVICE) return { lists: [], posts: [], comments: [], liked: [], likedPosts: [] };
  const db = await shared();
  return {
    lists: db.lists.filter((l) => owns(l, m)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toList),
    posts: db.posts.filter((p) => owns(p, m)).map((p) => p.id),
    comments: db.comments.filter((c) => owns(c, m)).map((c) => c.id),
    liked: db.likes.filter((k) => k.device === m.device).map((k) => k.listId),
    likedPosts: db.postLikes.filter((k) => k.device === m.device).map((k) => k.postId),
  };
}

// ───────── 게시판 쓰기 ─────────

export function addPost(input: { cat: BoardCat; title: string; body: string; storeId?: string }, who: Who) {
  return mutate((db): { ok: true; id: string } | Fail => {
    const m = mark(who);
    const over = overDaily(recentWrites(db, "post", db.posts), m, DAILY_POSTS, DAILY_POSTS_PER_IP);
    if (over) return fail(over === "me" ? "오늘은 글을 많이 써 주셨어요. 내일 다시 부탁드려요" : ipLimitMsg("글이"), 429);
    if (input.storeId && !db.stores.some((s) => s.id === input.storeId)) return fail("붙인 가게를 찾지 못했어요");
    const id = `p-${randomUUID().slice(0, 8)}`;
    db.posts.push({ ...m, id, at: stamp(), who: who.nick, cat: input.cat, title: input.title.trim(), body: input.body.trim(), storeId: input.storeId || undefined, comments: 0, likes: 0 });
    return { ok: true, id };
  });
}

export function deletePost(id: string, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    const p = db.posts.find((x) => x.id === id);
    if (!p) return fail("글을 찾지 못했어요", 404);
    if (!owns(p, mark(who))) return fail("이 기기에서 쓴 글만 지울 수 있어요", 403);
    db.posts.splice(db.posts.indexOf(p), 1);
    // 글과 함께 사라지는 댓글도 쓴 사람들의 하루 한도에 남긴다
    noteDeleted(db, "post", [p]);
    noteDeleted(db, "comment", db.comments.filter((c) => c.postId === id));
    db.comments = db.comments.filter((c) => c.postId !== id);
    db.postLikes = db.postLikes.filter((k) => k.postId !== id);
    return { ok: true };
  });
}

const countComments = (db: Db, postId: string) => db.comments.filter((c) => c.postId === postId && !c.hidden).length;

export function addComment(postId: string, text: string, who: Who) {
  return mutate((db): { ok: true; id: string } | Fail => {
    const p = db.posts.find((x) => x.id === postId && !x.hidden);
    if (!p) return fail("글을 찾지 못했어요", 404);
    const m = mark(who);
    const over = overDaily(recentWrites(db, "comment", db.comments), m, DAILY_COMMENTS, DAILY_COMMENTS_PER_IP);
    if (over) return fail(over === "me" ? "오늘은 댓글을 많이 써 주셨어요. 내일 다시 부탁드려요" : ipLimitMsg("댓글이"), 429);
    const id = `c-${randomUUID().slice(0, 8)}`;
    db.comments.push({ ...m, id, postId, at: stamp(), who: who.nick, text: text.trim() });
    p.comments = countComments(db, postId);
    return { ok: true, id };
  });
}

export function deleteComment(commentId: string, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    const c = db.comments.find((x) => x.id === commentId);
    if (!c) return fail("댓글을 찾지 못했어요", 404);
    if (!owns(c, mark(who))) return fail("이 기기에서 쓴 댓글만 지울 수 있어요", 403);
    db.comments.splice(db.comments.indexOf(c), 1);
    noteDeleted(db, "comment", [c]);
    const p = db.posts.find((x) => x.id === c.postId);
    if (p) p.comments = countComments(db, p.id);
    return { ok: true };
  });
}

// 글 추천(엄지척): 리스트 추천과 같은 규칙. 기기마다 글 하나에 한 번, 다시 누르면 취소, 내 글은 추천하지 않는다.
export function likePost(id: string, who: Who) {
  return mutate((db): { ok: true; liked: boolean; likes: number } | Fail => {
    const p = db.posts.find((x) => x.id === id && !x.hidden);
    if (!p) return fail("글을 찾지 못했어요", 404);
    const m = mark(who);
    if (m.device === NO_DEVICE) return fail("이 브라우저에서는 추천할 수 없어요", 400);
    if (owns(p, m)) return fail("내가 쓴 글은 추천할 수 없어요", 409);
    const old = db.postLikes.find((k) => k.postId === id && k.device === m.device);
    p.likes ??= 0;
    if (old) {
      db.postLikes.splice(db.postLikes.indexOf(old), 1);
      p.likes = Math.max(0, p.likes - 1);
    } else {
      db.postLikes.push({ ...m, postId: id, at: stamp() });
      p.likes += 1;
    }
    return { ok: true, liked: !old, likes: p.likes };
  });
}

// 신고: 같은 기기·접속 위치는 한 번. 서로 다른 접속 위치(IP) HIDE_AT 곳에서 신고가 오면 가린다 (후기 신고와 같은 규칙)
export function flagPost(id: string, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    const p = db.posts.find((x) => x.id === id);
    if (!p) return fail("글을 찾지 못했어요", 404);
    const m = mark(who);
    const flags = p.flags ?? [];
    if (flags.some((f) => same(f, m))) return fail("이미 신고해 주셨어요. 고마워요!", 409);
    p.flags = [...flags, m];
    if (distinctIps(p.flags) >= HIDE_AT) p.hidden = true;
    return { ok: true };
  });
}

export function flagComment(id: string, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    const c = db.comments.find((x) => x.id === id);
    if (!c) return fail("댓글을 찾지 못했어요", 404);
    const m = mark(who);
    const flags = c.flags ?? [];
    if (flags.some((f) => same(f, m))) return fail("이미 신고해 주셨어요. 고마워요!", 409);
    c.flags = [...flags, m];
    if (distinctIps(c.flags) >= HIDE_AT) {
      c.hidden = true;
      const p = db.posts.find((x) => x.id === c.postId);
      if (p) p.comments = countComments(db, p.id);
    }
    return { ok: true };
  });
}

// ───────── 맛집 리스트 쓰기 ─────────

function findOwnList(db: Db, id: string, who: Who): ListRow | Fail {
  const l = db.lists.find((x) => x.id === id);
  if (!l) return fail("리스트를 찾지 못했어요", 404);
  if (!owns(l, mark(who))) return fail("이 기기에서 만든 리스트만 고칠 수 있어요", 403);
  return l;
}
const isFail = (v: ListRow | Fail): v is Fail => "ok" in v && v.ok === false;

export function createList(input: { title: string; desc?: string; visibility: ListVisibility; storeIds?: string[] }, who: Who) {
  return mutate((db): { ok: true; id: string } | Fail => {
    const m = mark(who);
    if (m.device === NO_DEVICE) return fail("이 브라우저에서는 리스트를 만들 수 없어요. 다른 브라우저로 열어 주세요", 400);
    const over = overDaily(recentWrites(db, "list", db.lists.map((l) => ({ at: l.createdAt, device: l.device, ip: l.ip }))), m, DAILY_LISTS, DAILY_LISTS_PER_IP);
    if (over) return fail(over === "me" ? "오늘은 리스트를 많이 만들어 주셨어요. 내일 다시 부탁드려요" : ipLimitMsg("리스트가"), 429);
    const known = new Set(db.stores.map((s) => s.id));
    const storeIds = [...new Set(input.storeIds ?? [])].filter((s) => known.has(s)).slice(0, MAX_LIST_STORES);
    const now = stamp();
    const id = `l-${randomUUID().slice(0, 8)}`;
    db.lists.push({ ...m, id, title: input.title.trim(), desc: input.desc?.trim() || undefined, storeIds, who: who.nick, createdAt: now, updatedAt: now, visibility: input.visibility, likes: 0 });
    return { ok: true, id };
  });
}

export function updateList(id: string, patch: { title?: string; desc?: string | null; visibility?: ListVisibility }, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    const l = findOwnList(db, id, who);
    if (isFail(l)) return l;
    if (patch.title !== undefined) l.title = patch.title.trim();
    if (patch.desc !== undefined) l.desc = patch.desc?.trim() || undefined;
    if (patch.visibility !== undefined) l.visibility = patch.visibility;
    l.updatedAt = stamp();
    return { ok: true };
  });
}

export type ListStoreOp = { kind: "add"; storeId: string } | { kind: "remove"; storeId: string } | { kind: "move"; storeId: string; dir: -1 | 1 };

// 가게 넣기 · 빼기 · 순서 바꾸기
export function editListStores(id: string, op: ListStoreOp, who: Who) {
  return mutate((db): { ok: true; storeIds: string[] } | Fail => {
    const l = findOwnList(db, id, who);
    if (isFail(l)) return l;
    const at = l.storeIds.indexOf(op.storeId);
    if (op.kind === "add") {
      if (at >= 0) return fail("이미 이 리스트에 있어요", 409);
      if (!db.stores.some((s) => s.id === op.storeId)) return fail("가게를 찾지 못했어요", 404);
      if (l.storeIds.length >= MAX_LIST_STORES) return fail(`리스트 하나에 ${MAX_LIST_STORES}곳까지 담을 수 있어요`);
      l.storeIds.push(op.storeId);
    } else if (op.kind === "remove") {
      if (at < 0) return fail("이 리스트에 없는 가게예요", 404);
      l.storeIds.splice(at, 1);
    } else {
      const to = at + op.dir;
      if (at < 0 || to < 0 || to >= l.storeIds.length) return fail("더 옮길 수 없어요");
      [l.storeIds[at], l.storeIds[to]] = [l.storeIds[to], l.storeIds[at]];
    }
    l.updatedAt = stamp();
    return { ok: true, storeIds: l.storeIds };
  });
}

export function deleteList(id: string, who: Who) {
  return mutate((db): { ok: true } | Fail => {
    const l = findOwnList(db, id, who);
    if (isFail(l)) return l;
    db.lists.splice(db.lists.indexOf(l), 1);
    noteDeleted(db, "list", [{ id: l.id, at: l.createdAt, device: l.device, ip: l.ip }]);
    db.likes = db.likes.filter((k) => k.listId !== id);
    return { ok: true };
  });
}

// 추천: 기기마다 리스트 하나에 한 번, 다시 누르면 취소. 내가 만든 리스트는 추천하지 않는다.
// 같은 와이파이(학교·회사)에 여러 사람이 있을 수 있어 접속 위치로는 막지 않는다.
export function likeList(id: string, who: Who) {
  return mutate((db): { ok: true; liked: boolean; likes: number } | Fail => {
    const l = db.lists.find((x) => x.id === id);
    if (!l) return fail("리스트를 찾지 못했어요", 404);
    const m = mark(who);
    if (m.device === NO_DEVICE) return fail("이 브라우저에서는 추천할 수 없어요", 400);
    if (owns(l, m)) return fail("내가 만든 리스트는 추천할 수 없어요", 409);
    const old = db.likes.find((k) => k.listId === id && k.device === m.device);
    if (old) {
      db.likes.splice(db.likes.indexOf(old), 1);
      l.likes = Math.max(0, l.likes - 1);
    } else {
      db.likes.push({ ...m, listId: id, at: stamp() });
      l.likes += 1;
    }
    return { ok: true, liked: !old, likes: l.likes };
  });
}
