import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PHOTO_DIR, hash } from "@/lib/data/db";
import { bad, whoFrom } from "@/lib/request";

// 사진 받기. 화면에서 줄이고 JPEG 로 다시 만들어 보낸다(찍은 위치 같은 정보가 함께 지워진다).
const MAX_BYTES = 3 * 1024 * 1024;
const DAILY_PHOTOS = 30;

const g = globalThis as unknown as { __ddyPhotoCount?: Map<string, { day: string; n: number }> };
const counts = (g.__ddyPhotoCount ??= new Map());

export async function POST(req: Request) {
  const who = whoFrom(req, "");
  const key = hash(who.ip);
  const day = new Date().toISOString().slice(0, 10);
  const c = counts.get(key);
  if (c?.day === day && c.n >= DAILY_PHOTOS) return bad("오늘은 사진을 많이 올리셨어요. 내일 다시 부탁드려요", 429);

  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return bad("사진이 비어 있어요");
  if (buf.length > MAX_BYTES) return bad("사진이 너무 커요", 413);
  if (buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) return bad("사진 파일만 올릴 수 있어요", 415);

  const id = randomUUID();
  await mkdir(PHOTO_DIR, { recursive: true });
  await writeFile(path.join(PHOTO_DIR, `${id}.jpg`), buf);
  counts.set(key, { day, n: c?.day === day ? c.n + 1 : 1 });
  return Response.json({ ok: true, id }, { status: 201 });
}
