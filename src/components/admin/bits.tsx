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
