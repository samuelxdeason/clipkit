import { useId, useRef, useState } from "react";

type Choice = { value: string; label: string; detail?: string };
export default function OrganizePicker({ kind, choices, value, onChange }: { kind: "tag" | "assign" | "add"; choices: Choice[]; value: string; onChange: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const label = kind === "tag" ? "Tags" : kind === "assign" ? "Person" : "Collection";
  const parts = value.split(",");
  const term = (kind === "tag" ? parts[parts.length - 1] : query).trim().toLowerCase();
  const existing = parts.slice(0, -1).map(t => t.trim().toLowerCase());
  const matches = choices.filter(c => (!term || `${c.label} ${c.detail || ""}`.toLowerCase().includes(term)) && (kind !== "tag" || !existing.includes(c.value.toLowerCase()))).sort((a, b) => Number(b.label.toLowerCase().startsWith(term)) - Number(a.label.toLowerCase().startsWith(term)) || a.label.localeCompare(b.label));
  const choose = (c: Choice) => {
    if (kind === "tag") onChange([...parts.slice(0, -1).map(t => t.trim()).filter(Boolean), c.value].join(", ") + ", ");
    else { onChange(c.value); setQuery(c.label); }
    setOpen(false); setActive(-1); input.current?.focus();
  };
  return <div className="organize-picker" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}>
    <input ref={input} autoFocus role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={open ? listId : undefined} aria-activedescendant={open && active >= 0 && matches[active] ? `${listId}-${active}` : undefined} aria-label={label} placeholder={kind === "tag" ? "Find or create tags…" : `Search ${kind === "assign" ? "people" : "collections"}…`} value={kind === "tag" ? value : query} onClick={() => setOpen(true)} onChange={e => { setOpen(true); setActive(-1); if (kind === "tag") onChange(e.target.value); else { setQuery(e.target.value); onChange(""); } }} onKeyDown={e => {
      if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setOpen(true); const next = matches.length ? (active < 0 ? (e.key === "ArrowDown" ? 0 : matches.length - 1) : (active + (e.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length) : -1; setActive(next); requestAnimationFrame(() => document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" })); }
      else if (e.key === "Enter" && open && active >= 0 && matches[active]) { e.preventDefault(); choose(matches[active]); }
    }} />
    <svg className="picker-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
    {open && <div className="picker-options" id={listId} role="listbox" aria-label={`${label} suggestions`}>
      {matches.map((c, index) => <button type="button" role="option" id={`${listId}-${index}`} tabIndex={-1} key={c.value} aria-selected={active === index || (kind !== "tag" && value === c.value)} onMouseDown={e => e.preventDefault()} onClick={() => choose(c)}><span>{c.label}{c.detail && <small>{c.detail}</small>}</span>{value === c.value && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-9" /></svg>}</button>)}
      {!matches.length && <p role="status">{kind === "tag" ? "No matching tags. Save to create your typed tags." : `No matching ${kind === "assign" ? "people" : "collections"}.`}</p>}
    </div>}
  </div>;
}
