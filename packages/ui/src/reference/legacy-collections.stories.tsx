import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CollectionCardExample,
  FolderCardExample,
  FolderTreeExample,
  HeroExample,
  covers,
} from '../components/collections.stories';
import { css } from '../../styled-system/css';
import { legacyDocument } from './legacy-document';

/**
 * The existing app's collection surfaces from its real stylesheets beside
 * the recipes. Goes away with frontend/.
 */
const meta = {
  title: 'Reference/Legacy collections',
  parameters: { a11y: { test: 'off' }, docs: { disable: true } },
} satisfies Meta;
export default meta;

const caption = css({ color: 'muted', fontSize: 'meta', mb: '2', mt: '6' });
const frame = (height: string) =>
  css({ w: 'container.frame', maxW: 'none', h: `[${height}]`, border: 'none', display: 'block' });

const folderGlyph =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.2 3.4A2 2 0 0 0 7.5 2.5H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>';
const chevron =
  '<svg class="ui-chevron" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 4 6 6-6 6"/></svg>';
const imgs = (n: number) =>
  covers
    .slice(0, n)
    .map((src) => `<img src="${src}" alt="" draggable="false">`)
    .join('');

const featured = (n: number, name: string) =>
  `<div class="library-card library-card--collection folder-card-shell compact-folder featured-collection"><button type="button" class="album-card" aria-label="Open folder ${name}"><span class="compact-folder-icon ${n > 1 ? 'collection-cover-mosaic' : ''}" data-cover-count="${n}">${n ? imgs(n) : folderGlyph}</span><span class="collection-card-kind">${folderGlyph}Collection</span><span class="compact-folder-copy"><strong>${name}</strong><small>24 items · 2 folders</small></span><span class="collection-card-stats"><span>8 photos</span><span>16 videos</span></span></button><button type="button" class="folder-card-new" aria-label="New folder in ${name}" title="New subfolder">＋</button></div>`;

const directoryMarkup = `
<section class="album-browser collection-directory">
  <div class="album-grid collection-browse-grid">${featured(3, 'Weekend favorites')}${featured(1, 'Watch later')}${featured(0, 'Quiet moments')}</div>
</section>`;

const heroMarkup = `
<section class="album-browser collection-detail">
  <header class="collection-hero" data-card-tone="rose">
    <div class="collection-hero-cover" data-cover-count="3" aria-hidden="true">${imgs(3)}</div>
    <div class="collection-hero-copy">
      <div class="collection-hero-eyebrow">Your collection<span>★ Pinned to sidebar</span><span>${folderGlyph}Locked</span></div>
      <div class="manager-heading ui-page-header"><div><h1>Weekend favorites</h1></div><div class="page-primary-actions" role="group" aria-label="Page actions"><button type="button" class="m-button ui-button ui-button--primary ui-button--regular">＋ New folder</button><button type="button" class="m-button ui-button ui-button--neutral ui-button--regular" aria-label="Collection options">•••</button></div></div>
      <p class="collection-hero-caption">Photos and videos, collected in one place.</p>
      <dl class="ui-detail-facts" aria-label="Collection overview"><div><dt>Total items</dt><dd>24</dd></div><div><dt>Photos</dt><dd>8</dd></div><div><dt>Videos</dt><dd>16</dd></div><div><dt>Subfolders</dt><dd>2</dd></div></dl>
    </div>
  </header>
  <section aria-label="Subfolders"><div class="album-grid collection-browse-grid">
    <div class="library-card library-card--collection folder-card-shell compact-folder"><button type="button" class="album-card" aria-label="Open folder Summer"><span class="compact-folder-icon" data-cover-count="1"><img src="${covers[1]}" alt="" draggable="false"></span><span class="compact-folder-copy"><strong>Summer</strong><small>12 items · 1 folder</small></span></button><button type="button" class="folder-card-new" aria-label="New folder in Summer" title="New subfolder">＋</button></div>
    <div class="library-card library-card--collection folder-card-shell compact-folder"><button type="button" class="album-card" aria-label="Open folder Locked"><span class="compact-folder-icon" data-cover-count="0">${folderGlyph}</span><span class="compact-folder-copy"><strong>Locked</strong><small>3 items</small></span></button><button type="button" class="folder-card-new" aria-label="New folder in Locked" title="New subfolder" disabled>＋</button></div>
  </div></section>
</section>`;

const treeMarkup = `
<aside class="manager-sidebar" style="height:420px">
  <div class="nav-label">Organize</div>
  <button class="manager-nav active" aria-current="page">${folderGlyph}Collections</button>
  <nav class="collection-tree" aria-label="Collection folders">
    <div class="collection-tree-heading"><button aria-expanded="true" aria-label="Collapse collection folders">${chevron.replace('ui-chevron', 'ui-chevron is-expanded')}</button><button>Folders</button><button aria-label="New collection" title="New collection">＋</button></div>
    <div class="folder-tree-tools"><input aria-label="Find folder" placeholder="Find folder…" value=""><button title="Show pinned folders" aria-label="Show pinned folders" aria-pressed="false">☆</button></div>
    <div class="collection-tree-scroll">
      <div class="collection-tree-row active" style="padding-left:8px"><button class="folder-expand" aria-label="Collapse Weekend favorites" aria-expanded="true">${chevron.replace('ui-chevron', 'ui-chevron is-expanded')}</button><button class="folder-open" aria-current="page" title="Weekend favorites">${folderGlyph}<span>Weekend favorites</span></button></div>
      <div class="collection-tree-row" style="padding-left:21px"><button class="folder-expand" aria-label="Expand Summer" disabled></button><button class="folder-open" title="Summer">${folderGlyph}<span>Summer</span></button></div>
      <div class="collection-tree-row" style="padding-left:21px"><button class="folder-expand" aria-label="Expand City after rain" disabled></button><button class="folder-open" title="City after rain">${folderGlyph}<span>City after rain</span></button></div>
      <div class="collection-tree-row" style="padding-left:8px"><button class="folder-expand" aria-label="Expand Watch later" disabled></button><button class="folder-open" title="Watch later">${folderGlyph}<span>Watch later</span></button></div>
    </div>
  </nav>
</aside>`;

const grid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(350px, 100%), 1fr))',
  gap: '6',
  maxW: 'container.frame',
});

export const Directory: StoryObj = {
  render: () => (
    <div>
      <p className={caption}>Recipes (new)</p>
      <div className={grid}>
        <CollectionCardExample count={3} />
        <CollectionCardExample count={1} />
        <CollectionCardExample count={0} />
      </div>
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy collection directory"
        srcDoc={legacyDocument(directoryMarkup)}
        className={frame('440px')}
      />
    </div>
  ),
};

export const Detail: StoryObj = {
  render: () => (
    <div className={css({ maxW: 'container.frame' })}>
      <p className={caption}>Recipes (new)</p>
      <HeroExample />
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '2.5',
        })}
      >
        <FolderCardExample />
        <FolderCardExample locked />
      </div>
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy collection detail"
        srcDoc={legacyDocument(heroMarkup)}
        className={frame('620px')}
      />
    </div>
  ),
};

export const Tree: StoryObj = {
  render: () => (
    <div>
      <p className={caption}>Recipes (new)</p>
      <FolderTreeExample />
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy collection tree"
        srcDoc={legacyDocument(treeMarkup)}
        className={frame('440px')}
      />
    </div>
  ),
};
