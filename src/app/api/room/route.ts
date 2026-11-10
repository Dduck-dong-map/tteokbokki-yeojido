import { addComment, addPost, deleteComment, deletePost, flagComment, flagPost, likePost } from "@/lib/data/db";
import { checkComment, checkPost, type BoardCat } from "@/lib/community";
import { bad, readJson, reply, whoFrom } from "@/lib/request";

// 떡볶이방(게시판): 글 쓰기 · 지우기 · 댓글 · 신고. 지우기는 이 기기에서 쓴 것만 된다.
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return bad("내용을 읽지 못했어요");
  const who = whoFrom(req, body.nick);
  const id = typeof body.id === "string" ? body.id : "";

  switch (body.action) {
    case "post": {
      const error = checkPost(body);
      if (error) return bad(error, 422);
      return reply(await addPost({ cat: body.cat as BoardCat, title: body.title as string, body: body.body as string, storeId: (body.storeId as string | undefined) || undefined }, who));
    }
    case "delete":
      return reply(await deletePost(id, who));
    case "comment": {
      const error = checkComment(body.text);
      if (error) return bad(error, 422);
      return reply(await addComment(id, body.text as string, who));
    }
    case "delete-comment":
      return reply(await deleteComment(id, who));
    case "like":
      return reply(await likePost(id, who));
    case "flag":
      return reply(await flagPost(id, who));
    case "flag-comment":
      return reply(await flagComment(id, who));
    default:
      return bad("할 수 없는 요청이에요");
  }
}
