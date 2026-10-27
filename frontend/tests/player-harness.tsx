import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import VideoPlayer from "../src/VideoPlayer";
import { library } from "../wailsjs/go/models";
import "../src/style.css";
import "../src/manager.css";
import "../src/design-system.css";
import "../src/watch-organizer.css";

function Harness() {
  const [open, setOpen] = useState(false);
  const [closed, setClosed] = useState(false);
  const [video, setVideo] = useState(new library.Video({ id: "sample", site: "Local", title: "An afternoon by the coast", filename: "sample.mp4", filepath: "sample.mp4", webpage_url: "", models: ["Alex Morgan"], people: ["Alex Morgan", "Source Person"], labels: ["Travel"], favorite: false, width: 160, height: 90, duration: 60, position: 3 }));
  return <div className="finder-shell">{closed ? <p>Player closed</p> : <VideoPlayer video={video} src="/test-video.mp4" detailsOpen={open} onToggleDetails={() => setOpen(v => !v)} onChanged={() => {}} media={p => p} onClose={() => setClosed(true)} onPosition={position => setVideo(v => ({...v,position}))} />}</div>;
}
createRoot(document.getElementById("root")!).render(<Harness />);
