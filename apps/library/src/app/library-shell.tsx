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
} from 'lucide-react';
import { Button, Heading, Icon, IconButton, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { navigation } from './navigation.styles';

const nav = navigation();

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
      <aside
        id="library-navigation"
        data-open={open}
        className={css({
          display: { base: 'none', lg: 'flex' },
          '&[data-open=true]': { display: 'flex' },
          flexDirection: 'column',
          gap: '6',
          p: '4',
          borderRightWidth: '1px',
          borderColor: 'line',
          bg: 'field',
          position: { lg: 'sticky' },
          top: '0',
          h: { lg: '[100dvh]' },
        })}
      >
        <div className={nav.brand}>
          <span className={nav.mark}>
            <Icon glyph={SquarePlay} />
          </span>
          <div>
            <p className={nav.wordmark}>
              clipkit<span className={css({ color: 'accent' })}>.</span>
            </p>
            <p className={nav.tagline}>YOUR PERSONAL LIBRARY</p>
          </div>
        </div>
        <nav
          aria-label="Library navigation"
          className={css({
            display: 'flex',
            flexDirection: 'column',
            gap: '6',
            flex: '1',
            minH: '0',
            overflowY: 'auto',
          })}
        >
          <div className={nav.group}>
            <p className={nav.label}>LIBRARY</p>
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
          </div>
          <div className={nav.group}>
            <p className={nav.label}>ORGANIZE</p>
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
          </div>
          <div
            className={css({
              mt: 'auto',
              pt: '4',
              borderTopWidth: '1px',
              borderColor: 'line',
              display: 'grid',
              gap: '3',
            })}
          >
            <details open={page === 'downloads' ? true : undefined}>
              <summary
                className={css({ cursor: 'pointer', fontSize: 'sm', color: 'muted', py: '3' })}
              >
                Manage library
              </summary>
              <div className={css({ display: 'grid', gap: '2' })}>
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
              </div>
            </details>
            <NavigationItem label="Settings" glyph={Settings} />
            {demo && (
              <Text size="sm" tone="muted">
                Synthetic demo · session only
              </Text>
            )}
          </div>
        </nav>
      </aside>
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

/** Sidebar links keep navigation alignment and selected treatment in one owner. */
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
      <button type="button" disabled className={nav.item} title="Coming in a later milestone">
        {content}
      </button>
    );
  return (
    <a href={href} aria-current={active ? 'page' : undefined} className={nav.item}>
      {content}
    </a>
  );
}
