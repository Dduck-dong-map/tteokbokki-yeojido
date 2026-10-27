import { Suspense } from "react";
import StoreTable from "@/components/admin/StoreTable";
import { PageHeader, ProtoNote } from "@/components/admin/bits";
import { Icon } from "@/components/admin/Icon";

export const metadata = { title: "가게 관리" };

// M-AD-03 가게 목록 (REQ-AD-09)
export default function StoresPage() {
  return (
    <>
      <PageHeader id="M-AD-03" title="가게 관리" desc="가게는 지우지 않아요. 숨기거나 폐업 처리하고, 모든 변경은 이력에 남아 되돌릴 수 있어요.">
        <button type="button" className="btn btn--default">
          <Icon name="download" /> 내보내기
        </button>
        <button type="button" className="btn btn--primary">
          <Icon name="plus" /> 직접 등록
        </button>
      </PageHeader>
      <ProtoNote />
      <Suspense>
        <StoreTable />
      </Suspense>
    </>
  );
}
