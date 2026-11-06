import { addStore } from "@/lib/data/db";
import { PHOTO_ID, bad, readJson, whoFrom } from "@/lib/request";
import { checkNewStore, type NewStoreInput } from "@/lib/wiki";

// 새 가게 등록: 사전 승인 없이 바로 지도에 올라가고, 일주일 동안 「확인 중」으로 보인다.
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return bad("내용을 읽지 못했어요");
  const input = body as Partial<NewStoreInput>;
  const error = checkNewStore(input);
  if (error) return bad(error, 422);
  if (input.photos!.some((p) => !PHOTO_ID.test(p))) return bad("사진을 다시 올려 주세요", 422);

  const res = await addStore(input as NewStoreInput, whoFrom(req, body.nick));
  if (!res.ok) return Response.json({ ok: false, error: res.error, existing: res.existing }, { status: res.status });
  return Response.json(res, { status: 201 });
}
