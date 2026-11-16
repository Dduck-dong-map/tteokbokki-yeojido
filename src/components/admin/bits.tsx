import Link from "next/link";
import { Icon } from "./Icon";

// 어드민 화면 공통 조각 (Admin Navy 마크업 그대로)

export function PageHeader({ title, desc, id, children }: { title: string; desc?: string; id: string; children?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-header__title">
          {title} <span className="badge badge--outline u-mono">{id}</span>
        </h1>
        {desc && <p className="page-header__desc">{desc}</p>}
      </div>
      {children && <div className="page-header__actions">{children}</div>}
    </div>
  );
}

export function ProtoNote({ children }: { children?: React.ReactNode }) {
  return (
    <div className="alert proto-note">
      <Icon name="info" />
      <div>{children ?? "시안이에요. 예시 데이터로 움직이고, 누른 결과는 저장되지 않아요."}</div>
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="breadcrumb">
      {items.map((it, i) => (
        <span key={it.label} style={{ display: "contents" }}>
          {i > 0 && <span className="breadcrumb__sep">/</span>}
          {it.href ? <Link href={it.href}>{it.label}</Link> : <span className="breadcrumb__current">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Stamp({ n }: { n: number }) {
  return <span className={`stamp stamp--${n}`}>{n}</span>;
}

// 운영 권한이 없을 때 (lib/admin/access.ts). login = 열쇠로 로그인 · locked = 이 컴퓨터 밖이라 열쇠(ADMIN_KEY)가 있어야 열림
export function Locked({ why }: { why: "login" | "locked" }) {
  return (
    <div className="empty">
      <div className="empty__icon"><Icon name="alert" /></div>
      <div className="empty__title">{why === "login" ? "운영 로그인이 필요해요" : "이 주소에서는 운영 화면이 잠겨 있어요"}</div>
      <div className="empty__desc">
        {why === "login"
          ? "운영 열쇠를 넣은 브라우저에서만 가게 정보를 보고 고칠 수 있어요."
          : "열쇠 없이 여는 건 이 컴퓨터(127.0.0.1)에서만 돼요. 밖에서 열려면 서버에 ADMIN_KEY 를 넣고 로그인해요."}
      </div>
      <Link href="/admin/login" className="btn btn--primary u-mt-4">운영 로그인</Link>
    </div>
  );
}
