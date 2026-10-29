import { useState, type ReactNode } from 'react';
import {
  Copy,
  Film,
  SquarePlay,
  Folder,
  Heart,
  Image,
  Menu,
  Tag,
  Users,
  Settings,
  Download,
  SlidersHorizontal,
} from 'lucide-react';
import { Button, Heading, Icon, IconButton, Sidebar, Text, Accent, Rule } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { CollectionTree } from '../components/browsing/collection-tree';

export function LibraryShell({
  children,
  demo = false,
  page = 'videos',
  collectionId = 0,
}: {
  children: ReactNode;
  demo?: boolean;
  page?:
    | 'videos'
    | 'photos'
    | 'people'
    | 'tags'
    | 'collections'
    | 'following'
    | 'downloads'
    | 'duplicates'
    | 'settings';
  /** The open collection, so the sidebar's folder tree can mark and expand it. */
  collectionId?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={css({
        display: { base: 'block', lg: 'grid' },
        gridTemplateColumns: '248px minmax(0, 1fr)',
        minH: '[100dvh]',
      })}
    >
      <Rule
        side="bottom"
        className={css({
          display: { base: 'flex', lg: 'none' },
          p: '4',
          justifyContent: 'space-between',
          alignItems: 'center',
        })}
      >
        <Heading as="p" size="sm" fontFamily="brand">
          clipkit.
        </Heading>
        <IconButton
          aria-label="Toggle navigation"
          aria-expanded={open}
          aria-controls="library-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <Icon glyph={Menu} />
        </IconButton>
      </Rule>
      <Sidebar.Root
        id="library-navigation"
        data-open={open}
        className={css({
          display: { base: 'none', lg: 'flex' },
          '&[data-open=true]': { display: 'flex' },
          w: { base: 'full', lg: '[248px]' },
          position: { lg: 'sticky' },
          top: '0',
          h: { lg: '[100dvh]' },
        })}
      >
        <Sidebar.Brand href={demo ? '/?demo=1' : '/'} aria-label="ClipKit home">
          <Sidebar.Mark>
            <SquarePlay aria-hidden="true" />
          </Sidebar.Mark>
          <div>
            <Sidebar.Wordmark>
              clipkit<Accent>.</Accent>
            </Sidebar.Wordmark>
            <Sidebar.Tagline>Your personal library</Sidebar.Tagline>
          </div>
        </Sidebar.Brand>
        <Sidebar.Nav aria-label="Library navigation">
          <Sidebar.Group>
            <Sidebar.Label>Library</Sidebar.Label>
            <NavigationItem
              label="Videos"
              glyph={Film}
              href={demo ? '/?demo=1' : '/'}
              active={page === 'videos'}
            />
            <NavigationItem
              label="Photos"
              glyph={Image}
              href={demo ? undefined : '/?view=photos'}
              active={page === 'photos'}
            />
          </Sidebar.Group>
          <Sidebar.Group>
            <Sidebar.Label>Organize</Sidebar.Label>
            <NavigationItem
              label="Collections"
              glyph={Folder}
              href={demo ? undefined : '/?view=collections'}
              active={page === 'collections'}
            />
            <NavigationItem
              label="People"
              glyph={Users}
              href={demo ? undefined : '/?view=people'}
              active={page === 'people'}
            />
            <NavigationItem
              label="Tags"
              glyph={Tag}
              href={demo ? undefined : '/?view=tags'}
              active={page === 'tags'}
            />
          </Sidebar.Group>
          {!demo && <CollectionTree currentId={collectionId} />}
          <Sidebar.Footer>
            <details
              open={['downloads', 'following', 'duplicates'].includes(page) ? true : undefined}
            >
              <Sidebar.Summary>
                <SlidersHorizontal aria-hidden="true" />
                Manage library
              </Sidebar.Summary>
              <Sidebar.Group className={css({ mt: '1' })}>
                <NavigationItem
                  label="Following"
                  glyph={Heart}
                  href={demo ? undefined : '/?view=following'}
                  active={page === 'following'}
                />
                <NavigationItem
                  label="Downloads"
                  glyph={Download}
                  href={demo ? undefined : '/?view=downloads'}
                  active={page === 'downloads'}
                />
                <NavigationItem
                  label="Potential duplicates"
                  glyph={Copy}
                  href={demo ? undefined : '/?view=duplicates'}
                  active={page === 'duplicates'}
                />
                <Button asChild variant="quiet" justifyContent="flex-start">
                  <a href="?view=foundation">Design foundation</a>
                </Button>
              </Sidebar.Group>
            </details>
            <NavigationItem
              label="Settings"
              glyph={Settings}
              href={demo ? undefined : '/?view=settings'}
              active={page === 'settings'}
            />
            {demo && (
              <Text size="sm" tone="muted">
                Synthetic demo · session only
              </Text>
            )}
          </Sidebar.Footer>
        </Sidebar.Nav>
      </Sidebar.Root>
      <main
        id="main-content"
        className={css({
          minW: '0',
          px: { base: '4', md: '6' },
          py: '6',
          w: 'full',
        })}
      >
        {children}
      </main>
    </div>
  );
}

/** Sidebar rows: a link for a route that exists, a disabled button for one that does not yet. */
function NavigationItem({
  label,
  glyph,
  href,
  active = false,
}: {
  label: string;
  glyph: typeof Folder;
  href?: string;
  active?: boolean;
}) {
  const content = (
    <>
      <Icon glyph={glyph} />
      {label}
    </>
  );
  if (!href)
    return (
      <Sidebar.Item type="button" disabled title="Coming in a later milestone">
        {content}
      </Sidebar.Item>
    );
  return (
    <Sidebar.Item asChild>
      <a href={href} aria-current={active ? 'page' : undefined}>
        {content}
      </a>
    </Sidebar.Item>
  );
}
