import type { ReactNode } from 'react';
import { Search, X, Grid2X2 } from 'lucide-react';
import { Button, ChoiceSelect, Icon, IconButton, Input, Paging, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';

export function BrowseSearch({
  noun,
  value,
  onChange,
}: {
  noun: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={css({ position: 'relative' })}>
      <div
        className={css({
          position: 'absolute',
          left: '3',
          top: '3',
          color: 'muted',
          pointerEvents: 'none',
        })}
      >
        <Icon glyph={Search} size="sm" />
      </div>
      <Input
        aria-label={`Search ${noun}`}
        placeholder={
          noun === 'people'
            ? 'Search names or aliases…'
            : noun === 'tags'
              ? 'Search tag names…'
              : noun === 'downloads'
                ? 'Search titles or source URLs…'
                : `Search ${noun}, people or metadata…`
        }
        value={value}
        onChange={(event) => onChange(event.target.value)}
        ps="10"
        pe="12"
      />
      {value && (
        <div className={css({ position: 'absolute', right: '1', top: '0' })}>
          <IconButton variant="quiet" aria-label="Clear search" onClick={() => onChange('')}>
            <Icon glyph={X} size="sm" />
          </IconButton>
        </div>
      )}
    </div>
  );
}

export function PreviewSize({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ChoiceSelect
      hideLabel
      label="Preview size"
      appearance="toolbarIcon"
      triggerContent={<Icon glyph={Grid2X2} size="sm" />}
      value={value}
      onChange={onChange}
      options={[
        { value: 'small', label: 'Small previews' },
        { value: 'medium', label: 'Medium previews' },
        { value: 'large', label: 'Large previews' },
      ]}
    />
  );
}

export function ManageToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <div className={css({ borderLeftWidth: '1px', borderColor: 'line', pl: '3', ml: '1' })}>
      <Button data-manage-toggle="" variant="quiet" aria-pressed={active} onClick={onToggle}>
        {active ? 'Done managing' : 'Manage'}
      </Button>
    </div>
  );
}

export function BrowseToolbar({
  noun,
  query,
  onQuery,
  count,
  children,
  chips,
}: {
  noun: string;
  query: string;
  onQuery: (value: string) => void;
  count: number;
  children: ReactNode;
  chips?: ReactNode;
}) {
  return (
    <section
      aria-label={`${noun} browsing controls`}
      className={css({
        display: 'grid',
        gap: '4',
        pb: '5',
        borderBottomWidth: '1px',
        borderColor: 'line',
      })}
    >
      <BrowseSearch noun={noun} value={query} onChange={onQuery} />
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '3',
        })}
      >
        <Text size="sm" tone="muted" role="status">
          {count} {noun}
        </Text>
        <div className={css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3' })}>
          {children}
        </div>
      </div>
      {chips}
    </section>
  );
}

export function ActiveFilters({
  items,
  onClear,
}: {
  items: { key: string; label: string; onRemove: () => void }[];
  onClear: () => void;
}) {
  if (!items.length) return null;
  return (
    <div
      aria-label="Active filters"
      className={css({
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '2',
        pt: '4',
        borderTopWidth: '1px',
        borderColor: 'line',
      })}
    >
      <Text size="sm" tone="muted">
        Active filters
      </Text>
      {items.map((item) => (
        <Button
          key={item.key}
          variant="neutral"
          maxW="full"
          aria-label={`Remove ${item.label} filter`}
          onClick={item.onRemove}
        >
          <span
            title={item.label}
            className={css({
              minW: '0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            })}
          >
            {item.label}
          </span>
          <span className={css({ display: 'inline-flex', color: 'accent' })}>
            <Icon glyph={X} size="sm" />
          </span>
        </Button>
      ))}
      <Button variant="quiet" onClick={onClear} ml="auto" textDecoration="underline">
        Clear search &amp; filters
      </Button>
    </div>
  );
}

// Minimum card widths match the working frontend; columns follow available space.
const densities = {
  small: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))' }),
  medium: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(min(350px, 100%), 1fr))' }),
  large: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(min(440px, 100%), 1fr))' }),
};
const photoDensities = {
  small: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))' }),
  medium: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(min(310px, 100%), 1fr))' }),
  large: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(min(400px, 100%), 1fr))' }),
};
// Directory densities are independent of media frame sizes.
const peopleDensities = {
  small: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(min(190px, 100%), 1fr))' }),
  medium: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))' }),
  large: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))' }),
};
const tagDensities = {
  small: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))' }),
  medium: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))' }),
  large: css({ gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))' }),
};
export function BrowseGrid({
  size,
  testId,
  kind = 'videos',
  children,
}: {
  size: string;
  testId: string;
  kind?: 'videos' | 'photos' | 'people' | 'tags';
  children: ReactNode;
}) {
  const widths = {
    videos: densities,
    photos: photoDensities,
    people: peopleDensities,
    tags: tagDensities,
  }[kind];
  return (
    <div
      data-testid={testId}
      className={`${css({ display: 'grid', gap: { base: '4', md: '5' } })} ${widths[size as keyof typeof widths] || widths.medium}`}
    >
      {children}
    </div>
  );
}

export function BrowseFooter({
  noun,
  page,
  pageSize,
  count,
  onPage,
}: {
  noun: string;
  page: number;
  pageSize: number;
  count: number;
  onPage: (page: number) => void;
}) {
  return (
    <footer
      aria-label={`${noun} paging`}
      className={css({
        mt: '6',
        pt: '5',
        borderTopWidth: '1px',
        borderColor: 'line',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '4',
      })}
    >
      <Text size="sm" tone="muted">
        {count ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, count)}` : '0'} of{' '}
        {count} {noun}
      </Text>
      {count > pageSize && (
        <Paging page={page} count={count} pageSize={pageSize} onPageChange={onPage} />
      )}
    </footer>
  );
}
