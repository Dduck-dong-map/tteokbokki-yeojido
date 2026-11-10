import postgres from "postgres";
import type { Db } from "./db";

// 로컬 DB (도커 Postgres + PostGIS, 11-08) 저장 칸. .env.local 에 DATABASE_URL 이 있으면 db.ts 가 파일 대신 이것을 쓴다.
// 규칙(누가 무엇을 할 수 있나)은 전부 db.ts 에 그대로 두고, 여기서는 「읽기 · 바뀐 줄만 쓰기」만 한다.
//  - 읽기: 표 전부를 db.ts 의 Db 모양으로 읽는다 (지금 규모 = 가게 수백 곳이라 충분하다)
//  - 쓰기: 한 번에 하나씩(pg_advisory_xact_lock) 읽고 → db.ts 규칙대로 고치고 → 바뀐 줄만 넣기·고치기·지우기
// 표 = db/init/001_schema.sql. 이름은 앱 값 이름의 snake_case.

type Col = "text" | "int" | "num" | "bool" | "date" | "ts" | "json";
type Spec = { table: string; key: string[]; cols: Record<string, Col> };

const MARK = { device: "text", ip: "text" } as const;

// 순서 = 넣는 순서 (부모 표 먼저). 지우기는 거꾸로.
const SPECS: [keyof Db, Spec][] = [
  ["stores", { table: "stores", key: ["id"], cols: {
    id: "text", name: "text", grade: "text", lat: "num", lng: "num", address: "text", gu: "text", dong: "text",
    rice: "json", style: "text", spice: "int", spiceLabel: "text", taste: "json", sides: "json", shopType: "text", usage: "json",
    price: "int", priceCheckedAt: "date", menu: "json", hours: "json", lastConfirmedAt: "date", rating: "json", isSample: "bool",
    status: "text", createdAt: "date", by: "text", verify: "json", spiceVotes: "json", photos: "json", memo: "text", introBy: "text", introAt: "date",
  } }],
  ["logs", { table: "store_logs", key: ["id"], cols: { id: "text", storeId: "text", at: "ts", who: "text", kind: "text", changes: "json", ...MARK } }],
  ["reviews", { table: "reviews", key: ["id"], cols: { id: "text", storeId: "text", at: "ts", who: "text", stars: "int", spice: "int", text: "text", hidden: "bool", flags: "json", ...MARK } }],
  ["votes", { table: "store_votes", key: ["storeId", "device", "ip", "at"], cols: { storeId: "text", ok: "bool", at: "ts", ...MARK } }],
  ["flags", { table: "store_flags", key: ["storeId", "device", "ip", "at"], cols: { storeId: "text", reason: "text", at: "ts", ...MARK } }],
  ["posts", { table: "posts", key: ["id"], cols: {
    id: "text", at: "ts", who: "text", cat: "text", title: "text", body: "text", storeId: "text", comments: "int", likes: "int", isSample: "bool", hidden: "bool", flags: "json", ...MARK,
  } }],
  ["comments", { table: "post_comments", key: ["id"], cols: { id: "text", postId: "text", at: "ts", who: "text", text: "text", hidden: "bool", flags: "json", ...MARK } }],
  ["postLikes", { table: "post_likes", key: ["postId", "device"], cols: { postId: "text", at: "ts", ...MARK } }],
  ["lists", { table: "place_lists", key: ["id"], cols: {
    id: "text", title: "text", desc: "text", storeIds: "json", who: "text", createdAt: "ts", updatedAt: "ts", visibility: "text", likes: "int", isSample: "bool", ...MARK,
  } }],
  ["likes", { table: "list_likes", key: ["listId", "device"], cols: { listId: "text", at: "ts", ...MARK } }],
];

const PG_TYPE: Record<Col, string> = { text: "text", int: "int", num: "float8", bool: "boolean", date: "date", ts: "timestamptz", json: "jsonb" };
const snake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const q = (s: string) => `"${s}"`;

// 날짜는 'YYYY-MM-DD', 시각은 toISOString 과 같은 모양으로 꺼낸다 (앱이 문자열로 비교·정렬한다)
const readExpr = (k: string, t: Col) =>
  t === "date" ? `${q(snake(k))}::text` : t === "ts" ? `to_char(${q(snake(k))} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')` : q(snake(k));
const selectSql = (sp: Spec) => `select ${Object.entries(sp.cols).map(([k, t]) => `${readExpr(k, t)} as ${q(k)}`).join(", ")} from ${q(sp.table)}`;
// jsonb 칸은 값을 그대로 넘긴다 (라이브러리가 JSON 으로 바꾼다. 여기서 또 바꾸면 글자로 두 번 싸여 들어간다)
const param = (v: unknown, t: Col) => (v === undefined || v === null ? null : t === "json" ? (v as object) : v);

type Row = Record<string, unknown>;
type Client = postgres.Sql;

// 빈 칸(null)은 앱에서처럼 아예 없는 값으로
const clean = (r: Row) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== null));

// 표 10개를 한 번에 (DB 와 한 번만 오간다, 11-09). Supabase 처럼 DB 가 멀리 있으면 표마다 따로 읽을 때 화면이 그만큼 느려진다.
// 각 표를 JSON 배열로 묶어 { stores: [...], logs: [...] } 하나로 받는다. 칸 이름·날짜 모양은 selectSql 그대로.
const READ_ALL_SQL = `select json_build_object(${SPECS.map(
  ([k, sp]) => `'${k}', (select coalesce(json_agg(t), '[]'::json) from (${selectSql(sp)}) t)`,
).join(", ")}) as db`;

async function readAll(sql: Client): Promise<Db | null> {
  const [{ db }] = (await sql.unsafe(READ_ALL_SQL)) as unknown as [{ db: Record<string, Row[]> }];
  const out = Object.fromEntries(SPECS.map(([k]) => [k, (db[k] ?? []).map(clean)])) as Record<string, Row[]>;
  return out.stores.length ? (out as unknown as Db) : null;
}

const keyOf = (sp: Spec, r: Row) => sp.key.map((k) => String(r[k])).join("\u0001");
const sig = (sp: Spec, r: Row) => JSON.stringify(Object.keys(sp.cols).map((k) => r[k] ?? null));

async function saveDiff(tx: Client, before: Db, after: Db) {
  const plan = SPECS.map(([k, sp]) => {
    const b = new Map((before[k] as unknown as Row[]).map((r) => [keyOf(sp, r), r]));
    const a = new Map((after[k] as unknown as Row[]).map((r) => [keyOf(sp, r), r]));
    const idKey = sp.key.length === 1;
    const del: Row[] = [], ins: Row[] = [], upd: Row[] = [];
    for (const [key, r] of b) if (!a.has(key)) del.push(r);
    for (const [key, r] of a) {
      const old = b.get(key);
      if (!old) ins.push(r);
      else if (sig(sp, old) !== sig(sp, r)) {
        if (idKey) upd.push(r);
        else {
          // 여러 칸이 열쇠인 표는 고치지 않고 지우고 새로 넣는다
          del.push(old);
          ins.push(r);
        }
      }
    }
    return { sp, del, ins, upd };
  });

  // 지우기는 자식 표부터
  for (const { sp, del } of [...plan].reverse())
    for (const r of del)
      await tx.unsafe(`delete from ${q(sp.table)} where ${sp.key.map((k, i) => `${q(snake(k))} = $${i + 1}::${PG_TYPE[sp.cols[k]]}`).join(" and ")}`, sp.key.map((k) => param(r[k], sp.cols[k])) as never[]);

  // 넣기·고치기는 부모 표부터
  for (const { sp, ins, upd } of plan) {
    const cols = Object.entries(sp.cols);
    for (const r of ins)
      await tx.unsafe(
        `insert into ${q(sp.table)} (${cols.map(([k]) => q(snake(k))).join(", ")}) values (${cols.map(([, t], i) => `$${i + 1}::${PG_TYPE[t]}`).join(", ")})`,
        cols.map(([k, t]) => param(r[k], t)) as never[],
      );
    const rest = cols.filter(([k]) => k !== "id");
    for (const r of upd)
      await tx.unsafe(
        `update ${q(sp.table)} set ${rest.map(([k, t], i) => `${q(snake(k))} = $${i + 1}::${PG_TYPE[t]}`).join(", ")} where "id" = $${rest.length + 1}::text`,
        [...rest.map(([k, t]) => param(r[k], t)), r.id] as never[],
      );
  }
}

const EMPTY = (): Db => Object.fromEntries(SPECS.map(([k]) => [k, []])) as unknown as Db;

// 개발 서버는 모듈을 다시 불러오므로 연결은 전역에 하나만
// 이 컴퓨터 DB(도커)가 아니면 = Supabase 같은 바깥 DB 로 보고 암호화 연결(ssl)을 쓴다.
// Supabase 「Transaction pooler」 주소(포트 6543)는 미리 준비한 질의(prepared statement)를 못 쓰므로 끈다.
// Vercel 처럼 서버가 잠깐 떴다 사라지는 곳에서는 서버 하나에 연결 하나(Supabase 권장)만 쓰고, 쉬는 연결을 빨리 돌려준다.
const g = globalThis as unknown as { __ddyPg?: Client };
function client(): Client {
  if (!g.__ddyPg) {
    const url = process.env.DATABASE_URL!;
    let host = "", port = "";
    try {
      ({ hostname: host, port } = new URL(url));
    } catch {
      // 주소 모양을 못 읽으면 바깥 DB 로 본다 (연결 자체는 postgres 라이브러리가 판단)
    }
    const local = host === "127.0.0.1" || host === "localhost" || host === "db";
    g.__ddyPg = postgres(url, {
      max: Number(process.env.DATABASE_POOL ?? (local ? 5 : 1)),
      onnotice: () => undefined,
      ssl: local ? false : "require",
      prepare: port !== "6543",
      idle_timeout: local ? undefined : 20,
    });
  }
  return g.__ddyPg;
}

const LOCK = 724242; // 쓰기는 한 번에 하나씩 (서버가 여러 개여도)

// prepare: DB 가 비어 있으면(null) 예시 데이터를 만들어 주고, 아니면 빠진 칸만 채운다 (db.ts withCommunity · seed)
export async function pgMutate<T>(prepare: (raw: Db | null) => Db, fn: (db: Db) => T | Promise<T>): Promise<T> {
  const out = await client().begin(async (tx) => {
    await tx.unsafe(`select pg_advisory_xact_lock(${LOCK})`);
    const raw = await readAll(tx as unknown as Client);
    const before = raw ? structuredClone(raw) : EMPTY();
    const db = prepare(raw);
    const result = await fn(db);
    await saveDiff(tx as unknown as Client, before, db);
    return { result };
  });
  return out.result as T;
}

export async function pgRead(prepare: (raw: Db | null) => Db): Promise<Db> {
  const raw = await readAll(client());
  if (raw) return prepare(raw);
  // 처음 켠 빈 DB: 예시 가게·글·리스트를 바로 넣어 둔다 (팀원이 표를 열어 볼 수 있게)
  return pgMutate(prepare, (db) => db);
}
