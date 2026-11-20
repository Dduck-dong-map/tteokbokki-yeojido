import postgres from "postgres";
import type { Db } from "./db";

// Postgres 저장 칸 (11-08 · 11-20 부터 Neon, CI 의 Postgres). DATABASE_URL 이 있으면 db.ts 가 파일 대신 이것을 쓴다.
// 규칙(누가 무엇을 할 수 있나)은 전부 db.ts 에 그대로 두고, 여기서는 「읽기 · 바뀐 줄만 쓰기」만 한다.
//  - 읽기: 표를 db.ts 의 Db 모양으로 읽는다. 가게 · 글 · 리스트처럼 서비스 크기만큼만 있는 표는 전부,
//    누를 때마다 쌓이는 기록 표(변경 이력 · 길찾기 누름 · 사진 올림)는 규칙에 필요한 최근 것만 읽는다 (Spec.window, 11-19).
//    오래된 이력까지 필요한 화면은 pgLogs 로 조건을 걸어 따로 읽는다
//  - 쓰기: 한 번에 하나씩(pg_advisory_xact_lock) 읽고 → db.ts 규칙대로 고치고 → 바뀐 줄만 넣기·고치기·지우기
// 표 = db/init/001_schema.sql. 이름은 앱 값 이름의 snake_case.

type Col = "text" | "int" | "num" | "bool" | "date" | "ts" | "json";
// window = 전체 읽기에 실을 줄의 조건(SQL). 없으면 표 전부. 쓰기(saveDiff)는 읽은 줄끼리만 견주므로 안 읽은 줄은 건드리지 않는다
type Spec = { table: string; key: string[]; cols: Record<string, Col>; window?: string };

const MARK = { device: "text", ip: "text" } as const;

// 순서 = 넣는 순서 (부모 표 먼저). 지우기는 거꾸로.
const SPECS: [keyof Db, Spec][] = [
  ["stores", { table: "stores", key: ["id"], cols: {
    id: "text", name: "text", grade: "text", lat: "num", lng: "num", address: "text", gu: "text", dong: "text",
    rice: "json", style: "text", spice: "int", spiceLabel: "text", taste: "json", sides: "json", shopType: "text", usage: "json",
    price: "int", priceCheckedAt: "date", menu: "json", hours: "json", lastConfirmedAt: "date", rating: "json",
    status: "text", createdAt: "date", by: "text", verify: "json", photos: "json", memo: "text", introBy: "text", introAt: "date",
  } }],
  // 규칙이 보는 이력: 하루 한도(24시간) · 오늘 「아직 있어요」 · 최근 등록 수(7일) → 8일 치.
  // 되살린 시각(db.ts restoredAt)은 언제 것이든 필요해서, 운영자가 상태를 바꾼 줄은 날짜와 상관없이 싣는다
  ["logs", { table: "store_logs", key: ["id"], cols: { id: "text", storeId: "text", at: "ts", who: "text", kind: "text", changes: "json", ...MARK },
    window: `"at" > now() - interval '8 days' or ("kind" = 'edit' and "changes" @> '[{"field":"상태"}]'::jsonb)` }],
  ["reviews", { table: "reviews", key: ["id"], cols: { id: "text", storeId: "text", at: "ts", who: "text", stars: "int", text: "text", hidden: "bool", flags: "json", ...MARK } }],
  ["votes", { table: "store_votes", key: ["storeId", "device", "ip"], cols: { storeId: "text", ok: "bool", at: "ts", ...MARK } }],
  ["flags", { table: "store_flags", key: ["storeId", "device", "ip"], cols: { storeId: "text", reason: "text", at: "ts", ...MARK } }],
  ["posts", { table: "posts", key: ["id"], cols: {
    id: "text", at: "ts", who: "text", cat: "text", title: "text", body: "text", storeId: "text", comments: "int", likes: "int", hidden: "bool", flags: "json", ...MARK,
  } }],
  ["comments", { table: "post_comments", key: ["id"], cols: { id: "text", postId: "text", at: "ts", who: "text", text: "text", hidden: "bool", flags: "json", ...MARK } }],
  ["postLikes", { table: "post_likes", key: ["postId", "device"], cols: { postId: "text", at: "ts", ...MARK } }],
  ["lists", { table: "place_lists", key: ["id"], cols: {
    id: "text", title: "text", desc: "text", storeIds: "json", who: "text", createdAt: "ts", updatedAt: "ts", visibility: "text", likes: "int", ...MARK,
  } }],
  ["likes", { table: "list_likes", key: ["listId", "device"], cols: { listId: "text", at: "ts", ...MARK } }],
  // 길찾기 누름 (W1-4, db/init/004_directions.sql)
  // 규칙이 보는 것은 「오늘(한국 시간) 이미 눌렀나」뿐 → 이틀 치
  ["goes", { table: "store_directions", key: ["id"], cols: { id: "text", storeId: "text", app: "text", at: "ts", ...MARK }, window: `"at" > now() - interval '2 days'` }],
  // 사진 하루 한도 (11-18, db/init/001_schema.sql photo_uploads)
  // 하루 한도(24시간)만 본다. db.ts 가 24시간 지난 줄을 목록에서 빼면 saveDiff 가 지운다 → 한 시간 여유를 둬 그 줄이 읽히게 한다
  ["photoUploads", { table: "photo_uploads", key: ["id"], cols: { id: "text", at: "ts", ...MARK }, window: `"at" > now() - interval '25 hours'` }],
  // 지운 글 · 댓글 · 리스트의 하루 한도 줄 (11-19, db/init/001_schema.sql deleted_writes)
  ["deletedWrites", { table: "deleted_writes", key: ["kind", "id"], cols: { kind: "text", id: "text", at: "ts", ...MARK } }],
];

const PG_TYPE: Record<Col, string> = { text: "text", int: "int", num: "float8", bool: "boolean", date: "date", ts: "timestamptz", json: "jsonb" };
const snake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const q = (s: string) => `"${s}"`;

// 날짜는 'YYYY-MM-DD', 시각은 toISOString 과 같은 모양으로 꺼낸다 (앱이 문자열로 비교·정렬한다)
const readExpr = (k: string, t: Col) =>
  t === "date" ? `${q(snake(k))}::text` : t === "ts" ? `to_char(${q(snake(k))} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')` : q(snake(k));
const columnsSql = (sp: Spec) => Object.entries(sp.cols).map(([k, t]) => `${readExpr(k, t)} as ${q(k)}`).join(", ");
const selectSql = (sp: Spec) => `select ${columnsSql(sp)} from ${q(sp.table)}${sp.window ? ` where ${sp.window}` : ""}`;
// jsonb 칸은 값을 그대로 넘긴다 (라이브러리가 JSON 으로 바꾼다. 여기서 또 바꾸면 글자로 두 번 싸여 들어간다)
const param = (v: unknown, t: Col) => (v === undefined || v === null ? null : t === "json" ? (v as object) : v);

type Row = Record<string, unknown>;
type Client = postgres.Sql;

// 빈 칸(null)은 앱에서처럼 아예 없는 값으로
const clean = (r: Row) => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== null));

// 표 13개를 한 번에 (DB 와 한 번만 오간다, 11-09). 기록 표는 window 조건에 맞는 줄만 실린다. Neon 처럼 DB 가 멀리 있으면 표마다 따로 읽을 때 화면이 그만큼 느려진다.
// 각 표를 JSON 배열로 묶어 { stores: [...], logs: [...] } 하나로 받는다. 칸 이름·날짜 모양은 selectSql 그대로.
const READ_ALL_SQL = `select json_build_object(${SPECS.map(
  ([k, sp]) => `'${k}', (select coalesce(json_agg(t), '[]'::json) from (${selectSql(sp)}) t)`,
).join(", ")}) as db`;

async function readAll(sql: Client): Promise<Db | null> {
  const [{ db }] = (await sql.unsafe(READ_ALL_SQL)) as unknown as [{ db: Record<string, Row[]> }];
  const out = Object.fromEntries(SPECS.map(([k]) => [k, (db[k] ?? []).map(clean)])) as Record<string, Row[]>;
  // 표가 모두 비었을 때만 「빈 DB」(null). 가게 표가 window 없이 전부 읽히므로 기록 표가 일부만 실려도 판정은 같다. 가게만 비고 글·기록이 있으면 그대로 읽는다 (예전엔 가게가 비면 빈 DB 로 봐서 다른 표를 못 읽었다)
  return SPECS.some(([k]) => out[k].length) ? (out as unknown as Db) : null;
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
// 이 컴퓨터의 Postgres(CI · 시험)가 아니면 = Neon 같은 바깥 DB 로 보고 암호화 연결(ssl)을 쓴다.
// 풀러(연결을 나눠 쓰는 중간 서버) 주소로 붙으면 미리 준비한 질의(prepared statement)를 끈다 — 연결이 요청마다 바뀔 수 있어서다.
// Vercel 처럼 서버가 잠깐 떴다 사라지는 곳에서는 서버 하나에 연결 하나만 쓰고, 쉬는 연결을 빨리 돌려준다.
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
    // 풀러 주소: Neon 은 호스트 이름에 -pooler 가 붙고(포트는 5432 그대로), Supabase Transaction pooler 는 포트 6543 이다
    const pooled = host.includes("-pooler") || port === "6543";
    g.__ddyPg = postgres(url, {
      // || 로 고른다: .env.example 을 복사하면 DATABASE_POOL= 처럼 빈 글자가 오는데, ?? 는 빈 글자를 그대로 받아 연결 0개가 되고 질의가 끝없이 줄만 선다 (11-20)
      max: Number(process.env.DATABASE_POOL) || (local ? 5 : 1),
      onnotice: () => undefined,
      ssl: local ? false : "require",
      prepare: !pooled,
      idle_timeout: local ? undefined : 20,
    });
  }
  return g.__ddyPg;
}

const LOCK = 724242; // 쓰기는 한 번에 하나씩 (서버가 여러 개여도)

// prepare: DB 가 비어 있으면(null) 빈 저장소를 만들어 주고, 아니면 빠진 칸만 채운다 (db.ts prepare)
export async function pgMutate<T>(prepare: (raw: Db | null) => Db, fn: (db: Db) => T | Promise<T>): Promise<T> {
  const out = await client().begin(async (tx) => {
    await tx.unsafe(`select pg_advisory_xact_lock(${LOCK})`);
    const raw = await readAll(tx as unknown as Client);
    const before = raw ? structuredClone(raw) : EMPTY();
    const db = prepare(raw);
    const result = await fn(db);
    await saveDiff(tx as unknown as Client, before, db);
    // 사진 올림 줄은 하루 한도에만 쓴다. window(25시간) 밖으로 나간 옛 줄은 위에서 못 보므로, 사진을 올린 쓰기에서 함께 치운다
    if (db.photoUploads.length !== before.photoUploads.length) await tx.unsafe(`delete from "photo_uploads" where "at" < now() - interval '25 hours'`);
    return { result };
  });
  return out.result as T;
}

// 변경 이력을 조건을 걸어 읽는다 (가게 하나만 · 최근 몇 줄). 전체 읽기의 window 밖 줄까지 나온다.
// store_logs_store_idx (store_id, at desc) 를 탄다
export async function pgLogs(opts: { storeId?: string; limit?: number } = {}): Promise<Row[]> {
  const sp = SPECS.find(([k]) => k === "logs")![1];
  const where = opts.storeId ? ` where "store_id" = $1::text` : "";
  const limit = opts.limit ? ` limit ${Math.max(1, Math.floor(opts.limit))}` : "";
  const rows = (await client().unsafe(`select ${columnsSql(sp)} from ${q(sp.table)}${where} order by "at" desc${limit}`, (opts.storeId ? [opts.storeId] : []) as never[])) as unknown as Row[];
  return rows.map(clean);
}

export async function pgRead(prepare: (raw: Db | null) => Db): Promise<Db> {
  // 처음 켠 빈 DB 에는 아무것도 쓰지 않고 빈 저장소를 돌려준다 — 실제 가게는 어드민 「후보 가져오기」로 넣는다 (db/README.md)
  return prepare(await readAll(client()));
}
