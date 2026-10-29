import { useEffect, useState } from 'react';
import { Button, ChoiceSelect, Dialog, Portal, Text } from '@clipkit/ui';
import { PhotoViewer } from '../../components/browsing/photo-viewer';
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
      <PhotoViewer
        photos={library.matches}
        activeId={activeId}
        onPreview={onPreview}
        src={(photo) => library.client?.media(photo.filepath) || ''}
      />
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
