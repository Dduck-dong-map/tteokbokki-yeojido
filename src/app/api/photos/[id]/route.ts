import { connection } from "next/server";
import { PHOTO_CACHE, readPhoto } from "@/lib/data/photos";

// 사진 보기. Supabase Storage(비공개 버킷)든 서버 폴더든 이 주소로 내려 준다 (lib/data/photos.ts)
export async function GET(_req: Request, ctx: RouteContext<"/api/photos/[id]">) {
  await connection();
  const { id } = await ctx.params;
  const photo = await readPhoto(id);
  if (!photo.ok) {
    if (photo.status === 502) return new Response("사진을 불러오지 못했어요. 잠시 뒤 다시 부탁드려요", { status: 502, headers: { "cache-control": "no-store" } });
    return new Response("없는 사진이에요", { status: 404 });
  }
  return new Response(photo.body, { headers: { "content-type": photo.contentType, "cache-control": PHOTO_CACHE } });
}
