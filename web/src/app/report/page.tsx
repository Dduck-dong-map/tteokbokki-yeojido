import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import ReportForm from "@/components/report/ReportForm";
import { BackHeader } from "@/components/ui";
import { getStores } from "@/lib/data";

export const metadata: Metadata = { title: "제보하기" };

export default function ReportPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-paper">
      <BackHeader title="새 가게 제보" />
      <Suspense>
        <Loader />
      </Suspense>
    </div>
  );
}

async function Loader() {
  await connection();
  return <ReportForm stores={await getStores()} />;
}
