import { useState } from "react";

export default function PersonAvatar({ name, src, className = "person-avatar" }: { name: string; src?: string; className?: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const initials = name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
  return <span className={className} aria-hidden="true">{src && failedSource !== src ? <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailedSource(src)} /> : <span>{initials}</span>}</span>;
}
