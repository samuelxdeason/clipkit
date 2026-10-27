import { Button } from "./UIControls";
import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="manager-heading ui-page-header"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions}</div>;
}

export function LibraryToolbar({ children, label, className = "" }: { children: ReactNode; label: string; className?: string }) {
  return <section className={`library-toolbar ${className}`} aria-label={label}>{children}</section>;
}

export function LoadState({ title, message, onRetry, busy = false }: { title: string; message?: string; onRetry?: () => void; busy?: boolean }) {
  return <div className={`manager-empty workspace-load-state ${busy ? "is-loading" : onRetry ? "is-error" : ""}`} role={onRetry && !busy ? "alert" : "status"} aria-busy={busy || undefined}>
    <span className="state-symbol" aria-hidden="true">{busy ? <span className="state-spinner" /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3v1"/></svg>}</span>
    <h2>{title}</h2>{message && <p>{message.replace(/^Error:\s*/, "")}</p>}
    {onRetry && <Button variant="neutral" disabled={busy} onClick={onRetry}>Try again</Button>}
  </div>;
}

export function ActivityIndicator({ children }: { children: ReactNode }) {
  return <div className="activity-indicator" role="status"><span className="state-spinner" aria-hidden="true"/><span>{children}</span></div>;
}
