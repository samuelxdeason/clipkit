import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="manager-heading"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions}</div>;
}

export function LibraryToolbar({ children, label, className = "" }: { children: ReactNode; label: string; className?: string }) {
  return <section className={`library-toolbar ${className}`} aria-label={label}>{children}</section>;
}

export function LoadState({ title, message, onRetry, busy = false }: { title: string; message?: string; onRetry?: () => void; busy?: boolean }) {
  return <div className="manager-empty workspace-load-state" role={onRetry ? "alert" : "status"} aria-busy={busy || undefined}>
    <h2>{title}</h2>{message && <p>{message.replace(/^Error:\s*/, "")}</p>}
    {onRetry && <button className="m-button" onClick={onRetry}>Try again</button>}
  </div>;
}
