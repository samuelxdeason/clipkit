import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Download,
  Film,
  Folder,
  Heart,
  Image,
  Settings,
  SquarePlay,
  Tag,
  Users,
} from 'lucide-react';
import * as Sidebar from './sidebar';
import { css } from '../../styled-system/css';

const meta = {
  title: 'Patterns/Sidebar',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The existing app\'s sidebar: brand, labelled groups of rows, counts and a footer. Item is a button; render a link with asChild and mark the current route with aria-current="page". Rows that lead nowhere yet are disabled buttons.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Row({
  label,
  glyph: Glyph,
  current = false,
  count,
  disabled = false,
}: {
  label: string;
  glyph: typeof Film;
  current?: boolean;
  count?: number;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Sidebar.Item type="button" disabled>
        <Glyph aria-hidden="true" />
        {label}
      </Sidebar.Item>
    );
  }
  return (
    <Sidebar.Item asChild>
      <a href="#" aria-current={current ? 'page' : undefined}>
        <Glyph aria-hidden="true" />
        {label}
        {count !== undefined && <Sidebar.Count>{count}</Sidebar.Count>}
      </a>
    </Sidebar.Item>
  );
}

export const Library: Story = {
  render: () => (
    <Sidebar.Root aria-label="Library navigation" className={css({ h: '[640px]' })}>
      <Sidebar.Brand href="#" aria-label="ClipKit home">
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
          <Row label="Videos" glyph={Film} current count={1204} />
          <Row label="Photos" glyph={Image} count={388} />
        </Sidebar.Group>
        <Sidebar.Group>
          <Sidebar.Label>Organize</Sidebar.Label>
          <Row label="Collections" glyph={Folder} disabled />
          <Row label="People" glyph={Users} />
          <Row label="Tags" glyph={Tag} />
        </Sidebar.Group>
        <Sidebar.Footer>
          <details open>
            <Sidebar.Summary>Manage library</Sidebar.Summary>
            <Sidebar.Group className={css({ mt: '1' })}>
              <Row label="Following" glyph={Heart} />
              <Row label="Downloads" glyph={Download} count={3} />
            </Sidebar.Group>
          </details>
          <Row label="Settings" glyph={Settings} />
        </Sidebar.Footer>
      </Sidebar.Nav>
    </Sidebar.Root>
  ),
};
