import Link from "next/link";
import { PageHeader, ProtoNote } from "@/components/admin/bits";
import { Icon } from "@/components/admin/Icon";
import { ADMIN_FLAGS, ADMIN_REPORTS, AUDIT_LOG, SAMPLE_NOW, ageText } from "@/lib/admin/sample";
import { REGIONS, SAMPLE_STORES } from "@/lib/data/sample-stores";
import { freshness } from "@/lib/freshness";

export const metadata = { title: "오늘 할 일" };

// M-AD-01 홈 · 오늘 할 일: 하루 20분 안에 끝낼 일을 한 화면에 (REQ-AD-15)
export default function AdminHome() {
  const now = new Date(SAMPLE_NOW);
  const pending = ADMIN_REPORTS.filter((r) => r.status === "pending");
  const agree = ADMIN_REPORTS.filter((r) => r.status === "agree");
  const flags = ADMIN_FLAGS.filter((f) => f.status === "open");
  const stale = SAMPLE_STORES.filter((s) => freshness(s, now) !== "fresh");
  const fresh = SAMPLE_STORES.filter((s) => freshness(s, now) === "fresh").length;
  const oldest = pending.reduce((a, r) => (r.at < a ? r.at : a), pending[0]?.at ?? SAMPLE_NOW);

  const todos = [
    { n: pending.length, label: "승인 대기 제보", sub: `가장 오래된 것 ${ageText(oldest)} · 같은 내용 3건 묶음 1개`, href: "/admin/reports" },
    { n: flags.length, label: "신고·요청", sub: "사장님 요청 1 · 사진 신고 1 · 자동 알림 1", href: "/admin/flags" },
    { n: stale.length, label: "확인이 필요한 가게", sub: "마지막 확인 180일 넘음 (365일 넘으면 자동으로 내려감)", href: "/admin/freshness" },
    { n: agree.length, label: "동의 대기 수정 (보기만)", sub: "가격·맵기는 다른 기기 2곳이 동의하면 자동 반영", href: "/admin/reports?tab=agree" },
  ];

  return (
    <>
      <PageHeader id="M-AD-01" title="오늘 할 일" desc="제보 승인 → 신고 처리 → 신선도 점검 순서로 하면 하루 20분 안에 끝나요.">
        <Link href="/admin/reports" className="btn btn--primary">
          <Icon name="inbox" /> 승인 시작
        </Link>
      </PageHeader>
      <ProtoNote />

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__label">승인 대기</div>
          <div className="stat__value">{pending.length}</div>
          <div className="stat__delta">가장 오래된 것 {ageText(oldest)}</div>
        </div>
        <div className="stat">
          <div className="stat__label">제보 처리 시간 (중앙값, 7일)</div>
          <div className="stat__value">9시간</div>
          <div className="stat__delta">목표 24시간 이내 · 예시 값</div>
        </div>
        <div className="stat">
          <div className="stat__label">정보 신선도</div>
          <div className="stat__value">{Math.round((fresh / SAMPLE_STORES.length) * 100)}%</div>
          <div className="stat__delta">확인 180일 이내 가게 · 목표 80%</div>
        </div>
        <div className="stat">
          <div className="stat__label">이번 주 승인 뒤 되돌림</div>
          <div className="stat__value">0건</div>
          <div className="stat__delta">가드레일 · 3% 넘으면 승인 기준 점검</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card__head">
            <h3 className="card__title">할 일</h3>
          </div>
          <div className="card__body">
            {todos.map((t) => (
              <Link key={t.label} href={t.href} className="todo">
                <span className="todo__count">{t.n}</span>
                <span className="todo__body">
                  <span className="u-strong">{t.label}</span>
                  <br />
                  <span className="u-caption">{t.sub}</span>
                </span>
                <Icon name="chevron-right" />
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <h3 className="card__title">지역 채우기</h3>
            <div className="card__actions">
              <span className="u-caption">한 지역 100곳을 채워야 다음 지역을 열어요</span>
            </div>
          </div>
          <div className="card__body">
            {REGIONS.map((r) => {
              const n = SAMPLE_STORES.filter((s) => s.gu === r.gu && freshness(s, now) !== "expired").length;
              return (
                <div key={r.gu} className="u-mb-4">
                  <div className="u-row">
                    <span className="u-strong">{r.name}</span>
                    <span className="u-spacer" />
                    <span className="u-caption">{n} / 100곳</span>
                  </div>
                  <div className="meter u-mt-2">
                    <span style={{ width: `${Math.min(100, n)}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="u-row u-caption">
              다음 지역: 중구 신당동(즉석떡볶이 골목) · 출시 전 목표 300곳
            </div>
          </div>
        </div>
      </div>

      <div className="card u-mt-4 card--flush">
        <div className="card__head">
          <h3 className="card__title">최근 운영 기록</h3>
          <div className="card__actions">
            <Link href="/admin/logs" className="btn btn--text">
              전체 보기
            </Link>
          </div>
        </div>
        <div className="card__body">
          <table className="table table--compact">
            <tbody>
              {AUDIT_LOG.slice(0, 5).map((a) => (
                <tr key={a.at + a.target}>
                  <td className="u-muted" style={{ width: 130 }}>{a.at.slice(5)}</td>
                  <td className="cell--primary">{a.action}</td>
                  <td>{a.target}</td>
                  <td className="u-muted">{a.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
