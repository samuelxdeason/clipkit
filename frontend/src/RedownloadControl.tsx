import { Button } from "./UIControls";
import { useState } from "react";
import { Redownload } from "./api";

export default function RedownloadControl({ site, id, source, disabled }: { site: string; id: string; source: string; disabled?: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setPending(true); setError(""); setMessage("");
    try {
      await Redownload(site, id);
      setConfirm(false);
      setMessage("Re-download queued. Check Downloads for progress. Your current file stays until the replacement finishes.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setPending(false); }
  };

  return <div className="inspector-section">
    <h3>Download quality</h3>
    {source?.trim() ? <>
      {confirm ? <>
        <p>Download the best available quality and replace this file? Favorites, tags and collections are kept.</p>
        <Button variant="primary" disabled={disabled || pending} onClick={submit}>{pending ? "Queuing…" : "Replace file"}</Button>
        <Button variant="neutral" disabled={pending} onClick={() => setConfirm(false)}>Cancel</Button>
      </> : <Button variant="neutral" disabled={disabled || pending} onClick={() => { setConfirm(true); setMessage(""); setError(""); }}>Re-download in best quality</Button>}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </> : <p>Re-download unavailable: this video has no saved source link.</p>}
  </div>;
}
