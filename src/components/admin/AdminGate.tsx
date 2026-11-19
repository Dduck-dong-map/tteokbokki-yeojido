import { Suspense } from "react";
import { adminAccess } from "@/lib/admin/access";
import { Locked } from "./bits";

// 어드민 화면 내용을 열쇠 검사 뒤에 둔다 (F010). 가게 관리(/admin/stores)와 같은 방식:
// 쿠키·Host 를 읽는 검사는 요청 때 하므로 <Suspense> 안에서 돌고, 머리글(PageHeader)의 제목·설명은 밖에서 먼저 그려진다
// (번들 문서 02-guides/authentication-with-cache-components.md Step 2). 권한이 없으면 내용 대신 Locked.
// 레이아웃에서 막지 않는 까닭은 (console)/layout.tsx 주석 참고 — 페이지마다 따로 본다.
export default function AdminGate({ children, loading = "불러오는 중…" }: { children: React.ReactNode; loading?: string }) {
  return (
    <Suspense
      fallback={
        <div className="empty">
          <div className="empty__desc">{loading}</div>
        </div>
      }
    >
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  const access = await adminAccess();
  if (!access.ok) return <Locked why={access.why} />;
  return <>{children}</>;
}

// 머리글의 단추·링크처럼 누를 수 있는 것은 열쇠 검사 뒤에서만 그린다 (11-19).
// 잠겼으면 아무것도 그리지 않는다 — 잠김 안내(Locked)는 아래 내용 자리의 AdminGate 가 한 번만 띄운다.
// 검사 중에도 비워 둔다 (잠긴 사람에게 단추가 잠깐 보였다 사라지지 않게).
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <OnlyIfOpen>{children}</OnlyIfOpen>
    </Suspense>
  );
}

async function OnlyIfOpen({ children }: { children: React.ReactNode }) {
  const access = await adminAccess();
  return access.ok ? <>{children}</> : null;
}
