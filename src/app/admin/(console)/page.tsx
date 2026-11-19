import Link from "next/link";
import AdminGate, { AdminOnly } from "@/components/admin/AdminGate";
import { CELL_MAIN, LinkButton, Meter, PageHeader, Panel, ProtoNote, Stat, TableFrame } from "@/components/admin/bits";
import { Icon } from "@/components/admin/Icon";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ADMIN_FLAGS, ADMIN_REPORTS, AUDIT_LOG, SAMPLE_NOW, ageText } from "@/lib/admin/sample";
import { REGIONS, SAMPLE_STORES } from "@/lib/data/sample-stores";
import { freshness } from "@/lib/freshness";

export const metadata = { title: "오늘 할 일" };

// M-AD-01 홈 · 오늘 할 일: 하루 20분 안에 끝낼 일을 한 화면에 (REQ-AD-15)
export default function AdminHome() {
  const now = new Date(SAMPLE_NOW);
  const pending = ADMIN_REPORTS.filter((r) => r.status === "pending");
  const agree = ADMIN_REPORTS.filter((r) => r.status === "agree");
  const flags = ADMIN_FLAGS.filter((f) => f.status === "open");
  const stale = SAMPLE_STORES.filter((s) => freshness(s, now) !== "fresh");
  const fresh = SAMPLE_STORES.filter((s) => freshness(s, now) === "fresh").length;
  const oldest = pending.reduce((a, r) => (r.at < a ? r.at : a), pending[0]?.at ?? SAMPLE_NOW);

  const todos = [
    { n: pending.length, label: "승인 대기 제보", sub: `가장 오래된 것 ${ageText(oldest)} · 같은 내용 3건 묶음 1개`, href: "/admin/reports" },
    { n: flags.length, label: "신고·요청", sub: "사장님 요청 1 · 사진 신고 1 · 자동 알림 1", href: "/admin/flags" },
    { n: stale.length, label: "확인이 필요한 가게", sub: "마지막 확인 180일 넘음 (365일 넘으면 자동으로 내려감)", href: "/admin/freshness" },
    { n: agree.length, label: "동의 대기 수정 (보기만)", sub: "가격·맵기는 다른 기기 2곳이 동의하면 자동 반영", href: "/admin/reports?tab=agree" },
  ];

  return (
    <>
      <PageHeader id="M-AD-01" title="오늘 할 일" desc="제보 승인 → 신고 처리 → 신선도 점검 순서로 하면 하루 20분 안에 끝나요.">
        {/* 누를 수 있는 것은 열쇠 검사 뒤에만 (잠겼으면 안 보인다) */}
        <AdminOnly>
          <LinkButton href="/admin/reports" variant="filled">
            <Icon name="inbox" /> 승인 시작
          </LinkButton>
        </AdminOnly>
      </PageHeader>
      <AdminGate>
        <ProtoNote />

        <div className="grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-4">
          <Stat label="승인 대기" value={pending.length}>
            가장 오래된 것 {ageText(oldest)}
          </Stat>
          <Stat label="제보 처리 시간 (중앙값, 7일)" value="9시간">
            목표 24시간 이내 · 예시 값
          </Stat>
          <Stat label="정보 신선도" value={`${Math.round((fresh / SAMPLE_STORES.length) * 100)}%`}>
            확인 180일 이내 가게 · 목표 80%
          </Stat>
          <Stat label="이번 주 승인 뒤 되돌림" value="0건">
            가드레일 · 3% 넘으면 승인 기준 점검
          </Stat>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Panel title="할 일" flush>
            {todos.map((t) => (
              <Link key={t.label} href={t.href} className="flex items-center gap-3 border-b border-border px-5 py-3 transition-colors duration-100 last:border-b-0 hover:bg-ghost-hover active:bg-ghost-active">
                <span className="min-w-9 text-heading-4 font-semibold text-link tabular-nums">{t.n}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium text-foreground">{t.label}</span>
                  <span className="text-caption text-muted-foreground">{t.sub}</span>
                </span>
                <Icon name="chevron-right" className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </Panel>

          <Panel title="지역 채우기" actions={<span className="text-caption text-muted-foreground">한 지역 100곳을 채워야 다음 지역을 열어요</span>}>
            {REGIONS.map((r) => {
              const n = SAMPLE_STORES.filter((s) => s.gu === r.gu && freshness(s, now) !== "expired").length;
              return (
                <div key={r.gu} className="mb-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-medium text-foreground">{r.name}</span>
                    <span className="flex-1" />
                    <span className="text-caption text-muted-foreground tabular-nums">{n} / 100곳</span>
                  </div>
                  <Meter value={n} label={`${r.name} 채운 가게`} />
                </div>
              );
            })}
            <p className="text-caption text-muted-foreground">다음 지역: 중구 신당동(즉석떡볶이 골목) · 출시 전 목표 300곳</p>
          </Panel>
        </div>

        <Panel
          className="mt-4"
          flush
          title="최근 운영 기록"
          actions={
            <LinkButton href="/admin/logs" variant="text" size="compact">
              전체 보기
            </LinkButton>
          }
        >
          {/* 카드 안에 넣는 표라 표 틀의 테두리 · 모서리는 뺀다 */}
          <TableFrame compact className="rounded-none border-0">
            <Table>
              <TableBody>
                {AUDIT_LOG.slice(0, 5).map((a) => (
                  <TableRow key={a.at + a.target}>
                    <TableCell className="w-36 text-muted-foreground">{a.at.slice(5)}</TableCell>
                    <TableCell className={CELL_MAIN}>{a.action}</TableCell>
                    <TableCell>{a.target}</TableCell>
                    <TableCell className="text-muted-foreground">{a.actor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableFrame>
        </Panel>
      </AdminGate>
    </>
  );
}
