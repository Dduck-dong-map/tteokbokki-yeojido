import { Suspense } from "react";
import { AdminOnly } from "@/components/admin/AdminGate";
import StoreTable from "@/components/admin/StoreTable";
import { Empty, LinkButton, Locked, PageHeader, TableFrame } from "@/components/admin/bits";
import { Icon } from "@/components/admin/Icon";
import { adminAccess } from "@/lib/admin/access";
import { adminReadStores } from "@/lib/data/admin";
import { REGIONS } from "@/lib/regions";

export const metadata = { title: "가게 관리" };

// M-AD-03 가게 목록 (REQ-AD-09) — 11-15 부터 실제 DB 를 읽고 고친다
export default function StoresPage() {
  return (
    <>
      <PageHeader id="M-AD-03" title="가게 관리" desc="가게는 지우지 않아요. 숨기거나 폐업 처리하고, 모든 변경은 이력에 남아요.">
        {/* 누를 수 있는 것은 열쇠 검사 뒤에만 (잠겼으면 안 보인다) */}
        <AdminOnly>
          <LinkButton href="/admin/candidates" variant="outlined">
            <Icon name="download" /> 자료 넣기
          </LinkButton>
          <LinkButton href="/admin/stores/new" variant="filled">
            <Icon name="plus" /> 직접 등록
          </LinkButton>
        </AdminOnly>
      </PageHeader>
      <Suspense
        fallback={
          <TableFrame>
            <Empty desc="가게를 불러오는 중…" />
          </TableFrame>
        }
      >
        <Stores />
      </Suspense>
    </>
  );
}

async function Stores() {
  const access = await adminAccess();
  if (!access.ok) return <Locked why={access.why} />;
  const stores = await adminReadStores();
  return <StoreTable stores={stores} regions={REGIONS} now={new Date().toISOString()} />;
}
