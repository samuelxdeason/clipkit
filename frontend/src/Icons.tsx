export function Icon({ name, className = "", size = "regular" }: { name: string; className?: string; size?: "small" | "regular" | "feature" | "placeholder" }) {
  const pixels = { small: 14, regular: 18, feature: 24, placeholder: 32 }[size];
  const p: Record<string, JSX.Element> = {
    filters: <><path d="M4 7h4m4 0h8M4 17h10m4 0h2"/><circle cx="10" cy="7" r="2"/><circle cx="16" cy="17" r="2"/></>,
    photo: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/></>,
    film: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/></>,
    connections: <><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="20" cy="7" r="2"/><circle cx="6" cy="20" r="2"/><path d="m6.5 6.5 3.3 3.3m5-0.3 3.4-1.4M10 14.5l-2.8 3.8"/></>,
    expand: <path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>,
    home: <><path d="M3.5 10.8 12 3.5l8.5 7.3" /><path d="M5.5 9.5V20a.8.8 0 0 0 .8.8H10v-5.6h4v5.6h3.7a.8.8 0 0 0 .8-.8V9.5" /></>,
    feed: <><circle cx="12" cy="12" r="8.8" /><path d="M10.2 8.9v6.2L15.3 12z" fill="currentColor" stroke="none" /></>,
    people: <><circle cx="9" cy="8.2" r="3.4" /><path d="M3.6 19.8c.5-3.4 2.7-5.3 5.4-5.3s4.9 1.9 5.4 5.3" /><path d="M15.3 5.5a3.4 3.4 0 0 1 0 5.4M17.6 14.9c1.5.9 2.5 2.6 2.8 4.9" /></>,
    heart: <path d="M12 20.2C7.2 16.4 3.8 13.4 3.8 9.8 3.8 7.4 5.7 5.5 8 5.5c1.6 0 3.1.9 4 2.2.9-1.3 2.4-2.2 4-2.2 2.3 0 4.2 1.9 4.2 4.3 0 3.6-3.4 6.6-8.2 10.4z" />,
    tag: <><path d="M3.8 12.3 11.5 20l8.3-8.3V4.2h-7.5L3.8 12.3z" /><circle cx="15.7" cy="8.3" r="1.3" /></>,
    clock: <><circle cx="12" cy="12" r="8.8" /><path d="M12 7.2V12l3.3 2" /></>,
    plus: <path d="M12 5.5v13M5.5 12h13" />,
    spark: <><path d="M12 3.5 13.7 9 19.2 10.7 13.7 12.4 12 17.9 10.3 12.4 4.8 10.7 10.3 9z" /><path d="M18.5 16.5v4M16.5 18.5h4" /></>,
    download: <><path d="M12 4.2v10.6m0 0 4.2-4.2M12 14.8 7.8 10.6" /><path d="M4.8 19.6h14.4" /></>,
    gear: <><circle cx="12" cy="12" r="3.1" /><path d="M12 3v2.6M12 18.4V21M3 12h2.6M18.4 12H21M5.6 5.6l1.9 1.9M16.5 16.5l1.9 1.9M18.4 5.6l-1.9 1.9M7.5 16.5l-1.9 1.9" /></>,
    folder: <path d="M3.8 7.3v10.9a1 1 0 0 0 1 1h14.4a1 1 0 0 0 1-1V9.3a1 1 0 0 0-1-1h-7.6l-2-2H4.8a1 1 0 0 0-1 1z" />,
    hidden: <><path d="M4.2 12.8c2.4 2.3 5 3.4 7.8 3.4s5.4-1.1 7.8-3.4" /><path d="M12 16.6v2.6M7.2 15.5l-1.5 2.2M16.8 15.5l1.5 2.2" /></>,
    lock: <><rect x="5.8" y="11" width="12.4" height="8.6" rx="2" /><path d="M8.7 11V8.2a3.3 3.3 0 0 1 6.6 0V11" /></>,
    menu: <path d="M4.5 7.2h15M4.5 12h15M4.5 16.8h15" />,
    search: <><circle cx="11" cy="11" r="6.6" /><path d="m15.9 15.9 4.1 4.1" /></>,
    grid: <><rect x="4" y="4" width="6.8" height="6.8" rx="1.8" /><rect x="13.2" y="4" width="6.8" height="6.8" rx="1.8" /><rect x="4" y="13.2" width="6.8" height="6.8" rx="1.8" /><rect x="13.2" y="13.2" width="6.8" height="6.8" rx="1.8" /></>,
    x: <path d="M6.2 6.2l11.6 11.6M17.8 6.2 6.2 17.8" />,
    "heart-fill": <path d="M12 20.2C7.2 16.4 3.8 13.4 3.8 9.8 3.8 7.4 5.7 5.5 8 5.5c1.6 0 3.1.9 4 2.2.9-1.3 2.4-2.2 4-2.2 2.3 0 4.2 1.9 4.2 4.3 0 3.6-3.4 6.6-8.2 10.4z" fill="currentColor" stroke="none" />,
    bookmark: <path d="M7 4.6h10a1 1 0 0 1 1 1v13.8l-6-3.9-6 3.9V5.6a1 1 0 0 1 1-1z" />,
    "bookmark-fill": <path d="M7 4.6h10a1 1 0 0 1 1 1v13.8l-6-3.9-6 3.9V5.6a1 1 0 0 1 1-1z" fill="currentColor" stroke="none" />,
    volume: <><path d="M4.6 9.6v4.8h2.9l4.4 3.7V5.9L7.5 9.6z" /><path d="M15.3 9.2a4 4 0 0 1 0 5.6M17.9 6.9a7.4 7.4 0 0 1 0 10.2" /></>,
    "volume-off": <><path d="M4.6 9.6v4.8h2.9l4.4 3.7V5.9L7.5 9.6z" /><path d="m15.4 9.7 4.6 4.6M20 9.7l-4.6 4.6" /></>,
    shuffle: <><path d="M4 7.2h2.9c4.7 0 4.5 9.6 9.2 9.6H19M4 16.8h2.9c1.9 0 3-1.4 3.9-3M19 7.2h-2.9c-1.9 0-3 1.4-3.9 3" /><path d="m16.6 4.8 2.6 2.4-2.6 2.4M16.6 14.4l2.6 2.4-2.6 2.4" /></>,
    "play-fill": <path d="M8.6 5.6v12.8L19.2 12z" fill="currentColor" stroke="none" />,
  };
  return (
    <svg width={pixels} height={pixels} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
      strokeLinecap="round" strokeLinejoin="round" className={`ui-icon ui-icon--${size} ${className}`} data-icon={name} aria-hidden="true" focusable="false">
      {p[name]}
    </svg>
  );
}


