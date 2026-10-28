import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heart, Plus } from 'lucide-react';
import { Button } from '../components/button';
import { IconButton } from '../components/icon-button';
import { Icon } from '../components/icon';
import { css } from '../../styled-system/css';
import { legacyDocument } from './legacy-document';

/**
 * The existing app's buttons, rendered from its real stylesheets inside an
 * isolated frame, above the recipe-driven Button. Both rows use the same
 * labels so the two can be compared pixel for pixel. This story goes away
 * with frontend/.
 */
const meta = {
  title: 'Reference/Legacy buttons',
  parameters: { a11y: { test: 'off' }, docs: { disable: true } },
} satisfies Meta;
export default meta;

function lucide(path: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
const plusSvg = lucide('<path d="M5 12h14"/><path d="M12 5v14"/>');
const heartSvg = lucide(
  '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',
);

const legacyMarkup = `
<div class="row">
  <button class="m-button ui-button ui-button--primary ui-button--regular">
    ${plusSvg}Add videos
  </button>
  <button class="m-button ui-button ui-button--neutral ui-button--regular">Neutral</button>
  <button class="m-button ui-button ui-button--quiet ui-button--regular">Quiet</button>
  <button class="m-button ui-button ui-button--danger ui-button--regular">Danger</button>
  <button class="m-button ui-button ui-button--neutral ui-button--regular" aria-pressed="true">Favorite</button>
  <button class="m-button ui-button ui-button--neutral ui-button--regular" disabled>Unavailable</button>
</div>
<div class="row">
  <button class="m-button ui-button ui-button--neutral ui-button--compact">Compact</button>
  <button class="m-button ui-button ui-button--quiet ui-button--compact">Quiet compact</button>
  <button class="m-button ui-button ui-button--neutral ui-button--regular" aria-label="Favorite" style="padding:0;width:42px">${heartSvg}</button>
</div>`;

const row = css({ display: 'flex', alignItems: 'center', gap: 'actionGap', flexWrap: 'wrap' });
const caption = css({ color: 'muted', fontSize: 'meta', mb: '2', mt: '6' });

export const SideBySide: StoryObj = {
  render: () => (
    <div>
      <p className={caption}>Recipe (new)</p>
      <div className={row}>
        <Button variant="primary">
          <Icon glyph={Plus} />
          Add videos
        </Button>
        <Button>Neutral</Button>
        <Button variant="quiet">Quiet</Button>
        <Button variant="danger">Danger</Button>
        <Button aria-pressed="true">Favorite</Button>
        <Button disabled>Unavailable</Button>
      </div>
      <div className={`${row} ${css({ mt: '3' })}`}>
        <Button size="compact">Compact</Button>
        <Button size="compact" variant="quiet">
          Quiet compact
        </Button>
        <IconButton aria-label="Favorite">
          <Icon glyph={Heart} />
        </IconButton>
      </div>
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy buttons"
        srcDoc={legacyDocument(legacyMarkup)}
        className={css({ w: 'full', h: '40', border: 'none', display: 'block' })}
      />
    </div>
  ),
};
