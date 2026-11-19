import AdminGate from "@/components/admin/AdminGate";
import FreshnessTable from "@/components/admin/FreshnessTable";
import { PageHeader, ProtoNote } from "@/components/admin/bits";
import { SAMPLE_STORES } from "@/lib/data/sample-stores";

export const metadata = { title: "신선도 점검" };

// M-AD-05 신선도 점검 (REQ-AD-10)
export default function FreshnessPage() {
  return (
    <>
      <PageHeader id="M-AD-05" title="신선도 점검" desc="매주 한 번, 오래 확인 안 한 가게를 전화·방문·지도 앱으로 확인해요. 확인하면 확인일이 오늘로 바뀌고 도장이 다시 진해져요." />
      <AdminGate>
        <ProtoNote />
        {/* 예시 가게는 서버에서 읽어 넘긴다 */}
        <FreshnessTable stores={SAMPLE_STORES} />
      </AdminGate>
    </>
  );
}
