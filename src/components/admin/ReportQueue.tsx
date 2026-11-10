"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ADMIN_REPORTS, FLAG_LABEL, KIND_LABEL, REJECT_REASONS, ageText, type AdminReport, type ReportFields } from "@/lib/admin/sample";
import { SAMPLE_STORES } from "@/lib/data/sample-stores";
import { won } from "@/lib/filters";
import { hoursText } from "@/lib/freshness";
import { RICE_CAKES, STYLES } from "@/lib/taxonomy";
import type { Store } from "@/lib/types";
import { Stamp } from "./bits";
import { Icon } from "./Icon";

type Tab = "pending" | "agree" | "done";
const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "승인 대기" },
  { key: "agree", label: "동의 대기" },
  { key: "done", label: "처리 완료" },
];

const storeOf = (id?: string) => SAMPLE_STORES.find((s) => s.id === id);
const titleOf = (r: AdminReport) => r.fields.name ?? storeOf(r.storeId)?.name ?? `제보 #${r.id}`;

// 승인 대기 정렬 (REQ-AD-03): 같은 내용 3건 이상 → 폐업 신고 → 새 가게 → 정보 수정, 같은 칸 안에서는 오래된 것부터
const rank = (r: AdminReport) => ((r.sameCount ?? 0) >= 3 ? 0 : r.kind === "closed" ? 1 : r.kind === "new" ? 2 : 3);
const byQueue = (a: AdminReport, b: AdminReport) => rank(a) - rank(b) || a.at.localeCompare(b.at);

const NEW_CHECKS = [
  "등재 기준 3등급 중 하나다 (떡볶이 전문 · 분식집 · 메뉴에 있음)",
  "주소와 지도 핀이 맞다",
  "이미 있는 가게가 아니다 (150m 안 비슷한 이름 확인)",
  "사진에 사람 얼굴·개인 정보가 없다",
];

function fieldRows(f: ReportFields, s?: Store) {
  const rows: { label: string; now: string; next: string }[] = [];
  const add = (label: string, now: string | undefined, next: string | undefined) => next !== undefined && rows.push({ label, now: now ?? "—", next });
  add("가게 이름", s?.name, f.name);
  add("주소", s?.address, f.address);
  add("떡", s?.rice.map((r) => RICE_CAKES[r]).join(", "), f.rice?.map((r) => RICE_CAKES[r]).join(", "));
  add("스타일", s ? STYLES[s.style] : undefined, f.style && STYLES[f.style]);
  add("맵기", s ? String(s.spice) : undefined, f.spice !== undefined ? String(f.spice) : undefined);
  add("1인분 가격", s ? won(s.price) : undefined, f.price !== undefined ? won(f.price) : undefined);
  add("영업시간", s ? hoursText(s.hours) : undefined, f.hours);
  return rows;
}

export default function ReportQueue() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = (params.get("tab") as Tab) || "pending";

  const [items, setItems] = useState<AdminReport[]>(ADMIN_REPORTS);
  const [selected, setSelected] = useState<number | null>(null);
  const [checks, setChecks] = useState<Record<number, boolean[]>>({});
  const [method, setMethod] = useState<Record<number, string>>({});
  const [rejecting, setRejecting] = useState<AdminReport | null>(null);
  const [reason, setReason] = useState<string>("");
  const [blockDevice, setBlockDevice] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const list = useMemo(() => {
    const inTab = items.filter((r) => (tab === "pending" ? r.status === "pending" : tab === "agree" ? r.status === "agree" : ["approved", "rejected", "auto"].includes(r.status)));
    return tab === "pending" ? inTab.sort(byQueue) : inTab.sort((a, b) => b.at.localeCompare(a.at));
  }, [items, tab]);

  const current = list.find((r) => r.id === selected) ?? null;

  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2600);
  };

  const finish = (r: AdminReport, status: AdminReport["status"], msg: string, extra: Partial<AdminReport> = {}) => {
    const idx = list.findIndex((x) => x.id === r.id);
    const next = list[idx + 1] ?? list[idx - 1];
    setItems((all) => all.map((x) => (x.id === r.id ? { ...x, status, handledBy: "이시영", ...extra } : x)));
    setSelected(next && next.id !== r.id ? next.id : null);
    flash(`${msg} · 운영 기록에 남았어요`);
  };

  const canApprove = (r: AdminReport) => {
    if (r.kind === "new") return (checks[r.id] ?? []).filter(Boolean).length === NEW_CHECKS.length;
    if (r.kind === "closed") return !!method[r.id];
    return true;
  };

  const approve = (r: AdminReport) => {
    if (r.status === "agree") return finish(r, "approved", "지금 반영했어요");
    if (!canApprove(r)) return flash(r.kind === "new" ? "확인 항목 4개를 모두 체크해 주세요" : "어떻게 확인했는지 골라 주세요");
    finish(r, "approved", r.kind === "new" ? "승인해서 지도에 올렸어요" : r.kind === "closed" ? "폐업 처리했어요 (되살리기 가능)" : "승인해서 반영했어요");
  };

  const openReject = (r: AdminReport) => {
    setRejecting(r);
    setReason(r.flags?.includes("spam_device") ? "장난·도배" : "");
    setBlockDevice(!!r.flags?.includes("spam_device"));
  };

  // 키보드: A 승인 · R 반려 · J/K 아래·위 (REQ-AD-16, 하루 20분 목표)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (rejecting || (e.target instanceof HTMLElement && e.target.closest("input, textarea, select"))) return;
      const idx = list.findIndex((r) => r.id === selected);
      if (e.key === "j" || e.key === "ArrowDown") setSelected(list[Math.min(list.length - 1, idx + 1)]?.id ?? null);
      else if (e.key === "k" || e.key === "ArrowUp") setSelected(list[Math.max(0, idx - 1)]?.id ?? null);
      else if (current && tab !== "done" && e.key === "a") approve(current);
      else if (current && tab === "pending" && e.key === "r") openReject(current);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const setTab = (t: Tab) => {
    setSelected(null);
    router.replace(t === "pending" ? "/admin/reports" : `/admin/reports?tab=${t}`, { scroll: false });
  };

  const store = current ? storeOf(current.storeId) : undefined;
  const dupStore = current?.dupOf ? storeOf(current.dupOf) : undefined;

  return (
    <>
      <div className="tabs u-mb-4">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`tab${tab === t.key ? " is-active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label} {t.key !== "done" && <span className="u-muted">{items.filter((r) => r.status === t.key).length}</span>}
          </button>
        ))}
        <span className="u-spacer" />
        <span className="u-caption kbd-hint">
          <span className="kbd">J</span>/<span className="kbd">K</span> 이동 · <span className="kbd">A</span> 승인 · <span className="kbd">R</span> 반려
        </span>
      </div>

      <div className={`queue${current ? " is-detail" : ""}`}>
        <div className="queue__list card card--flush">
          {list.length === 0 ? (
            <div className="empty">
              <div className="empty__icon"><Icon name="inbox" /></div>
              <div className="empty__title">{tab === "pending" ? "오늘 할 일 끝!" : "비어 있어요"}</div>
              <div className="empty__desc">{tab === "pending" ? "승인 대기 제보가 없어요. 신고·요청함을 확인해 보세요." : "여기에 올 제보가 아직 없어요."}</div>
              {tab === "pending" && <Link href="/admin/flags" className="btn btn--default">신고·요청 보기</Link>}
            </div>
          ) : (
            list.map((r) => (
              <button key={r.id} type="button" className={`queue__item${r.id === selected ? " is-selected" : ""}`} onClick={() => setSelected(r.id)}>
                <div className="u-row">
                  <span className={`badge ${r.kind === "closed" ? "badge--danger" : r.kind === "new" ? "badge--info" : ""}`}>{KIND_LABEL[r.kind]}</span>
                  <span className="queue__title u-truncate">{titleOf(r)}</span>
                </div>
                <div className="queue__meta">
                  <span>#{r.id}</span>
                  <span>{ageText(r.at)}</span>
                  {r.status === "agree" && <span>동의 {r.agreements}/2</span>}
                  {r.status === "auto" && <span className="badge badge--success">자동 반영</span>}
                  {r.status === "approved" && <span className="badge badge--success">승인</span>}
                  {r.status === "rejected" && <span className="badge badge--danger">반려</span>}
                  {r.flags?.map((f) => (
                    <span key={f} className={`badge ${f === "spam_device" ? "badge--danger" : "badge--warning"}`}>{FLAG_LABEL[f]}</span>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="queue__detail">
          {!current ? (
            <div className="card">
              <div className="empty">
                <div className="empty__icon"><Icon name="arrow-right" /></div>
                <div className="empty__title">왼쪽에서 제보를 고르세요</div>
                <div className="empty__desc">J 를 누르면 맨 위 제보부터 열려요.</div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card__head">
                <h3 className="card__title">
                  <span className={`badge ${current.kind === "closed" ? "badge--danger" : current.kind === "new" ? "badge--info" : ""}`}>{KIND_LABEL[current.kind]}</span> {titleOf(current)}
                </h3>
                <div className="card__actions">
                  <button type="button" className="btn btn--text btn--sm" onClick={() => setSelected(null)}>목록으로</button>
                </div>
              </div>
              <div className="card__body">
                <dl className="kv u-mb-4">
                  <dt>제보 번호</dt><dd className="u-mono">#{current.id}</dd>
                  <dt>접수</dt><dd>{current.at} ({ageText(current.at)})</dd>
                  <dt>보낸 기기</dt><dd className="u-mono">{current.device}… <span className="u-caption">(해시 일부 · 사람은 알 수 없음)</span></dd>
                  {current.photo && (<><dt>사진</dt><dd>1장 (시안에는 없음)</dd></>)}
                  {current.handledBy && (<><dt>처리</dt><dd>{current.handledBy}{current.rejectReason && ` · 반려 사유: ${current.rejectReason}`}</dd></>)}
                </dl>

                {current.flags?.includes("many_same") && (
                  <div className="alert u-mb-4"><Icon name="info" /><div>같은 폐업 신고가 <b>{current.sameCount}건</b> 모였어요. 그래서 맨 위에 올라왔어요.</div></div>
                )}
                {current.flags?.includes("dup_suspect") && dupStore && (
                  <div className="alert alert--warning u-mb-4">
                    <Icon name="alert" />
                    <div>
                      150m 안에 비슷한 이름의 가게가 있어요: <b>{dupStore.name}</b>. 같은 가게면 새로 올리지 말고 기존 가게에 합치세요.
                      <div className="u-mt-2 u-row">
                        <Link href={`/admin/stores/${dupStore.id}`} className="btn btn--default btn--sm">기존 가게 보기</Link>
                        <button type="button" className="btn btn--default btn--sm" onClick={() => finish(current, "rejected", "기존 가게에 합쳤어요", { rejectReason: "이미 있는 가게(중복)" })}>기존 가게에 합치기</button>
                      </div>
                    </div>
                  </div>
                )}
                {current.flags?.includes("spam_device") && (
                  <div className="alert alert--danger u-mb-4">
                    <Icon name="alert" />
                    <div>이 기기는 오늘 <b>11건</b>을 보냈어요. 하루 한도(10건)를 넘어서 새 제보는 자동으로 막혔어요.</div>
                  </div>
                )}

                {current.kind === "closed" && store && (
                  <>
                    <dl className="kv u-mb-4">
                      <dt>가게</dt><dd><Link href={`/admin/stores/${store.id}`}>{store.name}</Link></dd>
                      <dt>마지막 확인</dt><dd>{store.lastConfirmedAt}</dd>
                    </dl>
                    {current.status === "pending" && (
                      <div className="field">
                        <label className="field__label">어떻게 확인했나요?<span className="req">*</span></label>
                        <div className="chips">
                          {["가게에 전화", "지도 앱 거리뷰·리뷰", "크루가 방문"].map((m) => (
                            <label key={m} className="check">
                              <input type="radio" name={`m-${current.id}`} checked={method[current.id] === m} onChange={() => setMethod({ ...method, [current.id]: m })} /> {m}
                            </label>
                          ))}
                        </div>
                        <p className="field__hint">폐업 처리하면 지도·목록에서 내려가요. 나중에 「아직 있어요」가 들어오면 자동 알림이 와요.</p>
                      </div>
                    )}
                  </>
                )}

                {current.kind !== "closed" && (
                  <table className="table diff u-mb-4">
                    <thead>
                      <tr><th style={{ width: 110 }}>항목</th>{current.kind === "edit" && <th>지금</th>}<th>{current.kind === "edit" ? "제보" : "제보 내용"}</th></tr>
                    </thead>
                    <tbody>
                      {fieldRows(current.fields, current.kind === "edit" ? store : undefined).map((row) => (
                        <tr key={row.label}>
                          <td className="u-muted">{row.label}</td>
                          {current.kind === "edit" && <td>{row.label === "맵기" && store ? <Stamp n={store.spice} /> : row.now}</td>}
                          <td className={current.kind === "edit" ? "is-changed" : ""}>{row.label === "맵기" ? <Stamp n={Number(row.next)} /> : row.next}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {current.status === "agree" && (
                  <div className="alert u-mb-4">
                    <Icon name="info" />
                    <div>
                      가격·맵기 수정은 다른 기기 2곳이 「맞아요」를 누르면 자동으로 반영돼요. 지금 <b>{current.agreements}/2</b>. 이상하면 「막기」로 승인 대기에 넣으세요.
                    </div>
                  </div>
                )}
                {current.status === "auto" && (
                  <div className="alert alert--success u-mb-4"><Icon name="check" /><div>동의 2곳이 모여 자동 반영됐어요. 잘못됐으면 가게 편집의 변경 이력에서 되돌리세요.</div></div>
                )}

                {current.kind === "new" && current.status === "pending" && (
                  <div className="field">
                    <label className="field__label">승인 전 확인<span className="req">*</span></label>
                    <div className="checklist">
                      {NEW_CHECKS.map((c, i) => (
                        <label key={c} className="check">
                          <input
                            type="checkbox"
                            checked={!!checks[current.id]?.[i]}
                            onChange={(e) => {
                              const arr = [...(checks[current.id] ?? NEW_CHECKS.map(() => false))];
                              arr[i] = e.target.checked;
                              setChecks({ ...checks, [current.id]: arr });
                            }}
                          />
                          {c}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {current.status === "pending" && (
                <div className="card__foot">
                  <button type="button" className="btn btn--default" onClick={() => openReject(current)}>반려 <span className="kbd">R</span></button>
                  {current.kind !== "closed" && (
                    current.kind === "edit" && store ? (
                      <Link href={`/admin/stores/${store.id}?from=${current.id}`} className="btn btn--default">고쳐서 승인</Link>
                    ) : (
                      <button type="button" className="btn btn--default" onClick={() => flash("고쳐서 승인: 가게 편집 화면(M-AD-04)에서 값을 고친 뒤 승인해요 (시안에서는 생략)")}>고쳐서 승인</button>
                    )
                  )}
                  <button type="button" className="btn btn--primary" disabled={!canApprove(current)} onClick={() => approve(current)}>
                    {current.kind === "new" ? "승인하고 지도에 올리기" : current.kind === "closed" ? "폐업 처리" : "승인해서 반영"} <span className="kbd">A</span>
                  </button>
                </div>
              )}
              {current.status === "agree" && (
                <div className="card__foot">
                  <button type="button" className="btn btn--default" onClick={() => finish(current, "pending", "막았어요. 승인 대기로 옮겼어요")}>막기 (승인 대기로)</button>
                  <button type="button" className="btn btn--primary" onClick={() => approve(current)}>지금 반영</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {rejecting && (
        <div className="modal-backdrop" onClick={() => setRejecting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="반려 사유">
            <div className="modal__head">
              <h3 className="modal__title">#{rejecting.id} 반려</h3>
              <button type="button" className="modal__close" onClick={() => setRejecting(null)} aria-label="닫기"><Icon name="close" /></button>
            </div>
            <div className="modal__body">
              <p className="u-mb-4">익명 제보라 보낸 사람에게 알릴 수는 없어요. 사유는 통계와 도배 판단에 써요.</p>
              <div className="checklist">
                {REJECT_REASONS.map((x) => (
                  <label key={x} className="check">
                    <input type="radio" name="reason" checked={reason === x} onChange={() => setReason(x)} /> {x}
                  </label>
                ))}
              </div>
              {reason === "장난·도배" && (
                <label className="check u-mt-4">
                  <input type="checkbox" checked={blockDevice} onChange={(e) => setBlockDevice(e.target.checked)} /> 이 기기({rejecting.device}…) 7일 동안 제보 막기
                </label>
              )}
            </div>
            <div className="modal__foot">
              <button type="button" className="btn btn--default" onClick={() => setRejecting(null)}>취소</button>
              <button
                type="button"
                className="btn btn--danger"
                disabled={!reason}
                onClick={() => {
                  finish(rejecting, "rejected", blockDevice ? "반려하고 기기를 7일 막았어요" : "반려했어요", { rejectReason: reason });
                  setRejecting(null);
                }}
              >
                반려
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
