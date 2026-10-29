import { useEffect, useState } from 'react';
import { Button, ChoiceSelect, Dialog, Input, Portal, Text } from '@clipkit/ui';
import type {
  CataloguePhoto,
  CatalogueVideo,
  Collection,
  LibraryClient,
  MediaKeys,
  Person,
} from '../../services/library-client';
import { collectionOptions } from '../../components/browsing/collection-options';
import {
  canMoveCollection,
  collectionPath,
  isLocked,
} from '../../components/browsing/collection-model';

export type CollectionDialogKind =
  | { kind: 'create'; parent: number }
  | { kind: 'rename' }
  | { kind: 'move' }
  | { kind: 'delete' }
  | {
      kind: 'organize';
      action: 'move' | 'add' | 'assign';
      videos: CatalogueVideo[];
      photos: CataloguePhoto[];
    }
  | null;

function keys(videos: CatalogueVideo[], photos: CataloguePhoto[]): MediaKeys {
  return {
    videos: videos.map(({ site, id }) => ({ site, id })),
    photos: photos.map((photo) => photo.id),
  };
}

/**
 * The collection dialogs of the existing browser: create, rename, move and
 * delete a collection, and organize selected media into a folder, another
 * collection or a person. Each is one Dialog with a name field or a choice.
 */
export function CollectionDialogs({
  dialog,
  collections,
  current,
  people,
  busy,
  error,
  mutate,
  onClose,
  onDeleted,
}: {
  dialog: CollectionDialogKind;
  collections: Collection[];
  current?: Collection;
  people: Person[];
  busy: boolean;
  error: string;
  mutate: (action: (api: LibraryClient) => Promise<unknown>, message: string) => Promise<boolean>;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState('');
  const [choice, setChoice] = useState('');
  useEffect(() => {
    setName(dialog?.kind === 'rename' ? current?.name || '' : '');
    setChoice(dialog?.kind === 'move' ? String(current?.parentId || 0) : '');
  }, [dialog, current]);
  if (!dialog) return null;

  const title =
    dialog.kind === 'create'
      ? dialog.parent
        ? 'New subfolder'
        : 'New collection'
      : dialog.kind === 'rename'
        ? 'Rename collection'
        : dialog.kind === 'move'
          ? 'Move collection'
          : dialog.kind === 'delete'
            ? 'Delete collection'
            : dialog.action === 'move'
              ? 'Move to folder'
              : dialog.action === 'add'
                ? 'Add to collection'
                : 'Assign a person';
  const selectedCount =
    dialog.kind === 'organize' ? dialog.videos.length + dialog.photos.length : 0;
  const description =
    dialog.kind === 'create'
      ? `Inside ${collectionPath(collections, dialog.parent) || 'Collections'}`
      : dialog.kind === 'rename'
        ? 'Choose a name that makes this collection easy to find.'
        : dialog.kind === 'move'
          ? 'Choose where this collection and its folders should live.'
          : dialog.kind === 'delete'
            ? `Delete “${current?.name}”? Photos and videos stay in your library. Any subfolders move up one level.`
            : dialog.action === 'move'
              ? `${selectedCount} items leave this folder for the one you choose.`
              : dialog.action === 'add'
                ? `${selectedCount} items. Existing collection memberships are preserved.`
                : `${selectedCount} items. Each photo has one person; videos gain this person alongside any they already have.`;

  const destinations =
    dialog.kind === 'move'
      ? [
          { value: '0', label: 'Collections (top level)' },
          ...collectionOptions(
            collections.filter((item) => canMoveCollection(collections, current?.id || 0, item.id)),
          ),
        ]
      : dialog.kind === 'organize' && dialog.action !== 'assign'
        ? collectionOptions(
            collections.filter((item) => item.id !== current?.id && !isLocked(item)),
          )
        : [];
  const needsName = dialog.kind === 'create' || dialog.kind === 'rename';
  const invalid = needsName
    ? !name.trim()
    : dialog.kind === 'delete'
      ? false
      : dialog.kind === 'move'
        ? choice === '' || choice === String(current?.parentId || 0)
        : !choice;

  async function submit() {
    let done = false;
    if (dialog?.kind === 'create')
      done = await mutate(
        (api) => api.createAlbum(name.trim(), dialog.parent),
        'Collection saved.',
      );
    else if (dialog?.kind === 'rename')
      done = await mutate(
        (api) => api.renameCollection(current!.id, name.trim()),
        'Collection saved.',
      );
    else if (dialog?.kind === 'move')
      done = await mutate((api) => api.moveAlbum(current!.id, Number(choice)), 'Collection moved.');
    else if (dialog?.kind === 'delete') {
      done = await mutate(
        (api) => api.deleteCollection(current!.id),
        'Collection removed. Your media is still in the library.',
      );
      if (done) onDeleted();
    } else if (dialog?.kind === 'organize') {
      const items = keys(dialog.videos, dialog.photos);
      const target = collections.find((item) => String(item.id) === choice);
      if (dialog.action === 'move')
        done = await mutate(
          (api) => api.transferCollectionItems(current!.id, Number(choice), items, false),
          `Moved to “${target?.name}”.`,
        );
      else if (dialog.action === 'add')
        done = await mutate(
          (api) => api.addAlbumItems(Number(choice), items),
          `Added to “${target?.name}”.`,
        );
      else
        done = await mutate(
          async (api) => {
            if (items.photos.length) await api.assignPhotos(items.photos, choice);
            for (const video of dialog.videos)
              await api.people(video, [...new Set([...(video.models || []), choice])]);
          },
          `Assigned to ${people.find((person) => person.name === choice)?.nickname || choice}.`,
        );
    }
    if (done) onClose();
  }

  return (
    <Dialog.Root
      open
      closeOnEscape={!busy}
      closeOnInteractOutside={!busy}
      onOpenChange={(event) => {
        if (!event.open && !busy) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Description>{description}</Dialog.Description>
            {error && (
              <Text role="alert" tone="danger">
                {error}
              </Text>
            )}
            {needsName && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!busy && !invalid) void submit();
                }}
              >
                <Text as="label" variant="label">
                  Collection name
                  <Input
                    autoFocus
                    value={name}
                    placeholder="Collection name"
                    disabled={busy}
                    onChange={(event) => setName(event.target.value)}
                  />
                </Text>
              </form>
            )}
            {(dialog.kind === 'move' ||
              (dialog.kind === 'organize' && dialog.action !== 'assign')) && (
              <>
                <ChoiceSelect
                  portalled={false}
                  label="Destination"
                  value={choice}
                  onChange={setChoice}
                  options={destinations}
                />
                {!destinations.length && (
                  <Text tone="muted">There is no unlocked collection to choose.</Text>
                )}
              </>
            )}
            {dialog.kind === 'organize' && dialog.action === 'assign' && (
              <>
                <ChoiceSelect
                  portalled={false}
                  label="Person"
                  value={choice}
                  onChange={setChoice}
                  options={people.map((person) => ({
                    value: person.name,
                    label: person.nickname || person.name,
                  }))}
                />
                {!people.length && <Text tone="muted">Create a person first.</Text>}
              </>
            )}
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button variant="quiet" disabled={busy}>
                  Cancel
                </Button>
              </Dialog.CloseTrigger>
              <Button
                variant={dialog.kind === 'delete' ? 'danger' : 'primary'}
                disabled={busy || invalid}
                loading={busy}
                onClick={() => void submit()}
              >
                {dialog.kind === 'delete'
                  ? 'Delete collection'
                  : dialog.kind === 'create'
                    ? 'Create'
                    : 'Save'}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
