import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, Film, Folder, Heart, Image, SquarePlay, Tag, Users } from 'lucide-react';
import * as Sidebar from '../components/sidebar';
import { css } from '../../styled-system/css';
import { legacyDocument } from './legacy-document';

/**
 * The existing app's sidebar from its real stylesheets beside the Sidebar
 * recipe. Goes away with frontend/.
 */
const meta = {
  title: 'Reference/Legacy sidebar',
  parameters: { a11y: { test: 'off' }, docs: { disable: true } },
} satisfies Meta;
export default meta;

const svg = (path: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const film = svg(
  '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4"/>',
);
const image = svg(
  '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
);
const folder = svg(
  '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.2 3.4A2 2 0 0 0 7.5 2.5H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
);
const brand =
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.5"/><path d="m10 8 6 4-6 4V8Z" fill="currentColor"/><path d="M7 3v3M17 18v3" stroke="currentColor" stroke-width="1.5"/></svg>';

const legacyMarkup = `
<aside aria-label="Library navigation" class="manager-sidebar" style="height:560px">
  <div class="sidebar-brand-row"><button class="manager-brand" aria-label="ClipKit home"><span class="brand-symbol">${brand}</span><span class="sidebar-brand-copy">ClipKit<small>Your personal library</small></span></button></div>
  <div class="nav-label">Library</div>
  <button class="manager-nav active" aria-current="page">${film}Videos<span class="nav-count">1204</span></button>
  <button class="manager-nav">${image}Photos<span class="nav-count">388</span></button>
  <div class="nav-label sidebar-organize-label">Organize</div>
  <button class="manager-nav">${folder}Collections</button>
  <button class="manager-nav">${folder}People</button>
  <button class="manager-nav">${folder}Tags</button>
</aside>`;

const caption = css({ color: 'muted', fontSize: 'meta', mb: '2', mt: '6' });

function Row({
  label,
  glyph: Glyph,
  current = false,
  count,
}: {
  label: string;
  glyph: typeof Film;
  current?: boolean;
  count?: number;
}) {
  return (
    <Sidebar.Item asChild>
      <a href="#" aria-current={current ? 'page' : undefined}>
        <Glyph aria-hidden="true" />
        {label}
        {count !== undefined && <Sidebar.Count>{count}</Sidebar.Count>}
      </a>
    </Sidebar.Item>
  );
}

export const SideBySide: StoryObj = {
  render: () => (
    <div>
      <p className={caption}>Recipe (new)</p>
      <Sidebar.Root aria-label="Library navigation" className={css({ h: '[560px]' })}>
        <Sidebar.Brand href="#" aria-label="ClipKit home">
          <Sidebar.Mark>
            <SquarePlay aria-hidden="true" />
          </Sidebar.Mark>
          <div>
            <Sidebar.Wordmark>ClipKit</Sidebar.Wordmark>
            <Sidebar.Tagline>Your personal library</Sidebar.Tagline>
          </div>
        </Sidebar.Brand>
        <Sidebar.Nav aria-label="Library navigation">
          <Sidebar.Group>
            <Sidebar.Label>Library</Sidebar.Label>
            <Row label="Videos" glyph={Film} current count={1204} />
            <Row label="Photos" glyph={Image} count={388} />
          </Sidebar.Group>
          <Sidebar.Group>
            <Sidebar.Label>Organize</Sidebar.Label>
            <Row label="Collections" glyph={Folder} />
            <Row label="People" glyph={Users} />
            <Row label="Tags" glyph={Tag} />
          </Sidebar.Group>
          <Sidebar.Footer>
            <Row label="Following" glyph={Heart} />
            <Row label="Downloads" glyph={Download} />
          </Sidebar.Footer>
        </Sidebar.Nav>
      </Sidebar.Root>
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy sidebar"
        srcDoc={legacyDocument(legacyMarkup)}
        className={css({
          w: 'container.frame',
          maxW: 'none',
          h: '[600px]',
          border: 'none',
          display: 'block',
        })}
      />
    </div>
  ),
};
