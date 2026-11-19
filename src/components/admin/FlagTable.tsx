"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ADMIN_FLAGS, FLAG_KIND_LABEL, ageText, type FlagKind } from "@/lib/admin/sample";
import type { Store } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CELL_MAIN, CELL_NUM, CELL_WRAP, Empty, LINK, LinkButton, StatusBadge, TableFrame, type Tone } from "./bits";
import { CheckField } from "./controls";

const KIND_TONE: Record<FlagKind, Tone> = { owner: "info", wrong: "warning", photo: "danger", system: "neutral" };
const ACTION: Record<FlagKind, string> = { owner: "가게 정보 고치기", wrong: "가게 정보 고치기", photo: "사진 내리기", system: "확인일 새로 고치기" };
const KINDS = ["all", "owner", "wrong", "photo", "system"] as const;

// M-AD-07 신고·요청: 사장님 요청 · 정보 신고 · 사진 신고 · 자동 알림. 48시간 안에 처리 (REQ-AD-11)
// stores = 가게 이름을 찾는 데 쓰는 예시 가게 (서버 페이지가 넘긴다)
export default function FlagTable({ stores }: { stores: Store[] }) {
  const [kind, setKind] = useState<FlagKind | "all">("all");
  const [flags, setFlags] = useState(ADMIN_FLAGS);
  const [showDone, setShowDone] = useState(false);
  const rows = flags.filter((f) => (kind === "all" || f.kind === kind) && (showDone || f.status === "open"));

  return (
    <TableFrame
      toolbar={
        <>
          <Tabs value={kind} onValueChange={(v) => setKind(v as FlagKind | "all")}>
            <TabsList variant="line">
              {KINDS.map((k) => (
                <TabsTrigger key={k} value={k} className="flex-none px-3">
                  {k === "all" ? "전체" : FLAG_KIND_LABEL[k]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex-1" />
          <CheckField checked={showDone} onChange={setShowDone}>
            처리한 것도 보기
          </CheckField>
        </>
      }
    >
      {rows.length === 0 ? (
        <Empty icon="check" title="처리할 신고·요청이 없어요" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">종류</TableHead>
              <TableHead>내용</TableHead>
              <TableHead>가게</TableHead>
              <TableHead className={CELL_NUM}>접수</TableHead>
              <TableHead className="w-56">
                <span className="sr-only">할 일</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((f) => {
              const s = stores.find((x) => x.id === f.storeId);
              const late = f.status === "open" && ageText(f.at).includes("일") && Number(ageText(f.at).replace(/\D/g, "")) >= 2;
              return (
                <TableRow key={f.id}>
                  <TableCell>
                    <StatusBadge tone={KIND_TONE[f.kind]}>{FLAG_KIND_LABEL[f.kind]}</StatusBadge>
                  </TableCell>
                  <TableCell className={cn(CELL_MAIN, CELL_WRAP)}>{f.summary}</TableCell>
                  <TableCell>
                    {s && (
                      <Link href={`/admin/stores/${s.id}`} className={LINK}>
                        {s.name}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className={cn(CELL_NUM, "text-muted-foreground")}>
                    <span className="inline-flex items-center gap-1.5">
                      {ageText(f.at)}
                      {late && <StatusBadge tone="danger">48시간 넘음</StatusBadge>}
                      {f.status === "done" && <StatusBadge tone="success">처리함</StatusBadge>}
                    </span>
                  </TableCell>
                  <TableCell>
                    {f.status === "open" && (
                      <span className="flex items-center gap-2">
                        {s && (
                          <LinkButton href={`/admin/stores/${s.id}`} variant="outlined" size="compact">
                            {ACTION[f.kind]}
                          </LinkButton>
                        )}
                        <Button type="button" variant="text" size="compact" onClick={() => setFlags(flags.map((x) => (x.id === f.id ? { ...x, status: "done" } : x)))}>
                          처리 완료
                        </Button>
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </TableFrame>
  );
}
