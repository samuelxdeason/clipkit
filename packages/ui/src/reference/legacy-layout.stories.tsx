import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../components/button';
import { FilterChip, FilterRail, PageHeader, SectionHeading, Toolbar } from '../components/layout';
import { SearchField } from '../components/search-field';
import { css } from '../../styled-system/css';
import { legacyDocument } from './legacy-document';

/**
 * The page header, a section heading and the browsing toolbar from the
 * existing app's real stylesheets, under their recipe-driven replacements.
 * Goes away with frontend/.
 */
const meta = {
  title: 'Reference/Legacy page structure',
  parameters: { a11y: { test: 'off' }, docs: { disable: true } },
} satisfies Meta;
export default meta;

const searchSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';

const legacyMarkup = `
<div class="manager-main" style="padding:0;width:900px">
  <div class="manager-heading ui-page-header"><div><h1>Your video library</h1><p>Find a favorite. Pick up where you left off.</p></div><div class="page-primary-actions" role="group" aria-label="Page actions"><button class="m-button ui-button ui-button--neutral ui-button--regular">Refresh library</button></div></div>
  <section class="library-toolbar compact-video-toolbar" aria-label="Video browsing controls">
    <div class="video-search-controls"><div class="video-search-line browse-query-group" role="group"><div class="manager-search">${searchSvg}<input aria-label="Search videos" value="beach"></div></div></div>
    <div class="video-result-scope"><span>38 videos</span></div>
    <div class="video-filter-chips" role="group" aria-label="Applied filters"><span class="active-filter-caption">Active filters</span><button>Resolution: 4K</button><button>Alex Morgan</button><button class="video-reset-all">Clear search &amp; filters</button></div>
  </section>
  <div class="settings-section-heading"><span class="settings-eyebrow">Add to your library</span><h2>Save something new</h2><p>Paste one link per line.</p></div>
</div>`;

const caption = css({ color: 'muted', fontSize: 'meta', mb: '2', mt: '6' });

function Recipes() {
  const [query, setQuery] = useState('beach');
  return (
    <div className={css({ maxW: '[900px]' })}>
      <PageHeader
        title="Your video library"
        description="Find a favorite. Pick up where you left off."
        actions={<Button variant="neutral">Refresh library</Button>}
      />
      <Toolbar.Root aria-label="videos browsing controls">
        <Toolbar.Search>
          <SearchField label="Search videos" value={query} onChange={setQuery} />
        </Toolbar.Search>
        <Toolbar.Row>
          <Toolbar.Summary>38 videos</Toolbar.Summary>
        </Toolbar.Row>
        <Toolbar.Chips>
          <FilterRail onReset={() => setQuery('')} resetLabel="Clear search & filters">
            <FilterChip label="Resolution: 4K" onClick={() => {}} />
            <FilterChip label="Alex Morgan" onClick={() => {}} />
          </FilterRail>
        </Toolbar.Chips>
      </Toolbar.Root>
      <SectionHeading
        eyebrow="Add to your library"
        title="Save something new"
        description="Paste one link per line."
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
        title="Legacy page structure"
        srcDoc={legacyDocument(legacyMarkup)}
        className={css({ w: '5xl', maxW: 'none', h: '[520px]', border: 'none', display: 'block' })}
      />
    </div>
  ),
};
