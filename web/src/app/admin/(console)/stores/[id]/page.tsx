import { notFound } from "next/navigation";
import { Suspense } from "react";
import StoreEditor from "@/components/admin/StoreEditor";
import { Breadcrumb, PageHeader } from "@/components/admin/bits";
import { getStore } from "@/lib/data";

export const metadata = { title: "가게 편집" };

// M-AD-04 가게 편집 (REQ-AD-09)
export default function StoreEditPage({ params }: PageProps<"/admin/stores/[id]">) {
  return (
    <Suspense fallback={<Breadcrumb items={[{ label: "가게 관리", href: "/admin/stores" }, { label: "…" }]} />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/stores/[id]">, "params">) {
  const store = await getStore((await params).id);
  if (!store) notFound();
  return (
    <>
      <Breadcrumb items={[{ label: "가게 관리", href: "/admin/stores" }, { label: store.name }]} />
      <PageHeader id="M-AD-04" title={store.name} desc={`${store.address} · 출처: 크루 확인`} />
      <StoreEditor initial={store} />
    </>
  );
}
