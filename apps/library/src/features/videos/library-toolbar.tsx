import { SlidersHorizontal } from 'lucide-react';
import { Button, Checkbox, ChoiceSelect, Icon, Popover, Portal } from '@clipkit/ui';
import {
  BrowseToolbar,
  PreviewSize,
  ManageToggle,
  ActiveFilters,
} from '../../components/browsing/browse-controls';
import { FilterPicker } from '../../components/browsing/filter-picker';
import { emptyFilters, type Filters } from './model';

const watchOptions = [
  { value: 'all', label: 'Any viewing status' },
  { value: 'unplayed', label: 'Unplayed' },
  { value: 'progress', label: 'In progress' },
  { value: 'finished', label: 'Finished' },
];
const options = (values: string[], label: string) => [
  { value: 'all', label },
  ...values.map((value) => ({ value, label: value })),
];

export function LibraryToolbar({
  filters,
  onFilters,
  sort,
  onSort,
  size,
  onSize,
  previewStyle,
  onPreviewStyle,
  manage,
  onManage,
  count,
  people,
  tags,
  sources = [],
  connected = false,
}: {
  filters: Filters;
  onFilters: (next: Partial<Filters>) => void;
  sort: string;
  onSort: (value: string) => void;
  size: string;
  previewStyle: string;
  onPreviewStyle: (value: string) => void;
  onSize: (value: string) => void;
  manage: boolean;
  onManage: () => void;
  count: number;
  people: string[];
  tags: string[];
  sources?: string[];
  connected?: boolean;
}) {
  const chips: { key: keyof Filters; label: string }[] = [];
  if (filters.query) chips.push({ key: 'query', label: `Search: ${filters.query}` });
  if (filters.watch !== 'all')
    chips.push({
      key: 'watch',
      label: watchOptions.find((option) => option.value === filters.watch)!.label,
    });
  for (const key of ['person', 'tag', 'resolution'] as const)
    if (filters[key] !== 'all') chips.push({ key, label: filters[key] });
  if (filters.favorites) chips.push({ key: 'favorites', label: 'Favorites' });
  if (filters.unorganized) chips.push({ key: 'unorganized', label: 'Needs organizing' });
  for (const key of ['source', 'duration', 'days', 'organization'] as const) {
    if (filters[key] !== 'all') chips.push({ key, label: `${key}: ${filters[key]}` });
  }
  if (filters.people.length)
    chips.push({ key: 'people', label: `People: ${filters.people.join(', ')}` });
  if (filters.tags.length)
    chips.push({ key: 'tags', label: `Tags (${filters.tagMatch}): ${filters.tags.join(', ')}` });
  const filterCount = chips.filter((chip) => chip.key !== 'query').length;

  return (
    <BrowseToolbar
      noun="videos"
      query={filters.query}
      onQuery={(query) => onFilters({ query })}
      count={count}
      chips={
        <ActiveFilters
          items={chips.map((chip) => ({
            ...chip,
            onRemove: () => onFilters({ [chip.key]: emptyFilters[chip.key] }),
          }))}
          onClear={() => onFilters(emptyFilters)}
        />
      }
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
          <Button variant="toolbar" aria-pressed={filterCount > 0}>
            <Icon glyph={SlidersHorizontal} size="sm" />
            Filters{filterCount ? ` (${filterCount})` : ''}
          </Button>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content>
              <Popover.Title>Filter videos</Popover.Title>
              <Popover.Description>Changes apply instantly.</Popover.Description>
              <Popover.Body>
                <ChoiceSelect
                  portalled={false}
                  layout="inline"
                  label="Viewing status"
                  value={filters.watch}
                  onChange={(watch) => onFilters({ watch })}
                  options={watchOptions}
                />
                {!connected && (
                  <ChoiceSelect
                    portalled={false}
                    layout="inline"
                    label="Person"
                    value={filters.person}
                    onChange={(person) => onFilters({ person })}
                    options={options(people, 'Any person')}
                  />
                )}
                {!connected && (
                  <ChoiceSelect
                    portalled={false}
                    layout="inline"
                    label="Tag"
                    value={filters.tag}
                    onChange={(tag) => onFilters({ tag })}
                    options={options(tags, 'Any tag')}
                  />
                )}
                {connected && (
                  <>
                    <FilterPicker
                      label="People"
                      options={people}
                      value={filters.people}
                      onChange={(people) => onFilters({ people })}
                    />
                    <ChoiceSelect
                      portalled={false}
                      layout="inline"
                      label="Match tags"
                      value={filters.tagMatch}
                      onChange={(tagMatch) => onFilters({ tagMatch })}
                      options={[
                        { value: 'all', label: 'All selected tags' },
                        { value: 'any', label: 'Any selected tag' },
                      ]}
                    />
                    <FilterPicker
                      label="Tags"
                      options={tags}
                      value={filters.tags}
                      onChange={(tags) => onFilters({ tags })}
                    />
                    <ChoiceSelect
                      portalled={false}
                      layout="inline"
                      label="Source"
                      value={filters.source}
                      onChange={(source) => onFilters({ source })}
                      options={options(sources, 'Any source')}
                    />
                    <ChoiceSelect
                      portalled={false}
                      layout="inline"
                      label="Duration"
                      value={filters.duration}
                      onChange={(duration) => onFilters({ duration })}
                      options={[
                        { value: 'all', label: 'Any duration' },
                        { value: 'short', label: 'Under 5 minutes' },
                        { value: 'medium', label: '5–20 minutes' },
                        { value: 'long', label: '20+ minutes' },
                      ]}
                    />
                    <ChoiceSelect
                      portalled={false}
                      layout="inline"
                      label="Added"
                      value={filters.days}
                      onChange={(days) => onFilters({ days })}
                      options={[
                        { value: 'all', label: 'Any time' },
                        { value: '7', label: 'Last 7 days' },
                        { value: '30', label: 'Last 30 days' },
                        { value: '90', label: 'Last 90 days' },
                      ]}
                    />
                    <ChoiceSelect
                      portalled={false}
                      layout="inline"
                      label="Organization"
                      value={filters.organization}
                      onChange={(organization) => onFilters({ organization })}
                      options={[
                        { value: 'all', label: 'Any organization' },
                        { value: 'people', label: 'Missing people' },
                        { value: 'tags', label: 'Missing tags' },
                      ]}
                    />
                  </>
                )}
                <ChoiceSelect
                  portalled={false}
                  layout="inline"
                  label="Resolution"
                  value={filters.resolution}
                  onChange={(resolution) => onFilters({ resolution })}
                  options={options(
                    connected ? ['720p', '1080p', '4K'] : ['1080p', '4K'],
                    'Any resolution (minimum)',
                  )}
                />
                <Checkbox
                  label="Favorites only"
                  checked={filters.favorites}
                  onCheckedChange={(favorites) => onFilters({ favorites })}
                />
              </Popover.Body>
              <Popover.Footer>
                <Button
                  variant="plain"
                  onClick={() => onFilters({ ...emptyFilters, query: filters.query })}
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
        label="Sort videos"
        value={sort}
        onChange={onSort}
        options={[
          { value: 'newest', label: 'Newest first' },
          { value: 'oldest', label: 'Oldest first' },
          { value: 'title', label: 'Title A–Z' },
          { value: 'duration', label: 'Longest first' },
          ...(connected ? [{ value: 'largest', label: 'Largest first' }] : []),
        ]}
      />
      <ChoiceSelect
        hideLabel
        appearance="toolbar"
        label="Portrait preview style"
        value={previewStyle}
        onChange={onPreviewStyle}
        options={[
          { value: 'portrait', label: 'Soft backdrop' },
          { value: 'triptych', label: 'Three frames' },
        ]}
      />
      <PreviewSize value={size} onChange={onSize} />
      <ManageToggle active={manage} onToggle={onManage} />
    </BrowseToolbar>
  );
}
