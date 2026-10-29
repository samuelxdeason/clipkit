import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button, ChoiceSelect, Dialog, Icon, IconButton, Portal, Text, Viewer } from '@clipkit/ui';
import { collectionOptions } from '../../components/browsing/collection-options';
import type { usePhotoLibrary } from './use-photo-library';

export type PhotoDialogKind = 'person' | 'collection' | 'trash' | null;
export function PhotoDialogs({
  library,
  kind,
  onClose,
  activeId,
  onPreview,
}: {
  library: ReturnType<typeof usePhotoLibrary>;
  kind: PhotoDialogKind;
  onClose: () => void;
  activeId: string | null;
  onPreview: (id: string | null) => void;
}) {
  const [value, setValue] = useState('');
  useEffect(() => setValue(''), [kind]);
  const index = library.matches.findIndex((photo) => photo.id === activeId);
  const active = library.matches[index];
  const title =
    kind === 'person'
      ? 'Assign a person'
      : kind === 'collection'
        ? 'Add photos to a collection'
        : 'Move photos to trash?';
  async function submit() {
    const saved =
      kind === 'person'
        ? await library.assign(value === '__none__' ? '' : value)
        : kind === 'collection'
          ? await library.collect(value)
          : await library.trash();
    if (saved) onClose();
  }
  return (
    <>
      <Viewer.Root
        kind="photo"
        open={!!active}
        onOpenChange={(event) => {
          if (!event.open) onPreview(null);
        }}
      >
        <Portal>
          <Viewer.Backdrop />
          <Viewer.Positioner>
            <Viewer.Window
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft' && index > 0) {
                  event.preventDefault();
                  onPreview(library.matches[index - 1].id);
                }
                if (event.key === 'ArrowRight' && index < library.matches.length - 1) {
                  event.preventDefault();
                  onPreview(library.matches[index + 1].id);
                }
              }}
            >
              <Viewer.Header>
                <Viewer.Heading>
                  <Viewer.Eyebrow>Photo viewer</Viewer.Eyebrow>
                  <Viewer.Title title={active?.filename}>
                    {active?.filename || 'Photo preview'}
                  </Viewer.Title>
                </Viewer.Heading>
                <Viewer.CloseTrigger asChild>
                  <IconButton aria-label="Close photo">
                    <Icon glyph={X} />
                  </IconButton>
                </Viewer.CloseTrigger>
              </Viewer.Header>
              <Viewer.Stage>
                {active && (
                  <Viewer.Image
                    src={library.client?.media(active.filepath)}
                    alt={active.filename}
                  />
                )}
              </Viewer.Stage>
              <Viewer.Footer>
                <Button
                  disabled={index <= 0}
                  onClick={() => onPreview(library.matches[index - 1].id)}
                >
                  ← Previous
                </Button>
                <Viewer.Caption>
                  {index + 1} / {library.matches.length} ·{' '}
                  {active?.album || active?.model || 'Photos'}
                </Viewer.Caption>
                <Button
                  disabled={index < 0 || index >= library.matches.length - 1}
                  onClick={() => onPreview(library.matches[index + 1].id)}
                >
                  Next →
                </Button>
              </Viewer.Footer>
            </Viewer.Window>
          </Viewer.Positioner>
        </Portal>
      </Viewer.Root>
      <Dialog.Root
        open={kind !== null}
        closeOnEscape={!library.busy}
        closeOnInteractOutside={!library.busy}
        onOpenChange={(event) => {
          if (!event.open && !library.busy) onClose();
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>
                {kind === 'trash'
                  ? `${library.selected.length} photos and their files will move to the vault’s recoverable trash and leave their collections. There is no in-app Undo.`
                  : kind === 'person'
                    ? `${library.selected.length} photos. Each photo has one person assignment; this replaces the previous assignment.`
                    : `${library.selected.length} photos. Existing collection memberships are preserved.`}
              </Dialog.Description>
              {library.error && (
                <Text role="alert" tone="danger">
                  {library.error}
                </Text>
              )}
              {kind === 'person' && (
                <ChoiceSelect
                  portalled={false}
                  label="Person assignment"
                  value={value}
                  onChange={setValue}
                  options={[
                    { value: '__none__', label: 'Remove assignment' },
                    ...library.people.map((person) => ({
                      value: person.name,
                      label: person.nickname || person.name,
                    })),
                  ]}
                />
              )}
              {kind === 'collection' && (
                <>
                  <ChoiceSelect
                    portalled={false}
                    label="Collection destination"
                    value={value}
                    onChange={setValue}
                    options={collectionOptions(library.collections)}
                  />
                  {!collectionOptions(library.collections).length && (
                    <Text>Create or unlock a collection in the existing app first.</Text>
                  )}
                </>
              )}
              <Dialog.Footer>
                <Dialog.CloseTrigger asChild aria-label="Cancel">
                  <Button variant="quiet" disabled={library.busy}>
                    Cancel
                  </Button>
                </Dialog.CloseTrigger>
                <Button
                  variant={kind === 'trash' ? 'danger' : 'primary'}
                  loading={library.busy}
                  disabled={kind !== 'trash' && !value}
                  onClick={submit}
                >
                  {kind === 'trash' ? 'Confirm removal' : 'Save changes'}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
