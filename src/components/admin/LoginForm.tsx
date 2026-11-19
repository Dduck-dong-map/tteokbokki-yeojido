"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

// 운영 열쇠 넣기 (ADMIN_KEY 가 있는 서버). 맞으면 12시간 동안 이 브라우저에서 운영 화면이 열린다.
export default function LoginForm() {
  const [state, action, pending] = useActionState(adminLogin, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <TextField
        id="admin-key"
        name="key"
        label="운영 열쇠"
        type="password"
        autoComplete="current-password"
        required
        error={state?.error}
        help={state?.error ? undefined : "서버의 ADMIN_KEY 와 같은 글자예요. 팀 안에서만 나눠요."}
      />
      <Button type="submit" variant="filled" size="xl" className="w-full" disabled={pending}>
        {pending ? "확인 중…" : "들어가기"}
      </Button>
    </form>
  );
}
