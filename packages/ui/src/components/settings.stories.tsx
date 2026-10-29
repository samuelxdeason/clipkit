import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, Folder, Link, Lock, Plus, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { StatusBadge } from './feedback';
import { Heading } from './heading';
import { Icon } from './icon';
import { SectionHeading } from './layout';
import { SettingsCard, SettingsNav, Storage } from './settings';
import { Text } from './text';
import { css } from '../../styled-system/css';

const meta = {
  title: 'Patterns/Settings',
  excludeStories: /Example$/,
  parameters: {
    docs: {
      description: {
        component:
          'The Settings surfaces: the section navigation beside the page, the settings card with its rows and the library path, and the storage summary with its tiles, track and legend.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const sections = [
  { id: 'general', label: 'Library', detail: 'Location & storage', glyph: Folder },
  { id: 'connections', label: 'Connections', detail: 'Accounts & access', glyph: Link },
  { id: 'maintenance', label: 'Maintenance', detail: 'Backup & media care', glyph: Settings2 },
];

export function NavExample() {
  const [section, setSection] = useState('general');
  return (
    <SettingsNav.Root aria-label="Settings sections" className={css({ w: { lg: '[224px]' } })}>
      {sections.map((item) => (
        <SettingsNav.Item
          key={item.id}
          type="button"
          aria-pressed={section === item.id}
          onClick={() => setSection(item.id)}
        >
          <item.glyph aria-hidden="true" />
          <SettingsNav.Copy>
            <SettingsNav.Title>{item.label}</SettingsNav.Title>
            <SettingsNav.Detail>{item.detail}</SettingsNav.Detail>
          </SettingsNav.Copy>
        </SettingsNav.Item>
      ))}
    </SettingsNav.Root>
  );
}

const sites = [
  { site: 'youtube', bytes: 14.2, tone: '1' },
  { site: 'x', bytes: 6.4, tone: '2' },
  { site: 'local', bytes: 2.1, tone: '3' },
] as const;
const total = sites.reduce((sum, item) => sum + item.bytes, 0);

export function LibraryCardExample() {
  return (
    <section aria-labelledby="storage-heading">
      <Heading id="storage-heading" size="sm" className={css({ mb: '4' })}>
        Library &amp; storage
      </Heading>
      <SettingsCard.Root>
        <SettingsCard.Row>
          <SettingsCard.Icon aria-hidden="true">
            <Folder />
          </SettingsCard.Icon>
          <SettingsCard.Copy>
            <SettingsCard.Title>Library location</SettingsCard.Title>
            <SettingsCard.Detail>Your media and catalogue are stored here.</SettingsCard.Detail>
          </SettingsCard.Copy>
          <SettingsCard.Control />
        </SettingsCard.Row>
        <SettingsCard.Path>D:\Media\Library</SettingsCard.Path>
        <Storage.Root>
          <Storage.Tiles aria-label="Library storage summary">
            <Storage.Tile>
              <Storage.Value>22.7 GB</Storage.Value>
              <Storage.Label>Library storage</Storage.Label>
            </Storage.Tile>
            <Storage.Tile>
              <Storage.Value>1,204</Storage.Value>
              <Storage.Label>Videos</Storage.Label>
            </Storage.Tile>
            <Storage.Tile>
              <Storage.Value>38</Storage.Value>
              <Storage.Label>People</Storage.Label>
            </Storage.Tile>
          </Storage.Tiles>
          <Storage.Breakdown>
            <Storage.Heading>Storage by source</Storage.Heading>
            <Storage.Track aria-hidden="true">
              {sites.map((item) => (
                <Storage.Segment
                  key={item.site}
                  bg={`chart.${item.tone}`}
                  style={{ width: `${(item.bytes / total) * 100}%` }}
                />
              ))}
            </Storage.Track>
            <Storage.Legend>
              {sites.map((item) => (
                <Storage.Item key={item.site}>
                  <Storage.Dot aria-hidden="true" bg={`chart.${item.tone}`} />
                  {item.site} <b>{item.bytes} GB</b>
                </Storage.Item>
              ))}
            </Storage.Legend>
          </Storage.Breakdown>
        </Storage.Root>
      </SettingsCard.Root>
    </section>
  );
}

export function MaintenanceCardExample() {
  return (
    <section aria-labelledby="backup-heading">
      <Heading id="backup-heading" size="sm" className={css({ mb: '4' })}>
        Backup &amp; recovery
      </Heading>
      <SettingsCard.Root>
        <SettingsCard.Row>
          <SettingsCard.Icon aria-hidden="true">
            <Download />
          </SettingsCard.Icon>
          <SettingsCard.Copy>
            <SettingsCard.Title>Back up catalogue</SettingsCard.Title>
            <SettingsCard.Detail>
              Save collections, people, tags, favorites, and playback positions. Media files are not
              copied.
            </SettingsCard.Detail>
          </SettingsCard.Copy>
          <SettingsCard.Control>
            <Button>Back up now</Button>
          </SettingsCard.Control>
        </SettingsCard.Row>
        <SettingsCard.Row>
          <SettingsCard.Icon aria-hidden="true">
            <Folder />
          </SettingsCard.Icon>
          <SettingsCard.Copy>
            <SettingsCard.Title>Rebuild library</SettingsCard.Title>
            <SettingsCard.Detail>
              Rescan media and saved metadata to restore catalogue entries.
            </SettingsCard.Detail>
          </SettingsCard.Copy>
          <SettingsCard.Control>
            <Button>Rebuild…</Button>
          </SettingsCard.Control>
        </SettingsCard.Row>
      </SettingsCard.Root>
    </section>
  );
}

export function ConnectionsExample() {
  return (
    <section aria-labelledby="connections-heading" className={css({ display: 'grid', gap: '4' })}>
      <Heading id="connections-heading" size="sm">
        Connected services
      </Heading>
      <Text tone="muted" className={css({ maxW: '[700px]' })}>
        Import a cookies.txt file exported while signed in to access protected posts. Connection
        files are saved in your vault.
      </Text>
      <div>
        <Button>
          <Icon glyph={Plus} size="sm" />
          Import connection file…
        </Button>
      </div>
      <SettingsCard.Root>
        <SettingsCard.Row>
          <SettingsCard.Icon aria-hidden="true">
            <Link />
          </SettingsCard.Icon>
          <SettingsCard.Copy>
            <SettingsCard.Title>X / Twitter</SettingsCard.Title>
            <SettingsCard.Detail>Connected to your library</SettingsCard.Detail>
          </SettingsCard.Copy>
          <SettingsCard.Control>
            <StatusBadge tone="success" dot>
              Connected
            </StatusBadge>
          </SettingsCard.Control>
        </SettingsCard.Row>
        <SettingsCard.Row>
          <SettingsCard.Icon aria-hidden="true">
            <Link />
          </SettingsCard.Icon>
          <SettingsCard.Copy>
            <SettingsCard.Title>Pornhub</SettingsCard.Title>
            <SettingsCard.Detail>No account connected</SettingsCard.Detail>
          </SettingsCard.Copy>
          <SettingsCard.Control>
            <StatusBadge dot>Not connected</StatusBadge>
          </SettingsCard.Control>
        </SettingsCard.Row>
      </SettingsCard.Root>
    </section>
  );
}

export function PageExample() {
  return (
    <div
      className={css({
        display: 'grid',
        gridTemplateColumns: { base: 'minmax(0, 1fr)', lg: '224px minmax(0, 1fr)' },
        gap: '6',
        alignItems: 'start',
        maxW: 'container.frame',
      })}
    >
      <NavExample />
      <div className={css({ minW: '0', display: 'grid', gap: '[30px]' })}>
        <SectionHeading
          surface
          eyebrow="Make ClipKit yours"
          title="Your library"
          description="Storage and library information, in one place."
        />
        <LibraryCardExample />
        <div
          className={css({
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2',
          })}
        >
          <Icon glyph={Lock} size="sm" />
          <Text as="span" variant="metadata" tone="muted">
            Your library stays in your vault.
          </Text>
        </div>
      </div>
    </div>
  );
}

export const Page: Story = { render: () => <PageExample /> };
export const Navigation: Story = { render: () => <NavExample /> };
export const Cards: Story = {
  render: () => (
    <div className={css({ display: 'grid', gap: '[30px]', maxW: 'container.content' })}>
      <LibraryCardExample />
      <MaintenanceCardExample />
      <ConnectionsExample />
    </div>
  ),
};
