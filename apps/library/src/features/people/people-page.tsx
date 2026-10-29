import { useState } from 'react';
import { Button, Dialog, Input, Portal, Text } from '@clipkit/ui';
import { LibraryShell } from '../../app/library-shell';
import { DirectoryBrowser } from '../../components/browsing/directory-browser';
import { useLibraryResource } from '../../services/use-library-resource';
import type { LibraryClient } from '../../services/library-client';

async function loadPeople(api: LibraryClient, signal: AbortSignal) {
  return (await api.listPeople(signal)) || [];
}
export function PeoplePage() {
  const library = useLibraryResource(loadPeople);
  const [creating, setCreating] = useState(false),
    [name, setName] = useState('');
  async function create() {
    if (await library.mutate((api) => api.createPerson(name.trim()), 'Person created.')) {
      setCreating(false);
      setName('');
    }
  }
  return (
    <LibraryShell page="people">
      <fieldset disabled={library.busy}>
        <DirectoryBrowser
          kind="people"
          entries={(library.data || []).map((person) => ({
            name: person.name,
            displayName: person.nickname || person.name,
            count: person.count || 0,
            thumbnail: person.thumbnail ? library.client?.media(person.thumbnail) : undefined,
            detail: person.sites,
          }))}
          loading={library.loading}
          error={library.error}
          notice={library.notice}
          onRefresh={() => void library.refresh()}
          href={(entry) => `/?view=person&name=${encodeURIComponent(entry.name)}`}
          actions={
            <Button variant="primary" onClick={() => setCreating(true)}>
              New person
            </Button>
          }
        />
      </fieldset>
      <Dialog.Root
        open={creating}
        closeOnEscape={!library.busy}
        closeOnInteractOutside={!library.busy}
        onOpenChange={(event) => {
          if (!library.busy) setCreating(event.open);
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>New person</Dialog.Title>
              <Dialog.Description>
                Create a person to organize their videos, photos and accounts.
              </Dialog.Description>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void create();
                }}
              >
                <label>
                  Name
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    disabled={library.busy}
                  />
                </label>
                {library.error && (
                  <Text role="alert" tone="danger">
                    {library.error}
                  </Text>
                )}
                <Dialog.Footer>
                  <Dialog.CloseTrigger asChild aria-label="Cancel">
                    <Button variant="quiet" disabled={library.busy}>
                      Cancel
                    </Button>
                  </Dialog.CloseTrigger>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={library.busy}
                    disabled={!name.trim()}
                  >
                    Create person
                  </Button>
                </Dialog.Footer>
              </form>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </LibraryShell>
  );
}
