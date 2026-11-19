import AdminGate from "@/components/admin/AdminGate";
import { CELL_MAIN, CELL_NUM, EntryCard, PageHeader, Panel, ProtoNote, Section, StatusBadge, TableFrame } from "@/components/admin/bits";
import { Icon, type IconName } from "@/components/admin/Icon";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TextField } from "@/components/ui/text-field";
import { ROLE_LABEL, RULES, STAFF } from "@/lib/admin/sample";
import { cn } from "@/lib/utils";

export const metadata = { title: "설정" };

const CARDS: { href: string; icon: IconName; title: string; desc: string }[] = [
  { href: "#staff", icon: "users", title: "운영자·권한", desc: "관리자 · 운영자 · 크루 초대와 역할" },
  { href: "#rules", icon: "tools", title: "운영 규칙", desc: "제보 한도 · 동의 수 · 신선도 일수" },
  { href: "#blocks", icon: "shield", title: "차단 기기", desc: "도배 기기 · 차단 기간" },
  { href: "#rules", icon: "map", title: "지역 열기", desc: "100곳 채운 지역만 공개 · M4" },
];

const HELP = ["운영 수칙 (하루 20분 순서)", "제보 처리 기준", "개인정보 다루는 법"];

// 역할별 권한 (REQ-AD-02)
const MATRIX: [string, boolean, boolean, boolean][] = [
  ["제보 승인·반려", true, true, false],
  ["가게 정보 수정", true, true, true],
  ["숨김·폐업 처리 · 되살리기", true, true, false],
  ["신선도 확인 (확인일 새로 고침)", true, true, true],
  ["신고·요청 처리", true, true, false],
  ["기기 차단", true, true, false],
  ["후보 가져오기 · 크루에게 맡기기", true, true, false],
  ["운영 기록 보기", true, true, false],
  ["운영자 초대 · 역할 바꾸기", true, false, false],
  ["운영 규칙 바꾸기", true, false, false],
];

// M-AD-09 설정 (REQ-AD-02, REQ-AD-08)
export default function SettingsPage() {
  return (
    <>
      <PageHeader id="M-AD-09" title="설정" desc="운영자·권한과 운영 규칙은 관리자만 바꿀 수 있어요." />
      <AdminGate>
        <ProtoNote />

        <Section title="관리">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CARDS.map((c) => (
              <EntryCard key={c.title} href={c.href} icon={c.icon} title={c.title} desc={c.desc} />
            ))}
          </div>
        </Section>

        <Section title="도움말">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {HELP.map((h) => (
              <EntryCard key={h} href="#rules" icon="book" title={h} />
            ))}
          </div>
        </Section>

        <Section id="staff" title="운영자·권한">
          <TableFrame
            className="mb-4"
            toolbar={
              <>
                <span className="font-medium text-foreground">운영하는 사람 {STAFF.length}명 (예시)</span>
                <div className="flex-1" />
                <Button type="button" variant="outlined" size="compact">
                  <Icon name="plus" /> 초대
                </Button>
              </>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>로그인</TableHead>
                  <TableHead>2단계 인증</TableHead>
                  <TableHead>맡은 지역</TableHead>
                  <TableHead className={CELL_NUM}>최근 활동</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STAFF.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className={CELL_MAIN}>{p.name}</TableCell>
                    <TableCell>
                      <StatusBadge tone={p.role === "owner" ? "info" : "neutral"}>{ROLE_LABEL[p.role]}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.email}</TableCell>
                    <TableCell>{p.twoFactor ? <StatusBadge tone="success">켬</StatusBadge> : <StatusBadge tone="warning">끔 · 크루는 선택</StatusBadge>}</TableCell>
                    <TableCell>{p.area ?? "전체"}</TableCell>
                    <TableCell className={cn(CELL_NUM, "text-muted-foreground")}>{p.lastSeen}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableFrame>
          <TableFrame compact toolbar={<span className="font-medium text-foreground">역할별로 할 수 있는 일</span>}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>할 일</TableHead>
                  <TableHead className="w-24">관리자</TableHead>
                  <TableHead className="w-24">운영자</TableHead>
                  <TableHead className="w-24">크루</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MATRIX.map(([label, ...can]) => (
                  <TableRow key={label}>
                    <TableCell>{label}</TableCell>
                    {can.map((c, i) => (
                      // 할 수 있음 = 체크 아이콘, 없음 = 줄표. 색만으로 구분하지 않고 스크린 리더에는 글자로 알린다
                      <TableCell key={i}>
                        {c ? (
                          <>
                            <Icon name="check" className="size-4 text-link" />
                            <span className="sr-only">할 수 있음</span>
                          </>
                        ) : (
                          <>
                            <span aria-hidden="true" className="text-muted-foreground">
                              —
                            </span>
                            <span className="sr-only">할 수 없음</span>
                          </>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableFrame>
        </Section>

        <Section id="rules" title="운영 규칙">
          <Panel footer={<span className="mr-auto text-caption text-muted-foreground">처음에는 코드 값으로 두고, 바꿀 일이 잦아지면 여기서 바꾸게 열어요.</span>}>
            <div className="grid gap-4 md:grid-cols-2">
              {RULES.map((r) => (
                <TextField key={r.key} label={r.label} value={r.value} help={r.note} disabled readOnly />
              ))}
            </div>
          </Panel>
        </Section>

        <Section id="blocks" title="차단 기기">
          <TableFrame>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기기</TableHead>
                  <TableHead>이유</TableHead>
                  <TableHead>차단한 사람</TableHead>
                  <TableHead className={CELL_NUM}>풀리는 날</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">할 일</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono">ff00…</TableCell>
                  <TableCell>도배 (하루 11건)</TableCell>
                  <TableCell>이시영</TableCell>
                  <TableCell className={cn(CELL_NUM, "text-muted-foreground")}>2026-11-02</TableCell>
                  <TableCell>
                    {/* 시안: 눌러도 저장되지 않는다 */}
                    <Button type="button" variant="text" size="compact">
                      풀기
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableFrame>
        </Section>
      </AdminGate>
    </>
  );
}
