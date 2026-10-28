import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from './button';
import { ChoiceSelect } from './choice-select';
import { FilterChip, FilterRail, PageHeader, SectionHeading, Toolbar } from './layout';
import { SearchField } from './search-field';

const meta = {
  title: 'Patterns/Page structure',
  parameters: {
    docs: {
      description: {
        component:
          "The existing app's page scaffolding. PageHeader is the title, one-line description and page actions. SectionHeading introduces a region with an optional eyebrow. Toolbar holds the search, the result count beside the controls, and the FilterRail of applied filters.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Header: Story = {
  render: () => (
    <PageHeader
      title="Your video library"
      description="Find a favorite. Pick up where you left off."
      actions={<Button variant="neutral">Refresh library</Button>}
    />
  ),
};

export const Section: Story = {
  render: () => (
    <SectionHeading
      eyebrow="Add to your library"
      title="Save something new"
      description="Paste one link per line. Tweets, Pornhub, YouTube and anything yt-dlp knows."
    />
  ),
};

function ToolbarExample() {
  const [query, setQuery] = useState('beach');
  const [sort, setSort] = useState('newest');
  return (
    <Toolbar.Root aria-label="videos browsing controls">
      <Toolbar.Search>
        <SearchField label="Search videos" value={query} onChange={setQuery} hint="Ctrl K" />
      </Toolbar.Search>
      <Toolbar.Row>
        <Toolbar.Summary role="status">38 videos</Toolbar.Summary>
        <Toolbar.Controls>
          <ChoiceSelect
            hideLabel
            appearance="toolbar"
            label="Sort videos"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
            ]}
          />
          <Button variant="quiet" aria-pressed>
            Filters
          </Button>
          <Button variant="quiet">Manage</Button>
        </Toolbar.Controls>
      </Toolbar.Row>
      <Toolbar.Chips>
        <FilterRail onReset={() => setQuery('')} resetLabel="Clear search & filters">
          <FilterChip label="Resolution: 4K" onClick={() => {}} />
          <FilterChip label="Alex Morgan" onClick={() => {}} />
        </FilterRail>
      </Toolbar.Chips>
    </Toolbar.Root>
  );
}

export const Browsing: Story = { render: () => <ToolbarExample /> };
