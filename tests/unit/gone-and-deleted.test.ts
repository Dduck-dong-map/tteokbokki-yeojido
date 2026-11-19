import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DAILY_COMMENTS, DAILY_COMMENTS_PER_IP, DAILY_LISTS, DAILY_LISTS_PER_IP, DAILY_POSTS, DAILY_POSTS_PER_IP } from "@/lib/community";
import type { NewStoreInput } from "@/lib/wiki";
import { GONE_REASON_FIELD, HIDE_AT, goneNotice } from "@/lib/wiki";

// 11-19 PRD 검증에서 나온 버그 고침 확인 (lib/data/db.ts · lib/wiki.ts).
//  ① 숨김 안내의 까닭은 내린 판정과 같은 기준(되살린 뒤 서로 다른 접속 위치 수)을 따른다 — 숨김 줄에 남긴 「내린 까닭」으로 가른다
//  ② 내려간 가게(숨김 · 문 닫음)에는 맞아요 · 달라요를 받지 않는다
//  ③ 글 · 댓글 · 리스트는 지워도 하루 한도에 센다 (쓰고 지우기를 되풀이해 한도를 넘지 못하게)
// 격리는 same-person.test.ts 와 같다: 테스트마다 임시 DATA_DIR + 파일 저장소, 모듈을 새로 읽는다.

type Db = typeof import("@/lib/data/db");
type Who = import("@/lib/data/db").Who;

let db: Db;
let dir: string;

const who = (n: string | number): Who => ({ nick: `손님${n}`, device: `device-${n}`, ip: `10.0.0.${n}` });
const WIFI = "203.0.113.7";
const sameIp = (n: string | number): Who => ({ nick: `와이파이${n}`, device: `wifi-device-${n}`, ip: WIFI });

const input = (): NewStoreInput => ({
  name: "까닭 시험 떡볶이",
  address: "서울 마포구 합정동 1-1",
  lat: 37.5496,
  lng: 126.9139,
  grade: "bunsik",
  rice: ["wheat"],
  style: "soup",
  spice: 3,
  menu: [{ name: "떡볶이", price: 4000 }],
  photos: [],
});

async function newStore() {
  const res = await db.addStore(input(), who("0"));
  if (!res.ok) throw new Error(res.error);
  return res.id;
}

const notice = async (id: string) => goneNotice((await db.readStore(id))!, await db.readHistory(id));

beforeEach(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "ddy-gone-deleted-"));
  process.env.DATA_DIR = dir;
  process.env.DATABASE_URL = "";
  delete (globalThis as { __ddyQueue?: unknown }).__ddyQueue;
  vi.resetModules();
  db = await import("@/lib/data/db");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("① 숨김 안내의 까닭 = 내린 판정과 같은 기준", () => {
  it(`같은 접속 위치의 달라요 ${HIDE_AT}표(내려가지 않음) 뒤에 서로 다른 ${HIDE_AT}곳의 신고로 숨기면 「신고」 문구`, async () => {
    const id = await newStore();
    for (let i = 1; i <= HIDE_AT; i++) expect((await db.verifyStore(id, false, sameIp(i))).ok).toBe(true);
    const mid = await db.readStore(id);
    expect(mid?.status).toBe("active");
    expect(mid?.verify?.no).toBe(HIDE_AT); // 달라요 수는 표 수 그대로 — 예전에는 이 값 때문에 달라요 문구가 나왔다
    for (let i = 1; i <= HIDE_AT; i++) await db.flagStore(id, "ad", who(i));
    expect((await db.readStore(id))?.status).toBe("hidden");
    expect(await notice(id)).toBe("신고가 쌓여 지도에서 내렸어요.");
    const [h] = await db.readHistory(id);
    expect(h).toMatchObject({ kind: "hidden", who: "지도", changes: [{ field: GONE_REASON_FIELD, to: "신고" }] });
  });

  it(`서로 다른 ${HIDE_AT}곳의 달라요로 숨기면 달라요 문구, 이력 줄에 까닭이 남는다`, async () => {
    const id = await newStore();
    for (let i = 1; i <= HIDE_AT; i++) await db.verifyStore(id, false, who(i));
    expect((await db.readStore(id))?.status).toBe("hidden");
    expect(await notice(id)).toBe("사실과 다르다는 의견이 쌓여 지도에서 내렸어요.");
    const [h] = await db.readHistory(id);
    expect(h).toMatchObject({ kind: "hidden", changes: [{ field: GONE_REASON_FIELD, to: "달라요" }] });
  });

  it("신고로 문 닫음도 까닭이 남고 문구는 그대로", async () => {
    const [s] = await db.readStores();
    for (let i = 1; i <= HIDE_AT; i++) await db.flagStore(s.id, "closed", who(i));
    expect(await notice(s.id)).toBe("문을 닫았다는 신고가 쌓여 지도에서 내렸어요.");
    const [h] = await db.readHistory(s.id);
    expect(h).toMatchObject({ kind: "closed", changes: [{ field: GONE_REASON_FIELD, to: "신고" }] });
  });

  it("까닭이 없는 옛 숨김 줄은 예전처럼 달라요 표 수로 가른다", () => {
    const old = [{ kind: "hidden" }];
    expect(goneNotice({ status: "hidden", verify: { yes: 0, no: HIDE_AT } }, old)).toBe("사실과 다르다는 의견이 쌓여 지도에서 내렸어요.");
    expect(goneNotice({ status: "hidden", verify: { yes: 0, no: 1 } }, old)).toBe("신고가 쌓여 지도에서 내렸어요.");
    expect(goneNotice({ status: "hidden", verify: { yes: 0, no: HIDE_AT } }, [])).toBe("사실과 다르다는 의견이 쌓여 지도에서 내렸어요.");
    expect(goneNotice({ status: "hidden" }, [])).toBe("지금은 지도에서 내린 가게예요.");
  });

  it("까닭이 있으면 달라요 표 수와 상관없이 까닭을 따른다", () => {
    const byFlags = [{ kind: "hidden", changes: [{ field: GONE_REASON_FIELD, to: "신고" }] }];
    const byVotes = [{ kind: "hidden", changes: [{ field: GONE_REASON_FIELD, to: "달라요" }] }];
    expect(goneNotice({ status: "hidden", verify: { yes: 0, no: HIDE_AT + 2 } }, byFlags)).toBe("신고가 쌓여 지도에서 내렸어요.");
    expect(goneNotice({ status: "hidden", verify: { yes: 0, no: 0 } }, byVotes)).toBe("사실과 다르다는 의견이 쌓여 지도에서 내렸어요.");
  });
});

describe("② 내려간 가게에는 맞아요 · 달라요를 받지 않는다", () => {
  for (const [label, reason, status] of [["숨김", "ad", "hidden"], ["문 닫음", "closed", "closed"]] as const) {
    it(`${label} 가게(등록 7일 안)에 맞아요 · 달라요 → 409, 상태 · 표 · 이력 그대로`, async () => {
      const id = await newStore();
      for (let i = 1; i <= HIDE_AT; i++) await db.flagStore(id, reason, who(i));
      const before = await db.readStore(id);
      expect(before?.status).toBe(status);
      const history = await db.readHistory(id);

      for (let i = 1; i <= HIDE_AT + 1; i++) {
        expect(await db.verifyStore(id, false, who(`no-${i}`))).toMatchObject({ ok: false, status: 409 });
        expect(await db.verifyStore(id, true, who(`yes-${i}`))).toMatchObject({ ok: false, status: 409 });
      }
      const after = await db.readStore(id);
      expect(after?.status).toBe(status);
      expect(after?.verify).toEqual(before?.verify);
      expect(await db.readHistory(id)).toEqual(history);
      const saved = JSON.parse(readFileSync(path.join(dir, "db.json"), "utf8")) as { votes: { storeId: string }[] };
      expect(saved.votes.filter((v) => v.storeId === id)).toEqual([]);
    });
  }
});

describe("③ 지운 글 · 댓글 · 리스트도 하루 한도에 센다", () => {
  const post = (n: string | number, w: Who) => db.addPost({ cat: "free", title: `지울 글 ${n}`, body: "본문" }, w);

  it(`글: 쓰고 지우기를 되풀이해도 한 사람 ${DAILY_POSTS}건에서 429`, async () => {
    for (let i = 0; i < DAILY_POSTS; i++) {
      const p = await post(i, who(1));
      if (!p.ok) throw new Error(p.error);
      expect(await db.deletePost(p.id, who(1))).toEqual({ ok: true });
    }
    expect(await post("over", who(1))).toMatchObject({ ok: false, status: 429, error: expect.stringContaining("글을 많이") });
    expect(await db.readPosts()).not.toContainEqual(expect.objectContaining({ title: expect.stringContaining("지울 글") }));
    expect((await post("other", who(2))).ok).toBe(true);
  });

  it(`글: 같은 접속 위치에서 기기를 바꿔 쓰고 지우기를 되풀이해도 ${DAILY_POSTS_PER_IP}건에서 429`, async () => {
    for (let i = 0; i < DAILY_POSTS_PER_IP; i++) {
      const p = await post(i, sameIp(i));
      if (!p.ok) throw new Error(p.error);
      await db.deletePost(p.id, sameIp(i));
    }
    expect(await post("over", sameIp("새 기기"))).toMatchObject({ ok: false, status: 429, error: expect.stringContaining("인터넷") });
    expect((await post("other", who(2))).ok).toBe(true);
  });

  it(`댓글: 쓰고 지우기를 되풀이해도 한 사람 ${DAILY_COMMENTS}건 · 같은 접속 위치 ${DAILY_COMMENTS_PER_IP}건에서 429`, async () => {
    const p = await post("host", who(9));
    if (!p.ok) throw new Error(p.error);
    let n = 0;
    for (let d = 0; n < DAILY_COMMENTS_PER_IP; d++) {
      for (let i = 0; i < DAILY_COMMENTS && n < DAILY_COMMENTS_PER_IP; i++, n++) {
        const c = await db.addComment(p.id, `지울 댓글 ${n}`, sameIp(d));
        if (!c.ok) throw new Error(c.error);
        expect(await db.deleteComment(c.id, sameIp(d))).toEqual({ ok: true });
      }
      if (d === 0) expect(await db.addComment(p.id, "한 번 더", sameIp(0))).toMatchObject({ ok: false, status: 429, error: expect.stringContaining("댓글을 많이") });
    }
    expect(await db.addComment(p.id, "기기만 바꿈", sameIp("새 기기"))).toMatchObject({ ok: false, status: 429, error: expect.stringContaining("인터넷") });
    expect((await db.readPost(p.id))?.comments).toEqual([]);
    expect((await db.readPost(p.id))?.post.comments).toBe(0);
    expect((await db.addComment(p.id, "다른 곳", who(1))).ok).toBe(true);
  });

  it("글을 지우면 함께 사라진 남의 댓글도 그 사람의 한도에 남는다", async () => {
    // 글쓴이 한도(DAILY_POSTS) 안에서 글마다 다른 사람의 댓글 하나를 달고 글을 지운다
    const used = Math.min(DAILY_POSTS, DAILY_COMMENTS);
    for (let i = 0; i < used; i++) {
      const p = await post(i, who(1));
      if (!p.ok) throw new Error(p.error);
      expect((await db.addComment(p.id, "댓글", who(2))).ok).toBe(true);
      await db.deletePost(p.id, who(1));
    }
    const p = await post("host", who(3));
    if (!p.ok) throw new Error(p.error);
    for (let i = used; i < DAILY_COMMENTS; i++) expect((await db.addComment(p.id, `댓글 ${i}`, who(2))).ok).toBe(true);
    expect(await db.addComment(p.id, "한 번 더", who(2))).toMatchObject({ ok: false, status: 429 });
  });

  it(`리스트: 쓰고 지우기를 되풀이해도 한 사람 ${DAILY_LISTS}건 · 같은 접속 위치 ${DAILY_LISTS_PER_IP}건에서 429`, async () => {
    let n = 0;
    for (let d = 0; n < DAILY_LISTS_PER_IP; d++) {
      for (let i = 0; i < DAILY_LISTS && n < DAILY_LISTS_PER_IP; i++, n++) {
        const l = await db.createList({ title: `지울 리스트 ${n}`, visibility: "public" }, sameIp(d));
        if (!l.ok) throw new Error(l.error);
        expect(await db.deleteList(l.id, sameIp(d))).toEqual({ ok: true });
      }
      if (d === 0) expect(await db.createList({ title: "한 번 더", visibility: "public" }, sameIp(0))).toMatchObject({ ok: false, status: 429, error: expect.stringContaining("리스트를 많이") });
    }
    expect(await db.createList({ title: "기기만 바꿈", visibility: "public" }, sameIp("새 기기"))).toMatchObject({ ok: false, status: 429, error: expect.stringContaining("인터넷") });
    expect((await db.readPublicLists()).some((l) => l.title.startsWith("지울 리스트"))).toBe(false);
    expect((await db.createList({ title: "다른 곳", visibility: "link" }, who(1))).ok).toBe(true);
  });

  it("지운 기록은 24시간이 지나면 한도에서 빠지고 지워진다", async () => {
    const saved = () => (JSON.parse(readFileSync(path.join(dir, "db.json"), "utf8")) as { deletedWrites: { kind: string; id: string }[] }).deletedWrites;
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-11-18T00:00:00Z"));
      for (let i = 0; i < DAILY_POSTS; i++) {
        const p = await post(i, who(1));
        if (!p.ok) throw new Error(p.error);
        await db.deletePost(p.id, who(1));
      }
      expect(saved()).toHaveLength(DAILY_POSTS);
      expect(await post("over", who(1))).toMatchObject({ ok: false, status: 429 });
      vi.setSystemTime(new Date("2026-11-19T00:00:01Z"));
      const p = await post("next-day", who(1));
      if (!p.ok) throw new Error(p.error);
      await db.deletePost(p.id, who(1));
      expect(saved().map((d) => d.id)).toEqual([p.id]);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("내려간 가게에는 아직 있어요 · 평가도 받지 않는다 (정보 고치기는 받는다)", () => {
  it("신고로 내린 가게: 아직 있어요 · 평가는 409 이고 확인일 · 별점이 그대로다. 고치기는 된다", async () => {
    const id = await newStore();
    for (const n of [1, 2, 3]) expect((await db.flagStore(id, "closed", who(n))).ok).toBe(true);
    const before = (await db.readStore(id))!;
    expect(before.status).toBe("closed");

    expect(await db.confirmStill(id, who(7))).toMatchObject({ ok: false, status: 409, error: "지도에서 내린 가게라 지금은 확인을 받지 않아요" });
    expect(await db.reviewStore(id, { stars: 5, text: "맛있어요" }, who(7))).toMatchObject({ ok: false, status: 409, error: "지도에서 내린 가게라 지금은 평가를 받지 않아요" });

    const after = (await db.readStore(id))!;
    expect(after.lastConfirmedAt).toBe(before.lastConfirmedAt);
    expect(after.rating).toEqual(before.rating);
    expect(await db.readReviews(id)).toHaveLength(0);

    // 잘못 내려간 가게를 누군가 고칠 수 있게 정보 고치기는 그대로 받는다
    expect((await db.editStore(id, { spice: 4 }, who(8))).ok).toBe(true);
  });
});
