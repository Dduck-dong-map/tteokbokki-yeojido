import type { Who } from "./data/db";
import type { Fail } from "./types";

export const PHOTO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const bad = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

export const NO_DEVICE_MSG = "이 브라우저를 알아보는 표시가 함께 오지 않았어요. 화면을 새로 고친 뒤 다시 해 주세요";

// 쓰기 요청에서 「누가」를 읽는다. 로그인이 없으므로 기기 표시 + 접속 위치만 본다.
//  - 기기 표시(x-ddy-device, lib/me.ts 가 늘 붙인다)가 없는 쓰기는 거절한다 (11-18 결정). 예전처럼 「no-device」 한 사람으로 묶지 않는다.
//    돌려준 값이 Response 면 그대로 응답한다: const who = whoFrom(req, body.nick); if (who instanceof Response) return who;
//  - 접속 위치는 x-forwarded-for 의 첫 주소다. Vercel 은 이 헤더를 손님이 보낸 값과 상관없이 실제 접속 주소로 덮어쓴다
//    (Vercel 문서 Request headers 「we currently overwrite the X-Forwarded-For header … to prevent IP spoofing」) → 배포에서는 믿을 수 있다.
//    앞에 프록시가 없는 서버(pnpm dev · pnpm start 를 밖에 바로 열 때)는 손님이 이 헤더를 지어 보낼 수 있다 (E2E 가 그렇게 서로 다른 사람을 흉내 낸다).
export function whoFrom(req: Request, nick: unknown): Who | Response {
  const device = req.headers.get("x-ddy-device")?.trim().slice(0, 64);
  if (!device || device === "no-device") return bad(NO_DEVICE_MSG);
  const name = typeof nick === "string" ? nick.trim().slice(0, 16) : "";
  return {
    nick: name || "이름 없는 손님",
    device,
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local",
  };
}

// ───────── 쓰기 입구 검사 (기술 스택 9절 #7) ─────────
// 다른 사이트가 이용자 브라우저를 빌려 쓰기를 보내지 못하게 한다 (CSRF).
// Server Action 이 하는 것과 같은 방식이다: Origin 을 Host(또는 X-Forwarded-Host)와 비교 (번들 문서 02-guides/data-security.md).
// route handler 에는 이 검사가 저절로 없어서 여기서 한다.

// JSON 본문 한도. 가장 긴 입력은 글 본문 2000자(한글 3바이트 = 6KB) · 소개글 500자 · 메뉴 5개라 64KB 면 넉넉하다
export const MAX_JSON_BYTES = 64 * 1024;

const hostOf = (url: string | undefined) => {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};

// 같은 출처로 보는 주소: 이 요청이 들어온 주소(X-Forwarded-Host → Host → 요청 URL) + 배포 주소(NEXT_PUBLIC_SITE_URL).
// 로컬(127.0.0.1:3000 · localhost:3101 등)은 브라우저가 연 주소가 그대로 Origin 과 Host 가 되므로 따로 적지 않아도 맞는다.
function allowedHosts(req: Request) {
  const hosts = new Set<string>();
  const forwarded = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwarded) hosts.add(forwarded);
  const host = req.headers.get("host");
  if (host) hosts.add(host);
  const own = hostOf(req.url);
  if (own) hosts.add(own);
  const site = hostOf(process.env.NEXT_PUBLIC_SITE_URL);
  if (site) hosts.add(site);
  return hosts;
}

// 다른 출처면 거절 응답, 괜찮으면 null.
//  - Origin 이 있으면: 그 host 가 allowedHosts 안에 있어야 한다 ("null" Origin 도 거절)
//  - Origin 이 없으면 Sec-Fetch-Site 를 본다: same-origin 만 통과
//  - 둘 다 없으면 브라우저가 아닌 요청(curl · 서버 · 시험)이다 → 통과. 브라우저는 POST 에 늘 Origin 을 붙이고,
//    브라우저가 아니면 어차피 헤더를 마음대로 만들 수 있어 막는 의미가 없다 (도배는 하루 한도가 막는다)
export function checkOrigin(req: Request): Response | null {
  const origin = req.headers.get("origin");
  if (origin) {
    const host = origin === "null" ? null : hostOf(origin);
    return host && allowedHosts(req).has(host) ? null : bad("이 사이트에서 보낸 요청이 아니에요", 403);
  }
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return bad("이 사이트에서 보낸 요청이 아니에요", 403);
  return null;
}

// 본문을 한도까지만 읽는다. Content-Length 가 없거나 거짓이어도 읽으면서 센다
async function readCapped(req: Request, max: number): Promise<string | null> {
  const declared = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > max) return null;
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export type JsonBody = Record<string, unknown>;

// 쓰기 route handler 공통 입구. 통과하면 본문(객체), 아니면 그대로 돌려줄 거절 응답.
//   다른 출처 403 · JSON 이 아님 415 · 본문이 너무 큼 413 · 읽지 못함 400
// 쓰는 쪽: const body = await readJson(req); if (body instanceof Response) return body;
export async function readJson(req: Request): Promise<JsonBody | Response> {
  const blocked = checkOrigin(req);
  if (blocked) return blocked;
  // text/plain · form 은 브라우저가 사전 확인(preflight) 없이 다른 사이트에서도 보낼 수 있어 받지 않는다
  const type = req.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (type !== "application/json") return bad("보내는 모양이 맞지 않아요", 415);
  let text: string | null;
  try {
    text = await readCapped(req, MAX_JSON_BYTES);
  } catch {
    return bad("내용을 읽지 못했어요");
  }
  if (text === null) return bad("내용이 너무 길어요", 413);
  try {
    const body: unknown = JSON.parse(text);
    return body && typeof body === "object" && !Array.isArray(body) ? (body as JsonBody) : bad("내용을 읽지 못했어요");
  } catch {
    return bad("내용을 읽지 못했어요");
  }
}

// db.ts 의 결과를 그대로 응답으로. 성공은 받은 그대로(id·집계 등 포함), 실패는 error(+existing) 와 상태 코드만 내보낸다.
// 다섯 라우트가 같은 모양을 쓰므로 한 곳에 둔다 (2026-11-09 리팩토링 때 통합)
export function reply<T extends { ok: true }>(res: T | Fail, okStatus = 200) {
  if (res.ok) return Response.json(res, { status: okStatus });
  return Response.json({ ok: false, error: res.error, ...(res.existing ? { existing: res.existing } : {}) }, { status: res.status });
}
