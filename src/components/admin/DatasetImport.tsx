"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { importDataset } from "@/app/admin/actions";
import type { Dataset } from "@/lib/data/datasets";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { won } from "@/lib/filters";
import { STYLES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { CELL_MAIN, CELL_NUM, IdBadge, LINK, Notice, Panel, Stamp, Stat, StatusBadge, TableFrame } from "./bits";
import { Icon } from "./Icon";

const UNKNOWN = <span className="text-muted-foreground">?</span>;

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
    <Panel
      className="mb-4"
      title={
        <span className="flex flex-wrap items-center gap-2">
          {dataset.title} <IdBadge>{dataset.at}</IdBadge>
        </span>
      }
      actions={
        // 자료 묶음마다 하나씩 있는 단추라 옥빛 채움(화면에 하나) 대신 옅은 옥빛으로 둔다
        <Button type="button" variant="tonal" size="compact" disabled={busy || !ready.length} onClick={() => run(ready.map((r) => r.id))}>
          <Icon name="download" /> {busy ? "넣는 중…" : ready.length ? `넣을 수 있는 ${ready.length}곳 모두 넣기` : "넣을 가게 없음"}
        </Button>
      }
    >
      <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-4">
        <Stat label="자료" value={`${rows.length}곳`}>공개된 사실만 · 리뷰 글·별점은 안 가져옴</Stat>
        <Stat label="DB 에 있음" value={`${done.length}곳`}>다시 넣지 않아요 (덮어쓰기 없음)</Stat>
        <Stat label="넣을 수 있음" value={`${ready.length}곳`}>빈 칸 없음</Stat>
        <Stat label="빈 칸 남음" value={`${gaps.length}곳`}>채워서 등록</Stat>
      </div>
      {msg && (
        <Notice tone={msg.kind === "ok" ? "success" : "danger"} role="status">
          {msg.text}
        </Notice>
      )}
      <TableFrame compact>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>가게</TableHead>
              <TableHead>동</TableHead>
              <TableHead>스타일</TableHead>
              <TableHead>맵기</TableHead>
              <TableHead className={CELL_NUM}>1인분</TableHead>
              <TableHead>확신도</TableHead>
              <TableHead className={CELL_NUM}>최근 근거</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="w-28">
                <span className="sr-only">할 일</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className={CELL_MAIN}>{r.store.name}</TableCell>
                <TableCell>{r.store.dong}</TableCell>
                <TableCell>{r.store.style ? STYLES[r.store.style] : UNKNOWN}</TableCell>
                <TableCell>{r.store.spice ? <Stamp n={r.store.spice} /> : UNKNOWN}</TableCell>
                <TableCell className={CELL_NUM}>{r.store.price ? won(r.store.price) : UNKNOWN}</TableCell>
                <TableCell>
                  <span className="flex flex-wrap items-center gap-1">
                    {r.research.confidence === "high" ? "높음" : "보통"}
                    {r.research.geo === "rough" && <StatusBadge tone="warning">핀 확인</StatusBadge>}
                  </span>
                </TableCell>
                <TableCell className={cn(CELL_NUM, "text-muted-foreground")}>{r.research.lastEvidence ?? "—"}</TableCell>
                <TableCell>
                  {r.inDb ? <StatusBadge tone="success">DB 에 있음</StatusBadge> : r.missing.length ? <StatusBadge tone="warning">빈 칸: {r.missing.join("·")}</StatusBadge> : <StatusBadge tone="info">넣을 수 있음</StatusBadge>}
                </TableCell>
                <TableCell>
                  {r.inDb ? (
                    <Link href={`/admin/stores/${r.id}`} className={cn(LINK, "whitespace-nowrap")}>
                      편집
                    </Link>
                  ) : r.missing.length ? (
                    <Link href={`/admin/stores/new?from=${dataset.id}&row=${r.id}`} className={cn(LINK, "whitespace-nowrap")}>
                      채워서 등록
                    </Link>
                  ) : (
                    <Button type="button" variant="text" size="compact" disabled={busy} onClick={() => run([r.id])}>
                      넣기
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableFrame>
      <p className="mt-2 text-caption text-muted-foreground">
        좌표 = {dataset.geocoder} · 원본 표 {dataset.doc}
      </p>
    </Panel>
  );
}
