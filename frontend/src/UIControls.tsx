import { Children, isValidElement, type ReactNode, useId, useLayoutEffect, useEffect, useRef, useState, forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from "react";

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

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps & { label: string }>(function IconButton(
  { label, className = "", ...props }, ref
) {
  return <Button {...props} ref={ref} aria-label={label} title={props.title || label} className={`ui-icon-button ${className}`} />;
});

export type ThumbnailSize = "small" | "medium" | "large";
export function useThumbnailSize(kind: "videos" | "photos" | "collections") {
  const key = "clipkitThumbnailSize:" + kind;
  const [value, setValue] = useState<ThumbnailSize>(() => {
    try { const saved = localStorage.getItem(key); return saved === "small" || saved === "large" ? saved : "medium"; } catch { return "medium"; }
  });
  return [value, (next: ThumbnailSize) => { setValue(next); try { localStorage.setItem(key, next); } catch { /* Keep the preference for this session. */ } }] as const;
}
export function ThumbnailSizeControl({ value, onChange, kind }: { value: ThumbnailSize; onChange: (value: ThumbnailSize) => void; kind: "videos" | "photos" | "collections" }) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => { const close = (event: PointerEvent) => { if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false; }; document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close); }, []);
  const label = kind === "videos" ? "Video thumbnail size" : kind === "photos" ? "Photo thumbnail size" : "Collection thumbnail size";
  return <details ref={menu} className="preview-size-menu" onKeyDown={e => { if(e.key === "Escape") { e.stopPropagation(); e.currentTarget.open = false; e.currentTarget.querySelector("summary")?.focus(); } }}>
    <summary aria-label={label} title={"Preview size: " + value}><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="12" y="3" width="5" height="5" rx="1"/><rect x="3" y="12" width="5" height="5" rx="1"/><rect x="12" y="12" width="5" height="5" rx="1"/></svg><Chevron expanded/></summary>
    <div className="preview-size-popover" role="group" aria-label={label}><span>Preview size</span>{(["small", "medium", "large"] as const).map(size => <button type="button" key={size} aria-label={size[0].toUpperCase()+size.slice(1)+" previews"} aria-pressed={value===size} onClick={()=>{onChange(size);if(menu.current){menu.current.open=false;menu.current.querySelector("summary")?.focus();}}}><span>{size[0].toUpperCase()+size.slice(1)}</span><span aria-hidden="true">{value===size?"✓":""}</span></button>)}</div>
  </details>;
}

/** Display preferences and organization live outside the search/filter surface. */
export function MediaBrowseBar({ children, actions }: { children: React.ReactNode; actions: React.ReactNode }) {
  return <div className="media-browse-bar"><div className="media-display-controls">{children}</div><div className="media-manage-controls">{actions}</div></div>;
}

export function Chevron({expanded=false}: {expanded?:boolean}) { return <svg className={`ui-chevron ${expanded?"is-expanded":""}`} width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7 4 6 6-6 6"/></svg>; }

/** Adapt declarative options, including dynamic sources, to the shared popover. */
export function FilterMenu({children, value, onValueChange, "aria-label": label}: {children:ReactNode; value:string|number; onValueChange:(value:string)=>void; "aria-label":string}) {
  const options = Children.toArray(children).filter(isValidElement).map(child=>{const props=child.props as {value?:string|number;children:ReactNode};const text=Children.toArray(props.children).join("");return {value:String(props.value??text),label:text};});
  return <SortMenu label={label} value={String(value)} onChange={onValueChange} options={options} filter/>;
}

/** Single-choice sort menu; changing focus never changes the selected sort. */
export function SortMenu({label, value, onChange, options, filter=false}: {label:string; value:string; onChange:(value:string)=>void; options:{value:string;label:string}[]; filter?:boolean}) {
  const [open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null), trigger=useRef<HTMLButtonElement>(null);
  const id=useId();
  const popup=useRef<HTMLDivElement>(null);
  const [placement,setPlacement]=useState<{left:number;top:number;width:number;maxHeight:number}>();
  useLayoutEffect(()=>{
    if(!open||!filter)return;
    const position=()=>{const anchor=trigger.current?.getBoundingClientRect();if(!anchor)return;const below=window.innerHeight-anchor.bottom-14,above=anchor.top-14;const height=Math.min(popup.current?.scrollHeight||240,280);const up=below<height&&above>below;const maxHeight=Math.max(60,Math.min(280,up?above:below));const width=Math.min(Math.max(anchor.width,180),window.innerWidth-24);setPlacement({left:Math.max(12,Math.min(anchor.left,window.innerWidth-width-12)),top:up?Math.max(12,anchor.top-Math.min(height,maxHeight)-6):anchor.bottom+6,width,maxHeight});};
    position();window.addEventListener("resize",position);window.addEventListener("scroll",position,true);return()=>{window.removeEventListener("resize",position);window.removeEventListener("scroll",position,true);};
  },[open,filter]);
  const typeahead=useRef({text:"",time:0});
  const buttons=()=>Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')||[]);
  const close=(restore=false)=>{setOpen(false);if(restore)trigger.current?.focus();};
  useEffect(()=>{if(open)buttons()[Math.max(0,options.findIndex(o=>o.value===value))]?.focus({preventScroll:true});},[open]);
  useEffect(()=>{const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};document.addEventListener("pointerdown",outside);return()=>document.removeEventListener("pointerdown",outside);},[]);
  return <div className={`sort-menu ${filter?"filter-choice-menu":""}`} ref={root} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false);}}>
    <button type="button" ref={trigger} className="sort-menu-trigger" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>setOpen(v=>!v)} onKeyDown={e=>{if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();setOpen(true);}}}>{options.find(o=>o.value===value)?.label||"Sort"}<Chevron expanded/></button>
    {open&&<div id={id} ref={popup} style={filter?{position:"fixed",...placement}:undefined} className="preview-size-popover sort-menu-popover" role="menu" aria-label={label} onKeyDown={e=>{
      const rows=buttons(),index=rows.indexOf(document.activeElement as HTMLButtonElement);
      if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close(true);return;}
      if(["ArrowDown","ArrowUp","Home","End"].includes(e.key)){e.preventDefault();rows[e.key==="Home"?0:e.key==="End"?rows.length-1:(index+(e.key==="ArrowDown"?1:-1)+rows.length)%rows.length]?.focus();}
      else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&e.key!==" "){e.preventDefault();const now=Date.now();typeahead.current={text:(now-typeahead.current.time<650?typeahead.current.text:"")+e.key.toLocaleLowerCase(),time:now};const match=options.findIndex(o=>o.label.toLocaleLowerCase().startsWith(typeahead.current.text));if(match>=0)rows[match]?.focus();}
    }}><span>{filter?label:"Sort by"}</span>{options.map(o=><button type="button" key={o.value} role="menuitemradio" aria-checked={value===o.value} tabIndex={-1} onClick={()=>{onChange(o.value);close(true);}}><span>{o.label}</span><span aria-hidden="true">{value===o.value?"✓":""}</span></button>)}</div>}
  </div>;
}
