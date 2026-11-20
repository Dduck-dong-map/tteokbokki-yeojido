import Link from "next/link";
import { Suspense } from "react";
import { CELL_MAIN, CELL_WRAP, Empty, LINK, Locked, PageHeader, TableFrame } from "@/components/admin/bits";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminAccess } from "@/lib/admin/access";
import { adminReadLogs } from "@/lib/data/admin";
import { cn } from "@/lib/utils";

export const metadata = { title: "운영 기록" };

const KIND_TEXT: Record<string, string> = { new: "등록", edit: "수정", still: "확인", hidden: "숨김", closed: "폐업", verified: "확인 완료" };

// M-AD-08 운영 기록: 누가 언제 어느 가게를 어떻게 바꿨는지 (REQ-AD-12). 11-15 부터 실제 DB 의 가게 이력(store_logs)을 보여 준다.
// 이용자의 등록·수정·「아직 있어요」와 운영자의 수정·숨김이 한 줄로 쌓인다. 이 화면에서는 지울 수 없다.
// ?store=<가게 id> 를 붙이면 그 가게 기록만 본다 (adminReadLogs 의 storeId).
export default function LogsPage({ searchParams }: PageProps<"/admin/logs">) {
  return (
    <>
      <PageHeader id="M-AD-08" title="운영 기록" desc="가게 등록·수정·확인·숨김·폐업이 모두 남아요. 최근 300건을 보여 줘요." />
      <Suspense
        fallback={
          <TableFrame>
            <Empty desc="기록을 불러오는 중…" />
          </TableFrame>
        }
      >
        <Logs searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Logs({ searchParams }: Pick<PageProps<"/admin/logs">, "searchParams">) {
  const access = await adminAccess();
  if (!access.ok) return <Locked why={access.why} />;
  const store = (await searchParams).store;
  const storeId = typeof store === "string" && store ? store : undefined;
  const logs = await adminReadLogs({ storeId, limit: 300 });
  // 기록 0건: 빈 표 대신 안내 (F023)
  if (!logs.length)
    return (
      <TableFrame>
        <Empty title="아직 남은 기록이 없어요" desc={storeId ? "이 가게는 아직 등록·수정·확인 기록이 없어요." : "가게를 등록하거나 고치면 여기에 한 줄씩 쌓여요."} />
      </TableFrame>
    );
  return (
    <TableFrame
      compact
      toolbar={
        <>
          <span className="font-medium text-foreground">최근 {logs.length}건</span>
          <div className="flex-1" />
          <span className="text-caption text-muted-foreground">기기·접속 위치는 해시로만 남고 여기에도 안 보여요</span>
        </>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">언제</TableHead>
            <TableHead className="w-36">누가</TableHead>
            <TableHead className="w-20">무엇을</TableHead>
            <TableHead>가게</TableHead>
            <TableHead>바뀐 것</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="font-mono text-muted-foreground">
                {new Date(l.at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </TableCell>
              <TableCell>{l.who}</TableCell>
              <TableCell className={CELL_MAIN}>{KIND_TEXT[l.kind] ?? l.kind}</TableCell>
              <TableCell>
                <Link href={`/admin/stores/${l.storeId}`} className={LINK}>
                  {l.storeName}
                </Link>
              </TableCell>
              <TableCell className={cn(CELL_WRAP, "text-muted-foreground")}>
                {l.changes?.length
                  ? l.changes.map((c, i) => (
                      <div key={i}>
                        <b>{c.field}</b> {c.from} → {c.to}
                      </div>
                    ))
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableFrame>
  );
}
