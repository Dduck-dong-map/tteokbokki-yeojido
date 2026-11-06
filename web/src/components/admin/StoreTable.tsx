"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { SAMPLE_NOW } from "@/lib/admin/sample";
import { REGIONS, SAMPLE_STORES } from "@/lib/data/sample-stores";
import { won } from "@/lib/filters";
import { daysSince, freshness } from "@/lib/freshness";
import { GRADES, STYLES } from "@/lib/taxonomy";
import { Stamp } from "./bits";
import { Icon } from "./Icon";

const STATE = {
  fresh: { label: "올라감", cls: "badge--success" },
  stale: { label: "흐림 (180일+)", cls: "badge--warning" },
  expired: { label: "내림 (365일+)", cls: "badge--danger" },
} as const;

// M-AD-03 가게 목록: 찾기 → 편집. 삭제는 없고 숨김·폐업만 (REQ-AD-09)
export default function StoreTable() {
  const view = useSearchParams().get("view");
  const [q, setQ] = useState("");
  const [gu, setGu] = useState("");
  const now = useMemo(() => new Date(SAMPLE_NOW), []);

  const rows = useMemo(
    () =>
      SAMPLE_STORES.map((s) => ({ s, f: freshness(s, now), d: daysSince(s.lastConfirmedAt, now) }))
        .filter(({ f }) => (view === "hidden" ? f === "expired" : true))
        .filter(({ s }) => (!gu || s.gu === gu) && (!q || s.name.includes(q) || s.dong.includes(q)))
        .sort((a, b) => b.d - a.d),
    [q, gu, view, now],
  );

  return (
    <div className="table-wrap">
      <div className="table-toolbar">
        <div className="input-search">
          <Icon name="search" />
          <input className="input" placeholder="가게 이름·동 찾기" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" style={{ width: 120 }} value={gu} onChange={(e) => setGu(e.target.value)} aria-label="지역">
          <option value="">모든 지역</option>
          {REGIONS.map((r) => (
            <option key={r.gu} value={r.gu}>{r.name}</option>
          ))}
        </select>
        <div className="table-toolbar__spacer" />
        <span className="u-caption">총 {rows.length}곳 · 오래 확인 안 한 순</span>
      </div>
      {rows.length === 0 ? (
        <div className="empty">
          <div className="empty__icon"><Icon name="search" /></div>
          <div className="empty__title">찾는 가게가 없어요</div>
          <div className="empty__desc">이름을 줄여서 찾거나, 제보 승인함에 새 가게 제보가 있는지 보세요.</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>가게</th>
                <th>등급</th>
                <th>동</th>
                <th>스타일</th>
                <th>맵기</th>
                <th className="cell--num">1인분</th>
                <th className="cell--num">마지막 확인</th>
                <th>상태</th>
                <th style={{ width: 120 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, f, d }) => (
                <tr key={s.id}>
                  <td className="cell--primary">
                    <Link href={`/admin/stores/${s.id}`}>{s.name}</Link>
                  </td>
                  <td>{GRADES[s.grade]}</td>
                  <td>{s.dong}</td>
                  <td>{STYLES[s.style]}</td>
                  <td><Stamp n={s.spice} /></td>
                  <td className="cell--num">{won(s.price)}</td>
                  <td className="cell--num u-muted">{s.lastConfirmedAt} · {d}일</td>
                  <td><span className={`badge ${STATE[f].cls}`}>{STATE[f].label}</span></td>
                  <td>
                    <div className="row-actions">
                      <Link href={`/admin/stores/${s.id}`}>편집</Link>
                      <Link href={`/store/${s.id}`} target="_blank">서비스</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination">
        <span className="pagination__info">1-{rows.length} / {rows.length}</span>
        <button type="button" className="page-btn" disabled>이전</button>
        <button type="button" className="page-btn is-active">1</button>
        <button type="button" className="page-btn" disabled>다음</button>
      </div>
    </div>
  );
}
