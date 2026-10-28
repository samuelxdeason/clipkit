import { FilterPicker } from '../../components/browsing/filter-picker';
import { SlidersHorizontal } from 'lucide-react';
import { Button, Checkbox, ChoiceSelect, Icon, Popover, Portal } from '@clipkit/ui';
import {
  ActiveFilters,
  BrowseToolbar,
  ManageToggle,
  PreviewSize,
} from '../../components/browsing/browse-controls';
import { emptyPhotoFilters, type PhotoFilters } from './model';
import type { Collection } from '../../services/library-client';

export function PhotoToolbar({
  filters,
  onFilters,
  sort,
  onSort,
  size,
  onSize,
  manage,
  onManage,
  count,
  people,
  albums,
  collections,
}: {
  filters: PhotoFilters;
  onFilters: (value: Partial<PhotoFilters>) => void;
  sort: string;
  onSort: (value: string) => void;
  size: string;
  onSize: (value: string) => void;
  manage: boolean;
  onManage: () => void;
  count: number;
  people: string[];
  albums: string[];
  collections: Collection[];
}) {
  const labels: Record<keyof PhotoFilters, string> = {
    query: 'Search',
    person: 'Person',
    album: 'Album',
    days: 'Last days',
    collection: 'Collection',
    unassigned: 'Unassigned',
  };
  const chips = (Object.keys(filters) as (keyof PhotoFilters)[])
    .filter((key) => !!filters[key])
    .map((key) => ({
      key,
      label: `${labels[key]}: ${key === 'collection' ? collections.find((item) => String(item.id) === filters.collection)?.name || filters.collection : filters[key]}`,
      onRemove: () => onFilters({ [key]: emptyPhotoFilters[key] }),
    }));
  const options = (values: string[], label: string) => [
    { value: '', label },
    ...values.map((value) => ({ value, label: value })),
  ];
  return (
    <BrowseToolbar
      noun="photos"
      query={filters.query}
      onQuery={(query) => onFilters({ query })}
      count={count}
      chips={<ActiveFilters items={chips} onClear={() => onFilters(emptyPhotoFilters)} />}
    >
      <Popover.Root
        variant="filters"
        positioning={{
          placement: 'bottom-start',
          strategy: 'fixed',
          gutter: 8,
          overflowPadding: 12,
        }}
      >
        <Popover.Trigger asChild>
          <Button variant="toolbar" aria-pressed={chips.length > 0}>
            <Icon glyph={SlidersHorizontal} size="sm" />
            Filters
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content>
              <Popover.Title>Filter photos</Popover.Title>
              <Popover.Description>Changes apply instantly.</Popover.Description>
              <Popover.Body>
                <FilterPicker
                  label="Person"
                  options={people}
                  value={filters.person ? [filters.person] : []}
                  onChange={(people) => onFilters({ person: people[0] || '' })}
                  multiple={false}
                />
                <ChoiceSelect
                  portalled={false}
                  layout="inline"
                  label="Album label"
                  value={filters.album}
                  onChange={(album) => onFilters({ album })}
                  options={options(albums, 'Any album label')}
                />
                <ChoiceSelect
                  portalled={false}
                  layout="inline"
                  label="Collection"
                  value={filters.collection}
                  onChange={(collection) => onFilters({ collection })}
                  options={[
                    { value: '', label: 'Any collection' },
                    ...collections
                      .filter(
                        (item) =>
                          !item.hidden &&
                          !item.inheritedHidden &&
                          !item.locked &&
                          !item.inheritedLocked,
                      )
                      .map((item) => ({ value: String(item.id), label: item.name })),
                  ]}
                />
                <ChoiceSelect
                  portalled={false}
                  layout="inline"
                  label="Date added"
                  value={filters.days}
                  onChange={(days) => onFilters({ days })}
                  options={[
                    { value: '', label: 'Any time' },
                    ...['7', '30', '90'].map((value) => ({ value, label: `Last ${value} days` })),
                  ]}
                />
                <Checkbox
                  label="No person assigned"
                  checked={filters.unassigned}
                  onCheckedChange={(unassigned) => onFilters({ unassigned })}
                />
              </Popover.Body>
              <Popover.Footer>
                <Button
                  variant="plain"
                  onClick={() => onFilters({ ...emptyPhotoFilters, query: filters.query })}
                >
                  Reset filters
                </Button>
                <Popover.CloseTrigger asChild aria-label="Done">
                  <Button>Done</Button>
                </Popover.CloseTrigger>
              </Popover.Footer>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
      <ChoiceSelect
        hideLabel
        appearance="toolbar"
        label="Sort photos"
        value={sort}
        onChange={onSort}
        options={[
          { value: 'newest', label: 'Newest first' },
          { value: 'oldest', label: 'Oldest first' },
          { value: 'name', label: 'Filename A–Z' },
        ]}
      />
      <PreviewSize value={size} onChange={onSize} />
      <ManageToggle active={manage} onToggle={onManage} />
    </BrowseToolbar>
  );
}
