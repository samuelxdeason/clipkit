import { useEffect, useRef, useState } from 'react';
import { Download, Folder, Link, Lock, Plus, Settings2 } from 'lucide-react';
import {
  Button,
  EmptyState,
  Heading,
  Icon,
  Notice,
  PageHeader,
  SectionHeading,
  SettingsCard,
  SettingsNav,
  StatusBadge,
  Storage,
  Text,
} from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { LibraryShell } from '../../app/library-shell';
import { ConnectionPanel } from '../../app/connection-panel';
import { useLibraryResource } from '../../services/use-library-resource';
import type { LibraryClient } from '../../services/library-client';
import { bytes, sections, type SettingsSection } from './model';

async function loadSettings(api: LibraryClient, signal: AbortSignal) {
  const [root, stats, cookies] = await Promise.all([
    api.mediaRoot(signal),
    api.stats(signal),
    api.cookieStatus(signal),
  ]);
  return { root, stats, cookies };
}

function readSection(): SettingsSection {
  const value = new URLSearchParams(window.location.search).get('section');
  return sections.some((item) => item.id === value) ? (value as SettingsSection) : 'general';
}

const chartTones = ['1', '2', '3', '4'] as const;

/**
 * Settings, as in the existing app: a section navigation beside the page,
 * each section a heading on its own panel and cards of rows. Library shows
 * where the vault is and what it holds; Connections the cookie files the
 * daemon has and a way to import one; Maintenance the backup and rebuild.
 */
export function SettingsPage() {
  const library = useLibraryResource(loadSettings);
  const data = library.data;
  const [section, setSection] = useState<SettingsSection>(readSection);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (section === 'general') url.searchParams.delete('section');
    else url.searchParams.set('section', section);
    window.history.replaceState(null, '', url);
  }, [section]);

  async function run(name: string, action: (api: LibraryClient) => Promise<string>) {
    if (!library.client || busy) return;
    setBusy(name);
    setError('');
    setNotice('');
    try {
      setNotice(await action(library.client));
      void library.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setBusy('');
    }
  }
  async function importCookies(chosen: File | undefined) {
    if (!chosen) return;
    const text = await chosen.text();
    await run('connections', async (api) => {
      await api.uploadCookies(text);
      return 'Connection settings updated.';
    });
  }

  const current = sections.find((item) => item.id === section)!;
  const stats = data?.stats;
  const total = stats?.totalBytes || 0;
  return (
    <LibraryShell page="settings">
      <PageHeader title="Settings" description="Manage your library and preferences." />
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: { base: 'minmax(0, 1fr)', lg: '224px minmax(0, 1fr)' },
          gap: '6',
          alignItems: 'start',
        })}
      >
        <SettingsNav.Root aria-label="Settings sections">
          {sections.map((item) => {
            const glyph =
              item.id === 'general' ? Folder : item.id === 'connections' ? Link : Settings2;
            return (
              <SettingsNav.Item
                key={item.id}
                type="button"
                aria-pressed={section === item.id}
                onClick={() => setSection(item.id)}
              >
                <Icon glyph={glyph} />
                <SettingsNav.Copy>
                  <SettingsNav.Title>{item.label}</SettingsNav.Title>
                  <SettingsNav.Detail>{item.detail}</SettingsNav.Detail>
                </SettingsNav.Copy>
              </SettingsNav.Item>
            );
          })}
        </SettingsNav.Root>
        <div className={css({ minW: '0', display: 'grid', gap: '[30px]' })}>
          <SectionHeading
            surface
            eyebrow="Make ClipKit yours"
            title={current.title}
            description={current.description}
          />
          {(error || library.error) && (
            <Notice
              tone="danger"
              actions={
                <Button variant="quiet" size="compact" onClick={() => void library.refresh()}>
                  Retry
                </Button>
              }
            >
              {error ||
                (data
                  ? 'Couldn’t refresh settings. Showing previously loaded information.'
                  : library.error)}
            </Notice>
          )}
          {(notice || library.notice) && (
            <Notice
              actions={
                !busy && (
                  <Button variant="quiet" size="compact" onClick={() => setNotice('')}>
                    Dismiss
                  </Button>
                )
              }
            >
              {notice || library.notice}
            </Notice>
          )}
          {library.loading && !data ? (
            <EmptyState state="loading" title="Opening settings…" />
          ) : !data ? null : section === 'general' ? (
            <section aria-labelledby="settings-storage">
              <Heading id="settings-storage" size="sm" className={css({ mb: '4' })}>
                Library &amp; storage
              </Heading>
              <SettingsCard.Root>
                <SettingsCard.Row>
                  <SettingsCard.Icon aria-hidden="true">
                    <Folder />
                  </SettingsCard.Icon>
                  <SettingsCard.Copy>
                    <SettingsCard.Title>Library location</SettingsCard.Title>
                    <SettingsCard.Detail>
                      Your media and catalogue are stored here. Change it where the daemon is
                      started.
                    </SettingsCard.Detail>
                  </SettingsCard.Copy>
                  <SettingsCard.Control />
                </SettingsCard.Row>
                <SettingsCard.Path>{data.root || 'Loading library location…'}</SettingsCard.Path>
                <Storage.Root>
                  <Storage.Tiles aria-label="Library storage summary">
                    <Storage.Tile>
                      <Storage.Value>{stats ? bytes(stats.totalBytes) : '—'}</Storage.Value>
                      <Storage.Label>Library storage</Storage.Label>
                    </Storage.Tile>
                    <Storage.Tile>
                      <Storage.Value>{stats?.videoCount.toLocaleString() ?? '—'}</Storage.Value>
                      <Storage.Label>Videos</Storage.Label>
                    </Storage.Tile>
                    <Storage.Tile>
                      <Storage.Value>{stats?.modelCount.toLocaleString() ?? '—'}</Storage.Value>
                      <Storage.Label>People</Storage.Label>
                    </Storage.Tile>
                  </Storage.Tiles>
                  {!!stats?.sites?.length && (
                    <Storage.Breakdown>
                      <Storage.Heading>Storage by source</Storage.Heading>
                      <Storage.Track aria-hidden="true">
                        {stats.sites.map((site, index) => (
                          <Storage.Segment
                            key={site.site}
                            bg={`chart.${chartTones[index % chartTones.length]}`}
                            style={{ width: `${total ? (site.bytes / total) * 100 : 0}%` }}
                          />
                        ))}
                      </Storage.Track>
                      <Storage.Legend>
                        {stats.sites.map((site, index) => (
                          <Storage.Item key={site.site}>
                            <Storage.Dot
                              aria-hidden="true"
                              bg={`chart.${chartTones[index % chartTones.length]}`}
                            />
                            {site.site} <b>{bytes(site.bytes)}</b>
                          </Storage.Item>
                        ))}
                      </Storage.Legend>
                    </Storage.Breakdown>
                  )}
                </Storage.Root>
              </SettingsCard.Root>
            </section>
          ) : section === 'connections' ? (
            <section
              aria-labelledby="settings-connections"
              className={css({ display: 'grid', gap: '4' })}
            >
              <Heading id="settings-connections" size="sm">
                Connected services
              </Heading>
              <Text tone="muted" className={css({ maxW: '[700px]' })}>
                Import a cookies.txt file exported while signed in to access protected posts.
                Connection files are saved in your vault.
              </Text>
              <div>
                <input
                  ref={file}
                  type="file"
                  accept=".txt,text/plain"
                  hidden
                  onChange={(event) => {
                    void importCookies(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
                <Button disabled={!!busy} onClick={() => file.current?.click()}>
                  <Icon glyph={Plus} size="sm" />
                  {busy === 'connections' ? 'Importing…' : 'Import connection file…'}
                </Button>
              </div>
              <SettingsCard.Root>
                {(
                  [
                    ['x', 'X / Twitter'],
                    ['pornhub', 'Pornhub'],
                  ] as const
                ).map(([id, label]) => {
                  const connected = !!data.cookies?.[id];
                  return (
                    <SettingsCard.Row key={id}>
                      <SettingsCard.Icon aria-hidden="true">
                        <Link />
                      </SettingsCard.Icon>
                      <SettingsCard.Copy>
                        <SettingsCard.Title>{label}</SettingsCard.Title>
                        <SettingsCard.Detail>
                          {connected ? 'Connected to your library' : 'No account connected'}
                        </SettingsCard.Detail>
                      </SettingsCard.Copy>
                      <SettingsCard.Control>
                        <StatusBadge tone={connected ? 'success' : 'neutral'} dot>
                          {connected ? 'Connected' : 'Not connected'}
                        </StatusBadge>
                      </SettingsCard.Control>
                    </SettingsCard.Row>
                  );
                })}
              </SettingsCard.Root>
            </section>
          ) : (
            <section aria-labelledby="settings-backup">
              <Heading id="settings-backup" size="sm" className={css({ mb: '4' })}>
                Backup &amp; recovery
              </Heading>
              <SettingsCard.Root>
                <SettingsCard.Row>
                  <SettingsCard.Icon aria-hidden="true">
                    <Download />
                  </SettingsCard.Icon>
                  <SettingsCard.Copy>
                    <SettingsCard.Title>Back up catalogue</SettingsCard.Title>
                    <SettingsCard.Detail>
                      Save collections, people, tags, favorites, and playback positions. Media files
                      are not copied.
                    </SettingsCard.Detail>
                  </SettingsCard.Copy>
                  <SettingsCard.Control>
                    <Button
                      disabled={!!busy}
                      loading={busy === 'backup'}
                      loadingText="Backing up…"
                      onClick={() =>
                        void run(
                          'backup',
                          async (api) => `Backup saved to ${(await api.backup()).path}`,
                        )
                      }
                    >
                      Back up now
                    </Button>
                  </SettingsCard.Control>
                </SettingsCard.Row>
                <SettingsCard.Row>
                  <SettingsCard.Icon aria-hidden="true">
                    <Folder />
                  </SettingsCard.Icon>
                  <SettingsCard.Copy>
                    <SettingsCard.Title>Rebuild library</SettingsCard.Title>
                    <SettingsCard.Detail>
                      Rescan media and saved metadata to restore catalogue entries.
                    </SettingsCard.Detail>
                  </SettingsCard.Copy>
                  <SettingsCard.Control>
                    <Button
                      disabled={!!busy}
                      loading={busy === 'rebuild'}
                      loadingText="Rebuilding…"
                      onClick={() =>
                        void run(
                          'rebuild',
                          async (api) =>
                            `Library rebuilt. ${(await api.rebuild()).count} files catalogued.`,
                        )
                      }
                    >
                      Rebuild…
                    </Button>
                  </SettingsCard.Control>
                </SettingsCard.Row>
              </SettingsCard.Root>
            </section>
          )}
          <div
            className={css({
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2',
            })}
          >
            <Icon glyph={Lock} size="sm" />
            <Text as="span" variant="metadata" tone="muted">
              Your library stays in your vault.
            </Text>
          </div>
        </div>
      </div>
      <ConnectionPanel server={library.server} onConnect={library.connect} busy={library.busy} />
    </LibraryShell>
  );
}
