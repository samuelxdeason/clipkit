import type { downloader } from "../wailsjs/go/models";

/** A view of the complete queue, never the search/sort result or a batch ETA. */
export default function DownloadQueueOverview({ active, waiting, completed, failed, filter, onFilter }: {
  active: downloader.Job[]; waiting: downloader.Job[]; completed: downloader.Job[]; failed: downloader.Job[];
  filter: string; onFilter: (value: string) => void;
}) {
  const current = active[0], next = waiting[0];
  const percent = current && Number.isFinite(current.percent) ? Math.round(Math.max(0, Math.min(100, current.percent))) : 0;
  const cards = [
    {id:"downloading",count:active.length,label:"In progress",detail:active.length ? "Live progress below" : "No active transfers"},
    {id:"queued",count:waiting.length,label:"Waiting",detail:waiting.length ? "Ready in queue order" : "Nothing waiting"},
    {id:"completed",count:completed.length,label:"Completed",detail:"Includes already saved items"},
    {id:"error",count:failed.length,label:"Needs attention",detail:failed.length ? "Review details or retry" : "No failed downloads"},
  ];
  return <section className="queue-overview-panel" aria-label="Queue overview">
    <div className="download-overview">{cards.map(card => <button key={card.id} className={`download-overview-card ${card.id}`} aria-label={`Show ${card.label.toLowerCase()} downloads (${card.count})`} aria-pressed={filter === card.id} onClick={() => onFilter(filter === card.id ? "all" : card.id)}><span>{card.label}</span><strong>{card.count}</strong><small>{card.detail}</small></button>)}</div>
    <div className="queue-live-summary">
      <div><span>{current ? active.length > 1 ? `Active now · 1 of ${active.length}` : "Active now" : "Queue status"}</span><strong title={current?.title || current?.url}>{current ? current.title || current.url : waiting.length ? "Waiting to start" : failed.length ? "Downloads need attention" : "No active downloads"}</strong><small>{current ? [`${percent}%`, current.speed, current.eta ? `${current.eta} remaining for this download` : ""].filter(Boolean).join(" · ") : "Progress and controls appear in the queue below."}</small></div>
      <div><span>Up next</span><strong title={next?.title || next?.url}>{next ? next.title || next.url : "Nothing waiting"}</strong><small>{next ? "First in queue order · reorder below" : "Add a link or browse your followed sources."}</small></div>
    </div>
  </section>;
}
