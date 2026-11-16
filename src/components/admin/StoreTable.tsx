"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { won } from "@/lib/filters";
import { daysSince, freshness } from "@/lib/freshness";
import { GRADES, STYLES } from "@/lib/taxonomy";
import type { Region, Store } from "@/lib/types";
import { Stamp } from "./bits";
import { Icon } from "./Icon";

const FRESH = {
  fresh: { label: "올라감", cls: "badge--success" },
  stale: { label: "흐림 (180일+)", cls: "badge--warning" },
  expired: { label: "내림 (365일+)", cls: "badge--danger" },
} as const;

type Show = "all" | "active" | "down";
type Kind = "real" | "sample" | "both";

// M-AD-03 가게 목록 (11-15 실제 DB): 찾기 → 편집. 삭제는 없고 숨김·폐업만 (REQ-AD-09)
// 예시 가게(isSample)는 「예시」 표시 — 실제 가게를 넣은 뒤엔 기본으로 실제 가게만 보인다.
export default function StoreTable({ stores, regions, now: nowIso }: { stores: Store[]; regions: Region[]; now: string }) {
  const view = useSearchParams().get("view");
  const hasReal = stores.some((s) => !s.isSample);
  const [q, setQ] = useState("");
  const [gu, setGu] = useState("");
  const [show, setShow] = useState<Show>(view === "hidden" ? "down" : "all");
  const [kind, setKind] = useState<Kind>(hasReal ? "real" : "both");
  const now = useMemo(() => new Date(nowIso), [nowIso]);

  const rows = useMemo(() => {
    const words = q.trim();
    return stores
      .map((s) => ({ s, f: freshness(s, now), d: daysSince(s.lastConfirmedAt, now), st: s.status ?? "active" }))
      .filter(({ s }) => kind === "both" || (kind === "sample" ? s.isSample : !s.isSample))
      .filter(({ f, st }) => show === "all" || (show === "active" ? st === "active" && f !== "expired" : st !== "active" || f === "expired"))
      .filter(({ s }) => (!gu || s.gu === gu) && (!words || s.name.includes(words) || s.dong.includes(words) || s.address.includes(words) || s.id.includes(words)))
      .sort((a, b) => b.d - a.d);
  }, [stores, q, gu, show, kind, now]);

  // 내보내기: 지금 보이는 가게를 JSON 파일로 (팀 공유·백업용)
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(rows.map((r) => r.s), null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `떡볶여지도_가게_${nowIso.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="table-wrap">
      <div className="table-toolbar" style={{ flexWrap: "wrap" }}>
        <div className="input-search">
          <Icon name="search" />
          <input className="input" placeholder="이름·동·주소·id 찾기" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select" style={{ width: 120 }} value={gu} onChange={(e) => setGu(e.target.value)} aria-label="지역">
          <option value="">모든 지역</option>
          {regions.map((r) => (
            <option key={r.gu} value={r.gu}>{r.name}</option>
          ))}
          <option value="etc">기타</option>
        </select>
        <select className="select" style={{ width: 130 }} value={show} onChange={(e) => setShow(e.target.value as Show)} aria-label="상태">
          <option value="all">모든 상태</option>
          <option value="active">지도에 보임</option>
          <option value="down">내림·숨김·폐업</option>
        </select>
        <select className="select" style={{ width: 130 }} value={kind} onChange={(e) => setKind(e.target.value as Kind)} aria-label="실제·예시">
          <option value="real">실제 가게</option>
          <option value="sample">예시 가게</option>
          <option value="both">실제 + 예시</option>
        </select>
        <div className="table-toolbar__spacer" />
        <span className="u-caption">총 {rows.length}곳 · 오래 확인 안 한 순</span>
        <button type="button" className="btn btn--default btn--sm" onClick={exportJson} disabled={!rows.length}>
          <Icon name="download" /> 내보내기
        </button>
      </div>
      {rows.length === 0 ? (
        <div className="empty">
          <div className="empty__icon"><Icon name="search" /></div>
          <div className="empty__title">찾는 가게가 없어요</div>
          <div className="empty__desc">
            {hasReal ? "이름을 줄여서 찾거나, 위의 고르기를 바꿔 보세요." : "아직 실제 가게가 없어요. 「후보 가져오기」에서 강남 리서치 자료를 넣을 수 있어요."}
          </div>
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
              {rows.map(({ s, f, d, st }) => (
                <tr key={s.id}>
                  <td className="cell--primary">
                    <Link href={`/admin/stores/${s.id}`}>{s.name}</Link>
                    {s.isSample && <span className="badge badge--outline" style={{ marginLeft: 6 }}>예시</span>}
                  </td>
                  <td>{GRADES[s.grade]}</td>
                  <td>{s.dong}</td>
                  <td>{STYLES[s.style]}</td>
                  <td><Stamp n={s.spice} /></td>
                  <td className="cell--num">{won(s.price)}</td>
                  <td className="cell--num u-muted">{s.lastConfirmedAt} · {d}일</td>
                  <td>
                    {st === "hidden" ? <span className="badge">숨김</span> : st === "closed" ? <span className="badge badge--danger">폐업</span> : <span className={`badge ${FRESH[f].cls}`}>{FRESH[f].label}</span>}
                  </td>
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
    </div>
  );
}
