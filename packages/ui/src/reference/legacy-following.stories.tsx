import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  RemoteItemExample,
  SourceCardExample,
  SourceHeroExample,
} from '../components/following.stories';
import { css } from '../../styled-system/css';
import { legacyDocument } from './legacy-document';

/**
 * The existing app's Following surfaces from its real stylesheets beside
 * the recipes. Goes away with frontend/.
 */
const meta = {
  title: 'Reference/Legacy following',
  parameters: { a11y: { test: 'off' }, docs: { disable: true } },
} satisfies Meta;
export default meta;

const caption = css({ color: 'muted', fontSize: 'meta', mb: '2', mt: '6' });
const frame = (height: string) =>
  css({ w: 'container.frame', maxW: 'none', h: `[${height}]`, border: 'none', display: 'block' });

const film =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4"/></svg>';
const button = (label: string, variant = 'neutral') =>
  `<button type="button" class="m-button ui-button ui-button--${variant} ui-button--regular">${label}</button>`;

const sourcesMarkup = `
<section class="following-page"><div class="following-sources">
  <article aria-label="Alex Morgan"><span class="following-avatar" aria-hidden="true"><span>AM</span></span><div class="following-source-copy"><button class="following-source-name">Alex Morgan</button><p>example.test · @alexmorgan · uploads</p><p class="following-source-description">Alex Morgan’s uploads</p><div class="following-source-stats"><span><b>128</b> videos</span><span><b>96</b> downloaded</span><span class="has-new"><b>32</b> available</span></div><small class="following-checked">Last checked: Oct 28, 9:14 PM</small></div><div class="ui-action-group following-source-actions">${button('View person')}${button('Browse')}${button('Check for updates')}<button type="button" class="clear-filters" aria-label="Unfollow Alex Morgan">Unfollow</button></div></article>
  <article aria-label="Evening channel"><span class="following-avatar" aria-hidden="true">${film}</span><div class="following-source-copy"><button class="following-source-name">Evening channel</button><p>example.test · uploads</p><div class="following-source-stats"><span><b>128</b> videos</span><span><b>96</b> downloaded</span><span><b>32</b> available</span></div><small class="following-checked">Last checked: Oct 28, 9:14 PM</small></div><div class="ui-action-group following-source-actions">${button('Browse')}${button('Check for updates')}<button type="button" class="clear-filters" aria-label="Unfollow Evening channel">Unfollow</button></div></article>
</div></section>`;

const heroMarkup = `
<section class="following-page">
  <header class="following-source-hero" data-card-tone="plum">
    <div class="following-hero-art"><span class="following-avatar" aria-hidden="true"><span>AM</span></span></div>
    <div class="following-hero-copy">
      <span class="following-hero-eyebrow">Followed source</span>
      <div class="following-hero-title"><h2>Alex Morgan</h2><div class="ui-action-group following-source-actions">${button('View person')}<a class="m-button" href="#">Open source ↗</a>${button('Check for updates')}</div></div>
      <p class="following-hero-meta">example.test · @alexmorgan · uploads</p>
      <p class="following-hero-url">https://example.test/alexmorgan/videos</p>
      <dl class="ui-detail-facts" aria-label="Source overview"><div><dt>Source items</dt><dd>128</dd></div><div><dt>Downloaded</dt><dd>96</dd></div><div><dt>Available</dt><dd>32</dd></div><div><dt>In progress</dt><dd>0</dd></div></dl>
      <p class="following-hero-checked">Last checked: Oct 28, 9:14 PM</p>
    </div>
  </header>
</section>`;

const item = (state: string, selected = false) => {
  const saved = state === 'downloaded';
  const cls = saved ? 'is-downloaded' : state === 'available' ? 'is-available' : 'is-pending';
  const mark =
    state === 'available'
      ? `<input class="following-select" type="checkbox" aria-label="Select The last light" ${selected ? 'checked' : ''}>`
      : `<span class="following-item-mark" aria-label="${saved ? 'Downloaded' : 'Queued'}">${saved ? '<svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-9"/></svg>' : film}</span>`;
  const preview = saved
    ? `<button class="following-thumbnail" aria-label="Play The last light"><span style="width:100%;height:100%;background:#263c49"></span><span class="following-thumbnail-play">${film}</span></button>`
    : `<div class="following-thumbnail is-placeholder">${film}<span>No saved preview</span></div>`;
  return `<div class="following-item following-media-item ${cls}${selected ? ' is-selected' : ''}">${mark}${preview}<div class="following-media-copy"><button class="following-video-title" ${state === 'pending' ? 'disabled' : ''}>The last light</button>${saved ? '<p class="following-original">Original: the_last_light_final_v2</p>' : ''}<p>example.test · 12:40 · 1080p · 212 MB</p></div><div class="following-media-actions"><span class="following-item-status">${saved ? 'Downloaded' : state === 'pending' ? 'Queued' : 'Available'}</span>${saved ? button('Play') : '<a class="following-source-link" href="#">View source ↗</a>'}</div></div>`;
};
const itemsMarkup = `<section class="following-page"><div class="following-items">${item('available')}${item('available', true)}${item('downloaded')}${item('pending')}</div></section>`;

export const Sources: StoryObj = {
  render: () => (
    <div>
      <p className={caption}>Recipes (new)</p>
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(440px, 100%), 1fr))',
          gap: '6',
          maxW: 'container.frame',
        })}
      >
        <SourceCardExample />
        <SourceCardExample person={false} />
      </div>
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy followed sources"
        srcDoc={legacyDocument(sourcesMarkup)}
        className={frame('360px')}
      />
    </div>
  ),
};

export const SourceHero: StoryObj = {
  render: () => (
    <div className={css({ maxW: 'container.frame' })}>
      <p className={caption}>Recipes (new)</p>
      <SourceHeroExample />
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy source hero"
        srcDoc={legacyDocument(heroMarkup)}
        className={frame('380px')}
      />
    </div>
  ),
};

export const Items: StoryObj = {
  render: () => (
    <div className={css({ maxW: 'container.frame' })}>
      <p className={caption}>Recipes (new)</p>
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
          gap: '6',
        })}
      >
        <RemoteItemExample state="available" />
        <RemoteItemExample state="available" selected />
        <RemoteItemExample state="downloaded" />
        <RemoteItemExample state="pending" />
      </div>
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy source items"
        srcDoc={legacyDocument(itemsMarkup)}
        className={frame('720px')}
      />
    </div>
  ),
};
