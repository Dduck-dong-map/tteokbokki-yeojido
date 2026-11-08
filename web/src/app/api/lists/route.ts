import { createList } from "@/lib/data/db";
import { checkListInfo, type ListVisibility } from "@/lib/community";
import { bad, readJson, whoFrom } from "@/lib/request";

// 맛집 리스트 새로 만들기 (내 맛지도). 처음부터 가게를 담아 만들 수도 있다 (가게 상세의 「리스트에 담기」).
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return bad("내용을 읽지 못했어요");
  const error = checkListInfo(body);
  if (error) return bad(error, 422);
  const storeIds = Array.isArray(body.storeIds) ? body.storeIds.filter((s): s is string => typeof s === "string") : [];
  const res = await createList(
    { title: body.title as string, desc: typeof body.desc === "string" ? body.desc : undefined, visibility: (body.visibility as ListVisibility | undefined) ?? "public", storeIds },
    whoFrom(req, body.nick),
  );
  return res.ok ? Response.json(res) : Response.json({ ok: false, error: res.error }, { status: res.status });
}
