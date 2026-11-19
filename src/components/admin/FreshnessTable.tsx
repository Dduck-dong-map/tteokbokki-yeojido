"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SAMPLE_NOW, STAFF } from "@/lib/admin/sample";
import { daysSince, freshness } from "@/lib/freshness";
import type { Store } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CELL_MAIN, CELL_NUM, Empty, LINK, StatusBadge, TableFrame } from "./bits";
import { PickSelect, Toast, type Option } from "./controls";

// M-AD-05 신선도 점검: 180일 넘은 가게를 오래된 순으로. 확인하면 확인일이 오늘로 (REQ-AD-10)
// stores = 점검할 예시 가게 (서버 페이지가 넘긴다)
export default function FreshnessTable({ stores }: { stores: Store[] }) {
  const now = useMemo(() => new Date(SAMPLE_NOW), []);
  const [done, setDone] = useState<string[]>([]);
  const [assignee, setAssignee] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const crewOptions: Option[] = [{ value: "", label: "맡길 사람" }, ...STAFF.filter((s) => s.role !== "owner").map((c) => ({ value: c.name, label: c.name }))];

  const rows = stores
    .map((s) => ({ s, f: freshness(s, now), d: daysSince(s.lastConfirmedAt, now) }))
    .filter(({ f, s }) => f !== "fresh" && !done.includes(s.id))
    .sort((a, b) => b.d - a.d);

  const confirm = (id: string, how: string) => {
    setDone([...done, id]);
    setToast(`${how} 확인 · 확인일을 오늘로 새로 고쳤어요`);
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <>
      <TableFrame
        toolbar={
          <>
            <span className="font-medium text-foreground">확인이 필요한 가게</span>
            <div className="flex-1" />
            <span className="text-caption text-muted-foreground">흐림 = 180일 넘음 · 내림 = 365일 넘어 지도·목록에서 자동으로 내려감</span>
          </>
        }
      >
        {rows.length === 0 ? (
          <Empty icon="check" title="모든 가게가 180일 안에 확인됐어요" desc="신선도 목표(80%)를 지키고 있어요." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>가게</TableHead>
                <TableHead>동</TableHead>
                <TableHead className={CELL_NUM}>마지막 확인</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>담당</TableHead>
                <TableHead className="w-60">확인함</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ s, f, d }) => (
                <TableRow key={s.id}>
                  <TableCell className={CELL_MAIN}>
                    <Link href={`/admin/stores/${s.id}`} className={LINK}>
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell>{s.dong}</TableCell>
                  <TableCell className={cn(CELL_NUM, "text-muted-foreground")}>
                    {s.lastConfirmedAt} · {d}일
                  </TableCell>
                  <TableCell>{f === "expired" ? <StatusBadge tone="danger">내림 (365일+)</StatusBadge> : <StatusBadge tone="warning">흐림 (180일+)</StatusBadge>}</TableCell>
                  <TableCell>
                    <PickSelect value={assignee[s.id] ?? ""} onChange={(v) => setAssignee({ ...assignee, [s.id]: v })} options={crewOptions} ariaLabel={`${s.name} 담당 크루`} className="w-36" />
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Button type="button" variant="outlined" size="compact" onClick={() => confirm(s.id, "전화로")}>
                        전화
                      </Button>
                      <Button type="button" variant="outlined" size="compact" onClick={() => confirm(s.id, "방문해서")}>
                        방문
                      </Button>
                      <Button type="button" variant="outlined" size="compact" onClick={() => confirm(s.id, "지도 앱으로")}>
                        지도 앱
                      </Button>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableFrame>
      {toast && <Toast>{toast}</Toast>}
    </>
  );
}
