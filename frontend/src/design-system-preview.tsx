import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ActionGroup } from "./UIControls";
import { PageHeader, LoadState } from "./WorkspaceUI";
import { PersonCard, TagCard } from "./LibraryCards";
import VideoCard from "./VideoCard";
import MediaTile from "./MediaTile";
import CollectionFolderCard from "./CollectionFolderCard";
import { library } from "../wailsjs/go/models";
import type { Album } from "./api";
import "./style.css";
import "./manager.css";
import "./design-system.css";
import "./workspace.css";
import "./albums.css";
import "./library-browsing.css";
import "./after-hours.css";
import "./ui-system.css";
import "./library-cards.css";
import "./browsing-controls.css";

const artwork = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#48515d"/><circle cx="480" cy="90" r="55" fill="#b7a6bc"/><path d="M0 360 190 120 380 360 510 190 640 360" fill="#78838a"/></svg>');
const sampleVideo = new library.Video({ title: "An afternoon in the hills", site: "Local", id: "preview", duration: 600, position: 120, height: 1080, width: 1920, labels: ["Travel"], filesize: 94371840 });
const sampleCollection = { id: 1, name: "Weekend favorites", count: 12, photoCount: 8, videoCount: 4, albumCount: 0, covers: [artwork], parentId: 0, locked: false, hidden: false, inheritedHidden: false, inheritedLocked: false } as Album;

function Preview() {
  const [selected, setSelected] = useState(false);
  const [cardSelected, setCardSelected] = useState(false);
  const [cardStatus, setCardStatus] = useState("Open a sample card to see its action.");
  return <div className="manager finder-shell" style={{ display: "block", minHeight: "100vh", height: "auto" }}><main style={{ maxWidth: 1100, margin: "auto", padding: "32px 20px" }}>
    <PageHeader title="ClipKit design system" description="Shared foundations and components. This preview uses no library data or network requests." />
    <section style={{ marginBottom: 32 }}><h2>Color roles</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
      {[["Canvas", "canvas"], ["Panel", "panel"], ["Field", "field"], ["Raised", "raised"], ["Accent / focus", "accent"], ["Selection", "selection-surface"], ["Tag text", "tag-text"], ["Success", "success"], ["Warning", "warning"], ["Danger", "danger"]].map(([label, token]) => <div key={token}><div style={{ height: 64, borderRadius: 8, border: "1px solid var(--ui-line)", background: `var(--ui-${token})` }}/><p>{label}<br/><code style={{ fontSize: 11 }}>--ui-{token}</code></p></div>)}
    </div></section>
    <section style={{ marginBottom: 32 }}><h2>Actions & states</h2><ActionGroup>
      <Button variant="primary">Primary action</Button><Button>Secondary action</Button><Button variant="quiet">Quiet action</Button><Button variant="danger">Delete collection</Button><Button disabled>Unavailable</Button><Button aria-pressed={selected} onClick={() => setSelected(!selected)}>Toggle selection</Button><Button size="compact">Compact</Button>
    </ActionGroup><p>Tab through controls to inspect focus rings. Toggle selection to inspect the active state.</p></section>
    <section style={{ marginBottom: 32 }}><h2>Page typography</h2><PageHeader title="Your video library" description="Page titles share the same typography across all library destinations."/><span className="tag-pill">Metadata tag</span></section>
    <section style={{ marginBottom: 32 }}><h2>Library card family</h2><p role="status">{cardStatus}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 24, alignItems: "start" }}>
      <VideoCard video={sampleVideo} thumbnail={artwork} people={["Alex"]} selected={cardSelected} selectionMode={false} onSelect={() => setCardSelected(!cardSelected)} onPlay={() => setCardStatus("Video playback action")} onTag={tag => setCardStatus(`Browse tag ${tag}`)} />
      <MediaTile title="Mountain light.jpg" subtitle="Alex" thumbnail={artwork} kind="photo" selected={cardSelected} selectionMode={false} onSelect={() => setCardSelected(!cardSelected)} onOpen={() => setCardStatus("Photo viewer action")} />
      <CollectionFolderCard folder={sampleCollection} featured media={path => path} onOpen={() => setCardStatus("Browse collection action")} onCreate={() => setCardStatus("Create subfolder action")} />
      <PersonCard name="Alex" count={12} thumbnail={artwork} onOpen={() => setCardStatus("Open person action")} />
      <TagCard name="Travel" count={12} onOpen={() => setCardStatus("Browse tag action")} />
    </div></section>
    <LoadState title="Couldn’t load this preview" message="Example error state. Recovery remains a neutral action." onRetry={() => {}} />
  </main></div>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
