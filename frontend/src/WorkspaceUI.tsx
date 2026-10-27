import { useRef } from "react";
import { Button, MediaBrowseBar, SortMenu } from "./UIControls";
import type { ReactNode, HTMLAttributes } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="manager-heading ui-page-header"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-primary-actions" role="group" aria-label="Page actions">{actions}</div>}</div>;
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

/** Shared browse row: search, display preferences, optional organizing actions, results. */
export function BrowseToolbar({ label, search, controls, actions, summary, layout = "compact", className = "" }: { layout?: "compact" | "results"; label: string; search: ReactNode; controls: ReactNode; actions?: ReactNode; summary: ReactNode; className?: string }) {
  return <LibraryToolbar label={label} className={`compact-video-toolbar directory-browse-toolbar ${layout === "results" ? "results-rail-toolbar" : ""} ${className}`}>
    <div className="video-search-line">{search}</div>
    <MediaBrowseBar actions={actions}>{controls}</MediaBrowseBar>
    <div className="video-result-scope">{summary}</div>
  </LibraryToolbar>;
}


/** Shared paging footer follows the results, on the same page canvas. */
export function BrowsePagination({ page, pageSize, total, noun, selected = 0, onPage }: {
  page: number; pageSize: number; total: number; noun: string; selected?: number; onPage: (page: number) => void;
}) {
  const root = useRef<HTMLElement>(null);
  const go = (next: number) => { onPage(next); root.current?.closest(".manager-main")?.scrollTo({top: 0}); };
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(0, page), pages - 1);
  return <footer ref={root} className="browse-pagination">
    <div className="browse-pagination-summary" role="status"><span className="browse-result-range">{total ? `${(current * pageSize + 1).toLocaleString()}–${Math.min((current + 1) * pageSize, total).toLocaleString()} of ${total.toLocaleString()} ${noun}` : `0 ${noun}`}</span>{selected > 0 && <span>{selected.toLocaleString()} selected</span>}</div>
    {pages > 1 && <nav aria-label={`${noun} pagination`}>
      <Button variant="quiet" size="compact" disabled={current === 0} onClick={() => go(current - 1)}>← Previous</Button>
      <SortMenu label={`Go to ${noun} page`} value={String(current)} onChange={value => go(Number(value))} options={Array.from({length:pages},(_,index)=>({value:String(index),label:`Page ${index + 1} of ${pages.toLocaleString()}`}))}/>
      <Button variant="quiet" size="compact" disabled={current >= pages - 1} onClick={() => go(current + 1)}>Next →</Button>
    </nav>}
  </footer>;
}


/** Shared layout slots for search and the results browsing rail. */
export function BrowseQueryGroup({ children }: { children: ReactNode }) {
  return <div className="video-search-line browse-query-group" role="group" aria-label="Search, filter and sort">{children}</div>;
}

/** Shared active-filter rail; removal and reset behavior stay with the caller. */
export function ActiveFilterChips({ children, label = "Applied filters" }: { children: ReactNode; label?: string }) {
  return <div className="video-filter-chips" role="group" aria-label={label}><span className="active-filter-caption">Active filters</span>{children}</div>;
}
