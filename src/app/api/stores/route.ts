import { addStore } from "@/lib/data/db";
import { PHOTO_ID, bad, readJson, reply, whoFrom } from "@/lib/request";
import { checkNewStore, type NewStoreInput } from "@/lib/wiki";

// 새 가게 등록: 사전 승인 없이 바로 지도에 올라가고, 일주일 동안 「확인 중」으로 보인다.
export async function POST(req: Request) {
  const body = await readJson(req);
  if (body instanceof Response) return body; // 다른 출처 · JSON 아님 · 너무 큼 · 읽지 못함 (lib/request.ts)
  const who = whoFrom(req, body.nick);
  if (who instanceof Response) return who; // 기기 표시(x-ddy-device)가 없는 쓰기는 받지 않는다
  const input = body as Partial<NewStoreInput>;
  const error = checkNewStore(input);
  if (error) return bad(error, 422);
  const photos = input.photos ?? []; // 사진이 선택일 때(MIN_PHOTOS 0)는 칸이 없을 수도 있다
  if (photos.some((p) => !PHOTO_ID.test(p))) return bad("사진을 다시 올려 주세요", 422);

  // 중복 가게면 existing(그 가게 id)이 함께 간다 → 화면이 「그 가게 보기」를 띄운다
  return reply(await addStore({ ...input, photos } as NewStoreInput, who), 201);
}
