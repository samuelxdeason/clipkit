import type { ReactNode } from "react";
import { cardTone } from "./identityTone";

/** Source metadata and unfiltered counts; actions remain owned by Following. */
export default function FollowingSourceHeader({ identity, title, host, handle, kind, url, checked, avatar, actions, counts, pending, unavailable }: {
  identity: string; title: string; host: string; handle?: string; kind?: string; url: string; checked: string;
  avatar: ReactNode; actions: ReactNode; counts: [number, number, number, number]; pending: boolean; unavailable: boolean;
}) {
  return <header className="following-source-hero" data-card-tone={cardTone(identity)}>
    <div className="following-hero-art">{avatar}</div>
    <div className="following-hero-copy">
      <span className="following-hero-eyebrow">Followed source</span>
      <div className="following-hero-title"><h2>{title}</h2>{actions}</div>
      <p className="following-hero-meta">{[host, handle ? `@${handle.replace(/^@/, "")}` : "", kind].filter(Boolean).join(" · ")}</p>
      <p className="following-hero-url">{url}</p>
      <dl className="ui-detail-facts" aria-label="Source overview">
        {["Source items", "Downloaded", "Available", "In progress"].map((label, index) => <div key={label}><dt>{label}</dt><dd>{pending || unavailable ? "—" : counts[index].toLocaleString()}</dd></div>)}
      </dl>
      <p className="following-hero-checked">{pending ? "Checking source and library…" : unavailable ? "Source counts unavailable. Try checking for updates again." : `Last checked: ${checked}`}</p>
    </div>
  </header>;
}
