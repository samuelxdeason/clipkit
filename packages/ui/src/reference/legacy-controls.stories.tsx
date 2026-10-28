import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ChoiceSelect } from '../components/choice-select';
import { SearchField } from '../components/search-field';
import * as Tabs from '../components/tabs';
import { css } from '../../styled-system/css';
import { legacyDocument } from './legacy-document';

/**
 * Tabs, the search field and the sort menu from the existing app's real
 * stylesheets, under their recipe-driven replacements. Goes away with
 * frontend/.
 */
const meta = {
  title: 'Reference/Legacy controls',
  parameters: { a11y: { test: 'off' }, docs: { disable: true } },
} satisfies Meta;
export default meta;

const searchSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';

const legacyMarkup = `
<div class="row">
  <nav class="utility-tabs profile-tabs" aria-label="Person library">
    <button class="active" aria-pressed="true">Videos</button>
    <button aria-pressed="false">Photos</button>
    <button aria-pressed="false">Accounts</button>
  </nav>
</div>
<div class="row library-toolbar compact-video-toolbar">
  <div class="video-search-line" style="width:420px">
    <div class="manager-search">${searchSvg}<input aria-label="Search this view" placeholder="Search titles, people, tags, or filenames…"><kbd>Ctrl K</kbd></div>
  </div>
</div>
<div class="row">
  <div class="sort-menu">
    <button type="button" class="sort-menu-trigger" aria-expanded="true">Newest first</button>
    <div class="preview-size-popover sort-menu-popover ui-choice-popover" role="menu" style="position:static;width:220px">
      <span>Sort videos</span>
      <button type="button" role="menuitemradio" aria-checked="true"><span>Newest first</span><span class="menu-selection-mark"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m4 10 4 4 8-8"/></svg></span></button>
      <button type="button" role="menuitemradio" aria-checked="false"><span>Oldest first</span><span class="menu-selection-mark"></span></button>
    </div>
  </div>
</div>`;

const caption = css({ color: 'muted', fontSize: 'meta', mb: '2', mt: '6' });
const block = css({ display: 'grid', gap: '4', maxW: 'md' });

function Recipes() {
  const [tab, setTab] = useState('videos');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const items = ['Videos', 'Photos', 'Accounts'];
  return (
    <div className={block}>
      <Tabs.Root value={tab} onValueChange={(d) => setTab(d.value)}>
        <Tabs.List aria-label="Scope">
          {items.map((item) => (
            <Tabs.Trigger key={item} value={item.toLowerCase()}>
              {item}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>
      <SearchField
        label="Search this view"
        placeholder="Search titles, people, tags, or filenames…"
        hint="Ctrl K"
        value={query}
        onChange={setQuery}
      />
      <ChoiceSelect
        hideLabel
        label="Sort videos"
        value={sort}
        onChange={setSort}
        options={[
          { value: 'newest', label: 'Newest first' },
          { value: 'oldest', label: 'Oldest first' },
        ]}
      />
    </div>
  );
}

export const SideBySide: StoryObj = {
  render: () => (
    <div>
      <p className={caption}>Recipes (new)</p>
      <Recipes />
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy controls"
        srcDoc={legacyDocument(legacyMarkup)}
        className={css({ w: '5xl', maxW: 'none', h: '96', border: 'none', display: 'block' })}
      />
    </div>
  ),
};
