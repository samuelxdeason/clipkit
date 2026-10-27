import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
export default function DetailDialog({ children, onClose, label, className = "" }: { children: ReactNode; onClose: () => void; label: string; className?: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const returnFocus = useRef(document.activeElement as HTMLElement | null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = returnFocus.current;
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (document.querySelector(".manager-modal")) return;
      if (e.defaultPrevented) return;
      if (e.key === "Escape") { e.stopImmediatePropagation(); close.current(); }
      if (e.key !== "Tab") return;
      const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],summary,[tabindex="0"]') || [])
        .filter(item => !item.matches(':disabled') && item.getClientRects().length > 0 && item.tabIndex >= 0);
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { e.preventDefault(); last?.focus(); }
      if (!e.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { e.preventDefault(); first?.focus(); }
      if (!items.length) { e.preventDefault(); panel.current?.focus(); }
    };
    window.addEventListener("keydown", handle);
    return () => { window.removeEventListener("keydown", handle); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <div className={`detail-backdrop ${className}`} onClick={onClose}><div className="detail-window" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} onClick={e => e.stopPropagation()}>{children}</div></div>;
}
