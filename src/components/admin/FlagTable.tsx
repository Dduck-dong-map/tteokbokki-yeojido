"use client";

import Link from "next/link";
import { useState } from "react";
import { ADMIN_FLAGS, FLAG_KIND_LABEL, ageText, type FlagKind } from "@/lib/admin/sample";
import { SAMPLE_STORES } from "@/lib/data/sample-stores";
import { Icon } from "./Icon";

const KIND_CLS: Record<FlagKind, string> = { owner: "badge--info", wrong: "badge--warning", photo: "badge--danger", system: "" };
const ACTION: Record<FlagKind, string> = { owner: "가게 정보 고치기", wrong: "가게 정보 고치기", photo: "사진 내리기", system: "확인일 새로 고치기" };

// M-AD-07 신고·요청: 사장님 요청 · 정보 신고 · 사진 신고 · 자동 알림. 48시간 안에 처리 (REQ-AD-11)
export default function FlagTable() {
  const [kind, setKind] = useState<FlagKind | "all">("all");
  const [flags, setFlags] = useState(ADMIN_FLAGS);
  const [showDone, setShowDone] = useState(false);
  const rows = flags.filter((f) => (kind === "all" || f.kind === kind) && (showDone || f.status === "open"));

  return (
    <div className="table-wrap">
      <div className="table-toolbar">
        <div className="tabs" style={{ borderBottom: 0 }}>
          {(["all", "owner", "wrong", "photo", "system"] as const).map((k) => (
            <button key={k} type="button" className={`tab${kind === k ? " is-active" : ""}`} onClick={() => setKind(k)}>
              {k === "all" ? "전체" : FLAG_KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="table-toolbar__spacer" />
        <label className="check"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> 처리한 것도 보기</label>
      </div>
      {rows.length === 0 ? (
        <div className="empty">
          <div className="empty__icon"><Icon name="check" /></div>
          <div className="empty__title">처리할 신고·요청이 없어요</div>
        </div>
      ) : (
        <table className="table">
          <thead><tr><th style={{ width: 110 }}>종류</th><th>내용</th><th>가게</th><th className="cell--num">접수</th><th style={{ width: 200 }} /></tr></thead>
          <tbody>
            {rows.map((f) => {
              const s = SAMPLE_STORES.find((x) => x.id === f.storeId);
              const late = f.status === "open" && ageText(f.at).includes("일") && Number(ageText(f.at).replace(/\D/g, "")) >= 2;
              return (
                <tr key={f.id}>
                  <td><span className={`badge ${KIND_CLS[f.kind]}`}>{FLAG_KIND_LABEL[f.kind]}</span></td>
                  <td className="cell--primary">{f.summary}</td>
                  <td>{s && <Link href={`/admin/stores/${s.id}`}>{s.name}</Link>}</td>
                  <td className="cell--num u-muted">
                    {ageText(f.at)} {late && <span className="badge badge--danger">48시간 넘음</span>}
                    {f.status === "done" && <span className="badge badge--success">처리함</span>}
                  </td>
                  <td>
                    {f.status === "open" && (
                      <div className="btn-group">
                        {s && <Link href={`/admin/stores/${s.id}`} className="btn btn--default btn--sm">{ACTION[f.kind]}</Link>}
                        <button type="button" className="btn btn--text btn--sm" onClick={() => setFlags(flags.map((x) => (x.id === f.id ? { ...x, status: "done" } : x)))}>처리 완료</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
