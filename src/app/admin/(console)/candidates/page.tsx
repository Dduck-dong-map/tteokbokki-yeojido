import Link from "next/link";
import { Suspense } from "react";
import DatasetImport from "@/components/admin/DatasetImport";
import { Locked, PageHeader, ProtoNote } from "@/components/admin/bits";
import { Icon } from "@/components/admin/Icon";
import { adminAccess } from "@/lib/admin/access";
import { CANDIDATES } from "@/lib/admin/sample";
import { adminReadStores } from "@/lib/data/admin";
import { DATASETS } from "@/lib/data/datasets";
import { SAMPLE_STORES } from "@/lib/data/sample-stores";

export const metadata = { title: "후보 가져오기" };

const STATUS = {
  new: { label: "새 후보", cls: "badge--info" },
  assigned: { label: "확인 중", cls: "badge--warning" },
  confirmed: { label: "확인 끝 · 등록 대기", cls: "badge--success" },
  duplicate: { label: "이미 있음", cls: "" },
  skip: { label: "떡볶이 없음", cls: "badge--outline" },
} as const;

// M-AD-06 후보 가져오기 (M4, REQ-AD-14): 공공데이터 일반음식점 → 분식·떡볶이 후보 → 크루 확인 → 등록
export default function CandidatesPage() {
  return (
    <>
      <PageHeader id="M-AD-06" title="후보 가져오기" desc="리서치·공공데이터에서 모은 가게 후보를 확인해서 DB 에 넣어요. 이미 있는 가게는 덮어쓰지 않아요.">
        <button type="button" className="btn btn--primary" disabled>
          <Icon name="download" /> 공공데이터 파일 올리기
        </button>
      </PageHeader>
      <Suspense fallback={<div className="card u-mb-4"><div className="card__body u-muted">자료를 불러오는 중…</div></div>}>
        <Datasets />
      </Suspense>

      <h2 className="section__title u-mt-6 u-mb-2">다음 단계 · 공공데이터 후보 (M4)</h2>
      <ProtoNote>M4(첫 데이터 300곳)에서 여는 칸이에요. 아래는 흐름만 보여 주는 예시 후보예요. 위의 리서치 자료는 실제로 DB 에 들어가요.</ProtoNote>

      <div className="stat-grid u-mb-4">
        <div className="stat"><div className="stat__label">1. 고르기</div><div className="stat__value">업태 분식 · 이름에 떡볶이</div><div className="stat__delta">영업 중인 곳만</div></div>
        <div className="stat"><div className="stat__label">2. 겹침 찾기</div><div className="stat__value">이름 + 150m</div><div className="stat__delta">이미 있는 가게는 「이미 있음」</div></div>
        <div className="stat"><div className="stat__label">3. 크루 확인</div><div className="stat__value">전화·방문</div><div className="stat__delta">맛 태그를 채움</div></div>
        <div className="stat"><div className="stat__label">4. 등록</div><div className="stat__value">확인 끝만</div><div className="stat__delta">출처 = 공공데이터 + 크루</div></div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <span className="u-strong">후보 {CANDIDATES.length}곳 (예시)</span>
          <div className="table-toolbar__spacer" />
          <span className="u-caption">리뷰·사진은 포털에서 가져오지 않아요 (저작권·약관)</span>
        </div>
        <table className="table">
          <thead><tr><th>후보 이름</th><th>주소</th><th>업태</th><th>상태</th><th>담당</th><th style={{ width: 140 }} /></tr></thead>
          <tbody>
            {CANDIDATES.map((c) => {
              const match = SAMPLE_STORES.find((s) => s.id === c.match);
              return (
                <tr key={c.id}>
                  <td className="cell--primary">{c.name}</td>
                  <td>{c.address}</td>
                  <td>{c.kind}</td>
                  <td>
                    <span className={`badge ${STATUS[c.status].cls}`}>{STATUS[c.status].label}</span>
                    {match && <> <Link href={`/admin/stores/${match.id}`} className="u-caption">{match.name}</Link></>}
                  </td>
                  <td className="u-muted">{c.assignee ?? "—"}</td>
                  <td>
                    <div className="row-actions">
                      {c.status === "new" && <a href="#">크루에게 맡기기</a>}
                      {c.status === "confirmed" && <a href="#">등록</a>}
                      {c.status !== "skip" && c.status !== "duplicate" && <a href="#">빼기</a>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// 리서치 자료 묶음 (lib/data/datasets.ts) — 실제 DB 에 넣는 칸
async function Datasets() {
  const access = await adminAccess();
  if (!access.ok) return <Locked why={access.why} />;
  const ids = (await adminReadStores()).map((s) => s.id);
  return (
    <>
      {DATASETS.map((d) => (
        <DatasetImport key={d.id} dataset={d} inDb={ids.filter((id) => d.stores.some((r) => r.id === id))} />
      ))}
    </>
  );
}
