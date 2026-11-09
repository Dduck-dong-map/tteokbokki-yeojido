import type { Who } from "./data/db";
import type { Fail } from "./types";

// 쓰기 요청에서 「누가」를 읽는다. 로그인이 없으므로 기기 표시 + 접속 위치만 본다.
export function whoFrom(req: Request, nick: unknown): Who {
  const name = typeof nick === "string" ? nick.trim().slice(0, 16) : "";
  return {
    nick: name || "이름 없는 손님",
    device: req.headers.get("x-ddy-device")?.slice(0, 64) || "no-device",
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local",
  };
}

export const PHOTO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const bad = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

// db.ts 의 결과를 그대로 응답으로. 성공은 받은 그대로(id·집계 등 포함), 실패는 error(+existing) 와 상태 코드만 내보낸다.
// 다섯 라우트가 같은 모양을 쓰므로 한 곳에 둔다 (2026-11-09 리팩토링 때 통합)
export function reply<T extends { ok: true }>(res: T | Fail, okStatus = 200) {
  if (res.ok) return Response.json(res, { status: okStatus });
  return Response.json({ ok: false, error: res.error, ...(res.existing ? { existing: res.existing } : {}) }, { status: res.status });
}
