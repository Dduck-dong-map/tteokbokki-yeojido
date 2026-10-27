import type { Metadata } from "next";
import { Suspense } from "react";
import ReportForm from "@/components/report/ReportForm";
import { BackHeader } from "@/components/ui";
import { getStores } from "@/lib/data";

export const metadata: Metadata = { title: "제보하기" };

export default async function ReportPage() {
  const stores = (await getStores()).map(({ id, name, address }) => ({ id, name, address }));
  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-paper">
      <BackHeader title="제보하기" />
      <Suspense>
        <ReportForm stores={stores} />
      </Suspense>
    </div>
  );
}
