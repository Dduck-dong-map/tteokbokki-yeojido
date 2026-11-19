import Link from "next/link";
import { Suspense } from "react";
import { AdminOnly } from "@/components/admin/AdminGate";
import DatasetImport from "@/components/admin/DatasetImport";
import { CELL_MAIN, LINK, Locked, PageHeader, Panel, ProtoNote, Stat, StatusBadge, TableFrame, type Tone } from "@/components/admin/bits";
import { Icon } from "@/components/admin/Icon";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminAccess } from "@/lib/admin/access";
import { CANDIDATES } from "@/lib/admin/sample";
import { adminReadStores } from "@/lib/data/admin";
import { DATASETS } from "@/lib/data/datasets";
import { SAMPLE_STORES } from "@/lib/data/sample-stores";
import { cn } from "@/lib/utils";

export const metadata = { title: "후보 가져오기" };

const STATUS: Record<"new" | "assigned" | "confirmed" | "duplicate" | "skip", { label: string; tone: Tone }> = {
  new: { label: "새 후보", tone: "info" },
  assigned: { label: "확인 중", tone: "warning" },
  confirmed: { label: "확인 끝 · 등록 대기", tone: "success" },
  duplicate: { label: "이미 있음", tone: "neutral" },
  skip: { label: "떡볶이 없음", tone: "neutral" },
};

// M-AD-06 후보 가져오기 (M4, REQ-AD-14): 공공데이터 일반음식점 → 분식·떡볶이 후보 → 크루 확인 → 등록
export default function CandidatesPage() {
  return (
    <>
      <PageHeader id="M-AD-06" title="후보 가져오기" desc="리서치·공공데이터에서 모은 가게 후보를 확인해서 DB 에 넣어요. 이미 있는 가게는 덮어쓰지 않아요.">
        {/* 누를 수 있는 것은 열쇠 검사 뒤에만 (잠겼으면 안 보인다). M4 에서 여는 단추라 아직 꺼 둔다 */}
        <AdminOnly>
          <Button type="button" variant="filled" size="md" disabled>
            <Icon name="download" /> 공공데이터 파일 올리기
          </Button>
        </AdminOnly>
      </PageHeader>
      <Suspense
        fallback={
          <Panel className="mb-4">
            <p className="text-muted-foreground">자료를 불러오는 중…</p>
          </Panel>
        }
      >
        <Datasets />
      </Suspense>

      <h2 className="mt-6 mb-2 text-heading-4 text-foreground">다음 단계 · 공공데이터 후보 (M4)</h2>
      <ProtoNote>M4(첫 데이터 300곳)에서 여는 칸이에요. 아래는 흐름만 보여 주는 예시 후보예요. 위의 리서치 자료는 실제로 DB 에 들어가요.</ProtoNote>

      <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))] gap-4">
        <Stat label="1. 고르기" value="업태 분식 · 이름에 떡볶이">영업 중인 곳만</Stat>
        <Stat label="2. 겹침 찾기" value="이름 + 150m">이미 있는 가게는 「이미 있음」</Stat>
        <Stat label="3. 크루 확인" value="전화·방문">맛 태그를 채움</Stat>
        <Stat label="4. 등록" value="확인 끝만">출처 = 공공데이터 + 크루</Stat>
      </div>

      <TableFrame
        toolbar={
          <>
            <span className="font-medium text-foreground">후보 {CANDIDATES.length}곳 (예시)</span>
            <div className="flex-1" />
            <span className="text-caption text-muted-foreground">리뷰·사진은 포털에서 가져오지 않아요 (저작권·약관)</span>
          </>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>후보 이름</TableHead>
              <TableHead>주소</TableHead>
              <TableHead>업태</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>담당</TableHead>
              <TableHead className="w-36">
                <span className="sr-only">할 일</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CANDIDATES.map((c) => {
              const match = SAMPLE_STORES.find((s) => s.id === c.match);
              return (
                <TableRow key={c.id}>
                  <TableCell className={CELL_MAIN}>{c.name}</TableCell>
                  <TableCell>{c.address}</TableCell>
                  <TableCell>{c.kind}</TableCell>
                  <TableCell>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</StatusBadge>
                      {match && (
                        <Link href={`/admin/stores/${match.id}`} className={cn(LINK, "text-caption")}>
                          {match.name}
                        </Link>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.assignee ?? "—"}</TableCell>
                  <TableCell>
                    {/* 시안: 눌러도 저장되지 않는다. 예전에는 줄에 마우스를 올려야 보였다 */}
                    <span className="flex flex-wrap gap-1">
                      {c.status === "new" && (
                        <Button type="button" variant="text" size="compact">
                          크루에게 맡기기
                        </Button>
                      )}
                      {c.status === "confirmed" && (
                        <Button type="button" variant="text" size="compact">
                          등록
                        </Button>
                      )}
                      {c.status !== "skip" && c.status !== "duplicate" && (
                        <Button type="button" variant="text" size="compact">
                          빼기
                        </Button>
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableFrame>
    </>
  );
}

// 리서치 자료 묶음 (lib/data/datasets.ts) — 실제 DB 에 넣는 칸
async function Datasets() {
  const access = await adminAccess();
  if (!access.ok) return <Locked why={access.why} />;
  const ids = (await adminReadStores()).map((s) => s.id);
  return (
    <>
      {DATASETS.map((d) => (
        <DatasetImport key={d.id} dataset={d} inDb={ids.filter((id) => d.stores.some((r) => r.id === id))} />
      ))}
    </>
  );
}
