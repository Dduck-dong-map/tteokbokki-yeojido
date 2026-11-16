"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { confirmStore, createStore, saveStore, setStoreStatus } from "@/app/admin/actions";
import type { AdminLog, AdminStoreInput } from "@/lib/data/admin";
import type { Research } from "@/lib/data/datasets";
import { DAY_NAMES } from "@/lib/freshness";
import { GRADES, MAX_TASTES, RICE_CAKES, SHOP_TYPES, SIDES, SPICE_LEVELS, STYLES, TASTES, USAGES, keysOf, type Spice } from "@/lib/taxonomy";
import type { Region, Store, StoreStatus } from "@/lib/types";
import { parseAddress } from "@/lib/wiki";
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
const KIND_TEXT: Record<string, string> = { new: "등록", edit: "수정", still: "확인", hidden: "숨김", closed: "폐업", verified: "확인 완료" };
const STATUS_TEXT: Record<StoreStatus, string> = { active: "지도에 보임", hidden: "숨김", closed: "폐업" };

const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const today = () => new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);

// 화면에서 고치는 모양 (숫자 칸은 글자로 들고 있다가 저장할 때 바꾼다)
type Draft = {
  id: string;
  name: string;
  grade: Store["grade"];
  shopType: Store["shopType"] | "";
  address: string;
  gu: string;
  dong: string;
  lat: string;
  lng: string;
  rice: Store["rice"];
  style: Store["style"] | "";
  spice: Spice | 0;
  spiceLabel: string;
  taste: Store["taste"];
  sides: Store["sides"];
  usage: Store["usage"];
  price: string;
  priceCheckedAt: string;
  menu: { name: string; price: string }[];
  hasHours: boolean;
  hours: { days: number[]; open: string; close: string };
  lastConfirmedAt: string;
  memo: string;
};

function toDraft(s: Partial<AdminStoreInput> & { id?: string }): Draft {
  return {
    id: s.id ?? "",
    name: s.name ?? "",
    grade: s.grade ?? "specialist",
    shopType: s.shopType ?? "",
    address: s.address ?? "",
    gu: s.gu ?? "",
    dong: s.dong ?? "",
    lat: s.lat !== undefined ? String(s.lat) : "",
    lng: s.lng !== undefined ? String(s.lng) : "",
    rice: s.rice ?? [],
    style: s.style ?? "",
    spice: s.spice ?? 0,
    spiceLabel: s.spiceLabel ?? "",
    taste: s.taste ?? [],
    sides: s.sides ?? [],
    usage: s.usage ?? [],
    price: s.price !== undefined ? String(s.price) : "",
    priceCheckedAt: s.priceCheckedAt ?? today(),
    menu: (s.menu ?? []).map((m) => ({ name: m.name, price: String(m.price) })),
    hasHours: !!s.hours,
    hours: s.hours ?? { days: [1, 2, 3, 4, 5, 6], open: "11:00", close: "20:00" },
    lastConfirmedAt: s.lastConfirmedAt ?? today(),
    memo: s.memo ?? "",
  };
}

const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(/,/g, "")));
function toInput(d: Draft) {
  return {
    name: d.name,
    grade: d.grade,
    shopType: d.shopType || undefined,
    address: d.address,
    gu: d.gu,
    dong: d.dong,
    lat: num(d.lat),
    lng: num(d.lng),
    rice: d.rice,
    style: d.style || undefined,
    spice: d.spice || undefined,
    spiceLabel: d.spiceLabel,
    taste: d.taste,
    sides: d.sides,
    usage: d.usage,
    price: num(d.price),
    priceCheckedAt: d.priceCheckedAt,
    menu: d.menu.filter((m) => m.name.trim() || m.price.trim()).map((m) => ({ name: m.name, price: num(m.price) ?? 0 })),
    hours: d.hasHours ? d.hours : undefined,
    lastConfirmedAt: d.lastConfirmedAt,
    memo: d.memo,
  };
}

type Props = {
  initial: Store | null; // null = 직접 등록
  template?: Partial<AdminStoreInput>; // 리서치 자료로 채워서 등록할 때
  templateId?: string;
  research?: Research;
  regions: Region[];
  history: AdminLog[];
  exists?: boolean; // 채워서 등록하려는 id 가 이미 DB 에 있음
};

// M-AD-04 가게 편집 (11-15 실제 저장). 태그는 정해진 보기에서만 고른다(기획안 7절). 저장 = 변경 이력 (REQ-AD-09)
export default function StoreEditor({ initial, template, templateId, research, regions, history, exists }: Props) {
  const router = useRouter();
  const isNew = !initial;
  const [start, setStart] = useState(() => toDraft(initial ?? { ...template, id: templateId }));
  const [d, setD] = useState<Draft>(start);
  const [tab, setTab] = useState<Tab>("basic");
  const [confirmKind, setConfirmKind] = useState<"hidden" | "closed" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();
  const dirty = JSON.stringify(d) !== JSON.stringify(start);
  const status = initial?.status ?? "active";

  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2800);
  };

  const save = () =>
    startBusy(async () => {
      setError(null);
      if (isNew) {
        const r = await createStore(toInput(d), d.id);
        if (!r.ok) return setError(r.error);
        router.push(`/admin/stores/${r.id}?saved=1`);
        return;
      }
      const r = await saveStore(initial.id, toInput(d));
      if (!r.ok) return setError(r.error);
      setStart(d);
      flash(`저장했어요 · 바뀐 칸 ${r.changes}개가 이력에 남았어요`);
      router.refresh();
    });

  const act = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, ok: string) =>
    startBusy(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) return setError(r.error);
      flash(ok);
      router.refresh();
    });

  // 주소를 고치면 구·동을 주소 글에서 다시 짐작한다 (비어 있을 때만 채움)
  const guessFromAddress = () => {
    const { gu, dong } = parseAddress(d.address);
    set({ gu: d.gu || (gu !== "etc" ? gu : ""), dong: d.dong || (/(동|가)$/.test(dong) ? dong : "") });
  };

  const latN = num(d.lat);
  const lngN = num(d.lng);
  const mapLink = latN && lngN ? `https://www.openstreetmap.org/?mlat=${latN}&mlon=${lngN}#map=18/${latN}/${lngN}` : null;

  return (
    <>
      {exists && templateId && (
        <div className="alert alert--warning u-mb-4">
          <Icon name="alert" />
          <div>
            이 가게(<b>{templateId}</b>)는 이미 DB 에 있어요. <Link href={`/admin/stores/${templateId}`}>그 가게 편집으로 가기</Link>
          </div>
        </div>
      )}

      <div className="tabs u-mb-4">
        {TABS.filter((t) => !isNew || t.key !== "history").map((t) => (
          <button key={t.key} type="button" className={`tab${tab === t.key ? " is-active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card__body">
          {error && (
            <div className="alert alert--danger u-mb-4" role="alert">
              <Icon name="alert" />
              <div>{error}</div>
            </div>
          )}

          {tab === "basic" && (
            <div className="form-grid">
              <div className="field">
                <label className="field__label">가게 이름<span className="req">*</span></label>
                <input className="input" value={d.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} />
              </div>
              <div className="field">
                <label className="field__label">주소 이름 (id)</label>
                <input className="input u-mono" value={isNew ? d.id : initial.id} disabled={!isNew} placeholder="비우면 자동 (예: gn-ruby)" onChange={(e) => set({ id: e.target.value.toLowerCase() })} />
                <p className="field__hint">{isNew ? "서비스 주소 /store/<id> 에 쓰여요. 영어 소문자·숫자·- 만." : "만든 뒤에는 바꾸지 않아요 (공유된 주소가 깨지지 않게)."}</p>
              </div>
              <div className="field">
                <label className="field__label">등재 등급<span className="req">*</span></label>
                <select className="select" value={d.grade} onChange={(e) => set({ grade: e.target.value as Store["grade"] })}>
                  {keysOf(GRADES).map((g) => <option key={g} value={g}>{GRADES[g]}</option>)}
                </select>
                <p className="field__hint">「메뉴에 있음」은 작은 도장, 필터에서 끌 수 있어요.</p>
              </div>
              <div className="field">
                <label className="field__label">가게 유형</label>
                <select className="select" value={d.shopType} onChange={(e) => set({ shopType: e.target.value as Draft["shopType"] })}>
                  <option value="">없음</option>
                  {keysOf(SHOP_TYPES).map((g) => <option key={g} value={g}>{SHOP_TYPES[g]}</option>)}
                </select>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="field__label">주소<span className="req">*</span></label>
                <input className="input" value={d.address} onChange={(e) => set({ address: e.target.value })} onBlur={guessFromAddress} placeholder="서울 강남구 압구정로50길 22" />
                <p className="field__hint">주소 검색(도로명주소 승인키)을 받으면 고르기로 바뀌고 좌표도 자동으로 채워요. 지금은 좌표를 직접 넣어요.</p>
              </div>
              <div className="field">
                <label className="field__label">구<span className="req">*</span></label>
                <select className="select" value={d.gu} onChange={(e) => set({ gu: e.target.value })}>
                  <option value="" disabled>고르세요</option>
                  {regions.map((r) => <option key={r.gu} value={r.gu}>{r.name}</option>)}
                  <option value="etc">기타</option>
                </select>
              </div>
              <div className="field">
                <label className="field__label">동<span className="req">*</span></label>
                <input className="input" value={d.dong} onChange={(e) => set({ dong: e.target.value })} placeholder="신사동" />
              </div>
              <div className="field">
                <label className="field__label">위도 · 경도<span className="req">*</span></label>
                <div className="u-row">
                  <input className="input u-mono" inputMode="decimal" value={d.lat} onChange={(e) => set({ lat: e.target.value })} placeholder="37.5246" aria-label="위도" />
                  <input className="input u-mono" inputMode="decimal" value={d.lng} onChange={(e) => set({ lng: e.target.value })} placeholder="127.0376" aria-label="경도" />
                </div>
                <p className="field__hint">
                  {mapLink ? <a href={mapLink} target="_blank" rel="noreferrer">이 좌표를 지도에서 보기 ↗</a> : "지도 앱에서 가게를 길게 눌러 나온 숫자를 넣어요."}
                </p>
              </div>
              <div className="field">
                <label className="field__label">마지막 확인일<span className="req">*</span></label>
                <input className="input u-mono" type="date" value={d.lastConfirmedAt} onChange={(e) => set({ lastConfirmedAt: e.target.value })} />
                <p className="field__hint">180일이 넘으면 흐리게, 365일이 넘으면 지도에서 내려가요.</p>
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label className="field__label">소개글 (서비스에 그대로 보여요)</label>
                <textarea className="textarea" value={d.memo} maxLength={500} onChange={(e) => set({ memo: e.target.value })} placeholder="비워 두면 안 보여요" />
              </div>
            </div>
          )}

          {tab === "taste" && (
            <>
              <div className="field">
                <label className="field__label">떡 · 여러 개</label>
                <div className="chips">
                  {keysOf(RICE_CAKES).map((k) => (
                    <label key={k} className="check"><input type="checkbox" checked={d.rice.includes(k)} onChange={() => set({ rice: toggle(d.rice, k) })} /> {RICE_CAKES[k]}</label>
                  ))}
                </div>
              </div>
              <div className="form-grid u-mt-4">
                <div className="field">
                  <label className="field__label">스타일 · 하나<span className="req">*</span></label>
                  <select className="select" value={d.style} onChange={(e) => set({ style: e.target.value as Draft["style"] })}>
                    <option value="" disabled>고르세요</option>
                    {keysOf(STYLES).map((k) => <option key={k} value={k}>{STYLES[k]}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label">맵기 · 신라면 = 3<span className="req">*</span></label>
                  <div className="chips">
                    {([1, 2, 3, 4, 5] as Spice[]).map((n) => (
                      <label key={n} className="check" title={SPICE_LEVELS[n].ref}><input type="radio" name="spice" checked={d.spice === n} onChange={() => set({ spice: n })} /> <Stamp n={n} /></label>
                    ))}
                  </div>
                  <p className="field__hint">{d.spice ? SPICE_LEVELS[d.spice].ref : "대표 메뉴 기준으로 골라요"}</p>
                </div>
                <div className="field">
                  <label className="field__label">가게가 부르는 맵기 이름</label>
                  <input className="input" value={d.spiceLabel} maxLength={20} onChange={(e) => set({ spiceLabel: e.target.value })} placeholder="예: 초보맛 · 1단계" />
                </div>
              </div>
              <div className="field u-mt-4">
                <label className="field__label">맛 결 · 최대 {MAX_TASTES}개</label>
                <div className="chips">
                  {keysOf(TASTES).map((k) => (
                    <label key={k} className="check">
                      <input type="checkbox" checked={d.taste.includes(k)} disabled={!d.taste.includes(k) && d.taste.length >= MAX_TASTES} onChange={() => set({ taste: toggle(d.taste, k) })} /> {TASTES[k]}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-grid u-mt-4">
                <div className="field">
                  <label className="field__label">같이 먹기</label>
                  <div className="chips">
                    {keysOf(SIDES).map((k) => <label key={k} className="check"><input type="checkbox" checked={d.sides.includes(k)} onChange={() => set({ sides: toggle(d.sides, k) })} /> {SIDES[k]}</label>)}
                  </div>
                </div>
                <div className="field">
                  <label className="field__label">이용</label>
                  <div className="chips">
                    {keysOf(USAGES).map((k) => <label key={k} className="check"><input type="checkbox" checked={d.usage.includes(k)} onChange={() => set({ usage: toggle(d.usage, k) })} /> {USAGES[k]}</label>)}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "menu" && (
            <>
              <div className="form-grid u-mb-4">
                <div className="field">
                  <label className="field__label">대표 떡볶이 1인분 (필터·도장에 쓰는 값)<span className="req">*</span></label>
                  <input className="input u-mono" inputMode="numeric" value={d.price} onChange={(e) => set({ price: e.target.value.replace(/[^\d]/g, "") })} placeholder="5000" />
                  <p className="field__hint">여럿이 나눠 먹는 냄비·안주만 있으면 1인분으로 나눈 값을 넣고, 메뉴에는 실제 가격을 적어요.</p>
                </div>
                <div className="field">
                  <label className="field__label">가격 확인일<span className="req">*</span></label>
                  <input className="input u-mono" type="date" value={d.priceCheckedAt} onChange={(e) => set({ priceCheckedAt: e.target.value })} />
                </div>
              </div>
              <table className="table u-mb-2">
                <thead><tr><th>메뉴</th><th className="cell--num" style={{ width: 140 }}>가격 (원)</th><th style={{ width: 96 }} /></tr></thead>
                <tbody>
                  {d.menu.map((m, i) => (
                    <tr key={i}>
                      <td><input className="input" value={m.name} aria-label={`메뉴 ${i + 1} 이름`} onChange={(e) => set({ menu: d.menu.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} /></td>
                      <td><input className="input u-mono" inputMode="numeric" value={m.price} aria-label={`메뉴 ${i + 1} 가격`} onChange={(e) => set({ menu: d.menu.map((x, j) => (j === i ? { ...x, price: e.target.value.replace(/[^\d]/g, "") } : x)) })} /></td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="button" className="btn btn--text btn--sm" disabled={i === 0} aria-label="위로" onClick={() => { const m2 = [...d.menu]; [m2[i - 1], m2[i]] = [m2[i], m2[i - 1]]; set({ menu: m2 }); }}>↑</button>
                          <button type="button" className="btn btn--text btn--sm" aria-label="빼기" onClick={() => set({ menu: d.menu.filter((_, j) => j !== i) })}><Icon name="close" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="btn btn--default btn--sm" onClick={() => set({ menu: [...d.menu, { name: "", price: "" }] })}>
                <Icon name="plus" /> 메뉴 더하기
              </button>
              <p className="field__hint u-mt-2">맨 위 메뉴가 대표 메뉴예요. 이용자가 메뉴를 고치면 대표 가격은 맨 위 메뉴 가격으로 바뀌어요.</p>
            </>
          )}

          {tab === "hours" && (
            <>
              <label className="check u-mb-4">
                <input type="checkbox" checked={!d.hasHours} onChange={() => set({ hasHours: !d.hasHours })} /> 영업시간을 아직 몰라요 (가게 상세에 「아직 몰라요」로 나와요)
              </label>
              {d.hasHours && (
                <div className="form-grid">
                  <div className="field">
                    <label className="field__label">여는 요일</label>
                    <div className="chips">
                      {DAY_NAMES.map((n, i) => (
                        <label key={n} className="check"><input type="checkbox" checked={d.hours.days.includes(i)} onChange={() => set({ hours: { ...d.hours, days: toggle(d.hours.days, i).sort() } })} /> {n}</label>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <label className="field__label">여는 시간 ~ 닫는 시간</label>
                    <div className="u-row">
                      <input className="input u-mono" type="time" value={d.hours.open} onChange={(e) => set({ hours: { ...d.hours, open: e.target.value } })} />
                      <span>~</span>
                      <input className="input u-mono" type="time" value={d.hours.close} onChange={(e) => set({ hours: { ...d.hours, close: e.target.value } })} />
                    </div>
                    <p className="field__hint">닫는 시간이 여는 시간보다 이르면 자정을 넘기는 가게로 봐요. 요일마다 다른 시간은 아직 한 줄로만 적어요.</p>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "history" && (
            history.length ? (
              <table className="table table--compact">
                <thead><tr><th style={{ width: 130 }}>언제</th><th style={{ width: 120 }}>누가</th><th style={{ width: 70 }}>무엇을</th><th>이전 → 새 값</th></tr></thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="u-muted u-mono">{new Date(h.at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                      <td>{h.who}</td>
                      <td className="cell--primary">{KIND_TEXT[h.kind] ?? h.kind}</td>
                      <td>
                        {h.changes?.length
                          ? h.changes.map((c, i) => (
                              <div key={i}><b>{c.field}</b> <span className="u-muted">{c.from}</span> → {c.to}</div>
                            ))
                          : <span className="u-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="u-muted">아직 이력이 없어요.</p>
            )
          )}
        </div>
        {tab !== "history" && (
          <div className="card__foot">
            <span className="u-caption">{dirty ? "저장하지 않은 변경이 있어요" : isNew ? "칸을 채우고 등록하세요" : "바뀐 것 없음"}</span>
            <span className="u-spacer" />
            <button type="button" className="btn btn--default" disabled={!dirty || busy} onClick={() => { setD(start); setError(null); }}>되돌리기</button>
            <button type="button" className="btn btn--primary" disabled={busy || (!isNew && !dirty) || (isNew && !!exists)} onClick={save}>
              {busy ? "저장 중…" : isNew ? "등록" : "저장"}
            </button>
          </div>
        )}
      </div>

      {initial && (
        <div className="card u-mt-4">
          <div className="card__head"><h3 className="card__title">확인과 내리기</h3></div>
          <div className="card__body">
            <div className="u-row u-mb-4">
              <span>마지막 확인 <b>{initial.lastConfirmedAt}</b></span>
              <span className="u-spacer" />
              <button type="button" className="btn btn--default btn--sm" disabled={busy} onClick={() => act(() => confirmStore(initial.id), "확인일을 오늘로 새로 고쳤어요")}>
                <Icon name="check" /> 오늘 확인함
              </button>
            </div>
            <div className="u-row">
              <span>
                지금 <b>{STATUS_TEXT[status]}</b>
                <span className="u-muted"> · 지우지 않아요. 내려도 언제든 되살릴 수 있어요</span>
              </span>
              <span className="u-spacer" />
              {status !== "active" && (
                <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => act(() => setStoreStatus(initial.id, "active"), "되살렸어요 · 지도에 다시 보여요")}>되살리기</button>
              )}
              {status !== "hidden" && <button type="button" className="btn btn--default btn--sm" disabled={busy} onClick={() => { setReason(""); setConfirmKind("hidden"); }}>숨기기</button>}
              {status !== "closed" && <button type="button" className="btn btn--danger btn--sm" disabled={busy} onClick={() => { setReason(""); setConfirmKind("closed"); }}>폐업 처리</button>}
            </div>
          </div>
        </div>
      )}

      {research && (
        <div className="card u-mt-4">
          <div className="card__head">
            <h3 className="card__title">리서치 근거</h3>
            <span className={`badge ${research.confidence === "high" ? "badge--success" : "badge--warning"}`}>확신도 {research.confidence === "high" ? "높음" : research.confidence === "medium" ? "보통" : research.confidence ?? "?"}</span>
          </div>
          <div className="card__body">
            <dl className="kv">
              <dt>근거</dt><dd>{research.basis ?? "—"}</dd>
              {research.gapNotes?.length ? <><dt>빈칸 재조사</dt><dd>{research.gapNotes.map((n, i) => <div key={i}>{n}</div>)}</dd></> : null}
              {research.hoursNote && <><dt>영업시간 메모</dt><dd>{research.hoursNote}</dd></>}
              {research.statusNote && <><dt>상태 메모</dt><dd>{research.statusNote}</dd></>}
              <dt>최근 근거</dt><dd>{research.lastEvidence ?? "—"}</dd>
              <dt>좌표</dt><dd>{research.geo === "building" ? "건물 번호까지 (OpenStreetMap)" : research.geo === "rough" ? "길 근처까지 — 핀 확인 필요" : "못 찾음"}</dd>
              <dt>출처</dt>
              <dd>
                {research.sources.map((u) => (
                  <div key={u} className="u-truncate"><a href={u} target="_blank" rel="noreferrer">{decodeURIComponent(u).replace(/^https?:\/\//, "").slice(0, 70)}</a></div>
                ))}
              </dd>
            </dl>
          </div>
        </div>
      )}

      {confirmKind && initial && (
        <div className="modal-backdrop" onClick={() => setConfirmKind(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={confirmKind === "closed" ? "폐업 처리" : "숨기기"}>
            <div className="modal__head">
              <h3 className="modal__title">{confirmKind === "closed" ? "폐업 처리할까요?" : "숨길까요?"}</h3>
              <button type="button" className="modal__close" onClick={() => setConfirmKind(null)} aria-label="닫기"><Icon name="close" /></button>
            </div>
            <div className="modal__body">
              <p>「{initial.name}」이 지도·목록·검색에서 내려가요. 가게 정보와 이력은 남고, 「되살리기」로 다시 올릴 수 있어요.</p>
              <div className="field u-mt-4">
                <label className="field__label">이유{confirmKind === "hidden" && <span className="req">*</span>}</label>
                <select className="select" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="">{confirmKind === "hidden" ? "고르세요" : "적지 않음"}</option>
                  {(confirmKind === "hidden" ? ["등재 기준 미달", "사장님 요청", "정보 확인 중", "중복 가게"] : ["폐업 확인", "이전(다른 곳으로 옮김)", "장기 휴업"]).map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="modal__foot">
              <button type="button" className="btn btn--default" onClick={() => setConfirmKind(null)}>취소</button>
              <button
                type="button"
                className="btn btn--danger"
                disabled={busy || (confirmKind === "hidden" && !reason)}
                onClick={() => {
                  const kind = confirmKind;
                  setConfirmKind(null);
                  act(() => setStoreStatus(initial.id, kind, reason), kind === "closed" ? "폐업 처리했어요 · 되살리기 가능" : "숨겼어요 · 되살리기 가능");
                }}
              >
                {confirmKind === "closed" ? "폐업 처리" : "숨기기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
