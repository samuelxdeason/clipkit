import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowUpRight, Film, Image, Tags, Users } from 'lucide-react';
import { Button } from '../components/button';
import { Tag } from '../components/feedback';
import * as MediaCard from '../components/media-card';
import { Identity } from '../components/surfaces';
import { css } from '../../styled-system/css';
import { legacyDocument } from './legacy-document';

/**
 * The existing app's four cards from its real stylesheets, under the
 * MediaCard silhouettes. Goes away with frontend/.
 */
const meta = {
  title: 'Reference/Legacy cards',
  parameters: { a11y: { test: 'off' }, docs: { disable: true } },
} satisfies Meta;
export default meta;

const svg = (path: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const film = svg(
  '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4"/>',
);
const people = svg(
  '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
);
const tag = svg(
  '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
);

const legacyMarkup = `
<div class="grid">
  <article class="library-card library-card--video video-card">
    <div class="video-card-frame">
      <button class="video-card-play" aria-label="Play An evening by the water"><span class="card-image-fallback video-card-placeholder">${film}<span>No preview</span></span></button>
      <span class="video-card-duration">12:34</span>
      <span class="video-card-quality">1080p</span>
    </div>
    <div class="video-card-body">
      <button class="video-card-title">An evening by the water</button>
      <div class="video-card-people">${people}<span>Alex Morgan, Casey Ellis</span></div>
      <div class="video-card-secondary"><div class="tag-list"><button class="tag-pill">Travel</button><button class="tag-pill">Quiet moments</button></div><details class="video-card-info"><summary>File info</summary></details></div>
    </div>
  </article>
  <div class="library-card library-card--photo mixed-media-tile">
    <button class="photo-tile" aria-label="Open Photo 124.jpg"><span class="photo-tile-frame"><span class="card-image-fallback media-tile-placeholder">${film}<span>No preview</span></span></span><strong>Photo 124.jpg</strong><small class="media-tile-subtitle" data-icon="people">${people}<span>No person assigned</span></small></button>
    <span class="mixed-media-kind">${film}Photo</span>
  </div>
  <button class="library-card library-card--person person-tile" data-card-tone="plum">
    <span class="person-tile-art"><span class="person-avatar"><span>AM</span></span><span class="person-tile-open" aria-hidden="true">↗</span></span>
    <span class="person-tile-copy"><strong>Alex Morgan</strong><span class="person-tile-alias">Person in your library</span><span class="person-tile-count">12 videos</span></span>
  </button>
  <button class="library-card library-card--tag tag-directory-card" data-card-tone="rose">
    <span class="tag-directory-symbol" aria-hidden="true">${tag}</span><span class="tag-directory-copy"><strong>Quiet moments</strong><small>8 videos</small></span><span class="tag-directory-arrow" aria-hidden="true">→</span>
  </button>
</div>`;

const caption = css({ color: 'muted', fontSize: 'meta', mb: '2', mt: '6' });
const grid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 240px)',
  gap: '4',
  alignItems: 'start',
});

export const SideBySide: StoryObj = {
  render: () => (
    <div>
      <p className={caption}>Recipes (new)</p>
      <div className={grid}>
        <MediaCard.Root kind="video" aria-label="An evening by the water">
          <MediaCard.Frame>
            <MediaCard.Media type="button" aria-label="Preview An evening by the water">
              <MediaCard.Fallback>
                <Film aria-hidden="true" />
                <span>No preview</span>
              </MediaCard.Fallback>
            </MediaCard.Media>
            <MediaCard.Badge className={css({ bottom: '3', right: '3' })}>12:34</MediaCard.Badge>
            <MediaCard.Badge className={css({ bottom: '3', left: '3' })}>1080p</MediaCard.Badge>
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
        <MediaCard.Root kind="photo" aria-label="Photo 124.jpg">
          <MediaCard.Frame>
            <MediaCard.Media type="button" aria-label="Preview Photo 124.jpg">
              <MediaCard.Fallback>
                <Image aria-hidden="true" />
                <span>No preview</span>
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
                fontWeight: 'bold',
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
              <span>12 videos</span>
            </MediaCard.Footer>
          </MediaCard.Body>
        </MediaCard.Root>
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
      </div>
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy cards"
        srcDoc={legacyDocument(
          legacyMarkup,
          '.grid { display: grid; grid-template-columns: repeat(4, 240px); gap: 16px; align-items: start; }',
        )}
        className={css({ w: '5xl', maxW: 'none', h: '[560px]', border: 'none', display: 'block' })}
      />
    </div>
  ),
};
