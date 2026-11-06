import { Suspense } from "react";
import ReportQueue from "@/components/admin/ReportQueue";
import { PageHeader, ProtoNote } from "@/components/admin/bits";

export const metadata = { title: "제보 승인함" };

// M-AD-02 제보 승인함 (REQ-AD-03~08)
export default function ReportsPage() {
  return (
    <>
      <PageHeader id="M-AD-02" title="제보 승인함" desc="새 가게·폐업은 여기서 승인해야 반영돼요. 가격·맵기 수정은 동의 2곳이면 자동 반영되고, 여기서는 지켜보기만 해요." />
      <ProtoNote />
      <Suspense>
        <ReportQueue />
      </Suspense>
    </>
  );
}
