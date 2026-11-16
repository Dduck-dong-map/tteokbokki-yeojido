import Link from "next/link";
import { Suspense } from "react";
import { Locked, PageHeader } from "@/components/admin/bits";
import { adminAccess } from "@/lib/admin/access";
import { adminReadLogs } from "@/lib/data/admin";

export const metadata = { title: "운영 기록" };

const KIND_TEXT: Record<string, string> = { new: "등록", edit: "수정", still: "확인", hidden: "숨김", closed: "폐업", verified: "확인 완료" };

// M-AD-08 운영 기록: 누가 언제 어느 가게를 어떻게 바꿨는지 (REQ-AD-12). 11-15 부터 실제 DB 의 가게 이력(store_logs)을 보여 준다.
// 이용자의 등록·수정·「아직 있어요」와 운영자의 수정·숨김이 한 줄로 쌓인다. 이 화면에서는 지울 수 없다.
export default function LogsPage() {
  return (
    <>
      <PageHeader id="M-AD-08" title="운영 기록" desc="가게 등록·수정·확인·숨김·폐업이 모두 남아요. 최근 300건을 보여 줘요." />
      <Suspense fallback={<div className="table-wrap"><div className="empty"><div className="empty__desc">기록을 불러오는 중…</div></div></div>}>
        <Logs />
      </Suspense>
    </>
  );
}

async function Logs() {
  const access = await adminAccess();
  if (!access.ok) return <Locked why={access.why} />;
  const logs = await adminReadLogs({ limit: 300 });
  return (
    <div className="table-wrap">
      <div className="table-toolbar">
        <span className="u-strong">최근 {logs.length}건</span>
        <div className="table-toolbar__spacer" />
        <span className="u-caption">기기·접속 위치는 해시로만 남고 여기에도 안 보여요</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="table table--compact">
          <thead><tr><th style={{ width: 130 }}>언제</th><th style={{ width: 140 }}>누가</th><th style={{ width: 70 }}>무엇을</th><th>가게</th><th>바뀐 것</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="u-muted u-mono">{new Date(l.at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                <td>{l.who}</td>
                <td className="cell--primary">{KIND_TEXT[l.kind] ?? l.kind}</td>
                <td><Link href={`/admin/stores/${l.storeId}`}>{l.storeName}</Link></td>
                <td className="u-muted">
                  {l.changes?.length ? l.changes.map((c, i) => <div key={i}><b>{c.field}</b> {c.from} → {c.to}</div>) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
