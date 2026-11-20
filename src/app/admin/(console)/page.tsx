import { redirect } from "next/navigation";

// 어드민 첫 화면은 가게 관리다. 시안이던 홈 · 제보 · 신고 · 설정 · 신선도 점검은 예시 자료와 함께 지웠다 (11-19).
export default function AdminHome() {
  redirect("/admin/stores");
}
