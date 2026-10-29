import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComparisonExample, NavExample } from '../components/duplicates.stories';
import { css } from '../../styled-system/css';
import { legacyDocument } from './legacy-document';

/**
 * The existing app's duplicate review surfaces from its real stylesheets
 * beside the recipes. Goes away with frontend/.
 */
const meta = {
  title: 'Reference/Legacy duplicates',
  parameters: { a11y: { test: 'off' }, docs: { disable: true } },
} satisfies Meta;
export default meta;

const caption = css({ color: 'muted', fontSize: 'meta', mb: '2', mt: '6' });
const frame = (height: string) =>
  css({ w: 'container.frame', maxW: 'none', h: `[${height}]`, border: 'none', display: 'block' });

const film =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4"/></svg>';
const button = (label: string, variant = 'neutral', extra = '') =>
  `<button type="button" class="m-button ui-button ui-button--${variant} ui-button--regular" ${extra}>${label}</button>`;

const navMarkup = `
<section class="duplicate-queue">
  <nav class="dq-navigation" aria-label="Review groups">
    <div class="dq-progress"><span class="dq-eyebrow">REVIEW QUEUE</span><strong>3 groups left</strong><span>7 videos to compare · 2 reviewed this session</span></div>
    <div class="dq-pager">${button('←', 'neutral', 'aria-label="Previous group"')}<label><span class="sr-only">Jump to group</span><select><option>Group 1 of 3 · 2 videos</option></select></label>${button('→', 'neutral', 'aria-label="Next group"')}</div>
  </nav>
</section>`;

const copy = (
  i: number,
  title: string,
  kept: boolean,
  resolution: string,
  note: string,
  highlight: boolean,
  size: string,
  sizeNote: string,
  sizeHighlight: boolean,
) => ({
  head: `<th scope="col" class="${kept ? 'dq-kept' : 'dq-recycled'}"><div class="dq-copy-heading"><span>Copy ${i}</span><span class="dq-status ${kept ? 'keep' : 'recycle'}">${kept ? '✓ Keep' : 'Recycle'}</span></div><div class="dq-preview"><button aria-label="Play copy ${i}: ${title}"><span class="dq-thumbnail-placeholder">${film}<span>No preview image</span></span><span class="dq-play">▶ Play</span></button></div><strong class="dq-video-title" title="${title}">${title}</strong><div class="dq-choice"><label class="${kept ? 'is-kept' : 'is-recycled'}"><input aria-label="Keep copy ${i}" type="checkbox" ${kept ? 'checked' : ''}><span class="dq-choice-copy"><strong>${kept ? 'Keep this video' : 'Recycle this video'}</strong><small>${kept ? 'Stays in your library' : 'Moves to Recycle bin when saved'}</small></span></label><button aria-label="Keep only copy ${i}">Keep only this</button></div></th>`,
  resolution: `<td class="${kept ? 'dq-kept' : 'dq-recycled'}"><strong>${resolution}</strong><small class="${highlight ? 'dq-highlight' : ''}">${note}</small></td>`,
  duration: `<td class="${kept ? 'dq-kept' : 'dq-recycled'}"><strong>12:40</strong><small>Same length</small></td>`,
  size: `<td class="${kept ? 'dq-kept' : 'dq-recycled'}"><strong>${size}</strong><small class="${sizeHighlight ? 'dq-highlight' : ''}">${sizeNote}</small></td>`,
  path: `<td class="${kept ? 'dq-kept' : 'dq-recycled'} dq-path">D:\\Media\\Library\\media\\${title}.mp4</td>`,
});
const a = copy(
  1,
  'The last light',
  true,
  '1,920 × 1,080',
  'Highest resolution',
  true,
  '212.4 MB',
  '18.2 MB larger',
  false,
);
const b = copy(
  2,
  'the_last_light_final_v2',
  false,
  '1,280 × 720',
  'Landscape',
  false,
  '194.2 MB',
  'Smallest file',
  true,
);

const reviewMarkup = `
<section class="duplicate-queue"><div class="dq-review">
  <div class="dq-compare-tools"><h2 class="dq-group-heading">Compare 2 videos</h2><div><button class="m-button">Preview side by side</button><button class="m-button pressed" aria-pressed="true">Fewer details</button></div></div>
  <div class="dq-table-scroll" tabindex="0" role="region" aria-label="Video comparison"><table class="dq-table" style="--dq-columns:2">
    <thead><tr><th scope="col" class="dq-row-label"><span>Copies</span><small>Play to check the content.</small></th>${a.head}${b.head}</tr></thead>
    <tbody>
      <tr><th scope="row">Resolution</th>${a.resolution}${b.resolution}</tr>
      <tr><th scope="row">Duration</th>${a.duration}${b.duration}</tr>
      <tr><th scope="row">File size</th>${a.size}${b.size}</tr>
      <tr><th scope="row">Location</th>${a.path}${b.path}</tr>
    </tbody>
  </table></div>
  <p class="dq-comparison-note">Higher resolution and larger files don’t always mean better quality. Preview the content before choosing.</p>
  <div class="dq-decision-bar"><div class="dq-decision-summary"><strong>1 to keep <span>·</span> 1 to recycle</strong><small>194.2 MB will move to Recycle bin. Files are not permanently deleted.</small></div><div class="ui-action-group dq-decision-actions">${button('Skip for now')}${button('Keep all')}${button('Save &amp; next', 'primary')}</div></div>
</div></section>`;

export const Navigation: StoryObj = {
  render: () => (
    <div className={css({ maxW: 'container.frame' })}>
      <p className={caption}>Recipes (new)</p>
      <NavExample />
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy review navigation"
        srcDoc={legacyDocument(navMarkup)}
        className={frame('160px')}
      />
    </div>
  ),
};

export const Review: StoryObj = {
  render: () => (
    <div className={css({ maxW: 'container.frame' })}>
      <p className={caption}>Recipes (new)</p>
      <ComparisonExample />
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy comparison"
        srcDoc={legacyDocument(reviewMarkup)}
        className={frame('1000px')}
      />
    </div>
  ),
};
