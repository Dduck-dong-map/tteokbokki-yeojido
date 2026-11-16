import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/admin/LoginForm";
import { adminAccess, keyMode } from "@/lib/admin/access";

export const metadata = { title: "로그인" };

// M-AD-00 운영자 로그인 (REQ-AD-01). 11-15: 서버에 ADMIN_KEY 가 있으면 그 열쇠로 들어간다 (lib/admin/access.ts).
// 열쇠가 없으면 이 컴퓨터(127.0.0.1)에서만 바로 들어간다. 이메일 링크 + 2단계 인증은 Supabase 로 옮길 때 붙인다.
export default function AdminLogin() {
  return (
    <div className="login">
      <div className="card">
        <div className="card__head">
          <h3 className="card__title">떡볶여지도 운영 로그인 <span className="badge badge--outline u-mono">M-AD-00</span></h3>
        </div>
        <Suspense fallback={<div className="card__body u-muted">확인하는 중…</div>}>
          <Body />
        </Suspense>
      </div>
    </div>
  );
}

async function Body() {
  const access = await adminAccess();
  if (access.ok)
    return (
      <>
        <div className="card__body">
          <div className="alert alert--success">
            <div>{access.mode === "local" ? "이 컴퓨터에서 열었어요. 열쇠 없이 들어가요." : "이미 로그인했어요."}</div>
          </div>
        </div>
        <div className="card__foot">
          <Link href="/admin/stores" className="btn btn--primary btn--block">가게 관리로 들어가기</Link>
        </div>
      </>
    );
  if (!keyMode())
    return (
      <div className="card__body">
        <div className="alert alert--warning">
          <div>이 서버에는 운영 열쇠(ADMIN_KEY)가 없어서, 이 컴퓨터의 127.0.0.1 주소로만 열려요. 밖에서 쓰려면 서버 설정에 ADMIN_KEY 를 넣어 주세요.</div>
        </div>
      </div>
    );
  return <LoginForm />;
}
