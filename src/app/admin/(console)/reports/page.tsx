import { Suspense } from "react";
import AdminGate from "@/components/admin/AdminGate";
import ReportQueue from "@/components/admin/ReportQueue";
import { PageHeader, ProtoNote } from "@/components/admin/bits";
import { SAMPLE_STORES } from "@/lib/data/sample-stores";

export const metadata = { title: "제보 승인함" };

// M-AD-02 제보 승인함 (REQ-AD-03~08)
export default function ReportsPage() {
  return (
    <>
      <PageHeader id="M-AD-02" title="제보 승인함" desc="새 가게·폐업은 여기서 승인해야 반영돼요. 가격·맵기 수정은 동의 2곳이면 자동 반영되고, 여기서는 지켜보기만 해요." />
      <AdminGate>
        <ProtoNote />
        <Suspense>
          {/* 예시 가게는 서버에서 읽어 넘긴다 (클라이언트 부품이 @/lib/data 를 직접 가져오지 않게) */}
          <ReportQueue stores={SAMPLE_STORES} />
        </Suspense>
      </AdminGate>
    </>
  );
}
