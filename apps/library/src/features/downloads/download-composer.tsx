import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Icon, Input, SectionHeading, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';

export function DownloadComposer({
  value,
  onChange,
  busy,
  connected,
  error,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  busy: boolean;
  connected: boolean;
  error: string;
  onSubmit: () => void;
}) {
  const [multiple, setMultiple] = useState(false);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className={css({ display: 'grid', gap: '4' })}
    >
      <SectionHeading eyebrow="Add to your library" title="Save something new" />
      <div className={css({ display: 'flex', flexWrap: 'wrap', alignItems: 'start', gap: '3' })}>
        <div className={css({ flex: '1', minW: '[min(100%, 240px)]' })}>
          {multiple ? (
            <textarea
              id="download-links"
              aria-label="Add download links"
              rows={4}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              disabled={busy}
              placeholder="Paste one link per line"
              className={css({
                w: 'full',
                p: '3',
                bg: 'field',
                color: 'text',
                borderWidth: '1px',
                borderColor: 'line',
                borderRadius: 'control',
                resize: 'vertical',
                _focusVisible: { outline: '[2px solid]', outlineColor: 'accent' },
              })}
            />
          ) : (
            <Input
              id="download-links"
              aria-label="Add download links"
              placeholder="Paste a video or photo link…"
              value={value}
              disabled={busy}
              onChange={(event) => onChange(event.target.value)}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData('text');
                if (pasted.trim().split(/\s+/).length > 1) {
                  event.preventDefault();
                  setMultiple(true);
                  onChange(pasted);
                }
              }}
            />
          )}
        </div>
        <Button type="submit" variant="primary" disabled={!connected || busy || !value.trim()}>
          <Icon glyph={Plus} size="sm" />
          Add to queue
        </Button>
      </div>
      {error && (
        <Text role="alert" tone="danger">
          {error}
        </Text>
      )}
      <div className={css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3' })}>
        <Button
          type="button"
          variant="quiet"
          size="compact"
          disabled={busy}
          aria-expanded={multiple}
          aria-controls="download-links"
          onClick={() => setMultiple(!multiple)}
        >
          {multiple ? 'Use compact entry' : 'Add multiple links'}
        </Button>
        <Text size="sm" tone="muted">
          Keep browsing. Downloads continue in the background.
        </Text>
      </div>
    </form>
  );
}
