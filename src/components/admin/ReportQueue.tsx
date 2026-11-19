"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ADMIN_REPORTS, FLAG_LABEL, KIND_LABEL, REJECT_REASONS, ageText, type AdminReport, type ReportFields } from "@/lib/admin/sample";
import { won } from "@/lib/filters";
import { hoursText } from "@/lib/freshness";
import { RICE_CAKES, STYLES } from "@/lib/taxonomy";
import type { Store } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Empty, Field, Kbd, KeyValue, LINK, LinkButton, Notice, Panel, Stamp, StatusBadge, TableFrame, type Tone } from "./bits";
import { CheckField, RadioList, Toast } from "./controls";

type Tab = "pending" | "agree" | "done";
const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "승인 대기" },
  { key: "agree", label: "동의 대기" },
  { key: "done", label: "처리 완료" },
];

const KIND_TONE: Record<AdminReport["kind"], Tone> = { new: "info", edit: "neutral", closed: "danger" };
const CLOSE_METHODS = ["가게에 전화", "지도 앱 거리뷰·리뷰", "크루가 방문"];

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

// stores = 가게 이름 · 지금 값을 찾는 데 쓰는 예시 가게 (서버 페이지가 넘긴다 — 클라이언트 부품이 @/lib/data 를 직접 가져오지 않는다)
export default function ReportQueue({ stores }: { stores: Store[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const tab = (params.get("tab") as Tab) || "pending";

  const [items, setItems] = useState<AdminReport[]>(ADMIN_REPORTS);
  const [selected, setSelected] = useState<number | null>(null);
  const [checks, setChecks] = useState<Record<number, boolean[]>>({});
  const [method, setMethod] = useState<Record<number, string>>({});
  // 반려 팝업: 열림과 대상을 따로 든다 (닫히는 동안 내용이 사라지지 않게)
  const [rejecting, setRejecting] = useState<AdminReport | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [blockDevice, setBlockDevice] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const storeOf = (id?: string) => stores.find((s) => s.id === id);
  const titleOf = (r: AdminReport) => r.fields.name ?? storeOf(r.storeId)?.name ?? `제보 #${r.id}`;

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
    setRejectOpen(true);
  };

  // 키보드: A 승인 · R 반려 · J/K 아래·위 (REQ-AD-16, 하루 20분 목표). 칸(글 입력 · 체크 · 고르기)을 만지는 동안에는 듣지 않는다
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (rejectOpen || (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [role=checkbox], [role=radio], [role=combobox], [role=tab]"))) return;
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

  const detailRows: [ReactNode, ReactNode][] = current
    ? [
        ["제보 번호", <span key="id" className="font-mono">#{current.id}</span>],
        ["접수", `${current.at} (${ageText(current.at)})`],
        [
          "보낸 기기",
          <span key="device">
            <span className="font-mono">{current.device}…</span> <span className="text-caption text-muted-foreground">(해시 일부 · 사람은 알 수 없음)</span>
          </span>,
        ],
        ...(current.photo ? [["사진", "1장 (시안에는 없음)"] as [ReactNode, ReactNode]] : []),
        ...(current.handledBy ? [["처리", `${current.handledBy}${current.rejectReason ? ` · 반려 사유: ${current.rejectReason}` : ""}`] as [ReactNode, ReactNode]] : []),
      ]
    : [];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList variant="line">
            {TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="flex-none px-3">
                {t.label} {t.key !== "done" && <span className="text-muted-foreground tabular-nums">{items.filter((r) => r.status === t.key).length}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <span className="flex-1" />
        <span className="hidden items-center gap-1 text-caption text-muted-foreground sm:flex">
          <Kbd>J</Kbd>/<Kbd>K</Kbd> 이동 · <Kbd>A</Kbd> 승인 · <Kbd>R</Kbd> 반려
        </span>
      </div>

      {/* 왼쪽 목록 · 오른쪽 상세. 1024px 미만에서는 하나씩: 고르면 상세만, 「목록으로」를 누르면 목록만 */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(17.5rem,23.75rem)_1fr]">
        <Panel flush className={cn(current && "max-lg:hidden")}>
          {list.length === 0 ? (
            <Empty icon="inbox" title={tab === "pending" ? "오늘 할 일 끝!" : "비어 있어요"} desc={tab === "pending" ? "승인 대기 제보가 없어요. 신고·요청함을 확인해 보세요." : "여기에 올 제보가 아직 없어요."}>
              {tab === "pending" && (
                <LinkButton href="/admin/flags" variant="outlined">
                  신고·요청 보기
                </LinkButton>
              )}
            </Empty>
          ) : (
            list.map((r) => {
              const on = r.id === selected;
              return (
                // 줄 전체가 단추. 고른 줄은 왼쪽 막대 + 옅은 옥빛 바탕 + aria-current 로 알린다
                <Button
                  key={r.id}
                  type="button"
                  variant="ghost"
                  aria-current={on ? "true" : undefined}
                  onClick={() => setSelected(r.id)}
                  className={cn(
                    "h-auto w-full flex-col items-stretch justify-start gap-0.5 rounded-none border-0 border-b border-l-4 border-border border-l-transparent px-4 py-3 text-left text-body-small font-normal whitespace-normal last:border-b-0 hover:bg-ghost-hover",
                    on && "border-l-primary bg-secondary hover:bg-secondary-hover",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <StatusBadge tone={KIND_TONE[r.kind]}>{KIND_LABEL[r.kind]}</StatusBadge>
                    <span className="truncate font-medium text-foreground">{titleOf(r)}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                    <span>#{r.id}</span>
                    <span>{ageText(r.at)}</span>
                    {r.status === "agree" && <span>동의 {r.agreements}/2</span>}
                    {r.status === "auto" && <StatusBadge tone="success">자동 반영</StatusBadge>}
                    {r.status === "approved" && <StatusBadge tone="success">승인</StatusBadge>}
                    {r.status === "rejected" && <StatusBadge tone="danger">반려</StatusBadge>}
                    {r.flags?.map((f) => (
                      <StatusBadge key={f} tone={f === "spam_device" ? "danger" : "warning"}>
                        {FLAG_LABEL[f]}
                      </StatusBadge>
                    ))}
                  </span>
                </Button>
              );
            })
          )}
        </Panel>

        <div className={cn(!current && "max-lg:hidden")}>
          {!current ? (
            <Panel>
              <Empty icon="arrow-right" title="왼쪽에서 제보를 고르세요" desc="J 를 누르면 맨 위 제보부터 열려요." />
            </Panel>
          ) : (
            <Panel
              title={
                <span className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={KIND_TONE[current.kind]}>{KIND_LABEL[current.kind]}</StatusBadge> {titleOf(current)}
                </span>
              }
              actions={
                <Button type="button" variant="text" size="compact" onClick={() => setSelected(null)}>
                  목록으로
                </Button>
              }
              footer={
                current.status === "pending" ? (
                  <>
                    <Button type="button" variant="outlined" size="md" onClick={() => openReject(current)}>
                      반려 <Kbd>R</Kbd>
                    </Button>
                    {current.kind !== "closed" &&
                      (current.kind === "edit" && store ? (
                        <LinkButton href={`/admin/stores/${store.id}?from=${current.id}`} variant="outlined">
                          고쳐서 승인
                        </LinkButton>
                      ) : (
                        <Button type="button" variant="outlined" size="md" onClick={() => flash("고쳐서 승인: 가게 편집 화면(M-AD-04)에서 값을 고친 뒤 승인해요 (시안에서는 생략)")}>
                          고쳐서 승인
                        </Button>
                      ))}
                    <Button type="button" variant="filled" size="md" disabled={!canApprove(current)} onClick={() => approve(current)}>
                      {current.kind === "new" ? "승인하고 지도에 올리기" : current.kind === "closed" ? "폐업 처리" : "승인해서 반영"} <Kbd>A</Kbd>
                    </Button>
                  </>
                ) : current.status === "agree" ? (
                  <>
                    <Button type="button" variant="outlined" size="md" onClick={() => finish(current, "pending", "막았어요. 승인 대기로 옮겼어요")}>
                      막기 (승인 대기로)
                    </Button>
                    <Button type="button" variant="filled" size="md" onClick={() => approve(current)}>
                      지금 반영
                    </Button>
                  </>
                ) : undefined
              }
            >
              <KeyValue items={detailRows} className="mb-4" />

              {current.flags?.includes("many_same") && (
                <Notice>
                  같은 폐업 신고가 <b>{current.sameCount}건</b> 모였어요. 그래서 맨 위에 올라왔어요.
                </Notice>
              )}
              {current.flags?.includes("dup_suspect") && dupStore && (
                <Notice tone="warning">
                  150m 안에 비슷한 이름의 가게가 있어요: <b>{dupStore.name}</b>. 같은 가게면 새로 올리지 말고 기존 가게에 합치세요.
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <LinkButton href={`/admin/stores/${dupStore.id}`} variant="outlined" size="compact">
                      기존 가게 보기
                    </LinkButton>
                    <Button type="button" variant="outlined" size="compact" onClick={() => finish(current, "rejected", "기존 가게에 합쳤어요", { rejectReason: "이미 있는 가게(중복)" })}>
                      기존 가게에 합치기
                    </Button>
                  </div>
                </Notice>
              )}
              {current.flags?.includes("spam_device") && (
                <Notice tone="danger">
                  이 기기는 오늘 <b>11건</b>을 보냈어요. 하루 한도(10건)를 넘어서 새 제보는 자동으로 막혔어요.
                </Notice>
              )}

              {current.kind === "closed" && store && (
                <>
                  <KeyValue
                    className="mb-4"
                    items={[
                      [
                        "가게",
                        <Link key="store" href={`/admin/stores/${store.id}`} className={LINK}>
                          {store.name}
                        </Link>,
                      ],
                      ["마지막 확인", store.lastConfirmedAt],
                    ]}
                  />
                  {current.status === "pending" && (
                    <Field label="어떻게 확인했나요?" required hint="폐업 처리하면 지도·목록에서 내려가요. 나중에 「아직 있어요」가 들어오면 자동 알림이 와요." className="mb-4">
                      <RadioList row ariaLabel="어떻게 확인했나요?" value={method[current.id] ?? ""} onChange={(m) => setMethod({ ...method, [current.id]: m })} options={CLOSE_METHODS} />
                    </Field>
                  )}
                </>
              )}

              {current.kind !== "closed" && (
                <TableFrame className="mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">항목</TableHead>
                        {current.kind === "edit" && <TableHead>지금</TableHead>}
                        <TableHead>{current.kind === "edit" ? "제보" : "제보 내용"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fieldRows(current.fields, current.kind === "edit" ? store : undefined).map((row) => (
                        <TableRow key={row.label}>
                          <TableCell className="text-muted-foreground">{row.label}</TableCell>
                          {current.kind === "edit" && <TableCell className="whitespace-normal">{row.label === "맵기" && store ? <Stamp n={store.spice} /> : row.now}</TableCell>}
                          {/* 고치자는 값(제보 열)은 옅은 갈색 바탕으로도 띄운다. 열 제목 「제보」가 뜻을 말한다 */}
                          <TableCell className={cn("whitespace-normal", current.kind === "edit" && "bg-report/10 font-medium text-foreground")}>{row.label === "맵기" ? <Stamp n={Number(row.next)} /> : row.next}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableFrame>
              )}

              {current.status === "agree" && (
                <Notice>
                  가격·맵기 수정은 다른 기기 2곳이 「맞아요」를 누르면 자동으로 반영돼요. 지금 <b>{current.agreements}/2</b>. 이상하면 「막기」로 승인 대기에 넣으세요.
                </Notice>
              )}
              {current.status === "auto" && <Notice tone="success">동의 2곳이 모여 자동 반영됐어요. 잘못됐으면 가게 편집의 변경 이력에서 되돌리세요.</Notice>}

              {current.kind === "new" && current.status === "pending" && (
                <Field label="승인 전 확인" required>
                  <div className="grid gap-2">
                    {NEW_CHECKS.map((c, i) => (
                      <CheckField
                        key={c}
                        checked={!!checks[current.id]?.[i]}
                        onChange={(on) => {
                          const arr = [...(checks[current.id] ?? NEW_CHECKS.map(() => false))];
                          arr[i] = on;
                          setChecks({ ...checks, [current.id]: arr });
                        }}
                      >
                        {c}
                      </CheckField>
                    ))}
                  </div>
                </Field>
              )}
            </Panel>
          )}
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            {/* 팝업은 어드민 틀 밖에 그려진다 — 어드민 제목 글꼴(Pretendard)을 여기서 준다 */}
            <DialogTitle className="font-sans">#{rejecting?.id} 반려</DialogTitle>
            <DialogDescription>익명 제보라 보낸 사람에게 알릴 수는 없어요. 사유는 통계와 도배 판단에 써요.</DialogDescription>
          </DialogHeader>
          <RadioList ariaLabel="반려 사유" value={reason} onChange={setReason} options={REJECT_REASONS} />
          {reason === "장난·도배" && (
            <CheckField checked={blockDevice} onChange={setBlockDevice}>
              이 기기({rejecting?.device}…) 7일 동안 제보 막기
            </CheckField>
          )}
          <DialogFooter>
            <Button type="button" variant="outlined" size="md" onClick={() => setRejectOpen(false)}>
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="md"
              disabled={!reason || !rejecting}
              onClick={() => {
                if (!rejecting) return;
                finish(rejecting, "rejected", blockDevice ? "반려하고 기기를 7일 막았어요" : "반려했어요", { rejectReason: reason });
                setRejectOpen(false);
              }}
            >
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && <Toast>{toast}</Toast>}
    </>
  );
}
