"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SAMPLE_NOW, STAFF } from "@/lib/admin/sample";
import { SAMPLE_STORES } from "@/lib/data/sample-stores";
import { daysSince, freshness } from "@/lib/freshness";
import { Icon } from "./Icon";

// M-AD-05 신선도 점검: 180일 넘은 가게를 오래된 순으로. 확인하면 확인일이 오늘로 (REQ-AD-10)
export default function FreshnessTable() {
  const now = useMemo(() => new Date(SAMPLE_NOW), []);
  const [done, setDone] = useState<string[]>([]);
  const [assignee, setAssignee] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const crew = STAFF.filter((s) => s.role !== "owner");

  const rows = SAMPLE_STORES.map((s) => ({ s, f: freshness(s, now), d: daysSince(s.lastConfirmedAt, now) }))
    .filter(({ f, s }) => f !== "fresh" && !done.includes(s.id))
    .sort((a, b) => b.d - a.d);

  const confirm = (id: string, how: string) => {
    setDone([...done, id]);
    setToast(`${how} 확인 · 확인일을 오늘로 새로 고쳤어요`);
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <>
      <div className="table-wrap">
        <div className="table-toolbar">
          <span className="u-strong">확인이 필요한 가게</span>
          <div className="table-toolbar__spacer" />
          <span className="u-caption">흐림 = 180일 넘음 · 내림 = 365일 넘어 지도·목록에서 자동으로 내려감</span>
        </div>
        {rows.length === 0 ? (
          <div className="empty">
            <div className="empty__icon"><Icon name="check" /></div>
            <div className="empty__title">모든 가게가 180일 안에 확인됐어요</div>
            <div className="empty__desc">신선도 목표(80%)를 지키고 있어요.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr><th>가게</th><th>동</th><th className="cell--num">마지막 확인</th><th>상태</th><th>담당</th><th style={{ width: 230 }}>확인함</th></tr>
              </thead>
              <tbody>
                {rows.map(({ s, f, d }) => (
                  <tr key={s.id}>
                    <td className="cell--primary"><Link href={`/admin/stores/${s.id}`}>{s.name}</Link></td>
                    <td>{s.dong}</td>
                    <td className="cell--num u-muted">{s.lastConfirmedAt} · {d}일</td>
                    <td>{f === "expired" ? <span className="badge badge--danger">내림 (365일+)</span> : <span className="badge badge--warning">흐림 (180일+)</span>}</td>
                    <td>
                      <select className="select" style={{ width: 150 }} value={assignee[s.id] ?? ""} onChange={(e) => setAssignee({ ...assignee, [s.id]: e.target.value })} aria-label="담당 크루">
                        <option value="">맡길 사람</option>
                        {crew.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button type="button" className="btn btn--default btn--sm" onClick={() => confirm(s.id, "전화로")}>전화</button>
                        <button type="button" className="btn btn--default btn--sm" onClick={() => confirm(s.id, "방문해서")}>방문</button>
                        <button type="button" className="btn btn--default btn--sm" onClick={() => confirm(s.id, "지도 앱으로")}>지도 앱</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
