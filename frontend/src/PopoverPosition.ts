import { useEffect, useRef, type RefObject } from "react";

/** Position against the actual trigger, independent of toolbar layout and legacy offsets. */
export function anchorPopover(trigger: HTMLElement, popup: HTMLElement, preferredWidth: number, heightLimit = 600) {
  const layer = popup as HTMLElement & { showPopover?: () => void; hidePopover?: () => void };
  const previousPopover = popup.getAttribute("popover");
  // The top layer avoids clipping by card overflow and transformed containers.
  if (layer.showPopover) { popup.setAttribute("popover", "manual"); layer.showPopover(); }
  const place = () => {
    const edge = 12, gap = 8;
    const anchor = trigger.getBoundingClientRect();
    const width = Math.max(0, Math.min(preferredWidth, window.innerWidth - edge * 2));
    Object.assign(popup.style, { position: "fixed", right: "auto", bottom: "auto", margin: "0", transform: "none", boxSizing: "border-box", minWidth: "0", width: `${width}px`, maxWidth: `${width}px`, overflowY: "auto", zIndex: "100" });
    const height = Math.min(popup.scrollHeight + 2, heightLimit);
    const below = Math.max(0, window.innerHeight - anchor.bottom - gap - edge);
    const above = Math.max(0, anchor.top - gap - edge);
    const up = below < Math.min(height, 240) && above > below;
    const maxHeight = Math.max(0, Math.min(heightLimit, up ? above : below));
    const top = up ? anchor.top - gap - Math.min(height, maxHeight) : anchor.bottom + gap;
    Object.assign(popup.style, { left: `${Math.max(edge, Math.min(anchor.left, window.innerWidth - width - edge))}px`, top: `${Math.max(edge, Math.min(top, window.innerHeight - edge))}px`, maxHeight: `${maxHeight}px` });
  };
  place();
  const observer = new ResizeObserver(place);
  observer.observe(trigger); observer.observe(popup);
  const scroll = (event: Event) => { if (!popup.contains(event.target as Node)) place(); };
  window.addEventListener("resize", place);
  window.addEventListener("scroll", scroll, true);
  return () => { layer.hidePopover?.(); if (previousPopover === null) popup.removeAttribute("popover"); else popup.setAttribute("popover", previousPopover); observer.disconnect(); window.removeEventListener("resize", place); window.removeEventListener("scroll", scroll, true); };
}

export function useDetailsPopover(ref: RefObject<HTMLDetailsElement>, selector: string, width: number) {
  const binding = useRef<{element: HTMLDetailsElement; dispose: () => void}>();
  useEffect(() => {
    const details = ref.current;
    if (binding.current?.element === details) return;
    binding.current?.dispose(); binding.current = undefined;
    if (!details) return;
    let cleanup: (() => void) | undefined;
    const sync = () => {
      cleanup?.(); cleanup = undefined;
      const trigger = details.querySelector<HTMLElement>("summary");
      const popup = details.querySelector<HTMLElement>(selector);
      if (details.open && trigger && popup) cleanup = anchorPopover(trigger, popup, width);
    };
    details.addEventListener("toggle", sync); sync();
    binding.current = {element: details, dispose: () => { cleanup?.(); details.removeEventListener("toggle", sync); }};
  });
  useEffect(() => () => { binding.current?.dispose(); binding.current = undefined; }, []);
}
