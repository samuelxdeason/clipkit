/** Keep connection failures readable without discarding useful server validation. */
export async function readJSONResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const html = /text\/html/i.test(response.headers.get("content-type") || "") || /^\s*</.test(text);
  if (html) throw new Error("The library server is unavailable. Check that ClipKit is running, then try again.");
  if (!response.ok) {
    let message = text.trim();
    try {
      const body = JSON.parse(text);
      message = typeof body === "string" ? body : body.message || body.error || "";
    } catch { /* Plain-text validation responses are supported by the server. */ }
    throw new Error(typeof message === "string" && message ? message : `The request failed (${response.status}). Please try again.`);
  }
  try { return JSON.parse(text) as T; }
  catch { throw new Error("The library returned an unreadable response. Please try again."); }
}

export async function requestJSON<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, options); }
  catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("Couldn’t connect to your library. Check that ClipKit is running and your connection is available, then try again.");
  }
  return readJSONResponse<T>(response);
}
