import Link from "next/link";
import { Suspense } from "react";
import StoreTable from "@/components/admin/StoreTable";
import { Locked, PageHeader } from "@/components/admin/bits";
import { Icon } from "@/components/admin/Icon";
import { adminAccess } from "@/lib/admin/access";
import { adminReadStores } from "@/lib/data/admin";
import { REGIONS } from "@/lib/data/sample-stores";

export const metadata = { title: "가게 관리" };

// M-AD-03 가게 목록 (REQ-AD-09) — 11-15 부터 실제 DB 를 읽고 고친다
export default function StoresPage() {
  return (
    <>
      <PageHeader id="M-AD-03" title="가게 관리" desc="가게는 지우지 않아요. 숨기거나 폐업 처리하고, 모든 변경은 이력에 남아요.">
        <Link href="/admin/candidates" className="btn btn--default">
          <Icon name="download" /> 자료 넣기
        </Link>
        <Link href="/admin/stores/new" className="btn btn--primary">
          <Icon name="plus" /> 직접 등록
        </Link>
      </PageHeader>
      <Suspense fallback={<div className="table-wrap"><div className="empty"><div className="empty__desc">가게를 불러오는 중…</div></div></div>}>
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
