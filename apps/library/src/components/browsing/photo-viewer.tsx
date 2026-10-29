import { X } from 'lucide-react';
import { Button, Icon, IconButton, Portal, Viewer } from '@clipkit/ui';
import type { CataloguePhoto } from '../../services/library-client';

/** The photo viewer: one photo from a list, with Previous, Next and the counter. */
export function PhotoViewer({
  photos,
  activeId,
  onPreview,
  src,
}: {
  photos: CataloguePhoto[];
  activeId: string | null;
  onPreview: (id: string | null) => void;
  src: (photo: CataloguePhoto) => string;
}) {
  const index = photos.findIndex((photo) => photo.id === activeId);
  const active = photos[index];
  return (
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
                onPreview(photos[index - 1].id);
              }
              if (event.key === 'ArrowRight' && index < photos.length - 1) {
                event.preventDefault();
                onPreview(photos[index + 1].id);
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
              {active && <Viewer.Image src={src(active)} alt={active.filename} />}
            </Viewer.Stage>
            <Viewer.Footer>
              <Button disabled={index <= 0} onClick={() => onPreview(photos[index - 1].id)}>
                ← Previous
              </Button>
              <Viewer.Caption>
                {index + 1} / {photos.length} · {active?.album || active?.model || 'Photos'}
              </Viewer.Caption>
              <Button
                disabled={index < 0 || index >= photos.length - 1}
                onClick={() => onPreview(photos[index + 1].id)}
              >
                Next →
              </Button>
            </Viewer.Footer>
          </Viewer.Window>
        </Viewer.Positioner>
      </Portal>
    </Viewer.Root>
  );
}
