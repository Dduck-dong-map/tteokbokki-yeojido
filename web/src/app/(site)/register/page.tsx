import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import RegisterForm from "@/components/register/RegisterForm";
import { BackHeader } from "@/components/ui";
import { getStores } from "@/lib/data";

export const metadata: Metadata = { title: "맛집 등록", robots: { index: false } };

export default function RegisterPage() {
  return (
    <div className="page-wide">
      {/* 1280 이상: 제목은 화면 왼쪽 끝으로 (사용자 11-08 시안 Group 3616). 입력·지도 칸 자리는 그대로라 옆으로만 옮긴다.
          page-wide 는 폭 1168 가운데 + 안쪽 24 → 왼쪽 끝까지 (100vw-1168)/2+24 를 당긴다 */}
      <BackHeader title="맛집 등록" className="xl:translate-x-[calc(26px_-_(100vw_-_1168px)/2_-_24px)] xl:translate-y-3" />
      <Suspense>
        <Loader />
      </Suspense>
    </div>
  );
}

async function Loader() {
  await connection();
  return <RegisterForm stores={await getStores()} />;
}
