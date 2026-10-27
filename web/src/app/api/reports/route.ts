import { checkReport, type ReportInput } from "@/lib/report";

// 제보 받기. 지금은 검사만 하고 저장하지 않는다.
// M2 에서 할 일: Supabase reports 표에 넣기(서버 전용 키) · 기기/IP 해시로 하루 10건 제한(DAILY_LIMIT)
//               · 같은 내용 3건이면 우선 검토 표시 (supabase/migrations 참고)
export async function POST(req: Request) {
  let body: ReportInput;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "내용을 읽지 못했어요" }, { status: 400 });
  }
  const input: ReportInput = {
    kind: body.kind,
    storeId: body.storeId,
    name: body.name?.trim(),
    address: body.address?.trim(),
    rice: Array.isArray(body.rice) ? body.rice : [],
    style: body.style,
    spice: body.spice,
    price: typeof body.price === "number" ? body.price : undefined,
  };
  const error = checkReport(input);
  if (error) return Response.json({ ok: false, error }, { status: 422 });
  return Response.json({ ok: true, stored: false }, { status: 202 });
}
