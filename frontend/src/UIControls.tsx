import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from "react";

export type ButtonVariant = "neutral" | "primary" | "quiet" | "danger";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "regular" | "compact";
};

/** Native button semantics, with one shared visual contract. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "neutral", size = "regular", className = "", type = "button", ...props }, ref
) {
  return <button {...props} ref={ref} type={type} className={`m-button ui-button ui-button--${variant} ui-button--${size} ${className}`} />;
});

/** Wrapping action row. No margins: spacing belongs to its parent layout. */
export function ActionGroup({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`ui-action-group ${className}`} />;
}

export function ViewSwitcher({ value, onChange, photo = false }: { value: string; onChange: (value: string) => void; photo?: boolean }) {
  return <div className="view-switch" role="group" aria-label={photo ? "Photo layout" : "Video layout"}>
    {["list", "grid"].map(mode => <button type="button" key={mode} aria-label={`${mode}${photo ? " photo" : ""} view`} aria-pressed={value === mode} className={value === mode ? "chosen" : ""} onClick={() => onChange(mode)}>
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{mode === "list" ? <path d="M3 5h14M3 10h14M3 15h14" /> : <><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="12" y="3" width="5" height="5" rx="1"/><rect x="3" y="12" width="5" height="5" rx="1"/><rect x="12" y="12" width="5" height="5" rx="1"/></>}</svg>
    </button>)}
  </div>;
}
