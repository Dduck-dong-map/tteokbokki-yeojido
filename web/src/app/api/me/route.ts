import { readOwned } from "@/lib/data/db";

// 이 기기가 만든 리스트 · 쓴 글 · 쓴 댓글 · 추천한 리스트. 로그인이 없어서 기기 표시(x-ddy-device)로만 찾는다.
export async function GET(req: Request) {
  const device = req.headers.get("x-ddy-device")?.slice(0, 64) || "no-device";
  return Response.json(await readOwned(device), { headers: { "cache-control": "no-store" } });
}
