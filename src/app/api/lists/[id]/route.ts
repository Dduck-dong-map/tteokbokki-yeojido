import { deleteList, editListStores, likeList, updateList } from "@/lib/data/db";
import { checkListInfo, type ListVisibility } from "@/lib/community";
import { bad, readJson, reply, whoFrom } from "@/lib/request";

// 맛집 리스트 하나에 하는 일: 이름·설명·공개 범위 고치기 · 가게 넣기/빼기/순서 · 지우기 (만든 기기만) · 추천 (누구나)
export async function POST(req: Request, ctx: RouteContext<"/api/lists/[id]">) {
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (body instanceof Response) return body; // 다른 출처 · JSON 아님 · 너무 큼 · 읽지 못함 (lib/request.ts)
  const who = whoFrom(req, body.nick);
  if (who instanceof Response) return who; // 기기 표시(x-ddy-device)가 없는 쓰기는 받지 않는다
  const storeId = typeof body.storeId === "string" ? body.storeId : "";

  switch (body.action) {
    case "update": {
      const error = checkListInfo(body, true);
      if (error) return bad(error, 422);
      return reply(
        await updateList(
          id,
          {
            title: typeof body.title === "string" ? body.title : undefined,
            desc: typeof body.desc === "string" ? body.desc : undefined,
            visibility: body.visibility as ListVisibility | undefined,
          },
          who,
        ),
      );
    }
    case "add":
    case "remove":
      if (!storeId) return bad("가게를 골라 주세요", 422);
      return reply(await editListStores(id, { kind: body.action, storeId }, who));
    case "move":
      if (!storeId || (body.dir !== 1 && body.dir !== -1)) return bad("옮길 곳을 알려 주세요", 422);
      return reply(await editListStores(id, { kind: "move", storeId, dir: body.dir }, who));
    case "delete":
      return reply(await deleteList(id, who));
    case "like":
      return reply(await likeList(id, who));
    default:
      return bad("할 수 없는 요청이에요");
  }
}
