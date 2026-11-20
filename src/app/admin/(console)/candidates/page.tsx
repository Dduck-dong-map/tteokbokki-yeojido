import { Suspense } from "react";
import { AdminOnly } from "@/components/admin/AdminGate";
import DatasetImport from "@/components/admin/DatasetImport";
import { Locked, PageHeader, Panel } from "@/components/admin/bits";
import { Icon } from "@/components/admin/Icon";
import { Button } from "@/components/ui/button";
import { adminAccess } from "@/lib/admin/access";
import { adminReadStores } from "@/lib/data/admin";
import { DATASETS } from "@/lib/data/datasets";

export const metadata = { title: "후보 가져오기" };

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
