import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, Film } from 'lucide-react';
import { Button } from './button';
import { EmptyState, Notice, StatusBadge, Tag } from './feedback';
import { css } from '../../styled-system/css';

const meta = {
  title: 'Feedback/Patterns',
  parameters: {
    docs: {
      description: {
        component:
          'Four small patterns from the existing app. Tag is a chip, a button when it has an action. StatusBadge labels a state with a tone and optional dot. Notice is an inline message with an accent bar; danger notices are alerts. EmptyState is the centred panel for empty, loading and error results.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const row = css({ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2' });
const stack = css({ display: 'grid', gap: '4' });

export const Tags: Story = {
  render: () => (
    <div className={row}>
      <Tag>Travel</Tag>
      <Tag onClick={() => {}} aria-label="Filter by tag: Beach">
        Beach
      </Tag>
      <Tag className={css({ maxW: '32' })} title="A very long tag name that truncates">
        A very long tag name that truncates
      </Tag>
    </div>
  ),
};

export const Statuses: Story = {
  render: () => (
    <div className={row}>
      <StatusBadge>Queued</StatusBadge>
      <StatusBadge tone="info">Downloading</StatusBadge>
      <StatusBadge tone="success">Done</StatusBadge>
      <StatusBadge tone="warning">Duplicate</StatusBadge>
      <StatusBadge tone="danger">Error</StatusBadge>
      <StatusBadge tone="success" dot>
        Connected
      </StatusBadge>
      <StatusBadge dot>Not connected</StatusBadge>
    </div>
  ),
};

export const Notices: Story = {
  render: () => (
    <div className={stack}>
      <Notice>Catalogue rebuilt. 1,204 videos were re-read from disk.</Notice>
      <Notice tone="info">Downloads continue in the background while you browse.</Notice>
      <Notice
        tone="danger"
        actions={
          <Button variant="quiet" size="compact">
            Retry
          </Button>
        }
      >
        Couldn’t refresh your library. Showing previously loaded videos.
      </Notice>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className={stack}>
      <EmptyState
        symbol={<Download />}
        title="Your queue is clear"
        description="Add a video link or a page of pictures to start a download. Finished items stay here until you clear them."
        actions={<Button variant="primary">Add a link</Button>}
      />
      <EmptyState
        state="loading"
        title="Loading your videos"
        description="Reading the catalogue."
      />
      <EmptyState
        state="error"
        symbol={<Film />}
        title="Library unavailable"
        description="The daemon did not answer. Check that it is running, then try again."
        actions={<Button>Retry</Button>}
      />
    </div>
  ),
};
