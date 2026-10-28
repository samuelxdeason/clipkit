import { useState, type ReactNode } from 'react';
import {
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
import { Button, Heading, Icon, IconButton, Sidebar, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';

export function LibraryShell({
  children,
  demo = false,
  page = 'videos',
}: {
  children: ReactNode;
  demo?: boolean;
  page?: 'videos' | 'photos' | 'people' | 'tags' | 'downloads';
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
      <div
        className={css({
          display: { base: 'flex', lg: 'none' },
          p: '4',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: '1px',
          borderColor: 'line',
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
      </div>
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
              clipkit<span className={css({ color: 'accent' })}>.</span>
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
            <NavigationItem label="Collections" glyph={Folder} />
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
          <Sidebar.Footer>
            <details open={page === 'downloads' ? true : undefined}>
              <Sidebar.Summary>
                <SlidersHorizontal aria-hidden="true" />
                Manage library
              </Sidebar.Summary>
              <Sidebar.Group className={css({ mt: '1' })}>
                <NavigationItem label="Following" glyph={Heart} />
                <NavigationItem
                  label="Downloads"
                  glyph={Download}
                  href={demo ? undefined : '/?view=downloads'}
                  active={page === 'downloads'}
                />
                <Button asChild variant="quiet" justifyContent="flex-start">
                  <a href="?view=foundation">Design foundation</a>
                </Button>
              </Sidebar.Group>
            </details>
            <NavigationItem label="Settings" glyph={Settings} />
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
