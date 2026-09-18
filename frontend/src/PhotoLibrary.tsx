import { useEffect, useState } from "react";
import * as api from "./api";
import { Icon } from "./App";

export function PersonAccounts({ person, query, onChanged }: { person: string; query: string; onChanged: () => void }) {
  const [accounts, setAccounts] = useState<api.AccountInfo[]>([]);
  const [available, setAvailable] = useState<api.AccountInfo[]>([]);
  const [url, setUrl] = useState("");
  const [account, setAccount] = useState("");
  const [version, setVersion] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => { let live = true; setLoading(true); setError(""); Promise.all([api.AccountsForPerson(person), api.AllAccounts()]).then(([rows, all]) => { if (live) { setAccounts(rows || []); setAvailable((all || []).filter(a => !a.person)); } }).catch(e => { if (live) setError(String(e)); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, [person, version]);
  const run = async (action: () => Promise<unknown>) => { setBusy(true); setError(""); try { await action(); setVersion(v => v + 1); onChanged(); setUrl(""); setAccount(""); } catch (e) { setError(String(e)); } finally { setBusy(false); } };
  return <section className="person-accounts"><h2>Connected accounts</h2><p>Connect the accounts this person uses. Their uploads will appear in this profile.</p>{error && <div className="manager-alert" role="alert">{error}<button onClick={() => setVersion(v => v + 1)}>Retry</button></div>}{loading ? <p>Loading accounts…</p> : <div className="account-list">{accounts.filter(a => [a.platform, a.handle, a.displayName].join(" ").toLowerCase().includes(query.toLowerCase())).map(a => <div className="account-row" key={`${a.platform}/${a.handle}`}><span className="setting-icon"><Icon name="connections" /></span><div><strong>{a.displayName || a.handle}</strong><small>{a.platform} · @{a.handle}</small></div>{/^https?:\/\//i.test(a.url) && <a className="m-button" href={a.url} target="_blank" rel="noreferrer">View account ↗</a>}<button className="m-button" disabled={busy} onClick={() => run(() => api.ConnectAccount(a.platform, a.handle, ""))}>Disconnect</button></div>)}{!error && !accounts.length && <p className="photo-loading">No accounts connected yet.</p>}</div>}<div className="account-connect"><h3>Connect an account</h3><form onSubmit={e => { e.preventDefault(); run(() => api.CreateAccount(url, person)); }}><input type="url" required aria-label="Account profile URL" placeholder="Paste an account profile URL…" value={url} onChange={e => setUrl(e.target.value)} /><button className="m-button primary" disabled={busy || !url.trim()}>Connect URL</button></form>{available.length > 0 && <form onSubmit={e => { e.preventDefault(); const a = available.find(a => JSON.stringify([a.platform, a.handle]) === account); if (a) run(() => api.ConnectAccount(a.platform, a.handle, person)); }}><select aria-label="Existing unassigned account" value={account} onChange={e => setAccount(e.target.value)}><option value="">Choose an unassigned account…</option>{available.map(a => <option key={`${a.platform}/${a.handle}`} value={JSON.stringify([a.platform, a.handle])}>{a.platform} · {a.handle}</option>)}</select><button className="m-button" disabled={busy || !account}>Connect account</button></form>}</div></section>;
}

