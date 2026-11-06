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
      <BackHeader title="맛집 등록" />
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
