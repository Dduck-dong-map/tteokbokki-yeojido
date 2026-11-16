"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { importDataset } from "@/app/admin/actions";
import type { Dataset } from "@/lib/data/datasets";
import { won } from "@/lib/filters";
import { STYLES } from "@/lib/taxonomy";
import { Stamp } from "./bits";
import { Icon } from "./Icon";

type Row = Dataset["stores"][number] & { inDb: boolean };

// M-AD-06 자료 묶음 넣기 (11-15). 넣을 수 있는 가게(빈 칸 없음 · 아직 DB 에 없음)만 넣고, 이미 있는 가게는 덮어쓰지 않는다.
export default function DatasetImport({ dataset, inDb }: { dataset: Dataset; inDb: string[] }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const have = new Set(inDb);
  const rows: Row[] = dataset.stores.map((r) => ({ ...r, inDb: have.has(r.id) }));
  const ready = rows.filter((r) => !r.inDb && !r.missing.length);
  const gaps = rows.filter((r) => !r.inDb && r.missing.length);
  const done = rows.filter((r) => r.inDb);

  const run = (ids?: string[]) =>
    start(async () => {
      setMsg(null);
      const r = await importDataset(dataset.id, ids);
      if (!r.ok) return setMsg({ kind: "err", text: r.error });
      const skipped = r.skipped.filter((s) => s.why !== "이미 있음");
      setMsg({ kind: "ok", text: `${r.added.length}곳을 넣었어요${skipped.length ? ` · 못 넣은 곳 ${skipped.length}곳 (${skipped.map((s) => `${s.id}: ${s.why}`).join(" / ")})` : ""}` });
      router.refresh();
    });

  return (
    <div className="card u-mb-4">
      <div className="card__head">
        <h3 className="card__title">
          {dataset.title} <span className="badge badge--outline u-mono">{dataset.at}</span>
        </h3>
        <div className="card__actions">
          <button type="button" className="btn btn--primary btn--sm" disabled={busy || !ready.length} onClick={() => run(ready.map((r) => r.id))}>
            <Icon name="download" /> {busy ? "넣는 중…" : ready.length ? `넣을 수 있는 ${ready.length}곳 모두 넣기` : "넣을 가게 없음"}
          </button>
        </div>
      </div>
      <div className="card__body">
        <div className="stat-grid u-mb-4">
          <div className="stat"><div className="stat__label">자료</div><div className="stat__value">{rows.length}곳</div><div className="stat__delta">공개된 사실만 · 리뷰 글·별점은 안 가져옴</div></div>
          <div className="stat"><div className="stat__label">DB 에 있음</div><div className="stat__value">{done.length}곳</div><div className="stat__delta">다시 넣지 않아요 (덮어쓰기 없음)</div></div>
          <div className="stat"><div className="stat__label">넣을 수 있음</div><div className="stat__value">{ready.length}곳</div><div className="stat__delta">빈 칸 없음</div></div>
          <div className="stat"><div className="stat__label">빈 칸 남음</div><div className="stat__value">{gaps.length}곳</div><div className="stat__delta">채워서 등록</div></div>
        </div>
        {msg && (
          <div className={`alert ${msg.kind === "ok" ? "alert--success" : "alert--danger"} u-mb-4`} role="status">
            <Icon name={msg.kind === "ok" ? "check" : "alert"} />
            <div>{msg.text}</div>
          </div>
        )}
        <div style={{ overflowX: "auto" }}>
          <table className="table table--compact">
            <thead>
              <tr><th>가게</th><th>동</th><th>스타일</th><th>맵기</th><th className="cell--num">1인분</th><th>확신도</th><th className="cell--num">최근 근거</th><th>상태</th><th style={{ width: 120 }} /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="cell--primary">{r.store.name}</td>
                  <td>{r.store.dong}</td>
                  <td>{r.store.style ? STYLES[r.store.style] : <span className="u-muted">?</span>}</td>
                  <td>{r.store.spice ? <Stamp n={r.store.spice} /> : <span className="u-muted">?</span>}</td>
                  <td className="cell--num">{r.store.price ? won(r.store.price) : <span className="u-muted">?</span>}</td>
                  <td>{r.research.confidence === "high" ? "높음" : "보통"}{r.research.geo === "rough" && <span className="badge badge--warning" style={{ marginLeft: 4 }}>핀 확인</span>}</td>
                  <td className="cell--num u-muted">{r.research.lastEvidence ?? "—"}</td>
                  <td>
                    {r.inDb ? <span className="badge badge--success">DB 에 있음</span> : r.missing.length ? <span className="badge badge--warning">빈 칸: {r.missing.join("·")}</span> : <span className="badge badge--info">넣을 수 있음</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      {r.inDb ? (
                        <Link href={`/admin/stores/${r.id}`}>편집</Link>
                      ) : r.missing.length ? (
                        <Link href={`/admin/stores/new?from=${dataset.id}&row=${r.id}`}>채워서 등록</Link>
                      ) : (
                        <button type="button" className="btn btn--text btn--sm" disabled={busy} onClick={() => run([r.id])}>넣기</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="field__hint u-mt-2">좌표 = {dataset.geocoder} · 원본 표 {dataset.doc}</p>
      </div>
    </div>
  );
}
