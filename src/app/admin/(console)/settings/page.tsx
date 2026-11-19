import AdminGate from "@/components/admin/AdminGate";
import { PageHeader, ProtoNote } from "@/components/admin/bits";
import { Icon, type IconName } from "@/components/admin/Icon";
import { ROLE_LABEL, RULES, STAFF } from "@/lib/admin/sample";

export const metadata = { title: "설정" };

const CARDS: { href: string; icon: IconName; color: string; title: string; desc: string }[] = [
  { href: "#staff", icon: "users", color: "blue", title: "운영자·권한", desc: "관리자 · 운영자 · 크루 초대와 역할" },
  { href: "#rules", icon: "tools", color: "cyan", title: "운영 규칙", desc: "제보 한도 · 동의 수 · 신선도 일수" },
  { href: "#blocks", icon: "shield", color: "green", title: "차단 기기", desc: "도배 기기 · 차단 기간" },
  { href: "#rules", icon: "map", color: "orange", title: "지역 열기", desc: "100곳 채운 지역만 공개 · M4" },
];

const HELP = ["운영 수칙 (하루 20분 순서)", "제보 처리 기준", "개인정보 다루는 법"];

// 역할별 권한 (REQ-AD-02)
const MATRIX: [string, boolean, boolean, boolean][] = [
  ["제보 승인·반려", true, true, false],
  ["가게 정보 수정", true, true, true],
  ["숨김·폐업 처리 · 되살리기", true, true, false],
  ["신선도 확인 (확인일 새로 고침)", true, true, true],
  ["신고·요청 처리", true, true, false],
  ["기기 차단", true, true, false],
  ["후보 가져오기 · 크루에게 맡기기", true, true, false],
  ["운영 기록 보기", true, true, false],
  ["운영자 초대 · 역할 바꾸기", true, false, false],
  ["운영 규칙 바꾸기", true, false, false],
];

// M-AD-09 설정 (REQ-AD-02, REQ-AD-08)
export default function SettingsPage() {
  return (
    <>
      <PageHeader id="M-AD-09" title="설정" desc="운영자·권한과 운영 규칙은 관리자만 바꿀 수 있어요." />
      <AdminGate>
        <ProtoNote />

        <section className="section">
          <h2 className="section__title">관리</h2>
          <div className="entry-grid entry-grid--4">
            {CARDS.map((c) => (
              <a key={c.title} href={c.href} className="entry-card">
                <span className={`entry-card__icon entry-card__icon--${c.color}`}><Icon name={c.icon} /></span>
                <span className="entry-card__body">
                  <span className="entry-card__title">{c.title}</span>
                  <span className="entry-card__desc">{c.desc}</span>
                </span>
                <span className="entry-card__arrow"><Icon name="arrow-right" /></span>
              </a>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section__title">도움말</h2>
          <div className="entry-grid entry-grid--3">
            {HELP.map((h) => (
              <a key={h} href="#rules" className="entry-card entry-card--help">
                <span className="entry-card__icon"><Icon name="book" /></span>
                <span className="entry-card__body"><span className="entry-card__title">{h}</span></span>
                <span className="entry-card__arrow"><Icon name="arrow-right" /></span>
              </a>
            ))}
          </div>
        </section>

        <section className="section" id="staff">
          <h2 className="section__title">운영자·권한</h2>
          <div className="table-wrap u-mb-4">
            <div className="table-toolbar">
              <span className="u-strong">운영하는 사람 {STAFF.length}명 (예시)</span>
              <div className="table-toolbar__spacer" />
              <button type="button" className="btn btn--default btn--sm"><Icon name="plus" /> 초대</button>
            </div>
            <table className="table">
              <thead><tr><th>이름</th><th>역할</th><th>로그인</th><th>2단계 인증</th><th>맡은 지역</th><th className="cell--num">최근 활동</th></tr></thead>
              <tbody>
                {STAFF.map((p) => (
                  <tr key={p.name}>
                    <td className="cell--primary">{p.name}</td>
                    <td><span className={`badge ${p.role === "owner" ? "badge--info" : ""}`}>{ROLE_LABEL[p.role]}</span></td>
                    <td className="u-muted">{p.email}</td>
                    <td>{p.twoFactor ? <span className="badge badge--success">켬</span> : <span className="badge badge--warning">끔 · 크루는 선택</span>}</td>
                    <td>{p.area ?? "전체"}</td>
                    <td className="cell--num u-muted">{p.lastSeen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-wrap">
            <div className="table-toolbar"><span className="u-strong">역할별로 할 수 있는 일</span></div>
            <table className="table table--compact">
              <thead><tr><th>할 일</th><th style={{ width: 90 }}>관리자</th><th style={{ width: 90 }}>운영자</th><th style={{ width: 90 }}>크루</th></tr></thead>
              <tbody>
                {MATRIX.map(([label, ...can]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    {can.map((c, i) => <td key={i}>{c ? <span className="dot dot--success" /> : <span className="u-muted">—</span>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section" id="rules">
          <h2 className="section__title">운영 규칙</h2>
          <div className="card">
            <div className="card__body">
              {RULES.map((r) => (
                <div key={r.key} className="form-row">
                  <label className="field__label">{r.label}</label>
                  <div>
                    <input className="input" style={{ maxWidth: 240 }} value={r.value} disabled readOnly />
                    <p className="field__hint">{r.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="card__foot">
              <span className="u-caption">처음에는 코드 값으로 두고, 바꿀 일이 잦아지면 여기서 바꾸게 열어요.</span>
            </div>
          </div>
        </section>

        <section className="section" id="blocks">
          <h2 className="section__title">차단 기기</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>기기</th><th>이유</th><th>차단한 사람</th><th className="cell--num">풀리는 날</th><th style={{ width: 100 }} /></tr></thead>
              <tbody>
                <tr>
                  <td className="u-mono">ff00…</td>
                  <td>도배 (하루 11건)</td>
                  <td>이시영</td>
                  <td className="cell--num u-muted">2026-11-02</td>
                  <td><div className="row-actions"><a href="#">풀기</a></div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </AdminGate>
    </>
  );
}
