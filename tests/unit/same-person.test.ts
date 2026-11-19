import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DAILY_COMMENTS, DAILY_COMMENTS_PER_IP, DAILY_LISTS, DAILY_LISTS_PER_IP, DAILY_POSTS, DAILY_POSTS_PER_IP } from "@/lib/community";
import type { NewStoreInput } from "@/lib/wiki";
import { DAILY_LIMIT, DAILY_LIMIT_PER_IP, DAILY_PHOTOS, DAILY_PHOTOS_PER_IP, HIDE_AT, VERIFY_YES, isPending } from "@/lib/wiki";

// 같은 사람 판정 · 도배 방지 (11-18 결정, lib/data/db.ts · lib/request.ts).
//  - 내리는 판정(달라요 · 가게 신고 · 후기 · 글 · 댓글 신고)은 서로 다른 접속 위치(IP) HIDE_AT 곳이 모여야 한다
//  - 좋은 쪽 판정(맞아요)은 기기 기준 그대로 — 같은 와이파이의 세 사람이면 확인 끝
//  - 하루 한도 = 한 사람(기기 + IP) 한도 + 같은 IP 전체 상한
//  - 기기 표시(x-ddy-device)가 없는 쓰기는 거절
//  - 사진 하루 한도는 저장소에 남는다
// 격리는 db.test.ts 와 같다: 테스트마다 임시 DATA_DIR + 파일 저장소, 모듈을 새로 읽는다.

type Db = typeof import("@/lib/data/db");
type Who = import("@/lib/data/db").Who;

let db: Db;
let dir: string;

// 서로 다른 사람 (기기도 접속 위치도 다름)
const who = (n: string | number): Who => ({ nick: `손님${n}`, device: `device-${n}`, ip: `10.0.0.${n}` });
// 같은 접속 위치에서 기기 표시만 바꾼 요청 (헤더만 바꿔 보내는 도배 · 같은 와이파이의 여러 사람)
const WIFI = "203.0.113.7";
const sameIp = (n: string | number, ip = WIFI): Who => ({ nick: `와이파이${n}`, device: `wifi-device-${n}`, ip });

const input = (p: Partial<NewStoreInput> = {}): NewStoreInput => ({
  name: "판정 시험 떡볶이",
  address: "서울 마포구 합정동 1-1",
  lat: 37.5496,
  lng: 126.9139,
  grade: "bunsik",
  rice: ["wheat"],
  style: "soup",
  spice: 3,
  menu: [{ name: "떡볶이", price: 4000 }],
  photos: [],
  ...p,
});

const statusOf = async (id: string) => (await db.readStore(id))?.status ?? "active";

async function newStore() {
  const res = await db.addStore(input(), who("0"));
  if (!res.ok) throw new Error(res.error);
  return res.id;
}

async function reload() {
  delete (globalThis as { __ddyQueue?: unknown }).__ddyQueue;
  vi.resetModules();
  db = await import("@/lib/data/db");
}

beforeEach(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "ddy-same-person-"));
  process.env.DATA_DIR = dir;
  process.env.DATABASE_URL = "";
  await reload();
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe(`가게 신고 — 서로 다른 접속 위치 ${HIDE_AT}곳이어야 내린다`, () => {
  it(`같은 IP 에서 기기 표시만 바꾼 신고 ${HIDE_AT}건(그리고 더 많이)으로는 내려가지 않는다`, async () => {
    const [s] = await db.readStores();
    // 예시 가게는 status 칸이 없다(없으면 active) → 응답의 status 대신 저장된 값을 본다
    for (let i = 1; i <= HIDE_AT + 2; i++) expect((await db.flagStore(s.id, "closed", sameIp(i))).ok).toBe(true);
    expect(await statusOf(s.id)).toBe("active");
    const data = await import("@/lib/data");
    expect((await data.getStores()).some((x) => x.id === s.id)).toBe(true);
    expect((await db.readHistory(s.id)).some((h) => h.kind === "closed" || h.kind === "hidden")).toBe(false);
  });

  it("같은 IP 여럿 + 다른 IP 하나 = 두 곳이라 그대로, 세 번째 IP 가 오면 내려간다", async () => {
    const [s] = await db.readStores();
    for (let i = 1; i <= 3; i++) await db.flagStore(s.id, "ad", sameIp(i));
    expect((await db.flagStore(s.id, "ad", who("1"))).ok).toBe(true);
    expect(await statusOf(s.id)).toBe("active");
    expect(await db.flagStore(s.id, "ad", who("2"))).toEqual({ ok: true, status: "hidden" });
  });

  it("서로 다른 IP 3곳, 「문을 닫았어요」가 과반이면 closed", async () => {
    const [s] = await db.readStores();
    await db.flagStore(s.id, "closed", who("1"));
    await db.flagStore(s.id, "closed", who("2"));
    expect(await db.flagStore(s.id, "wrong", who("3"))).toEqual({ ok: true, status: "closed" });
    expect((await db.readHistory(s.id))[0]).toMatchObject({ kind: "closed", who: "지도" });
  });

  it("폐업 과반도 접속 위치 수로 센다 — 한 곳에서 「문을 닫았어요」를 여러 번 보내도 한 곳 몫", async () => {
    const [s] = await db.readStores();
    for (let i = 1; i <= 5; i++) await db.flagStore(s.id, "closed", sameIp(i)); // 폐업 5건이지만 한 곳
    await db.flagStore(s.id, "ad", who("1"));
    // 세 곳 가운데 폐업은 한 곳 → 과반이 아니라 hidden
    expect(await db.flagStore(s.id, "ad", who("2"))).toEqual({ ok: true, status: "hidden" });
  });

  it("한 사람 한 번은 그대로: 같은 기기 · 같은 IP 의 두 번째 신고는 409", async () => {
    const [s] = await db.readStores();
    await db.flagStore(s.id, "ad", sameIp(1));
    expect(await db.flagStore(s.id, "ad", sameIp(1))).toMatchObject({ ok: false, status: 409, error: "이미 신고해 주셨어요. 고마워요!" });
  });
});

describe(`달라요 — 서로 다른 접속 위치 ${HIDE_AT}곳이어야 내린다 · 맞아요는 기기 기준`, () => {
  it(`같은 IP 에서 기기 표시만 바꾼 달라요 ${HIDE_AT}표로는 내려가지 않는다 (달라요 수는 표 수 그대로)`, async () => {
    const id = await newStore();
    for (let i = 1; i <= HIDE_AT; i++) expect(await db.verifyStore(id, false, sameIp(i))).toMatchObject({ ok: true, no: i, status: "active" });
    expect(await statusOf(id)).toBe("active");
    expect((await db.readHistory(id)).some((h) => h.kind === "hidden")).toBe(false);
    // 다른 두 곳이 더 달라요를 내면 세 곳이 되어 내려간다
    expect(await db.verifyStore(id, false, who("1"))).toMatchObject({ ok: true, status: "active" });
    expect(await db.verifyStore(id, false, who("2"))).toMatchObject({ ok: true, no: HIDE_AT + 2, status: "hidden" });
    expect((await db.readHistory(id))[0]).toMatchObject({ kind: "hidden", who: "지도" });
  });

  it("서로 다른 IP 3곳의 달라요 → hidden", async () => {
    const id = await newStore();
    for (let i = 1; i < HIDE_AT; i++) expect(await db.verifyStore(id, false, who(i))).toMatchObject({ ok: true, status: "active" });
    expect(await db.verifyStore(id, false, who(HIDE_AT))).toMatchObject({ ok: true, no: HIDE_AT, status: "hidden" });
  });

  it(`같은 IP(교회 와이파이)의 기기 ${VERIFY_YES}대가 맞아요 → 확인 끝`, async () => {
    const id = await newStore();
    for (let i = 1; i <= VERIFY_YES; i++) expect(await db.verifyStore(id, true, sameIp(i))).toMatchObject({ ok: true, yes: i });
    const s = (await db.readStore(id))!;
    expect(s.verify).toEqual({ yes: VERIFY_YES, no: 0 });
    expect(isPending(s, new Date())).toBe(false);
    expect((await db.readHistory(id)).some((h) => h.kind === "verified")).toBe(true);
  });

  it("한 사람 한 표는 그대로: 같은 기기 · 같은 IP 는 두 번 못 낸다", async () => {
    const id = await newStore();
    expect((await db.verifyStore(id, false, sameIp(1))).ok).toBe(true);
    expect(await db.verifyStore(id, true, sameIp(1))).toMatchObject({ ok: false, status: 409 });
  });
});

describe(`후기 · 글 · 댓글 신고 — 서로 다른 접속 위치 ${HIDE_AT}곳이어야 가린다`, () => {
  it("후기: 같은 IP 3건은 그대로 보이고, 서로 다른 IP 3곳이면 숨긴다", async () => {
    const [s] = await db.readStores();
    const [review] = await db.readReviews(s.id);
    expect(review).toBeDefined();
    for (let i = 1; i <= HIDE_AT; i++) expect(await db.flagReview(review.id, sameIp(i))).toEqual({ ok: true });
    expect((await db.readReviews(s.id)).some((r) => r.id === review.id)).toBe(true);
    expect(await db.flagReview(review.id, who("1"))).toEqual({ ok: true });
    expect((await db.readReviews(s.id)).some((r) => r.id === review.id)).toBe(true); // 두 곳
    expect(await db.flagReview(review.id, who("2"))).toEqual({ ok: true });
    expect((await db.readReviews(s.id)).some((r) => r.id === review.id)).toBe(false); // 세 곳
  });

  it("글: 같은 IP 3건은 그대로 보이고, 서로 다른 IP 3곳이면 가린다", async () => {
    const p = await db.addPost({ cat: "free", title: "신고 시험 글", body: "본문" }, who("9"));
    if (!p.ok) throw new Error(p.error);
    for (let i = 1; i <= HIDE_AT; i++) expect(await db.flagPost(p.id, sameIp(i))).toEqual({ ok: true });
    expect(await db.readPost(p.id)).toBeDefined();
    await db.flagPost(p.id, who("1"));
    expect(await db.readPost(p.id)).toBeDefined();
    await db.flagPost(p.id, who("2"));
    expect(await db.readPost(p.id)).toBeUndefined();
    expect((await db.readPosts()).some((x) => x.id === p.id)).toBe(false);
  });

  it("댓글: 같은 IP 3건은 그대로 보이고, 서로 다른 IP 3곳이면 가리고 댓글 수가 줄어든다", async () => {
    const p = await db.addPost({ cat: "free", title: "댓글 신고 시험", body: "본문" }, who("9"));
    if (!p.ok) throw new Error(p.error);
    const c = await db.addComment(p.id, "가려질 댓글", who("9"));
    if (!c.ok) throw new Error(c.error);
    for (let i = 1; i <= HIDE_AT; i++) expect(await db.flagComment(c.id, sameIp(i))).toEqual({ ok: true });
    expect((await db.readPost(p.id))?.comments).toHaveLength(1);
    await db.flagComment(c.id, who("1"));
    expect((await db.readPost(p.id))?.comments).toHaveLength(1);
    await db.flagComment(c.id, who("2"));
    const after = await db.readPost(p.id);
    expect(after?.comments).toHaveLength(0);
    expect(after?.post.comments).toBe(0);
  });
});

describe("하루 한도 — 한 사람 한도 + 같은 접속 위치 상한", () => {
  // 서로 멀리 떨어뜨려 중복 검사에 안 걸리게 한다
  const far = (i: number) => input({ name: `한도 가게 ${i}`, lat: 34 + i * 0.01, lng: 127 });

  it(`등록: 같은 IP 에서 기기를 바꿔 가며 ${DAILY_LIMIT_PER_IP}건까지 되고 ${DAILY_LIMIT_PER_IP + 1}번째는 429 (다른 IP 는 된다)`, async () => {
    let n = 0;
    for (let d = 0; n < DAILY_LIMIT_PER_IP; d++) {
      for (let i = 0; i < DAILY_LIMIT && n < DAILY_LIMIT_PER_IP; i++, n++) {
        const res = await db.addStore(far(n), sameIp(d));
        expect(res.ok, `${n + 1}번째 (기기 ${d})`).toBe(true);
      }
    }
    const over = await db.addStore(far(n), sameIp("새 기기"));
    expect(over).toMatchObject({ ok: false, status: 429 });
    if (!over.ok) expect(over.error).toBe("지금 쓰는 인터넷(와이파이)에서 오늘 등록·수정이 너무 많이 올라왔어요. 데이터로 바꾸거나 내일 다시 부탁드려요");
    // 고치기도 같은 묶음이라 막힌다
    const [sample] = await db.readStores();
    expect(await db.editStore(sample.id, { memo: "상한 뒤 고치기" }, sameIp("또 다른 기기"))).toMatchObject({ ok: false, status: 429 });
    // 다른 접속 위치는 따로 센다
    expect((await db.addStore(far(n + 1), who("1"))).ok).toBe(true);
  }, 30_000);

  it(`등록: 한 사람 한도(${DAILY_LIMIT})는 그대로 — 11번째는 「많이 해 주셨어요」, 같은 IP 의 다른 기기는 된다`, async () => {
    for (let i = 0; i < DAILY_LIMIT; i++) expect((await db.addStore(far(i), sameIp(1))).ok).toBe(true);
    const over = await db.addStore(far(DAILY_LIMIT), sameIp(1));
    expect(over).toMatchObject({ ok: false, status: 429, error: "오늘은 등록·수정을 많이 해 주셨어요. 내일 다시 부탁드려요" });
    expect((await db.addStore(far(DAILY_LIMIT + 1), sameIp(2))).ok).toBe(true);
  });

  it(`글: 같은 IP 에서 기기를 바꿔 ${DAILY_POSTS_PER_IP}건까지, 다음은 429`, async () => {
    let n = 0;
    for (let d = 0; n < DAILY_POSTS_PER_IP; d++) {
      for (let i = 0; i < DAILY_POSTS && n < DAILY_POSTS_PER_IP; i++, n++) expect((await db.addPost({ cat: "free", title: `글 ${n}`, body: "본문" }, sameIp(d))).ok).toBe(true);
    }
    const over = await db.addPost({ cat: "free", title: "한 번 더", body: "본문" }, sameIp("새 기기"));
    expect(over).toMatchObject({ ok: false, status: 429 });
    if (!over.ok) expect(over.error).toContain("글이 너무 많이");
    expect((await db.addPost({ cat: "free", title: "다른 곳", body: "본문" }, who("1"))).ok).toBe(true);
  }, 30_000);

  it(`댓글: 한 사람 ${DAILY_COMMENTS}건, 같은 IP 에서 기기를 바꿔 ${DAILY_COMMENTS_PER_IP}건까지, 다음은 429`, async () => {
    const p = await db.addPost({ cat: "free", title: "댓글 한도", body: "본문" }, who("9"));
    if (!p.ok) throw new Error(p.error);
    // 상한은 한 사람 한도보다 크다: 혼자 쓰는 사람은 자기 한도에서 멈춘다
    expect(DAILY_COMMENTS_PER_IP).toBeGreaterThan(DAILY_COMMENTS);
    let n = 0;
    for (let d = 0; n < DAILY_COMMENTS_PER_IP; d++) {
      for (let i = 0; i < DAILY_COMMENTS && n < DAILY_COMMENTS_PER_IP; i++, n++) expect((await db.addComment(p.id, `댓글 ${n}`, sameIp(d))).ok).toBe(true);
      // 첫 기기는 자기 한도(60)를 다 쓰면 거절된다
      if (d === 0) expect(await db.addComment(p.id, "한 번 더", sameIp(0))).toMatchObject({ ok: false, status: 429 });
    }
    expect(await db.addComment(p.id, "기기만 바꿈", sameIp("새 기기"))).toMatchObject({ ok: false, status: 429 });
    expect((await db.addComment(p.id, "다른 곳", who("1"))).ok).toBe(true);
  }, 60_000);

  it(`리스트: 같은 IP 에서 기기를 바꿔 ${DAILY_LISTS_PER_IP}건까지, 다음은 429`, async () => {
    let n = 0;
    for (let d = 0; n < DAILY_LISTS_PER_IP; d++) {
      for (let i = 0; i < DAILY_LISTS && n < DAILY_LISTS_PER_IP; i++, n++) expect((await db.createList({ title: `리스트 ${n}`, visibility: "link" }, sameIp(d))).ok).toBe(true);
    }
    expect(await db.createList({ title: "한 번 더", visibility: "link" }, sameIp("새 기기"))).toMatchObject({ ok: false, status: 429 });
    expect((await db.createList({ title: "다른 곳", visibility: "link" }, who("1"))).ok).toBe(true);
  }, 30_000);
});

describe("기기 표시(x-ddy-device)가 없는 쓰기는 거절", () => {
  const json = { "content-type": "application/json" };
  const req = (url: string, headers: Record<string, string>, body: unknown) => new Request(`http://127.0.0.1:3101${url}`, { method: "POST", headers, body: JSON.stringify(body) });

  it("whoFrom: 헤더가 없거나 비었거나 「no-device」면 400 응답, 있으면 기기 · 접속 위치(x-forwarded-for 첫 주소)", async () => {
    const { whoFrom, NO_DEVICE_MSG } = await import("@/lib/request");
    for (const headers of [{}, { "x-ddy-device": "" }, { "x-ddy-device": "   " }, { "x-ddy-device": "no-device" }] as Record<string, string>[]) {
      const res = whoFrom(req("/api/stores", { ...json, ...headers }, {}), "손님");
      expect(res).toBeInstanceOf(Response);
      expect((res as Response).status).toBe(400);
      expect(await (res as Response).json()).toEqual({ ok: false, error: NO_DEVICE_MSG });
    }
    expect(whoFrom(req("/api/stores", { ...json, "x-ddy-device": "abc", "x-forwarded-for": "198.51.100.4, 10.0.0.1" }, {}), " 손님 ")).toEqual({ nick: "손님", device: "abc", ip: "198.51.100.4" });
    expect(whoFrom(req("/api/stores", { ...json, "x-ddy-device": "abc" }, {}), "")).toEqual({ nick: "이름 없는 손님", device: "abc", ip: "local" });
  });

  it("가게 route: 헤더 없는 신고는 400 이고 저장소에 남지 않는다, 헤더가 있으면 된다", async () => {
    const { POST } = await import("@/app/api/stores/[id]/route");
    const { NO_DEVICE_MSG } = await import("@/lib/request");
    const [s] = await db.readStores();
    const ctx = { params: Promise.resolve({ id: s.id }) };
    for (let i = 0; i < HIDE_AT; i++) {
      const res = await POST(req(`/api/stores/${s.id}`, { ...json, "x-forwarded-for": `198.51.100.${i + 1}` }, { action: "flag", reason: "closed" }), ctx);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ ok: false, error: NO_DEVICE_MSG });
    }
    expect(await statusOf(s.id)).toBe("active");

    const ok = await POST(req(`/api/stores/${s.id}`, { ...json, "x-ddy-device": "device-a", "x-forwarded-for": "198.51.100.1" }, { action: "flag", reason: "closed" }), ctx);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ ok: true });
    expect(await statusOf(s.id)).toBe("active");
  });

  it("등록 · 글 · 리스트 · 리스트 고치기 · 사진 route 도 헤더가 없으면 400", async () => {
    const stores = await import("@/app/api/stores/route");
    const room = await import("@/app/api/room/route");
    const lists = await import("@/app/api/lists/route");
    const list = await import("@/app/api/lists/[id]/route");
    const photos = await import("@/app/api/photos/route");
    expect((await stores.POST(req("/api/stores", json, input()))).status).toBe(400);
    expect((await room.POST(req("/api/room", json, { action: "post", cat: "free", title: "제목", body: "본문" }))).status).toBe(400);
    expect((await lists.POST(req("/api/lists", json, { title: "리스트", visibility: "public" }))).status).toBe(400);
    expect((await list.POST(req("/api/lists/x", json, { action: "like" }), { params: Promise.resolve({ id: "x" }) })).status).toBe(400);
    const photo = new Request("http://127.0.0.1:3101/api/photos", { method: "POST", headers: { "content-type": "image/jpeg" }, body: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]) });
    expect((await photos.POST(photo)).status).toBe(400);
    // 아무것도 저장되지 않았다
    expect((await db.readStores()).every((s) => s.isSample)).toBe(true);
    expect((await db.readPosts()).every((p) => p.isSample)).toBe(true);
  });
});

describe("사진 하루 한도 — 저장소에 남는다", () => {
  const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
  const saved = () => (JSON.parse(readFileSync(path.join(dir, "db.json"), "utf8")) as { photoUploads: { id: string; device: string; ip: string; at: string }[] }).photoUploads;

  it(`한 사람 ${DAILY_PHOTOS}장까지 되고, 모듈을 새로 읽어도(서버가 새로 떠도) 다음 장은 429`, async () => {
    let photos = await import("@/lib/data/photos");
    const me = sameIp(1);
    const ids: string[] = [];
    for (let i = 0; i < DAILY_PHOTOS; i++) {
      const r = await photos.addPhoto(JPEG, me);
      expect(r.ok, `${i + 1}번째`).toBe(true);
      if (r.ok) ids.push(r.id);
    }
    // 저장소에 한 장 = 한 줄, 기기 · 접속 위치는 해시로만
    expect(saved().map((p) => p.id)).toEqual(ids);
    expect(saved()[0].device).not.toContain("wifi-device");
    expect(saved()[0].ip).not.toContain(WIFI);

    // 서버가 새로 뜬 것처럼: 전역 줄을 비우고 모듈을 새로 읽는다
    await reload();
    photos = await import("@/lib/data/photos");
    const over = await photos.addPhoto(JPEG, me);
    expect(over).toMatchObject({ ok: false, status: 429, error: "오늘은 사진을 많이 올리셨어요. 내일 다시 부탁드려요" });
    expect(saved()).toHaveLength(DAILY_PHOTOS);
    // 같은 와이파이의 다른 기기는 자기 한도로 올린다
    expect((await photos.addPhoto(JPEG, sameIp(2))).ok).toBe(true);
    // 올린 사진은 실제로 읽힌다
    expect((await photos.readPhoto(ids[0])).ok).toBe(true);
  }, 30_000);

  it(`같은 IP 전체 상한 ${DAILY_PHOTOS_PER_IP}장 — 기기를 바꿔도 다음 장은 429, 다른 IP 는 된다`, async () => {
    let n = 0;
    for (let d = 0; n < DAILY_PHOTOS_PER_IP; d++) {
      for (let i = 0; i < DAILY_PHOTOS && n < DAILY_PHOTOS_PER_IP; i++, n++) expect((await db.takePhotoSlot(`photo-${n}`, sameIp(d))).ok).toBe(true);
    }
    const over = await db.takePhotoSlot("photo-over", sameIp("새 기기"));
    expect(over).toMatchObject({ ok: false, status: 429 });
    if (!over.ok) expect(over.error).toContain("사진이 너무 많이");
    expect((await db.takePhotoSlot("photo-other", who("1"))).ok).toBe(true);
  }, 30_000);

  it("저장에 실패하면 잡은 자리를 돌려준다 (한도를 깎지 않는다)", async () => {
    const photos = await import("@/lib/data/photos");
    process.env.SUPABASE_URL = "https://abc.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(await photos.addPhoto(JPEG, sameIp(1))).toMatchObject({ ok: false, status: 502 });
      expect(saved()).toHaveLength(0);
    } finally {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
  });

  it("24시간이 지난 줄은 한도에서 빠지고 지워진다", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-11-18T00:00:00Z"));
      for (let i = 0; i < DAILY_PHOTOS; i++) await db.takePhotoSlot(`old-${i}`, sameIp(1));
      expect(await db.takePhotoSlot("old-over", sameIp(1))).toMatchObject({ ok: false, status: 429 });
      vi.setSystemTime(new Date("2026-11-19T00:00:01Z"));
      expect((await db.takePhotoSlot("new-0", sameIp(1))).ok).toBe(true);
      expect(saved().map((p) => p.id)).toEqual(["new-0"]);
    } finally {
      vi.useRealTimers();
    }
  });
});
