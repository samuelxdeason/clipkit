import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, ActionGroup } from "./UIControls";
import { PageHeader, LoadState } from "./WorkspaceUI";
import "./manager.css";
import "./design-system.css";
import "./workspace.css";
import "./albums.css";
import "./library-browsing.css";
import "./after-hours.css";
import "./ui-system.css";

function Preview() {
  const [selected, setSelected] = useState(false);
  return <div className="manager finder-shell" style={{ display: "block", minHeight: "100vh", height: "auto" }}><main style={{ maxWidth: 1100, margin: "auto", padding: "32px 20px" }}>
    <PageHeader title="ClipKit design system" description="Shared foundations and components. This preview uses no library data or network requests." />
    <section style={{ marginBottom: 32 }}><h2>Color roles</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
      {[["Canvas", "canvas"], ["Panel", "panel"], ["Field", "field"], ["Raised", "raised"], ["Accent / focus", "accent"], ["Selection", "selection-surface"], ["Tag text", "tag-text"], ["Success", "success"], ["Warning", "warning"], ["Danger", "danger"]].map(([label, token]) => <div key={token}><div style={{ height: 64, borderRadius: 8, border: "1px solid var(--ui-line)", background: `var(--ui-${token})` }}/><p>{label}<br/><code style={{ fontSize: 11 }}>--ui-{token}</code></p></div>)}
    </div></section>
    <section style={{ marginBottom: 32 }}><h2>Actions & states</h2><ActionGroup>
      <Button variant="primary">Primary action</Button><Button>Secondary action</Button><Button variant="quiet">Quiet action</Button><Button variant="danger">Delete collection</Button><Button disabled>Unavailable</Button><Button aria-pressed={selected} onClick={() => setSelected(!selected)}>Toggle selection</Button><Button size="compact">Compact</Button>
    </ActionGroup><p>Tab through controls to inspect focus rings. Toggle selection to inspect the active state.</p></section>
    <section style={{ marginBottom: 32 }}><h2>Page typography</h2><PageHeader title="Your video library" description="Page titles share the same typography across all library destinations."/><span className="tag-pill">Metadata tag</span></section>
    <LoadState title="Couldn’t load this preview" message="Example error state. Recovery remains a neutral action." onRetry={() => {}} />
  </main></div>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
