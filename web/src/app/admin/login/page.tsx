import Link from "next/link";

export const metadata = { title: "로그인" };

// M-AD-00 운영자 로그인 (REQ-AD-01): 이메일 로그인 링크 + 2단계 인증. 가입 화면은 없고 관리자가 초대한다.
export default function AdminLogin() {
  return (
    <div className="login">
      <div className="card">
        <div className="card__head">
          <h3 className="card__title">떡볶여지도 운영 로그인 <span className="badge badge--outline u-mono">M-AD-00</span></h3>
        </div>
        <div className="card__body">
          <div className="field">
            <label className="field__label">이메일</label>
            <input className="input" type="email" placeholder="초대받은 이메일" />
            <p className="field__hint">로그인 링크를 메일로 보내요. 비밀번호는 쓰지 않아요.</p>
          </div>
          <div className="field u-mt-4">
            <label className="field__label">2단계 인증 번호</label>
            <input className="input u-mono" inputMode="numeric" placeholder="인증 앱의 6자리" />
            <p className="field__hint">관리자·운영자는 꼭 켜야 해요.</p>
          </div>
          <div className="alert u-mt-4">
            <div>시안이에요. 실제 로그인은 M2(Supabase)에서 붙여요. 지금은 아래 버튼으로 바로 들어가요.</div>
          </div>
        </div>
        <div className="card__foot">
          <Link href="/admin" className="btn btn--primary btn--block">
            들어가기 (시안)
          </Link>
        </div>
      </div>
    </div>
  );
}
