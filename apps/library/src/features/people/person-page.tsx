import { useCallback, useState, type ReactNode } from 'react';
import { Button, EmptyState, Heading, Notice, Breadcrumbs } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { LibraryShell } from '../../app/library-shell';
import { ConnectionPanel } from '../../app/connection-panel';
import { ContentTabs } from '../../components/browsing/content-tabs';
import { ManageToggle } from '../../components/browsing/browse-controls';
import { PersonProfileHeader } from './person-profile-header';
import { useLibraryResource } from '../../services/use-library-resource';
import type { LibraryClient } from '../../services/library-client';
import { ProfileDialog, type ProfileAction } from './profile-dialog';
import { PersonAccounts } from './person-accounts';
import type { ProfileData } from './profile-model';

export function PersonPage({
  name,
  renderMedia,
}: {
  name: string;
  renderMedia: (kind: 'videos' | 'photos') => ReactNode;
}) {
  const [tab, setTab] = useState('videos');
  const load = useCallback(
    async (api: LibraryClient, signal: AbortSignal): Promise<ProfileData | null> => {
      const catalogue = await api.catalogue(signal);
      const person = catalogue.people.find((person) => person.name === name);
      if (!person) return null;
      const [info, accounts] = await Promise.all([
        api.personInfo(name, signal),
        api.accounts(signal),
      ]);
      return {
        person,
        info: { ...info, name, links: info.links || [] },
        accounts: accounts || [],
        people: catalogue.people,
        videos: catalogue.videos.filter((video) => (video.people || []).includes(name)),
      };
    },
    [name],
  );
  const library = useLibraryResource(load);
  const [manage, setManage] = useState(false),
    [action, setAction] = useState<ProfileAction>(null);
  const profile = library.data;
  const displayName = profile?.info.nickname || profile?.person.nickname || name;
  return (
    <LibraryShell page="people">
      <Breadcrumbs>
        <a href="/?view=people">People</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{displayName}</span>
      </Breadcrumbs>
      {library.error && (
        <Notice
          tone="danger"
          className={css({ my: '3' })}
          actions={
            <Button variant="quiet" size="compact" onClick={() => void library.refresh()}>
              Retry
            </Button>
          }
        >
          {library.error}
        </Notice>
      )}
      {library.notice && <Notice className={css({ my: '3' })}>{library.notice}</Notice>}
      {library.loading && !profile ? (
        <EmptyState state="loading" title="Loading profile…" />
      ) : !profile ? (
        <>
          <Heading as="h1">{library.error ? 'Profile unavailable' : 'Person not found'}</Heading>
          <Button asChild>
            <a href="/?view=people">Back to people</a>
          </Button>
        </>
      ) : (
        <>
          <PersonProfileHeader
            name={name}
            profile={profile}
            cover={
              profile.info.cover || profile.person.thumbnail
                ? library.client?.media(profile.info.cover || profile.person.thumbnail!)
                : undefined
            }
            busy={library.busy}
            manage={manage}
            onAction={setAction}
          />
          <ContentTabs
            label="Person content"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'videos', label: 'Videos' },
              { value: 'photos', label: 'Photos' },
              { value: 'accounts', label: 'Accounts' },
            ]}
          >
            {tab === 'accounts' ? (
              <>
                <div className={css({ display: 'flex', justifyContent: 'end' })}>
                  <ManageToggle active={manage} onToggle={() => setManage((value) => !value)} />
                </div>
                <PersonAccounts
                  name={name}
                  accounts={profile.accounts}
                  busy={library.busy}
                  mutate={library.mutate}
                />
              </>
            ) : (
              renderMedia(tab === 'photos' ? 'photos' : 'videos')
            )}
          </ContentTabs>
          <ProfileDialog
            action={action}
            onClose={() => setAction(null)}
            data={profile}
            busy={library.busy}
            error={library.error}
            mutate={library.mutate}
          />
        </>
      )}
      <ConnectionPanel server={library.server} onConnect={library.connect} busy={library.busy} />
    </LibraryShell>
  );
}
