import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
export default function DetailDialog({ children, onClose, label, className = "" }: { children: ReactNode; onClose: () => void; label: string; className?: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (document.querySelector(".manager-modal")) return;
      if (e.key === "Escape") { e.stopImmediatePropagation(); close.current(); }
      if (e.key !== "Tab") return;
      const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,a[href]') || []);
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { e.preventDefault(); last?.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", handle, true);
    return () => { window.removeEventListener("keydown", handle, true); previous?.focus(); };
  }, []);
  return <div className={`detail-backdrop ${className}`} onClick={onClose}><div className="detail-window" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} onClick={e => e.stopPropagation()}>{children}</div></div>;
}
