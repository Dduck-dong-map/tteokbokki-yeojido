import type { Who } from "./data/db";

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
