import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { library } from "../wailsjs/go/models";
import { MarkWatched, SetPosition } from "./api";
import { Icon } from "./App";

export default function VideoPlayer({ video, src, poster, onClose, onPrevious, onNext, details, detailsOpen, onToggleDetails, onPosition }: {
  video: library.Video;
  src: string;
  poster?: string;
  onClose: () => void;
  onPosition: (position: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  details: ReactNode;
  detailsOpen: boolean;
  onToggleDetails: () => void;
}) {
  const player = useRef<HTMLVideoElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const lastSaved = useRef(0);
  const lastPosition = useRef(video.position || 0);
  const total = useRef(video.duration || 0);
  const loaded = useRef(false);
  const writes = useRef(Promise.resolve());
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const save = () => {
    if (!loaded.current) return;
    const position = lastPosition.current, duration = total.current;
    onPosition(position >= duration - 2 ? 0 : position);
    writes.current = writes.current.then(() => SetPosition(video.site, video.id, position, duration))
      .then(() => setSaveError(""))
      .catch(() => setSaveError("Your playback position couldn’t be saved."));
  };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const handle = (event: KeyboardEvent) => {
      if (document.querySelector(".manager-modal")) return;
      if (event.key === "Escape" && !document.fullscreenElement) {
        event.stopImmediatePropagation();
        close.current();
      }
      if (event.key === "Tab") {
        const elements = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), video, input, select, textarea') || []);
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const changed = () => setFullscreen(!!document.fullscreenElement);
    window.addEventListener("keydown", handle, true);
    document.addEventListener("fullscreenchange", changed);
    return () => {
      save();
      window.removeEventListener("keydown", handle, true);
      document.removeEventListener("fullscreenchange", changed);
      previous?.focus();
    };
  }, []);
  const seek = (seconds: number) => {
    const el = player.current;
    if (el && Number.isFinite(el.duration)) el.currentTime = Math.max(0, Math.min(el.duration, el.currentTime + seconds));
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (panel.current?.requestFullscreen) await panel.current.requestFullscreen();
      else {
        const el = player.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
        if (el?.webkitEnterFullscreen) el.webkitEnterFullscreen();
        else setError("Fullscreen isn’t available in this browser. You can still watch here.");
      }
    } catch { setError("Fullscreen couldn’t open. You can still watch here."); }
  };
  return <div className="watch-backdrop">
    <div className={`watch-window ${detailsOpen ? "has-details" : ""} ${video.height && video.width && video.height > video.width ? "portrait-player" : ""}`} ref={panel} role="dialog" aria-modal="true" aria-labelledby="watch-title" tabIndex={-1}>
      <header className="watch-header"><div><span className="watch-eyebrow">NOW PLAYING</span><h2 id="watch-title">{video.title || video.filename || "Untitled video"}</h2></div><button className="watch-close" onClick={onClose} aria-label="Close player"><Icon name="x" /></button></header>
      <div className="watch-content"><div className="watch-playback"><div className="watch-stage"><video ref={player} src={src} poster={poster} controls autoPlay playsInline preload="metadata" aria-label="Video player"
        onLoadedMetadata={e => {
          const el = e.currentTarget;
          total.current = Number.isFinite(el.duration) ? el.duration : video.duration || 0;
          if (video.position && video.position < total.current - 2) el.currentTime = video.position;
          loaded.current = true;
        }}
        onPlay={() => { MarkWatched(video.site, video.id).catch(() => setSaveError("Watch history couldn’t be updated.")); }}
        onTimeUpdate={e => {
          lastPosition.current = e.currentTarget.currentTime;
          if (Date.now() - lastSaved.current > 10000) { lastSaved.current = Date.now(); save(); }
        }}
        onPause={save} onEnded={() => { lastPosition.current = total.current; save(); }}
        onError={() => setError("This video couldn’t be played. Check that its file is available and its format is supported by your browser.")} />
      </div>
      <footer className="watch-footer"><span>{video.site}{video.height ? ` · ${video.height}p` : ""}{video.ext ? ` · ${video.ext.toUpperCase()}` : ""}</span><div className="watch-controls"><button onClick={onPrevious} disabled={!onPrevious} aria-label="Previous video">←</button><button onClick={onNext} disabled={!onNext} aria-label="Next video">→</button><button onClick={() => seek(-10)} aria-label="Rewind 10 seconds">↶ <span>10s</span></button><button onClick={() => seek(10)} aria-label="Forward 10 seconds"><span>10s</span> ↷</button><button onClick={onToggleDetails} aria-pressed={detailsOpen}><Icon name="menu" />Details</button><button onClick={toggleFullscreen}><Icon name="expand" />{fullscreen ? "Exit fullscreen" : "Fullscreen"}</button></div></footer>
      {(error || saveError) && <p className="watch-error" role="alert">{error || saveError}</p>}
      </div>{detailsOpen && <div className="watch-inspector">{details}</div>}</div>
    </div>
  </div>;
}


