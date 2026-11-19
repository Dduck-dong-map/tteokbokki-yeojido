import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PHOTO_ID } from "../request";
import { PHOTO_DIR, releasePhotoSlot, takePhotoSlot, type Who } from "./db";

// 사진 저장소: 사진을 어디에 두는지는 여기서만 정한다 (route 두 개는 이 파일만 부른다).
//  - Supabase Storage 설정(SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY)이 있으면 비공개 버킷에 넣고 서버가 받아 내려 준다.
//  - 없으면 지금처럼 서버 폴더(PHOTO_DIR = .data/photos)에 둔다 → 로컬 개발 · E2E 파일 모드.
//  - Vercel 에서 설정이 없으면 올리기를 거절한다. /tmp 는 요청마다 사라질 수 있어 조용히 쓰면 사진이 없어진다.
// service role 키는 RLS 를 건너뛰는 열쇠라 서버에서만 읽는다(NEXT_PUBLIC_ 금지). 이 파일은 node:fs 를 쓰는 db.ts 를 불러
// 브라우저 코드에서는 불러올 수 없다.
// 주소 /api/photos/[id] 와 사진 id(UUID) 는 그대로라 가게 데이터 · 화면 코드는 바뀌지 않는다.

const DEFAULT_BUCKET = "photos";
// 사진은 id 마다 한 번만 쓰고 고치지 않으므로 오래 캐시해도 된다 (지금 보기 응답과 같은 값)
export const PHOTO_CACHE = "public, max-age=31536000, immutable";

type StorageConfig = { url: string; key: string; bucket: string };

// 요청 때마다 읽는다 (시험에서 환경 변수를 바꿔 가며 확인하려고). 빈 값은 없는 것으로 본다
function storageConfig(): StorageConfig | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return { url, key, bucket: process.env.SUPABASE_PHOTO_BUCKET?.trim() || DEFAULT_BUCKET };
}

export type PhotoStore = "storage" | "file" | "none";
// 지금 어디에 저장하는지 (시험 · 점검용)
export function photoStore(): PhotoStore {
  if (storageConfig()) return "storage";
  return process.env.VERCEL ? "none" : "file";
}

// Supabase 공식 예시처럼 apikey 와 Authorization 을 함께 보낸다
const authHeaders = (c: StorageConfig) => ({ apikey: c.key, authorization: `Bearer ${c.key}` });
const objectPath = (c: StorageConfig, id: string) => `${encodeURIComponent(c.bucket)}/${id}.jpg`;

export type SaveResult = { ok: true } | { ok: false; error: string; status: number };

// 검사를 마친 JPEG 를 id 로 저장한다
export async function savePhoto(id: string, buf: Buffer): Promise<SaveResult> {
  if (!PHOTO_ID.test(id)) return { ok: false, error: "사진 번호가 이상해요", status: 400 };
  const c = storageConfig();
  if (c) {
    // POST /storage/v1/object/{bucket}/{path} — 같은 이름이 있으면 덮어쓰지 않는다(x-upsert: false → 400 이미 있음)
    const res = await fetch(`${c.url}/storage/v1/object/${objectPath(c, id)}`, {
      method: "POST",
      headers: {
        ...authHeaders(c),
        "content-type": "image/jpeg",
        "cache-control": "max-age=31536000",
        "x-upsert": "false",
      },
      body: new Uint8Array(buf),
    }).catch(() => null);
    if (!res?.ok) {
      console.error("[photos] Storage 올리기 실패", res?.status, await res?.text().catch(() => ""));
      return { ok: false, error: "사진을 올리지 못했어요. 잠시 뒤 다시 부탁드려요", status: 502 };
    }
    return { ok: true };
  }
  if (process.env.VERCEL) return { ok: false, error: "지금은 사진을 올릴 수 없어요. 사진 없이 먼저 올려 주세요", status: 503 };
  await mkdir(PHOTO_DIR, { recursive: true });
  await writeFile(path.join(PHOTO_DIR, `${id}.jpg`), buf);
  return { ok: true };
}

// 사진 한 장 올리기 = 하루 한도 자리 잡기 → 저장. route 는 이것만 부른다.
// 한도는 저장소(photo_uploads 표 · 파일 저장소의 photoUploads)에 줄로 남아 서버가 새로 떠도 이어서 센다 (규칙은 db.ts takePhotoSlot).
// 자리를 먼저 잡는 까닭: 동시에 여러 장을 올려도 한도를 넘지 않게. 저장에 실패하면 잡은 자리를 돌려준다.
export async function addPhoto(buf: Buffer, who: Who): Promise<{ ok: true; id: string } | { ok: false; error: string; status: number }> {
  const id = randomUUID();
  const slot = await takePhotoSlot(id, who);
  if (!slot.ok) return { ok: false, error: slot.error, status: slot.status };
  const saved = await savePhoto(id, buf).catch((e: unknown) => {
    console.error("[photos] 저장 실패", e);
    return { ok: false as const, error: "사진을 올리지 못했어요. 잠시 뒤 다시 부탁드려요", status: 500 };
  });
  if (!saved.ok) {
    await releasePhotoSlot(id);
    return saved;
  }
  return { ok: true, id };
}

export type ReadResult = { ok: true; body: BodyInit; contentType: string } | { ok: false; status: 404 | 502 };

// 사진 하나 꺼내기. 없으면 404, Storage 가 응답하지 않으면 502
export async function readPhoto(id: string): Promise<ReadResult> {
  if (!PHOTO_ID.test(id)) return { ok: false, status: 404 };
  const c = storageConfig();
  if (c) {
    // 비공개 버킷: GET /storage/v1/object/authenticated/{bucket}/{path}
    const res = await fetch(`${c.url}/storage/v1/object/authenticated/${objectPath(c, id)}`, {
      headers: authHeaders(c),
      cache: "no-store",
    }).catch(() => null);
    if (res?.ok && res.body) return { ok: true, body: res.body, contentType: res.headers.get("content-type") || "image/jpeg" };
    // Storage 는 없는 파일에 400(본문 statusCode "404") 또는 404 를 준다
    if (res && (res.status === 400 || res.status === 404)) return { ok: false, status: 404 };
    console.error("[photos] Storage 읽기 실패", res?.status);
    return { ok: false, status: 502 };
  }
  try {
    const file = await readFile(path.join(PHOTO_DIR, `${id}.jpg`));
    return { ok: true, body: new Uint8Array(file), contentType: "image/jpeg" };
  } catch {
    return { ok: false, status: 404 };
  }
}
