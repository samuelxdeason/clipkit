import type { ReactNode } from 'react';
import { Grid2X2 } from 'lucide-react';
import {
  Button,
  ChoiceSelect,
  FilterChip,
  FilterRail,
  Icon,
  Paging,
  SearchField,
  Text,
  Toolbar,
  Rule,
} from '@clipkit/ui';
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
    <SearchField
      label={`Search ${noun}`}
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
      onChange={onChange}
    />
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
    <Rule side="left" className={css({ ml: '1' })}>
      <Button data-manage-toggle="" variant="quiet" aria-pressed={active} onClick={onToggle}>
        {active ? 'Done managing' : 'Manage'}
      </Button>
    </Rule>
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
    <Toolbar.Root aria-label={`${noun} browsing controls`}>
      <Toolbar.Search>
        <BrowseSearch noun={noun} value={query} onChange={onQuery} />
      </Toolbar.Search>
      <Toolbar.Row>
        <Toolbar.Summary role="status">
          {count} {noun}
        </Toolbar.Summary>
        <Toolbar.Controls>{children}</Toolbar.Controls>
      </Toolbar.Row>
      {chips && <Toolbar.Chips>{chips}</Toolbar.Chips>}
    </Toolbar.Root>
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
    <FilterRail onReset={onClear} resetLabel="Clear search & filters">
      {items.map((item) => (
        <FilterChip key={item.key} label={item.label} onClick={item.onRemove} />
      ))}
    </FilterRail>
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
    <Rule asChild side="top">
      <footer
        aria-label={`${noun} paging`}
        className={css({
          mt: '6',
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
    </Rule>
  );
}
