"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ADMIN_REPORTS, AUDIT_LOG } from "@/lib/admin/sample";
import { DAY_NAMES } from "@/lib/freshness";
import { GRADES, MAX_TASTES, RICE_CAKES, SHOP_TYPES, SIDES, SPICE_LEVELS, STYLES, TASTES, USAGES, keysOf, type Spice } from "@/lib/taxonomy";
import type { Store } from "@/lib/types";
import { Stamp } from "./bits";
import { Icon } from "./Icon";

type Tab = "basic" | "taste" | "menu" | "hours" | "history";
const TABS: { key: Tab; label: string }[] = [
  { key: "basic", label: "기본 정보" },
  { key: "taste", label: "맛 태그" },
  { key: "menu", label: "메뉴·가격" },
  { key: "hours", label: "영업시간" },
  { key: "history", label: "변경 이력" },
];

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

// M-AD-04 가게 편집. 태그는 정해진 보기에서만 고른다(기획안 7절). 저장 = 변경 이력 + 운영 기록 (REQ-AD-09)
export default function StoreEditor({ initial }: { initial: Store }) {
  const from = Number(useSearchParams().get("from"));
  const report = ADMIN_REPORTS.find((r) => r.id === from && r.storeId === initial.id);
  const [s, setS] = useState<Store>(initial);
  const [tab, setTab] = useState<Tab>(report?.fields.hours ? "hours" : "basic");
  const [confirmKind, setConfirmKind] = useState<"hide" | "closed" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const dirty = JSON.stringify(s) !== JSON.stringify(initial);

  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2600);
  };

  const history = AUDIT_LOG.filter((a) => initial.name.startsWith(a.target.replace(/^#\d+ /, "").split(" (")[0]));

  return (
    <>
      {report && (
        <div className="alert alert--warning u-mb-4">
          <Icon name="alert" />
          <div>
            제보 <b>#{report.id}</b>을 보고 고치는 중이에요. 제보 내용: 영업시간 「{report.fields.hours}」. 저장하면 제보도 「고쳐서 승인」으로 닫혀요.
          </div>
        </div>
      )}

      <div className="tabs u-mb-4">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`tab${tab === t.key ? " is-active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card__body">
          {tab === "basic" && (
            <div className="form-grid">
              <div className="field">
                <label className="field__label">가게 이름<span className="req">*</span></label>
                <input className="input" value={s.name} maxLength={60} onChange={(e) => setS({ ...s, name: e.target.value })} />
              </div>
              <div className="field">
                <label className="field__label">등재 등급<span className="req">*</span></label>
                <select className="select" value={s.grade} onChange={(e) => setS({ ...s, grade: e.target.value as Store["grade"] })}>
                  {keysOf(GRADES).map((g) => <option key={g} value={g}>{GRADES[g]}</option>)}
                </select>
                <p className="field__hint">「메뉴에 있음」은 작은 도장, 필터에서 끌 수 있어요.</p>
              </div>
              <div className="field">
                <label className="field__label">가게 유형</label>
                <select className="select" value={s.shopType} onChange={(e) => setS({ ...s, shopType: e.target.value as Store["shopType"] })}>
                  {keysOf(SHOP_TYPES).map((g) => <option key={g} value={g}>{SHOP_TYPES[g]}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label">동</label>
                <input className="input" value={s.dong} onChange={(e) => setS({ ...s, dong: e.target.value })} />
              </div>
              <div className="field">
                <label className="field__label">주소<span className="req">*</span></label>
                <input className="input" value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} />
                <p className="field__hint">M2 부터 도로명주소 검색으로 고르고, 좌표는 자동으로 채워요.</p>
              </div>
              <div className="field">
                <label className="field__label">지도 핀</label>
                <input className="input u-mono" value={`${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}`} disabled />
                <p className="field__hint">핀이 어긋났다는 신고가 오면 지도에서 끌어서 옮겨요(M3).</p>
              </div>
            </div>
          )}

          {tab === "taste" && (
            <>
              <div className="field">
                <label className="field__label">떡 · 여러 개</label>
                <div className="chips">
                  {keysOf(RICE_CAKES).map((k) => (
                    <label key={k} className="check"><input type="checkbox" checked={s.rice.includes(k)} onChange={() => setS({ ...s, rice: toggle(s.rice, k) })} /> {RICE_CAKES[k]}</label>
                  ))}
                </div>
              </div>
              <div className="form-grid u-mt-4">
                <div className="field">
                  <label className="field__label">스타일 · 하나</label>
                  <select className="select" value={s.style} onChange={(e) => setS({ ...s, style: e.target.value as Store["style"] })}>
                    {keysOf(STYLES).map((k) => <option key={k} value={k}>{STYLES[k]}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label">맵기 · 신라면 = 3</label>
                  <div className="chips">
                    {([1, 2, 3, 4, 5] as Spice[]).map((n) => (
                      <label key={n} className="check" title={SPICE_LEVELS[n].ref}><input type="radio" name="spice" checked={s.spice === n} onChange={() => setS({ ...s, spice: n })} /> <Stamp n={n} /></label>
                    ))}
                  </div>
                  <p className="field__hint">보통은 투표 평균이 정해요. 여기서 고치면 이력에 「운영자 수정」으로 남아요.</p>
                </div>
              </div>
              <div className="field u-mt-4">
                <label className="field__label">맛 결 · 최대 {MAX_TASTES}개</label>
                <div className="chips">
                  {keysOf(TASTES).map((k) => (
                    <label key={k} className="check">
                      <input type="checkbox" checked={s.taste.includes(k)} disabled={!s.taste.includes(k) && s.taste.length >= MAX_TASTES} onChange={() => setS({ ...s, taste: toggle(s.taste, k) })} /> {TASTES[k]}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-grid u-mt-4">
                <div className="field">
                  <label className="field__label">같이 먹기</label>
                  <div className="chips">
                    {keysOf(SIDES).map((k) => <label key={k} className="check"><input type="checkbox" checked={s.sides.includes(k)} onChange={() => setS({ ...s, sides: toggle(s.sides, k) })} /> {SIDES[k]}</label>)}
                  </div>
                </div>
                <div className="field">
                  <label className="field__label">이용</label>
                  <div className="chips">
                    {keysOf(USAGES).map((k) => <label key={k} className="check"><input type="checkbox" checked={s.usage.includes(k)} onChange={() => setS({ ...s, usage: toggle(s.usage, k) })} /> {USAGES[k]}</label>)}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "menu" && (
            <>
              <table className="table u-mb-4">
                <thead><tr><th>메뉴</th><th className="cell--num" style={{ width: 160 }}>가격 (원)</th></tr></thead>
                <tbody>
                  {s.menu.map((m, i) => (
                    <tr key={i}>
                      <td><input className="input" value={m.name} onChange={(e) => setS({ ...s, menu: s.menu.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} /></td>
                      <td><input className="input u-mono" inputMode="numeric" value={m.price} onChange={(e) => setS({ ...s, menu: s.menu.map((x, j) => (j === i ? { ...x, price: Number(e.target.value.replace(/\D/g, "")) || 0 } : x)) })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="form-grid">
                <div className="field">
                  <label className="field__label">대표 떡볶이 1인분 (필터에 쓰는 값)</label>
                  <input className="input u-mono" inputMode="numeric" value={s.price} onChange={(e) => setS({ ...s, price: Number(e.target.value.replace(/\D/g, "")) || 0 })} />
                </div>
                <div className="field">
                  <label className="field__label">가격 확인일</label>
                  <input className="input u-mono" type="date" value={s.priceCheckedAt} onChange={(e) => setS({ ...s, priceCheckedAt: e.target.value })} />
                </div>
              </div>
            </>
          )}

          {tab === "hours" && (
            <div className="form-grid">
              <div className="field">
                <label className="field__label">여는 요일</label>
                <div className="chips">
                  {DAY_NAMES.map((d, i) => (
                    <label key={d} className="check"><input type="checkbox" checked={s.hours.days.includes(i)} onChange={() => setS({ ...s, hours: { ...s.hours, days: toggle(s.hours.days, i).sort() } })} /> {d}</label>
                  ))}
                </div>
              </div>
              <div className="field">
                <label className="field__label">여는 시간 ~ 닫는 시간</label>
                <div className="u-row">
                  <input className="input u-mono" type="time" value={s.hours.open} onChange={(e) => setS({ ...s, hours: { ...s.hours, open: e.target.value } })} />
                  <span>~</span>
                  <input className="input u-mono" type="time" value={s.hours.close} onChange={(e) => setS({ ...s, hours: { ...s.hours, close: e.target.value } })} />
                </div>
                <p className="field__hint">닫는 시간이 여는 시간보다 이르면 자정을 넘기는 가게로 봐요.</p>
              </div>
            </div>
          )}

          {tab === "history" && (
            <table className="table table--compact">
              <thead><tr><th style={{ width: 130 }}>언제</th><th>누가</th><th>무엇을</th><th>이전 → 새 값</th><th style={{ width: 90 }} /></tr></thead>
              <tbody>
                {[...history, { at: "2026-09-02 14:00", actor: "크루 A (예시)", role: "crew" as const, action: "가격 수정", target: initial.name, detail: `${(initial.price - 500).toLocaleString()}원 → ${initial.price.toLocaleString()}원` }].map((h) => (
                  <tr key={h.at + h.action}>
                    <td className="u-muted">{h.at.slice(2)}</td>
                    <td>{h.actor}</td>
                    <td className="cell--primary">{h.action}</td>
                    <td>{h.detail}</td>
                    <td><button type="button" className="btn btn--text btn--sm" onClick={() => flash("이 변경을 되돌렸어요 · 되돌린 것도 기록에 남아요")}>되돌리기</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {tab !== "history" && (
          <div className="card__foot">
            <button type="button" className="btn btn--default" disabled={!dirty} onClick={() => setS(initial)}>되돌리기</button>
            <button type="button" className="btn btn--primary" disabled={!dirty} onClick={() => flash("저장했어요 · 변경 이력과 운영 기록에 남았어요 (시안이라 실제 저장은 안 돼요)")}>저장</button>
          </div>
        )}
      </div>

      <div className="card u-mt-4">
        <div className="card__head"><h3 className="card__title">확인과 내리기</h3></div>
        <div className="card__body">
          <div className="u-row u-mb-4">
            <span>마지막 확인 <b>{s.lastConfirmedAt}</b></span>
            <span className="u-spacer" />
            <button type="button" className="btn btn--default btn--sm" onClick={() => { setS({ ...s, lastConfirmedAt: "2026-10-27" }); flash("확인일을 오늘로 새로 고쳤어요"); }}>
              <Icon name="check" /> 오늘 확인함
            </button>
          </div>
          <div className="u-row">
            <span className="u-muted">지도·목록에서 내리기 (지우지 않아요. 언제든 되살릴 수 있어요)</span>
            <span className="u-spacer" />
            <button type="button" className="btn btn--default btn--sm" onClick={() => setConfirmKind("hide")}>숨기기</button>
            <button type="button" className="btn btn--danger btn--sm" onClick={() => setConfirmKind("closed")}>폐업 처리</button>
          </div>
        </div>
      </div>

      {confirmKind && (
        <div className="modal-backdrop" onClick={() => setConfirmKind(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="modal__head">
              <h3 className="modal__title">{confirmKind === "closed" ? "폐업 처리할까요?" : "숨길까요?"}</h3>
              <button type="button" className="modal__close" onClick={() => setConfirmKind(null)} aria-label="닫기"><Icon name="close" /></button>
            </div>
            <div className="modal__body">
              <p>「{s.name}」이 지도·목록·검색에서 내려가요. 가게 정보와 이력은 남고, 「되살리기」로 다시 올릴 수 있어요.</p>
              {confirmKind === "hide" && (
                <div className="field u-mt-4">
                  <label className="field__label">숨기는 이유<span className="req">*</span></label>
                  <select className="select" defaultValue="">
                    <option value="" disabled>고르세요</option>
                    <option>등재 기준 미달</option>
                    <option>사장님 요청</option>
                    <option>정보 확인 중</option>
                  </select>
                </div>
              )}
            </div>
            <div className="modal__foot">
              <button type="button" className="btn btn--default" onClick={() => setConfirmKind(null)}>취소</button>
              <button type="button" className="btn btn--danger" onClick={() => { setConfirmKind(null); flash(confirmKind === "closed" ? "폐업 처리했어요 · 되살리기 가능" : "숨겼어요 · 되살리기 가능"); }}>
                {confirmKind === "closed" ? "폐업 처리" : "숨기기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
