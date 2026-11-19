import { notFound } from "next/navigation";
import { Suspense } from "react";
import StoreEditor from "@/components/admin/StoreEditor";
import { Breadcrumb, Locked, PageHeader } from "@/components/admin/bits";
import { adminAccess } from "@/lib/admin/access";
import { adminReadLogs, adminReadStore } from "@/lib/data/admin";
import { findResearch, getDataset } from "@/lib/data/datasets";
import { REGIONS } from "@/lib/regions";

export const metadata = { title: "가게 편집" };

const CRUMB = { label: "가게 관리", href: "/admin/stores" };

// M-AD-04 가게 편집 (REQ-AD-09) — 11-15 실제 DB 에 저장.
// /admin/stores/new = 직접 등록. ?from=<자료 묶음>&row=<가게 id> 면 리서치 자료로 칸을 채워서 연다 (빈 칸만 채우고 등록)
export default function StoreEditPage({ params, searchParams }: PageProps<"/admin/stores/[id]">) {
  return (
    <Suspense fallback={<Breadcrumb items={[CRUMB, { label: "…" }]} />}>
      <Editor params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Editor({ params, searchParams }: Pick<PageProps<"/admin/stores/[id]">, "params" | "searchParams">) {
  const access = await adminAccess();
  if (!access.ok) return <Locked why={access.why} />;
  const { id } = await params;
  const regions = REGIONS;

  if (id === "new") {
    const sp = await searchParams;
    const from = typeof sp.from === "string" ? getDataset(sp.from) : undefined;
    const row = from && typeof sp.row === "string" ? from.stores.find((r) => r.id === sp.row) : undefined;
    const exists = row ? !!(await adminReadStore(row.id)) : false;
    return (
      <>
        <Breadcrumb items={[CRUMB, { label: "직접 등록" }]} />
        <PageHeader
          id="M-AD-04"
          title={row ? `${row.store.name} 등록` : "가게 직접 등록"}
          desc={row ? `${from!.title} 자료로 칸을 채웠어요. 빈 칸(${row.missing.join("·") || "없음"})을 채우고 등록하세요.` : "운영자가 확인한 가게를 바로 지도에 올려요. 등록한 일은 이력에 남아요."}
        />
        <StoreEditor initial={null} template={row?.store} templateId={row?.id} research={row?.research} regions={regions} history={[]} exists={exists} />
      </>
    );
  }

  const store = await adminReadStore(id);
  if (!store) notFound();
  const history = await adminReadLogs({ storeId: id, limit: 100 });
  const found = findResearch(id);
  return (
    <>
      <Breadcrumb items={[CRUMB, { label: store.name }]} />
      <PageHeader id="M-AD-04" title={store.name} desc={`${store.address} · id ${store.id}${found ? ` · 출처 ${found.dataset.title}` : ""}`} />
      <StoreEditor initial={store} research={found?.row.research} regions={regions} history={history} />
    </>
  );
}
