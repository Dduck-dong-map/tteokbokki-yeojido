"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/admin/actions";

// 운영 열쇠 넣기 (ADMIN_KEY 가 있는 서버). 맞으면 12시간 동안 이 브라우저에서 운영 화면이 열린다.
export default function LoginForm() {
  const [state, action, pending] = useActionState(adminLogin, undefined);
  return (
    <form action={action}>
      <div className="card__body">
        <div className="field">
          <label className="field__label" htmlFor="admin-key">운영 열쇠</label>
          <input id="admin-key" name="key" className={`input${state?.error ? " is-error" : ""}`} type="password" autoComplete="current-password" required />
          {state?.error ? <p className="field__error">{state.error}</p> : <p className="field__hint">서버의 ADMIN_KEY 와 같은 글자예요. 팀 안에서만 나눠요.</p>}
        </div>
      </div>
      <div className="card__foot">
        <button type="submit" className="btn btn--primary btn--block" disabled={pending}>{pending ? "확인 중…" : "들어가기"}</button>
      </div>
    </form>
  );
}
