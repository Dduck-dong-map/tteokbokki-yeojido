import FlagTable from "@/components/admin/FlagTable";
import { PageHeader, ProtoNote } from "@/components/admin/bits";

export const metadata = { title: "신고·요청" };

// M-AD-07 신고·요청 (REQ-AD-11)
export default function FlagsPage() {
  return (
    <>
      <PageHeader id="M-AD-07" title="신고·요청" desc="사장님 수정 요청과 잘못된 정보·사진 신고, 자동 알림을 48시간 안에 처리해요. 노출 순서와 태그는 어떤 요청으로도 바꾸지 않아요." />
      <ProtoNote />
      <FlagTable />
    </>
  );
}
