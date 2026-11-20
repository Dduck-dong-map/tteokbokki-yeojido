import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";
import { IdBadge, LinkButton, Notice, Panel } from "@/components/admin/bits";
import { adminAccess, keyMode } from "@/lib/admin/access";

export const metadata = { title: "로그인" };

// M-AD-00 운영자 로그인 (REQ-AD-01). 11-15: 서버에 ADMIN_KEY 가 있으면 그 열쇠로 들어간다 (lib/admin/access.ts).
// 열쇠가 없으면 이 컴퓨터(127.0.0.1)에서만 바로 들어간다. 이메일 링크 + 2단계 인증은 아직 없다.
export default function AdminLogin() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background p-6">
      <Panel
        className="w-full max-w-sm"
        title={
          <span className="flex flex-wrap items-center gap-2">
            떡볶여지도 운영 로그인 <IdBadge>M-AD-00</IdBadge>
          </span>
        }
      >
        <Suspense fallback={<p className="text-muted-foreground">확인하는 중…</p>}>
          <Body />
        </Suspense>
      </Panel>
    </div>
  );
}

async function Body() {
  const access = await adminAccess();
  if (access.ok)
    return (
      <div className="flex flex-col gap-4">
        <Notice tone="success" className="mb-0">
          {access.mode === "local" ? "이 컴퓨터에서 열었어요. 열쇠 없이 들어가요." : "이미 로그인했어요."}
        </Notice>
        <LinkButton href="/admin/stores" variant="filled" size="xl" className="w-full">
          가게 관리로 들어가기
        </LinkButton>
      </div>
    );
  if (!keyMode())
    return (
      <Notice tone="warning" className="mb-0">
        이 서버에는 운영 열쇠(ADMIN_KEY)가 없어서, 이 컴퓨터의 127.0.0.1 주소로만 열려요. 밖에서 쓰려면 서버 설정에 ADMIN_KEY 를 넣어 주세요.
      </Notice>
    );
  return <LoginForm />;
}
