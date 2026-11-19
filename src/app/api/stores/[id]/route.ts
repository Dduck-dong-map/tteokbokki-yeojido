import { confirmStill, editStore, flagReview, flagStore, recordGo, reviewStore, verifyStore } from "@/lib/data/db";
import { PHOTO_ID, bad, readJson, reply, whoFrom } from "@/lib/request";
import { FLAG_REASONS, checkPatch, checkReview, type FlagReason, type StorePatch } from "@/lib/wiki";

// 가게 하나에 하는 일: 정보 고치기 · 아직 있어요 · 맞아요/달라요 · 평가 · 신고.
// 「아직 있어요」의 거리 확인은 기기 안에서 한다 (위치를 서버로 보내지 않는다).
export async function POST(req: Request, ctx: RouteContext<"/api/stores/[id]">) {
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (body instanceof Response) return body; // 다른 출처 · JSON 아님 · 너무 큼 · 읽지 못함 (lib/request.ts)
  const who = whoFrom(req, body.nick);
  if (who instanceof Response) return who; // 기기 표시(x-ddy-device)가 없는 쓰기는 받지 않는다


  switch (body.action) {
    case "edit": {
      const patch = (body.patch ?? {}) as StorePatch;
      const error = checkPatch(patch);
      if (error) return bad(error, 422);
      if (patch.addPhotos?.some((p) => !PHOTO_ID.test(p))) return bad("사진을 다시 올려 주세요", 422);
      return reply(await editStore(id, patch, who));
    }
    case "still":
      return reply(await confirmStill(id, who));
    case "verify":
      return reply(await verifyStore(id, body.ok === true, who));
    case "review": {
      const input = { stars: body.stars as number | undefined, text: typeof body.text === "string" ? body.text : undefined };
      const error = checkReview(input);
      if (error) return bad(error, 422);
      return reply(await reviewStore(id, { stars: input.stars!, text: input.text }, who));
    }
    case "flag": {
      const reason = body.reason as FlagReason;
      if (!(reason in FLAG_REASONS)) return bad("신고 이유를 골라 주세요", 422);
      return reply(await flagStore(id, reason, who));
    }
    // 길찾기 누름 기록 (W1-4, KPI-W01)
    case "go":
      return reply(await recordGo(id, body.app === "kakao" ? "kakao" : "naver", who));
    case "flag-review":
      if (typeof body.reviewId !== "string") return bad("어느 후기인지 알려 주세요", 422);
      return reply(await flagReview(body.reviewId, who));
    default:
      return bad("할 수 없는 요청이에요");
  }
}
