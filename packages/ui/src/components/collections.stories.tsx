import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronRight, Folder, Lock, Plus, Star, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { CoverMosaic, FolderCard, FolderTree, Hero } from './collections';
import { Icon } from './icon';
import { PageHeader } from './layout';
import * as MediaCard from './media-card';
import * as Sidebar from './sidebar';
import { Identity, Rule, Stat } from './surfaces';
import { css } from '../../styled-system/css';

const meta = {
  title: 'Patterns/Collections',
  excludeStories: /Example$|^covers$/,
  parameters: {
    docs: {
      description: {
        component:
          'The collection surfaces: the featured collection card (MediaCard kind="collection"), the hero at the top of a collection, the compact folder card for subfolders, the sidebar folder tree and the cover mosaic they share.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Original flat artwork, never real media. */
function cover(hue: number) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="hsl(${hue} 22% 26%)"/><circle cx="110" cy="120" r="48" fill="hsl(${hue} 30% 60%)" opacity=".7"/><path d="M0 230 110 150 190 210 320 120V320H0Z" fill="hsl(${hue} 25% 36%)"/></svg>`,
  )}`;
}
export const covers = [cover(330), cover(200), cover(40)];

export function CollectionCardExample({ count = 3 }: { count?: 0 | 1 | 2 | 3 }) {
  const shown = covers.slice(0, count);
  return (
    <MediaCard.Root kind="collection" aria-label="Weekend favorites">
      <MediaCard.Link href="#">
        <MediaCard.Frame>
          {shown.length ? (
            <CoverMosaic count={(['one', 'two', 'three'] as const)[shown.length - 1]}>
              {shown.map((src) => (
                <img key={src} src={src} alt="" />
              ))}
            </CoverMosaic>
          ) : (
            <Folder aria-hidden="true" />
          )}
          <MediaCard.Badge className={css({ top: '3.5', left: '3.5' })}>
            <Folder aria-hidden="true" /> Collection
          </MediaCard.Badge>
        </MediaCard.Frame>
        <MediaCard.Body>
          <MediaCard.Title title="Weekend favorites">Weekend favorites</MediaCard.Title>
          <MediaCard.Subtitle>
            <span>24 items · 2 folders</span>
          </MediaCard.Subtitle>
        </MediaCard.Body>
        <MediaCard.Footer>
          <span>8 photos</span>
          <span>16 videos</span>
        </MediaCard.Footer>
      </MediaCard.Link>
      <MediaCard.Action aria-label="New folder in Weekend favorites" title="New subfolder">
        <Plus />
      </MediaCard.Action>
    </MediaCard.Root>
  );
}

export function HeroExample() {
  return (
    <Hero.Root aria-label="Collection overview">
      <Identity aria-hidden="true" tone="rose" wash="hero" />
      <Identity asChild tone="rose">
        <Hero.Cover aria-hidden="true">
          <CoverMosaic even count="three">
            {covers.map((src) => (
              <img key={src} src={src} alt="" />
            ))}
          </CoverMosaic>
        </Hero.Cover>
      </Identity>
      <Hero.Copy>
        <Identity asChild tone="rose">
          <Hero.Eyebrow>
            Your collection
            <span>
              <Icon glyph={Star} size="sm" /> Pinned to sidebar
            </span>
            <span>
              <Icon glyph={Lock} size="sm" /> Locked
            </span>
          </Hero.Eyebrow>
        </Identity>
        <PageHeader
          title="Weekend favorites"
          actions={
            <>
              <Button variant="primary">
                <Icon glyph={Plus} size="sm" />
                New folder
              </Button>
              <Button aria-label="Collection options">•••</Button>
            </>
          }
        />
        <Hero.Caption>Photos and videos, collected in one place.</Hero.Caption>
        <Rule asChild side="top" className={css({ mt: '6', pt: '5' })}>
          <dl
            aria-label="Collection overview"
            className={css({
              display: 'grid',
              gridTemplateColumns: {
                base: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
              },
              gap: '4',
            })}
          >
            {[
              ['Total items', '24'],
              ['Photos', '8'],
              ['Videos', '16'],
              ['Subfolders', '2'],
            ].map(([label, value]) => (
              <Stat.Root key={label}>
                <Stat.Label>{label}</Stat.Label>
                <Stat.Value>{value}</Stat.Value>
              </Stat.Root>
            ))}
          </dl>
        </Rule>
      </Hero.Copy>
    </Hero.Root>
  );
}

export function FolderCardExample({ locked = false }: { locked?: boolean }) {
  return (
    <FolderCard.Root aria-label="Summer">
      <FolderCard.Open href="#" aria-label="Open folder Summer">
        <FolderCard.Icon>
          {locked ? <Lock aria-hidden="true" /> : <img src={covers[1]} alt="" />}
        </FolderCard.Icon>
        <FolderCard.Copy>
          <FolderCard.Name>Summer</FolderCard.Name>
          <FolderCard.Detail>12 items · 1 folder</FolderCard.Detail>
        </FolderCard.Copy>
      </FolderCard.Open>
      <FolderCard.Action aria-label="New folder in Summer" title="New subfolder" disabled={locked}>
        <Plus />
      </FolderCard.Action>
    </FolderCard.Root>
  );
}

const folders = [
  { id: 1, name: 'Weekend favorites', depth: 0, children: true, active: true },
  { id: 2, name: 'Summer', depth: 1, children: false, active: false },
  { id: 3, name: 'City after rain', depth: 1, children: false, active: false },
  { id: 4, name: 'Watch later', depth: 0, children: false, active: false },
];

export function FolderTreeExample() {
  const [expanded, setExpanded] = useState(true);
  const [query, setQuery] = useState('');
  const [pinned, setPinned] = useState(false);
  return (
    <Sidebar.Root aria-label="Library navigation" className={css({ h: '[420px]' })}>
      <Sidebar.Nav>
        <Sidebar.Group>
          <Sidebar.Label>Organize</Sidebar.Label>
          <Sidebar.Item asChild>
            <a href="#" aria-current="page">
              <Icon glyph={Folder} />
              Collections
            </a>
          </Sidebar.Item>
        </Sidebar.Group>
        <FolderTree.Root aria-label="Collection folders">
          <FolderTree.Heading>
            <button
              type="button"
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse collection folders' : 'Expand collection folders'}
              onClick={() => setExpanded((value) => !value)}
            >
              <ChevronRight style={{ transform: expanded ? 'rotate(90deg)' : undefined }} />
            </button>
            <button type="button">Folders</button>
            <button type="button" aria-label="New collection" title="New collection">
              <Plus />
            </button>
          </FolderTree.Heading>
          {expanded && (
            <>
              <FolderTree.Tools>
                <input
                  aria-label="Find folder"
                  placeholder="Find folder…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear folder search"
                    onClick={() => setQuery('')}
                  >
                    <X />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Show pinned folders"
                  aria-pressed={pinned}
                  onClick={() => setPinned((value) => !value)}
                >
                  <Star />
                </button>
              </FolderTree.Tools>
              <FolderTree.Scroll>
                {folders.map((folder) => (
                  <FolderTree.Row
                    key={folder.id}
                    data-active={folder.active || undefined}
                    style={{ paddingLeft: 8 + folder.depth * 13 }}
                  >
                    <FolderTree.Expand
                      type="button"
                      aria-label={`Expand ${folder.name}`}
                      aria-expanded={folder.children ? true : undefined}
                      disabled={!folder.children}
                    >
                      {folder.children && <ChevronRight />}
                    </FolderTree.Expand>
                    <FolderTree.Open
                      href="#"
                      aria-current={folder.active ? 'page' : undefined}
                      title={folder.name}
                    >
                      <Folder />
                      <span>{folder.name}</span>
                    </FolderTree.Open>
                  </FolderTree.Row>
                ))}
                {query && <FolderTree.Path>Collections / Weekend favorites</FolderTree.Path>}
                {pinned && <FolderTree.Empty>Pin a folder from its options menu.</FolderTree.Empty>}
              </FolderTree.Scroll>
            </>
          )}
        </FolderTree.Root>
      </Sidebar.Nav>
    </Sidebar.Root>
  );
}

export const CollectionCards: Story = {
  render: () => (
    <div
      className={css({
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(350px, 100%), 1fr))',
        gap: '6',
        maxW: 'container.frame',
      })}
    >
      <CollectionCardExample count={3} />
      <CollectionCardExample count={1} />
      <CollectionCardExample count={0} />
    </div>
  ),
};
export const CollectionHero: Story = {
  render: () => (
    <div className={css({ maxW: 'container.frame' })}>
      <HeroExample />
    </div>
  ),
};
export const FolderCards: Story = {
  render: () => (
    <div
      className={css({
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '2.5',
        maxW: 'container.content',
      })}
    >
      <FolderCardExample />
      <FolderCardExample locked />
    </div>
  ),
};
export const Tree: Story = { render: () => <FolderTreeExample /> };
