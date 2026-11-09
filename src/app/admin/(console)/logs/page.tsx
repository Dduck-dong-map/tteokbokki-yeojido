import { PageHeader, ProtoNote } from "@/components/admin/bits";
import { Icon } from "@/components/admin/Icon";
import { AUDIT_LOG, ROLE_LABEL } from "@/lib/admin/sample";

export const metadata = { title: "운영 기록" };

// M-AD-08 운영 기록: 누가 언제 무엇을 바꿨는지. 지울 수 없음 (REQ-AD-12)
export default function LogsPage() {
  return (
    <>
      <PageHeader id="M-AD-08" title="운영 기록" desc="승인·반려·수정·숨김·차단·권한 변경이 모두 남아요. 이 기록은 아무도 지울 수 없어요.">
        <button type="button" className="btn btn--default">
          <Icon name="download" /> 내려받기
        </button>
      </PageHeader>
      <ProtoNote />
      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="input-search">
            <Icon name="search" />
            <input className="input" placeholder="가게·제보 번호·사람 찾기" />
          </div>
          <select className="select" style={{ width: 140 }} aria-label="종류" defaultValue="">
            <option value="">모든 일</option>
            <option>제보 승인</option>
            <option>제보 반려</option>
            <option>가게 수정</option>
            <option>기기 차단</option>
            <option>권한 변경</option>
          </select>
          <div className="table-toolbar__spacer" />
          <span className="u-caption">최근 {AUDIT_LOG.length}건 (예시)</span>
        </div>
        <table className="table table--compact">
          <thead><tr><th style={{ width: 130 }}>언제</th><th>누가</th><th>무엇을</th><th>대상</th><th>내용</th></tr></thead>
          <tbody>
            {AUDIT_LOG.map((a) => (
              <tr key={a.at + a.target}>
                <td className="u-muted u-mono">{a.at.slice(2)}</td>
                <td>{a.actor} <span className="badge badge--outline">{a.actor === "시스템" ? "자동" : ROLE_LABEL[a.role]}</span></td>
                <td className="cell--primary">{a.action}</td>
                <td>{a.target}</td>
                <td className="u-muted">{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
