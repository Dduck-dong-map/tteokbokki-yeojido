import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { NewStoreInput } from "@/lib/wiki";

// Postgres 모드 저장 흐름 · 빈 DB · 잠금(RLS) (lib/data/pg.ts, 기술 스택 9절 #4 · #8).
// DATABASE_URL 이 있을 때만 돈다 (CI 의 Postgres 서비스 · 내 컴퓨터에 따로 띄운 Postgres + PostGIS). 없으면 전부 건너뛴다.
//
// 안전: DATABASE_URL 이 가리키는 DB 의 표는 건드리지 않는다. 그 서버에 시험용 DB(ddy_test_…)를 새로 만들어
// db/init/*.sql 을 차례로 돌리고, 시험이 끝나면 지운다. 그래서 그 계정에 DB 를 만들 권한(CREATEDB)이 있어야 한다
// (CI 의 계정은 주인이라 된다). Neon 같은 바깥 DB 주소로는 돌리지 않는다.

const BASE = process.env.DATABASE_URL || "";
const INIT_DIR = path.join(process.cwd(), "db", "init");
const INIT_FILES = readdirSync(INIT_DIR).filter((f) => f.endsWith(".sql")).sort();

type Db = typeof import("@/lib/data/db");
type Sql = postgres.Sql;

const who = (n: string) => ({ nick: `손님${n}`, device: `pg-device-${n}`, ip: `10.1.0.${n}` });

const input = (p: Partial<NewStoreInput> = {}): NewStoreInput => ({
  name: "PG 시험 떡볶이",
  address: "서울 마포구 합정동 1-1",
  lat: 37.5496,
  lng: 126.9139,
  grade: "bunsik",
  rice: ["wheat"],
  style: "soup",
  spice: 3,
  menu: [{ name: "떡볶이", price: 4000 }],
  photos: ["11111111-1111-4111-8111-111111111111"],
  ...p,
});

const g = globalThis as unknown as { __ddyPg?: Sql; __ddyQueue?: unknown };

// 앱 쪽 연결(pg.ts 의 전역 연결)을 닫는다 — 다른 시험 DB 로 바꾸기 전에
async function closeApp() {
  await g.__ddyPg?.end({ timeout: 1 });
  delete g.__ddyPg;
}

// db.ts 를 그 DB 주소로 새로 읽는다 (PG 는 모듈을 읽을 때 정해진다)
async function openApp(url: string): Promise<Db> {
  await closeApp();
  delete g.__ddyQueue;
  vi.stubEnv("DATABASE_URL", url);
  vi.resetModules();
  return import("@/lib/data/db");
}

describe.skipIf(!BASE)("Postgres 모드 (DATABASE_URL)", () => {
  let admin: Sql;
  const made: string[] = [];
  const peers: Sql[] = [];
  let createdAnon = false;

  // 시험용 DB 하나를 새로 만들고 db/init/*.sql 을 돌린다. 앱이 붙을 주소를 돌려준다
  async function freshDb(): Promise<{ url: string; sql: Sql }> {
    const name = `ddy_test_${process.pid}_${Date.now().toString(36)}_${made.length}`;
    await admin.unsafe(`create database ${name} template template0`);
    made.push(name);
    const u = new URL(BASE);
    u.pathname = `/${name}`;
    const url = u.toString();
    const sql = postgres(url, { max: 1, onnotice: () => undefined });
    peers.push(sql);
    for (const f of INIT_FILES) await sql.unsafe(readFileSync(path.join(INIT_DIR, f), "utf8")).simple();
    return { url, sql };
  }

  beforeAll(async () => {
    admin = postgres(BASE, { max: 1, onnotice: () => undefined });
  });

  afterEach(async () => {
    await closeApp();
    vi.unstubAllEnvs();
  });

  afterAll(async () => {
    await closeApp();
    for (const s of peers) await s.end({ timeout: 1 });
    for (const name of made) await admin.unsafe(`drop database if exists ${name} with (force)`);
    if (createdAnon) await admin.unsafe(`drop role if exists anon`);
    await admin.end({ timeout: 1 });
  });

  describe("빈 DB (#4)", () => {
    it("빈 DB 를 열면 빈 저장소이고 아무것도 써 넣지 않는다", async () => {
      const { url, sql } = await freshDb();
      const db = await openApp(url);
      expect(await db.readStores()).toEqual([]);
      expect(await db.readPosts()).toEqual([]);
      expect(await db.readPublicLists()).toEqual([]);
      const [{ n }] = await sql`select count(*)::int as n from stores`;
      expect(n).toBe(0);

      // 첫 쓰기는 그 한 줄만 넣는다
      const res = await db.addStore(input(), who("1"));
      expect(res.ok).toBe(true);
      const rows = await sql`select count(*)::int as n from stores`;
      expect(rows[0]).toEqual({ n: 1 });
      const [{ posts }] = await sql`select count(*)::int as posts from posts`;
      expect(posts).toBe(0);
    });
  });

  describe("저장 흐름 (#8)", () => {
    it("가게 등록 → 중복 막힘 → 길찾기 기록 → 글 · 댓글 · 추천 → 리스트 · 추천 이 DB 에 남고 다시 열어도 같다", async () => {
      const { url, sql } = await freshDb();
      const db = await openApp(url);

      const added = await db.addStore(input(), who("1"));
      expect(added.ok).toBe(true);
      const id = (added as { id: string }).id;
      const dup = await db.addStore(input({ name: "PG 시험 떡볶이 합정점" }), who("2"));
      expect(dup).toMatchObject({ ok: false, existing: id });
      expect((await db.readHistory(id)).map((h) => h.kind)).toEqual(["new"]);

      expect((await db.recordGo(id, "naver", who("1"))).ok).toBe(true);
      expect((await db.recordGo(id, "naver", who("1"))).ok).toBe(true); // 같은 사람 · 같은 날은 한 줄
      const [{ goes }] = await sql`select count(*)::int as goes from store_directions`;
      expect(goes).toBe(1);

      const post = await db.addPost({ cat: "free", title: "PG 글", body: "본문 '따옴표' \\ 백슬래시", storeId: id }, who("1"));
      expect(post.ok).toBe(true);
      const postId = (post as { id: string }).id;
      expect((await db.addComment(postId, "댓글", who("2"))).ok).toBe(true);

      // 동시에 다섯 명이 추천해도 잠금(pg_advisory_xact_lock) 덕에 정확히 5
      const likes = await Promise.all(["3", "4", "5", "6", "7"].map((n) => db.likePost(postId, who(n))));
      expect(likes.every((r) => r.ok)).toBe(true);

      const list = await db.createList({ title: "PG 리스트", visibility: "public", storeIds: [id] }, who("1"));
      expect(list.ok).toBe(true);
      const listId = (list as { id: string }).id;
      expect(await db.likeList(listId, who("2"))).toMatchObject({ ok: true, liked: true, likes: 1 });

      // 사진 하루 한도 줄(photo_uploads, 11-18): 자리를 잡으면 한 줄, 돌려주면 지워진다
      expect((await db.takePhotoSlot("pg-photo-1", who("1"))).ok).toBe(true);
      expect((await db.takePhotoSlot("pg-photo-2", who("1"))).ok).toBe(true);
      await db.releasePhotoSlot("pg-photo-2");
      const uploads = await sql`select id, device, ip from photo_uploads`;
      expect(uploads.map((r) => r.id)).toEqual(["pg-photo-1"]);
      expect(uploads[0].device).not.toContain("pg-device");

      // 새 연결로 다시 읽어도 같다 (DB 에 남았다)
      const reopened = await openApp(url);
      expect((await reopened.readStore(id))?.name).toBe("PG 시험 떡볶이");
      const read = await reopened.readPost(postId);
      expect(read?.post.body).toBe("본문 '따옴표' \\ 백슬래시");
      expect(read?.post.likes).toBe(5);
      expect(read?.comments.map((c) => c.text)).toEqual(["댓글"]);
      expect((await reopened.readList(listId))?.likes).toBe(1);
      const [{ n }] = await sql`select count(*)::int as n from post_likes where post_id = ${postId}`;
      expect(n).toBe(5);

      // 기기 · 접속 위치는 해시로만 남는다
      const [row] = await sql`select device, ip from store_logs where store_id = ${id}`;
      expect(row.device).not.toContain("pg-device");
      expect(row.ip).not.toContain("10.1.0.");
    });
  });

  describe("잠금 RLS (#8)", () => {
    it("public 의 모든 표에 RLS 가 켜져 있다", async () => {
      const { sql } = await freshDb();
      const off = await sql`
        select c.relname from pg_class c join pg_namespace s on s.oid = c.relnamespace
        where s.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity order by 1`;
      expect(off.map((r) => r.relname)).toEqual([]);
    });

    it("공개 키 역할(anon)은 표를 읽어도 0줄이고, 넣기는 거절된다 — Supabase 처럼 표 권한을 줘도", async () => {
      const { url, sql } = await freshDb();
      // 가게 · 글 · 리스트 · 길찾기 줄을 만든다
      const db = await openApp(url);
      const added = await db.addStore(input(), who("1"));
      expect(added.ok).toBe(true);
      const stores = await db.readStores();
      expect(stores).toHaveLength(1);
      await db.recordGo(stores[0].id, "kakao", who("1"));
      expect((await db.addPost({ cat: "free", title: "RLS 글", body: "본문" }, who("1"))).ok).toBe(true);

      // Supabase 의 anon 역할 흉내: 로그인 없는 역할 + 표 권한(Supabase 기본값처럼 모두 허용). 막는 것은 RLS 뿐이다
      const [{ exists }] = await admin`select exists(select 1 from pg_roles where rolname = 'anon') as exists`;
      if (!exists) {
        await admin.unsafe(`create role anon nologin`);
        createdAnon = true;
      }
      await sql.unsafe(`grant usage on schema public to anon; grant select, insert, update, delete on all tables in schema public to anon;`).simple();

      const tables = (await sql`select tablename from pg_tables where schemaname = 'public' order by 1`).map((r) => r.tablename as string);
      expect(tables).toContain("photo_uploads");
      expect(tables.length).toBeGreaterThanOrEqual(12);

      await sql.begin(async (tx) => {
        await tx.unsafe(`set local role anon`);
        for (const t of tables) {
          const [{ n }] = await tx.unsafe(`select count(*)::int as n from "${t}"`);
          expect(n, `${t} 를 anon 이 읽음`).toBe(0);
        }
        // 지우기 · 고치기도 보이는 줄이 없어 아무것도 바뀌지 않는다
        const del = await tx.unsafe(`delete from stores`);
        expect(del.count).toBe(0);
        await tx.unsafe(`reset role`);
      });

      // 넣기는 오류로 끝난다 (트랜잭션이 깨지므로 따로)
      await expect(
        sql.begin(async (tx) => {
          await tx.unsafe(`set local role anon`);
          await tx.unsafe(`insert into posts (id, at, who, cat, title, body, comments, likes, device, ip) values ('anon-post', now(), 'x', 'free', 't', 'b', 0, 0, 'd', 'i')`);
        }),
      ).rejects.toThrow(/row-level security/);

      // 표 주인(앱)은 그대로 읽는다
      const [{ n }] = await sql`select count(*)::int as n from stores`;
      expect(n).toBe(stores.length);
      await sql.unsafe(`revoke all on all tables in schema public from anon; revoke usage on schema public from anon;`).simple();
    });
  });
});
