import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { Button, MediaBrowseBar } from "./UIControls";
import type { ReactNode, HTMLAttributes } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="manager-heading ui-page-header"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions}</div>;
}

export function LibraryToolbar({ children, label, className = "" }: { children: ReactNode; label: string; className?: string }) {
  return <section className={`library-toolbar ${className}`} aria-label={label}>{children}</section>;
}

export function LoadState({ title, message, onRetry, busy = false }: { title: string; message?: string; onRetry?: () => void; busy?: boolean }) {
  return <EmptyState className={`workspace-load-state ${busy ? "is-loading" : onRetry ? "is-error" : ""}`} role={onRetry && !busy ? "alert" : "status"} aria-busy={busy || undefined}
    title={title} message={message?.replace(/^Error:\s*/, "")}
    icon={<span className="state-symbol" aria-hidden="true">{busy ? <span className="state-spinner" /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3v1"/></svg>}</span>}>
    {onRetry && <Button variant="neutral" disabled={busy} onClick={onRetry}>Try again</Button>}
  </EmptyState>;
}

export function ActivityIndicator({ children }: { children: ReactNode }) {
  return <div className="activity-indicator" role="status"><span className="state-spinner" aria-hidden="true"/><span>{children}</span></div>;
}

/** Shared empty-state structure; callers own the message and recovery action. */
export function EmptyState({ title, message, icon, children, className = "", ...props }: Omit<HTMLAttributes<HTMLDivElement>, "title"> & { title: ReactNode; message?: ReactNode; icon?: ReactNode }) {
  return <div {...props} className={`manager-empty ${className}`.trim()}>{icon}<h2>{title}</h2>{message && <p>{message}</p>}{children}</div>;
}

/** Content-dialog heading; keep close semantics and busy handling in the caller. */
export function DialogHeader({ title, onClose, disabled = false, closeLabel = "Close", closeIcon = "×" }: { title: ReactNode; onClose: () => void; disabled?: boolean; closeLabel?: string; closeIcon?: ReactNode }) {
  return <header className="ui-dialog-header"><h2>{title}</h2><button type="button" disabled={disabled} onClick={onClose} aria-label={closeLabel}>{closeIcon}</button></header>;
}

const PageActionsContext = createContext<{ target: HTMLDivElement | null; setTarget: (node: HTMLDivElement | null) => void } | null>(null);
export function PageActionsProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  return <PageActionsContext.Provider value={{ target, setTarget }}>{children}</PageActionsContext.Provider>;
}
/** One top-bar destination; the page keeps ownership of its action handlers. */
export function PageActionsSlot({ children }: { children?: ReactNode }) {
  const context = useContext(PageActionsContext);
  return <div className="page-primary-actions" role="group" aria-label="Page actions" ref={context?.setTarget}>{children}</div>;
}
export function PageActions({ children }: { children: ReactNode }) {
  const context = useContext(PageActionsContext);
  return context?.target ? createPortal(children, context.target) : null;
}

/** Shared browse row: search, display preferences, optional organizing actions, results. */
export function BrowseToolbar({ label, search, controls, actions, summary, className = "" }: { label: string; search: ReactNode; controls: ReactNode; actions?: ReactNode; summary: ReactNode; className?: string }) {
  return <LibraryToolbar label={label} className={`compact-video-toolbar directory-browse-toolbar ${className}`}>
    <div className="video-search-line">{search}</div>
    <MediaBrowseBar actions={actions}>{controls}</MediaBrowseBar>
    <div className="video-result-scope" role="status">{summary}</div>
  </LibraryToolbar>;
}
