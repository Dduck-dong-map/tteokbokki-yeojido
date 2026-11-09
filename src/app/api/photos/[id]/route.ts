import { readFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { PHOTO_DIR } from "@/lib/data/db";
import { PHOTO_ID } from "@/lib/request";

export async function GET(_req: Request, ctx: RouteContext<"/api/photos/[id]">) {
  await connection();
  const { id } = await ctx.params;
  if (!PHOTO_ID.test(id)) return new Response("없는 사진이에요", { status: 404 });
  try {
    const file = await readFile(path.join(PHOTO_DIR, `${id}.jpg`));
    return new Response(file, { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("없는 사진이에요", { status: 404 });
  }
}
