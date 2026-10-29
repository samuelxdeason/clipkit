import { LibraryShell } from '../../app/library-shell';
import { DirectoryBrowser } from '../../components/browsing/directory-browser';
import { useLibraryResource } from '../../services/use-library-resource';
import type { LibraryClient } from '../../services/library-client';
import { labelEntries } from './model';

async function loadTags(api: LibraryClient, signal: AbortSignal) {
  return labelEntries((await api.labelCounts(signal)) || []);
}
export function TagsPage() {
  const library = useLibraryResource(loadTags);
  return (
    <LibraryShell page="tags">
      <DirectoryBrowser
        kind="tags"
        entries={library.data || []}
        loading={library.loading}
        error={library.error}
        notice={library.notice}
        onRefresh={() => void library.refresh()}
        href={(entry) => `/?tag=${encodeURIComponent(entry.name)}`}
      />
    </LibraryShell>
  );
}
