/** Daemon queue wire contract; no UI dependencies. */
export interface DownloadJob {
  id: string;
  url: string;
  title: string;
  status: string;
  percent: number;
  speed: string;
  eta: string;
  count: number;
  error: string;
  replace: boolean;
}
