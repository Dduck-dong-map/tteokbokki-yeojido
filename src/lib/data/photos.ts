import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { BlobNotFoundError, get, put } from "@vercel/blob";
import { PHOTO_ID } from "../request";
import { PHOTO_DIR, releasePhotoSlot, takePhotoSlot, type Who } from "./db";

// 사진 저장소: 사진을 어디에 두는지는 여기서만 정한다 (route 두 개는 이 파일만 부른다).
//  - Vercel Blob 비공개 저장소가 이어져 있으면(BLOB_STORE_ID 또는 BLOB_READ_WRITE_TOKEN) 거기에 넣고 서버가 받아 내려 준다.
//    DB 를 Neon 으로 옮기며(11-20) Supabase Storage 대신 쓴다. 임시 자리다 — 무료 한도(1GB · 월 올리기 2,000회)를 넘길 것 같으면 이 파일만 바꿔 옮긴다.
//  - 없으면 서버 폴더(PHOTO_DIR = .data/photos)에 둔다 → 로컬 개발 · E2E 파일 모드.
//  - Vercel 에서 설정이 없으면 올리기를 거절한다. /tmp 는 요청마다 사라질 수 있어 조용히 쓰면 사진이 없어진다.
// Vercel 에서는 저장소를 프로젝트에 이으면 BLOB_STORE_ID 가 들어오고 열쇠 없이(OIDC) 붙는다. Vercel 밖(이 컴퓨터)에서는
// `vercel env pull` 로 받거나 BLOB_READ_WRITE_TOKEN 을 넣는다. 이 값들은 서버에서만 읽는다(NEXT_PUBLIC_ 금지).
// 주소 /api/photos/[id] 와 사진 id(UUID) 는 그대로라 가게 데이터 · 화면 코드는 바뀌지 않는다.

// 사진은 id 마다 한 번만 쓰고 고치지 않으므로 오래 캐시해도 된다 (지금 보기 응답과 같은 값)
export const PHOTO_CACHE = "public, max-age=31536000, immutable";
const YEAR = 31_536_000;

// 요청 때마다 읽는다 (시험에서 환경 변수를 바꿔 가며 확인하려고). 빈 값은 없는 것으로 본다
const blobOn = () => !!(process.env.BLOB_STORE_ID?.trim() || process.env.BLOB_READ_WRITE_TOKEN?.trim());
const blobPath = (id: string) => `photos/${id}.jpg`;

export type PhotoStore = "storage" | "file" | "none";
// 지금 어디에 저장하는지 (시험 · 점검용)
export function photoStore(): PhotoStore {
  if (blobOn()) return "storage";
  return process.env.VERCEL ? "none" : "file";
}

export type SaveResult = { ok: true } | { ok: false; error: string; status: number };

// 검사를 마친 JPEG 를 id 로 저장한다
export async function savePhoto(id: string, buf: Buffer): Promise<SaveResult> {
  if (!PHOTO_ID.test(id)) return { ok: false, error: "사진 번호가 이상해요", status: 400 };
  if (blobOn()) {
    // 비공개로 넣는다. 같은 이름이 있으면 덮어쓰지 않는다(SDK 기본값 — 오류로 끝난다)
    try {
      await put(blobPath(id), buf, { access: "private", contentType: "image/jpeg", cacheControlMaxAge: YEAR, addRandomSuffix: false });
    } catch (e) {
      console.error("[photos] Blob 올리기 실패", e);
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

// 사진 하나 꺼내기. 없으면 404, Blob 이 응답하지 않으면 502
export async function readPhoto(id: string): Promise<ReadResult> {
  if (!PHOTO_ID.test(id)) return { ok: false, status: 404 };
  if (blobOn()) {
    // 비공개 저장소: 서버가 꺼내 내려 준다. 없는 사진은 null
    try {
      const res = await get(blobPath(id), { access: "private" });
      if (!res?.stream) return { ok: false, status: 404 };
      return { ok: true, body: res.stream, contentType: res.blob.contentType || "image/jpeg" };
    } catch (e) {
      if (e instanceof BlobNotFoundError) return { ok: false, status: 404 };
      console.error("[photos] Blob 읽기 실패", e);
      return { ok: false, status: 502 };
    }
  }
  try {
    const file = await readFile(path.join(PHOTO_DIR, `${id}.jpg`));
    return { ok: true, body: new Uint8Array(file), contentType: "image/jpeg" };
  } catch {
    return { ok: false, status: 404 };
  }
}
