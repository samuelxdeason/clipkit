import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowUpRight, Film, Image, Tags, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Tag } from './feedback';
import * as MediaCard from './media-card';
import { Identity } from './surfaces';
import { css } from '../../styled-system/css';

const meta = {
  title: 'Patterns/MediaCard',
  parameters: {
    docs: {
      description: {
        component:
          "The existing app's card family: one shell, four silhouettes. Video is a 16:9 frame over a structured body, photo a 4:5 contact sheet, person a portrait stage, tag a typographic tile. Hover lifts the card; data-selected shows the selection surface. Media is the one clickable surface and needs an accessible name. Domain content and identity colour stay in the app.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const grid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: '4',
  alignItems: 'start',
});

function Video({ selectable = false }: { selectable?: boolean }) {
  const [selected, setSelected] = useState(false);
  return (
    <MediaCard.Root
      kind="video"
      aria-label="An evening by the water"
      data-selected={selected || undefined}
    >
      <MediaCard.Frame>
        <MediaCard.Media type="button" aria-label="Preview An evening by the water">
          <MediaCard.Fallback>
            <Film aria-hidden="true" />
            <span>Preview unavailable</span>
          </MediaCard.Fallback>
        </MediaCard.Media>
        <MediaCard.Badge className={css({ bottom: '3', right: '3' })}>12:34</MediaCard.Badge>
        <MediaCard.Badge className={css({ bottom: '3', left: '3' })}>1080p</MediaCard.Badge>
        {selectable && (
          <MediaCard.Select>
            <Checkbox
              label="Select this video"
              hideLabel
              checked={selected}
              onCheckedChange={setSelected}
            />
          </MediaCard.Select>
        )}
        <MediaCard.Progress role="img" aria-label="In progress">
          <MediaCard.ProgressValue style={{ width: '40%' }} />
        </MediaCard.Progress>
      </MediaCard.Frame>
      <MediaCard.Body>
        <MediaCard.Title>An evening by the water</MediaCard.Title>
        <MediaCard.Subtitle>
          <Users aria-hidden="true" />
          <span>Alex Morgan, Casey Ellis</span>
        </MediaCard.Subtitle>
        <MediaCard.Secondary>
          <div className={css({ display: 'flex', gap: '1', minW: '0' })}>
            <Tag onClick={() => {}}>Travel</Tag>
            <Tag onClick={() => {}}>Quiet moments</Tag>
          </div>
          <Button size="compact" variant="quiet">
            File info
          </Button>
        </MediaCard.Secondary>
      </MediaCard.Body>
    </MediaCard.Root>
  );
}

function Photo() {
  return (
    <MediaCard.Root kind="photo" aria-label="Photo 124.jpg">
      <MediaCard.Frame>
        <MediaCard.Media type="button" aria-label="Preview Photo 124.jpg">
          <MediaCard.Fallback>
            <Image aria-hidden="true" />
            <span>Preview unavailable</span>
          </MediaCard.Fallback>
        </MediaCard.Media>
        <MediaCard.Badge className={css({ top: '3', right: '3' })}>
          <Image aria-hidden="true" /> Photo
        </MediaCard.Badge>
      </MediaCard.Frame>
      <MediaCard.Body>
        <MediaCard.Title className={css({ lineClamp: 1, whiteSpace: 'nowrap' })}>
          Photo 124.jpg
        </MediaCard.Title>
        <MediaCard.Subtitle data-empty="">
          <Users aria-hidden="true" />
          <span>No person assigned</span>
        </MediaCard.Subtitle>
      </MediaCard.Body>
    </MediaCard.Root>
  );
}

function Person() {
  return (
    <MediaCard.Root kind="person" aria-label="Alex Morgan">
      <MediaCard.Frame>
        <div
          aria-hidden="true"
          className={css({
            display: 'grid',
            placeItems: 'center',
            w: '[136px]',
            h: '[136px]',
            borderRadius: 'full',
            bg: 'identity.plumWash',
            color: 'identity.plum',
            borderWidth: '1px',
            borderColor: 'identity.plumLine',
            fontSize: '[40px]',
            fontWeight: 'heading',
          })}
        >
          AM
        </div>
        <MediaCard.Arrow
          aria-hidden="true"
          className={css({ position: 'absolute', top: '4', right: '4' })}
        >
          <ArrowUpRight />
        </MediaCard.Arrow>
      </MediaCard.Frame>
      <MediaCard.Body>
        <MediaCard.Title>Alex Morgan</MediaCard.Title>
        <MediaCard.Subtitle>
          <span>Person in your library</span>
        </MediaCard.Subtitle>
        <MediaCard.Footer>
          <span className={css({ display: 'inline-flex', alignItems: 'center', gap: '2' })}>
            <Film className={css({ color: 'identity.plum' })} />
            <span>12 videos</span>
          </span>
        </MediaCard.Footer>
      </MediaCard.Body>
    </MediaCard.Root>
  );
}

function TagTile() {
  return (
    <MediaCard.Root kind="tag" aria-label="Quiet moments">
      <MediaCard.Body>
        <div className={css({ display: 'flex', justifyContent: 'space-between', gap: '4' })}>
          <Identity asChild tone="rose">
            <MediaCard.Symbol aria-hidden="true">
              <Tags />
            </MediaCard.Symbol>
          </Identity>
          <MediaCard.Arrow aria-hidden="true">
            <ArrowUpRight />
          </MediaCard.Arrow>
        </div>
        <div className={css({ mt: 'auto', display: 'grid', gap: '2' })}>
          <MediaCard.Title>Quiet moments</MediaCard.Title>
          <span className={css({ color: 'muted', fontSize: 'control' })}>8 videos</span>
        </div>
      </MediaCard.Body>
    </MediaCard.Root>
  );
}

export const Family: Story = {
  render: () => (
    <div className={grid}>
      <Video />
      <Photo />
      <Person />
      <TagTile />
    </div>
  ),
};

export const Selectable: Story = {
  render: () => (
    <div className={grid}>
      <Video selectable />
    </div>
  ),
};
