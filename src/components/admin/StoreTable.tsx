"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { won } from "@/lib/filters";
import { daysSince, freshness } from "@/lib/freshness";
import { GRADES, STYLES } from "@/lib/taxonomy";
import type { Region, Store } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CELL_MAIN, CELL_NUM, Empty, LINK, Stamp, StatusBadge, TableFrame, type Tone } from "./bits";
import { PickSelect, SearchInput, type Option } from "./controls";
import { Icon } from "./Icon";

const FRESH: Record<"fresh" | "stale" | "expired", { label: string; tone: Tone }> = {
  fresh: { label: "올라감", tone: "success" },
  stale: { label: "흐림 (180일+)", tone: "warning" },
  expired: { label: "내림 (365일+)", tone: "danger" },
};

type Show = "all" | "active" | "down";
const SHOW_OPTIONS: Option<Show>[] = [
  { value: "all", label: "모든 상태" },
  { value: "active", label: "지도에 보임" },
  { value: "down", label: "내림·숨김·폐업" },
];

// M-AD-03 가게 목록 (11-15 실제 DB): 찾기 → 편집. 삭제는 없고 숨김·폐업만 (REQ-AD-09)
export default function StoreTable({ stores, regions, now: nowIso }: { stores: Store[]; regions: Region[]; now: string }) {
  const view = useSearchParams().get("view");
  const [q, setQ] = useState("");
  const [gu, setGu] = useState("");
  const [show, setShow] = useState<Show>(view === "hidden" ? "down" : "all");
  const now = useMemo(() => new Date(nowIso), [nowIso]);

  const rows = useMemo(() => {
    const words = q.trim();
    return stores
      .map((s) => ({ s, f: freshness(s, now), d: daysSince(s.lastConfirmedAt, now), st: s.status ?? "active" }))
      .filter(({ f, st }) => show === "all" || (show === "active" ? st === "active" && f !== "expired" : st !== "active" || f === "expired"))
      .filter(({ s }) => (!gu || s.gu === gu) && (!words || s.name.includes(words) || s.dong.includes(words) || s.address.includes(words) || s.id.includes(words)))
      .sort((a, b) => b.d - a.d);
  }, [stores, q, gu, show, now]);

  const guOptions: Option[] = [{ value: "", label: "모든 지역" }, ...regions.map((r) => ({ value: r.gu, label: r.name })), { value: "etc", label: "기타" }];

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
    <TableFrame
      toolbar={
        <>
          <SearchInput value={q} onChange={setQ} placeholder="이름·동·주소·id 찾기" />
          <PickSelect value={gu} onChange={setGu} options={guOptions} ariaLabel="지역" className="w-32" />
          <PickSelect value={show} onChange={setShow} options={SHOW_OPTIONS} ariaLabel="상태" className="w-36" />
          <div className="flex-1" />
          <span className="text-caption text-muted-foreground">총 {rows.length}곳 · 오래 확인 안 한 순</span>
          <Button type="button" variant="outlined" size="compact" onClick={exportJson} disabled={!rows.length}>
            <Icon name="download" /> 내보내기
          </Button>
        </>
      }
    >
      {rows.length === 0 ? (
        <Empty
          icon="search"
          title="찾는 가게가 없어요"
          desc={stores.length ? "이름을 줄여서 찾거나, 위의 고르기를 바꿔 보세요." : "아직 가게가 없어요. 「후보 가져오기」에서 강남 리서치 자료를 넣을 수 있어요."}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>가게</TableHead>
              <TableHead>등급</TableHead>
              <TableHead>동</TableHead>
              <TableHead>스타일</TableHead>
              <TableHead>맵기</TableHead>
              <TableHead className={CELL_NUM}>1인분</TableHead>
              <TableHead className={CELL_NUM}>마지막 확인</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="w-32">
                <span className="sr-only">바로가기</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ s, f, d, st }) => (
              <TableRow key={s.id}>
                <TableCell className={CELL_MAIN}>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/admin/stores/${s.id}`} className={LINK}>
                      {s.name}
                    </Link>
                  </span>
                </TableCell>
                <TableCell>{GRADES[s.grade]}</TableCell>
                <TableCell>{s.dong}</TableCell>
                <TableCell>{STYLES[s.style]}</TableCell>
                <TableCell>
                  <Stamp n={s.spice} />
                </TableCell>
                <TableCell className={CELL_NUM}>{won(s.price)}</TableCell>
                <TableCell className={cn(CELL_NUM, "text-muted-foreground")}>
                  {s.lastConfirmedAt} · {d}일
                </TableCell>
                <TableCell>{st === "hidden" ? <StatusBadge>숨김</StatusBadge> : st === "closed" ? <StatusBadge tone="danger">폐업</StatusBadge> : <StatusBadge tone={FRESH[f].tone}>{FRESH[f].label}</StatusBadge>}</TableCell>
                <TableCell>
                  {/* 예전에는 줄에 마우스를 올려야 보였다. 터치 · 키보드에서도 쓰게 늘 보인다 */}
                  <span className="flex gap-3 whitespace-nowrap">
                    <Link href={`/admin/stores/${s.id}`} className={LINK}>
                      편집
                    </Link>
                    <Link href={`/store/${s.id}`} target="_blank" className={LINK}>
                      서비스
                    </Link>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableFrame>
  );
}
