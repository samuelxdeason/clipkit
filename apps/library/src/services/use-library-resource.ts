import { useCallback, useEffect, useRef, useState } from 'react';
import { LibraryClient, resolveServer, validateServer } from './library-client';

function storedServer() {
  try {
    return localStorage.getItem('clipkit.library.server') || '';
  } catch {
    return '';
  }
}

/** Shared lifecycle for directory/profile reads. The feature supplies a stable loader. */
export function useLibraryResource<T>(
  load: (client: LibraryClient, signal: AbortSignal) => Promise<T>,
) {
  const [server, setServer] = useState(storedServer);
  const [attempt, setAttempt] = useState(0);
  const [client, setClient] = useState<LibraryClient | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [writeError, setWriteError] = useState('');
  const [notice, setNotice] = useState('');
  const pending = useRef<AbortController | null>(null);
  const active = useRef(true);
  const lock = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      pending.current?.abort();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    pending.current?.abort();
    setClient(null);
    setData(null);
    setLoading(true);
    setError('');
    setWriteError('');
    setNotice('');
    resolveServer(server)
      .then((origin) => {
        if (!cancelled) setClient(new LibraryClient(origin));
      })
      .catch((error) => {
        if (!cancelled) {
          setError(String(error));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      pending.current?.abort();
    };
  }, [server, attempt]);
  const refresh = useCallback(async () => {
    if (!client || !active.current) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    try {
      const next = await load(client, controller.signal);
      if (!controller.signal.aborted && active.current) {
        setData(next);
        setError('');
      }
    } catch (error) {
      if (!controller.signal.aborted && active.current)
        setError(error instanceof Error ? error.message : String(error));
    } finally {
      if (pending.current === controller && active.current) setLoading(false);
    }
  }, [client, load]);
  useEffect(() => {
    setData(null);
    setWriteError('');
    setNotice('');
    if (!client) return;
    void refresh();
    const off = client.subscribe(() => {
      if (!lock.current) void refresh();
    });
    return () => {
      off();
      pending.current?.abort();
    };
  }, [client, refresh]);
  async function mutate(action: (client: LibraryClient) => Promise<unknown>, message: string) {
    if (!client || lock.current) return false;
    lock.current = true;
    setBusy(true);
    setWriteError('');
    setNotice('');
    pending.current?.abort();
    let success = false;
    try {
      await action(client);
      success = true;
      if (active.current) setNotice(message);
    } catch (error) {
      if (active.current) setWriteError(error instanceof Error ? error.message : String(error));
    } finally {
      await refresh();
      lock.current = false;
      if (active.current) setBusy(false);
    }
    return success;
  }
  function connect(value: string) {
    if (lock.current) return;
    try {
      const next = validateServer(value);
      try {
        localStorage.setItem('clipkit.library.server', next);
      } catch {
        /* Optional persistence. */
      }
      if (next !== server) setServer(next);
      else if (client) void refresh();
      else setAttempt((value) => value + 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  }
  return {
    data,
    client,
    server,
    connect,
    loading,
    busy,
    error: writeError || error,
    notice,
    mutate,
    refresh: client ? refresh : () => setAttempt((value) => value + 1),
  };
}
