import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button, ChoiceSelect, Dialog, Icon, IconButton, Input, Portal, Text } from '@clipkit/ui';
import { collectionOptions } from '../../components/browsing/collection-options';
import { css } from '@clipkit/ui/css';
import { useVideoLibrary } from './use-video-library';
import { useConnectedLibrary } from './use-connected-library';
export type VideoDialogKind = 'collection' | 'remove' | 'tags' | 'person' | null;
const row = css({ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '3' });
export function VideoDialogs({
  demo,
  library,
  connected,
  dialog,
  setDialog,
}: {
  demo: boolean;
  library: ReturnType<typeof useVideoLibrary> | ReturnType<typeof useConnectedLibrary>;
  connected: ReturnType<typeof useConnectedLibrary>;
  dialog: VideoDialogKind;
  setDialog: (value: VideoDialogKind) => void;
}) {
  const busy = !demo && connected.busy;
  const [collection, setCollection] = useState('');
  const [editValue, setEditValue] = useState('');
  useEffect(() => {
    setCollection(demo ? 'Weekend favorites' : '');
    setEditValue('');
  }, [dialog, demo]);
  const dialogTitle = {
    collection: 'Add to a collection',
    tags: 'Add tags',
    person: 'Add a person',
    remove: demo ? 'Remove demo videos?' : 'Move videos to trash?',
  }[dialog || 'collection'];
  const dialogAction = {
    collection: 'Add selected videos',
    tags: 'Save changes',
    person: 'Save changes',
    remove: 'Confirm removal',
  }[dialog || 'collection'];
  let dialogDescription = `${library.selected.length} selected videos. Changes are saved to your library.`;
  if (demo)
    dialogDescription = `${library.selected.length} selected videos. Changes last for this session only.`;
  if (dialog === 'remove')
    dialogDescription = demo
      ? `${library.selected.length} items will leave this demo. No real files are deleted, and you can undo this.`
      : `${library.selected.length} videos and their files will move to the vault’s recoverable trash and leave their collections. There is no in-app Undo. This does not permanently erase the files.`;
  const invalidDialog =
    !demo &&
    ((dialog === 'collection' && !collection) ||
      (dialog === 'tags' && !editValue.split(',').some((value) => value.trim())) ||
      (dialog === 'person' && !editValue));
  async function confirmDialog() {
    let success: boolean | void;
    if (dialog === 'collection') success = await library.collect(collection);
    else if (dialog === 'tags') success = await connected.addTags(editValue);
    else if (dialog === 'person') success = await connected.addPerson(editValue);
    else success = await library.removeSelected();
    if (demo || success) setDialog(null);
  }
  return (
    <>
      <Dialog.Root
        open={dialog !== null}
        closeOnEscape={!busy}
        closeOnInteractOutside={!busy}
        onOpenChange={(event) => {
          if (!event.open && !busy) setDialog(null);
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <div className={row}>
                <Dialog.Title>{dialogTitle}</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <IconButton aria-label="Close organize dialog" variant="quiet" disabled={busy}>
                    <Icon glyph={X} />
                  </IconButton>
                </Dialog.CloseTrigger>
              </div>
              <Dialog.Description>{dialogDescription}</Dialog.Description>
              {!demo && connected.error && (
                <Text tone="danger" role="alert">
                  {connected.error}
                </Text>
              )}
              {dialog === 'collection' && (
                <ChoiceSelect
                  portalled={false}
                  label="Collection"
                  value={collection}
                  onChange={setCollection}
                  options={
                    demo
                      ? ['Weekend favorites', 'Watch later', 'Quiet moments'].map((value) => ({
                          value,
                          label: value,
                        }))
                      : collectionOptions(connected.collections)
                  }
                />
              )}
              {dialog === 'collection' &&
                !demo &&
                !connected.collections.some((item) => !item.locked && !item.inheritedLocked) && (
                  <Text tone="muted">Create or unlock a collection in the existing app first.</Text>
                )}
              {dialog === 'tags' && (
                <label>
                  Tags, separated by commas
                  <Input
                    value={editValue}
                    onChange={(event) => setEditValue(event.target.value)}
                    disabled={busy}
                  />
                </label>
              )}
              {dialog === 'person' && (
                <ChoiceSelect
                  portalled={false}
                  label="Person to add"
                  value={editValue}
                  onChange={setEditValue}
                  options={connected.people.map((person) => ({
                    value: person.name,
                    label: person.nickname || person.name,
                  }))}
                />
              )}
              {dialog === 'person' && !connected.people.length && (
                <Text tone="muted">Create a person in the existing app first.</Text>
              )}
              <Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <Button variant="quiet" disabled={busy}>
                    Cancel
                  </Button>
                </Dialog.CloseTrigger>
                <Button
                  variant={
                    dialog === 'collection' ? 'primary' : dialog === 'remove' ? 'danger' : 'neutral'
                  }
                  disabled={busy || invalidDialog}
                  loading={busy}
                  onClick={confirmDialog}
                >
                  {dialogAction}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
