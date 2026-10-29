import type { Meta, StoryObj } from '@storybook/react-vite';
import { PhotoExample, PlayerExample, stageArtwork } from '../components/viewer.stories';
import { css } from '../../styled-system/css';
import { legacyDocument } from './legacy-document';

/**
 * The existing app's watch window and photo viewer from its real
 * stylesheets beside the Viewer and Organizer recipes. Goes away with
 * frontend/.
 */
const meta = {
  title: 'Reference/Legacy viewer',
  parameters: { a11y: { test: 'off' }, docs: { disable: true } },
} satisfies Meta;
export default meta;

const close =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

const caption = css({ m: '0', mb: '2', mt: '6', color: 'muted', fontSize: 'meta' });
const frameClass = css({
  w: 'container.frame',
  maxW: 'none',
  h: '[640px]',
  border: 'none',
  display: 'block',
});

const option = (initials: string, name: string, detail: string, pressed: boolean) =>
  `<button type="button" class="wo-option" aria-pressed="${pressed}"><span class="person-avatar" aria-hidden="true"><span>${initials}</span></span><span class="wo-option-name"><strong>${name}</strong><small>${detail}</small></span><span class="wo-check" aria-hidden="true">${pressed ? '✓' : '+'}</span></button>`;

const playerMarkup = `
<div class="watch-backdrop"><div class="watch-window has-details" role="dialog" aria-modal="true" aria-labelledby="watch-title" tabindex="-1">
  <header class="viewer-header watch-header"><div><span class="viewer-eyebrow">NOW PLAYING</span><h2 id="watch-title" title="The last light">The last light</h2></div><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular ui-icon-button" aria-label="Close player">${close}</button></header>
  <div class="watch-content"><div class="watch-playback"><div class="watch-stage"><video poster="${stageArtwork}" aria-label="Video player"></video></div>
    <div class="watch-organize-bar"><span>Organize while you watch</span><div><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular" aria-pressed="true">People</button><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular" aria-pressed="false">Tags</button><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular" aria-pressed="false">Collections</button></div></div>
    <footer class="watch-footer"><span>demo · 1080p · MP4</span><div class="watch-controls"><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular" aria-label="Previous video">←</button><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular" aria-label="Next video">→</button><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular" aria-label="Rewind 10 seconds">↶ <span>10s</span></button><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular" aria-label="Forward 10 seconds"><span>10s</span> ↷</button><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular" aria-pressed="false">File details</button><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular">Fullscreen</button></div></footer>
  </div><div class="watch-inspector"><section class="watch-organizer" aria-label="Organize this video">
    <header class="wo-heading"><div><span>YOUR LIBRARY</span><h3>Make it yours</h3></div><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular ui-icon-button" aria-label="Close organization panel">${close}</button></header>
    <nav class="wo-tabs" aria-label="Video information sections"><button type="button" aria-pressed="true">People</button><button type="button" aria-pressed="false">Tags</button><button type="button" aria-pressed="false">Collections</button><button type="button" aria-pressed="false">File</button></nav>
    <div class="wo-feedback" aria-live="polite">Changes save automatically.<button type="button">Undo</button></div>
    <div class="wo-intro"><h4>Who’s in this video?</h4><p>Link anyone you recognize. Select again to unlink.</p></div>
    <form class="wo-search"><input aria-label="Search people" placeholder="Search people…" value="Sam"></form>
    <button type="button" class="m-button wo-create">＋ Create and link “Sam”</button>
    <div class="wo-options">${option('AM', 'Alex Morgan', 'In this video', true)}${option('CE', 'Casey Ellis', 'Link to video', false)}${option('JL', 'Jordan Lane', 'Link to video', false)}</div>
    <p class="wo-empty">No more matches. Use the create button above to add someone.</p>
  </section></div></div>
</div></div>`;

const photoMarkup = `
<div class="detail-backdrop photo-viewer"><div class="detail-window" role="dialog" aria-modal="true" aria-label="IMG_2041.jpg" tabindex="-1">
  <header class="viewer-header"><div><span class="viewer-eyebrow">PHOTO VIEWER</span><h2 title="IMG_2041.jpg">IMG_2041.jpg</h2></div><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular ui-icon-button" aria-label="Close photo">${close}</button></header>
  <img src="${stageArtwork}" alt="IMG_2041.jpg">
  <footer><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular">← Previous</button><span>3 / 24 · Summer</span><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular">Next →</button></footer>
</div></div>`;

// The viewers fill the viewport; the frame's own padding would shrink them.
const fill = '.finder-shell { padding: 0; }';

export const Player: StoryObj = {
  render: () => (
    <div>
      <p className={caption}>Recipes (new)</p>
      <PlayerExample />
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy watch window"
        srcDoc={legacyDocument(playerMarkup, fill)}
        className={frameClass}
      />
    </div>
  ),
};

export const Photo: StoryObj = {
  render: () => (
    <div>
      <p className={caption}>Recipes (new)</p>
      <PhotoExample />
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy photo viewer"
        srcDoc={legacyDocument(photoMarkup, fill)}
        className={frameClass}
      />
    </div>
  ),
};
