import { useEffect, useRef, useState } from "react";

type Choice = { value: string; label: string; detail?: string };
export default function FilterMultiSelect({ label, choices, selected, onChange }: {
  label: string; choices: Choice[]; selected: string[]; onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  const close = () => { setOpen(false); setQuery(""); trigger.current?.focus(); };
  const matches = choices.filter(c => [c.label, c.value, c.detail].join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const names = selected.map(value => choices.find(c => c.value === value)?.label || value);
  return <div className="filter-multi">
    <button ref={trigger} type="button" className="filter-picker-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <span>{label}</span><span className="filter-picker-preview">{names.length ? names.join(", ") : "Any"}</span>
      {selected.length > 0 && <span className="filter-picker-count">{selected.length}</span>}
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 4 4 4-4 4" /></svg>
    </button>
    {open && <div className="filter-picker-sheet" role="dialog" aria-modal="true" aria-label={"Choose " + label.toLowerCase()} onKeyDown={e => {
      if (e.key === "Escape") { e.stopPropagation(); close(); }
      if (e.key === "Tab") {
        const nodes = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)'));
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }}>
      <div className="filter-picker-heading"><button type="button" onClick={close} aria-label="Back to filters"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m10 4-4 4 4 4" /></svg></button><strong>{label}</strong><button type="button" className="filter-picker-clear" disabled={!selected.length} onClick={() => onChange([])}>Clear</button></div>
      <div className="filter-picker-search"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><input ref={input} type="search" aria-label={"Search " + label.toLowerCase()} placeholder={"Find " + label.toLowerCase() + "…"} value={query} onChange={e => setQuery(e.target.value)} /></div>
      <div className="filter-picker-options" role="group" aria-label={label}>
        {matches.map(c => <label key={c.value} className={selected.includes(c.value) ? "is-selected" : ""}><input type="checkbox" checked={selected.includes(c.value)} onChange={() => onChange(selected.includes(c.value) ? selected.filter(v => v !== c.value) : [...selected, c.value])} /><span className="filter-picker-check" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m3 8 3 3 7-7" /></svg></span><span className="filter-picker-option-text">{c.label}{c.detail && <small>{c.detail}</small>}</span></label>)}
        {!matches.length && <div className="filter-picker-empty"><strong>No {label.toLowerCase()} found</strong><span>{query ? "Try a different name or spelling." : "Options will appear when added to your videos."}</span>{query && <button type="button" onClick={() => { setQuery(""); input.current?.focus(); }}>Clear search</button>}</div>}
      </div>
      <div className="filter-picker-footer"><div><strong aria-live="polite">{selected.length} selected</strong><span>{label === "Tags" ? "Matches every selected tag" : "Matches any selected person"}</span></div><button type="button" className="m-button" onClick={close}>Done</button></div>
    </div>}
  </div>;
}
