import { addPhoto } from "@/lib/data/photos";
import { bad, checkOrigin, whoFrom } from "@/lib/request";

// 사진 받기. 화면에서 줄이고 JPEG 로 다시 만들어 보낸다(찍은 위치 같은 정보가 함께 지워진다).
// 어디에 저장하는지(Vercel Blob · 서버 폴더)와 하루 한도(저장소의 photo_uploads 표)는 lib/data/photos.ts 가 정한다.
const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(req: Request) {
  // 다른 사이트에서 보낸 올리기는 받지 않는다 (lib/request.ts checkOrigin). 사진이라 JSON 검사는 하지 않고 크기는 아래 MAX_BYTES 그대로
  const blocked = checkOrigin(req);
  if (blocked) return blocked;
  const who = whoFrom(req, "");
  if (who instanceof Response) return who; // 기기 표시(x-ddy-device)가 없는 올리기는 받지 않는다

  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return bad("사진이 비어 있어요");
  if (buf.length > MAX_BYTES) return bad("사진이 너무 커요", 413);
  if (buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) return bad("사진 파일만 올릴 수 있어요", 415);

  // 하루 한도(한 사람 · 접속 위치)를 먼저 잡고 저장한다. 한도를 넘으면 429
  const saved = await addPhoto(buf, who);
  if (!saved.ok) return bad(saved.error, saved.status);
  return Response.json({ ok: true, id: saved.id }, { status: 201 });
}
