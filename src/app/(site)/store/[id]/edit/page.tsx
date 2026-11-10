import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import EditForm from "@/components/register/EditForm";
import { BackHeader } from "@/components/layout";
import { getStore, getStores } from "@/lib/data";

export const metadata: Metadata = { title: "정보 고치기", robots: { index: false } };

export default function EditPage({ params }: PageProps<"/store/[id]/edit">) {
  return (
    <div className="page-narrow">
      <Suspense fallback={<BackHeader title="정보 고치기" />}>
        <Loader params={params} />
      </Suspense>
    </div>
  );
}

async function Loader({ params }: Pick<PageProps<"/store/[id]/edit">, "params">) {
  await connection();
  const { id } = await params;
  const [store, stores] = await Promise.all([getStore(id), getStores()]);
  if (!store) notFound();
  return (
    <>
      <BackHeader title={`${store.name} 고치기`} href={`/store/${id}`} />
      <EditForm store={store} stores={stores} />
    </>
  );
}
