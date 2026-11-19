import { createList } from "@/lib/data/db";
import { checkListInfo, type ListVisibility } from "@/lib/community";
import { bad, readJson, reply, whoFrom } from "@/lib/request";

// 맛집 리스트 새로 만들기 (내 맛지도). 처음부터 가게를 담아 만들 수도 있다 (가게 상세의 「리스트에 담기」).
export async function POST(req: Request) {
  const body = await readJson(req);
  if (body instanceof Response) return body; // 다른 출처 · JSON 아님 · 너무 큼 · 읽지 못함 (lib/request.ts)
  const who = whoFrom(req, body.nick);
  if (who instanceof Response) return who; // 기기 표시(x-ddy-device)가 없는 쓰기는 받지 않는다
  const error = checkListInfo(body);
  if (error) return bad(error, 422);
  const storeIds = Array.isArray(body.storeIds) ? body.storeIds.filter((s): s is string => typeof s === "string") : [];
  const res = await createList(
    { title: body.title as string, desc: typeof body.desc === "string" ? body.desc : undefined, visibility: (body.visibility as ListVisibility | undefined) ?? "public", storeIds },
    who,
  );
  return reply(res);
}
