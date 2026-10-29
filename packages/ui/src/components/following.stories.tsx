import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, ExternalLink, Film, Play, Check } from 'lucide-react';
import { Button } from './button';
import { Hero } from './collections';
import { StatusBadge } from './feedback';
import { RemoteItem, SourceCard } from './following';
import { Icon } from './icon';
import { PageHeader } from './layout';
import { Avatar, Identity, Rule, Stat, TextLink } from './surfaces';
import { css } from '../../styled-system/css';

const meta = {
  title: 'Patterns/Following',
  excludeStories: /Example$/,
  parameters: {
    docs: {
      description: {
        component:
          'The Following surfaces: a followed source as a card in the directory, the source hero (Hero with a portrait cover), and one remote item with its preview, copy and status row.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export function SourceCardExample({ person = true }: { person?: boolean }) {
  return (
    <SourceCard.Root aria-label="Alex Morgan">
      <Identity asChild tone="plum">
        <SourceCard.Art aria-hidden="true">{person ? 'AM' : <Film />}</SourceCard.Art>
      </Identity>
      <SourceCard.Copy>
        <SourceCard.Name type="button">
          {person ? 'Alex Morgan' : 'Evening channel'}
        </SourceCard.Name>
        <SourceCard.Meta>example.test · @alexmorgan · uploads</SourceCard.Meta>
        {person && <SourceCard.Meta>Alex Morgan’s uploads</SourceCard.Meta>}
        <SourceCard.Stats>
          <SourceCard.Stat>
            <b>128</b> videos
          </SourceCard.Stat>
          <SourceCard.Stat>
            <b>96</b> downloaded
          </SourceCard.Stat>
          <SourceCard.Stat>
            <b>32</b> available
          </SourceCard.Stat>
        </SourceCard.Stats>
        <SourceCard.Checked>Last checked: Oct 28, 9:14 PM</SourceCard.Checked>
      </SourceCard.Copy>
      <SourceCard.Actions>
        {person && <Button>View person</Button>}
        <Button>Browse</Button>
        <Button>Check for updates</Button>
        <Button variant="quiet" className={css({ ml: 'auto' })} aria-label="Unfollow Alex Morgan">
          Unfollow
        </Button>
      </SourceCard.Actions>
    </SourceCard.Root>
  );
}

export function SourceHeroExample() {
  return (
    <Hero.Root cover="portrait" aria-label="Followed source">
      <Identity aria-hidden="true" tone="plum" wash="hero" />
      <Identity asChild tone="plum">
        <Hero.Cover aria-hidden="true">
          <Avatar.Root shape="portrait">
            <Avatar.Frame>
              <Avatar.Wash aria-hidden="true" />
              <Avatar.Initials aria-hidden="true">AM</Avatar.Initials>
            </Avatar.Frame>
          </Avatar.Root>
        </Hero.Cover>
      </Identity>
      <Hero.Copy>
        <Identity asChild tone="plum">
          <Hero.Eyebrow>Followed source</Hero.Eyebrow>
        </Identity>
        <PageHeader
          as="h2"
          title="Alex Morgan"
          actions={
            <>
              <Button>View person</Button>
              <Button asChild>
                <a href="#">
                  Open source <Icon glyph={ExternalLink} size="sm" />
                </a>
              </Button>
              <Button>Check for updates</Button>
            </>
          }
        />
        <Hero.Caption>example.test · @alexmorgan · uploads</Hero.Caption>
        <Hero.Note>https://example.test/alexmorgan/videos</Hero.Note>
        <Rule asChild side="top" className={css({ mt: '6', pt: '5' })}>
          <dl
            aria-label="Source overview"
            className={css({
              display: 'grid',
              gridTemplateColumns: {
                base: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(4, minmax(0, 1fr))',
              },
              gap: '4',
            })}
          >
            {[
              ['Source items', '128'],
              ['Downloaded', '96'],
              ['Available', '32'],
              ['In progress', '0'],
            ].map(([label, value]) => (
              <Stat.Root key={label}>
                <Stat.Label>{label}</Stat.Label>
                <Stat.Value>{value}</Stat.Value>
              </Stat.Root>
            ))}
          </dl>
        </Rule>
        <Hero.Note>Last checked: Oct 28, 9:14 PM</Hero.Note>
      </Hero.Copy>
    </Hero.Root>
  );
}

const artwork = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#263c49"/><circle cx="90" cy="60" r="30" fill="#a9b5ac" opacity=".7"/><path d="M0 130 70 80 130 120 200 60 320 110V180H0Z" fill="#455563"/></svg>',
)}`;

export function RemoteItemExample({
  state = 'available',
  selected = false,
}: {
  state?: 'available' | 'downloaded' | 'pending' | 'failed';
  selected?: boolean;
}) {
  const saved = state === 'downloaded';
  return (
    <RemoteItem.Root aria-label="The last light" data-selected={selected || undefined}>
      {state === 'available' || state === 'failed' ? (
        <RemoteItem.Mark asChild>
          <input type="checkbox" aria-label="Select The last light" defaultChecked={selected} />
        </RemoteItem.Mark>
      ) : (
        <RemoteItem.Mark
          aria-label={saved ? 'Downloaded' : 'Queued'}
          data-state={saved ? 'downloaded' : 'pending'}
        >
          {saved ? <Check /> : <Download />}
        </RemoteItem.Mark>
      )}
      {saved ? (
        <RemoteItem.Preview asChild>
          <button type="button" aria-label="Play The last light">
            <img src={artwork} alt="" />
            <RemoteItem.Play aria-hidden="true">
              <Play />
            </RemoteItem.Play>
          </button>
        </RemoteItem.Preview>
      ) : (
        <RemoteItem.Preview>
          <Film aria-hidden="true" />
          <span>No saved preview</span>
        </RemoteItem.Preview>
      )}
      <RemoteItem.Copy>
        <RemoteItem.Title type="button" disabled={state === 'pending'}>
          The last light
        </RemoteItem.Title>
        {saved && (
          <RemoteItem.Original title="the_last_light_final_v2">
            Original: the_last_light_final_v2
          </RemoteItem.Original>
        )}
        <RemoteItem.Line>example.test · 12:40 · 1080p · 212 MB</RemoteItem.Line>
        {saved && <RemoteItem.Line>Alex Morgan</RemoteItem.Line>}
      </RemoteItem.Copy>
      <RemoteItem.Actions>
        <StatusBadge
          tone={
            saved
              ? 'success'
              : state === 'pending'
                ? 'info'
                : state === 'failed'
                  ? 'danger'
                  : 'neutral'
          }
        >
          {saved
            ? 'Downloaded'
            : state === 'pending'
              ? 'Queued'
              : state === 'failed'
                ? 'Failed · Retry'
                : 'Available'}
        </StatusBadge>
        {saved ? (
          <Button>
            <Icon glyph={Play} size="sm" />
            Play
          </Button>
        ) : (
          <TextLink href="#">View source ↗</TextLink>
        )}
      </RemoteItem.Actions>
    </RemoteItem.Root>
  );
}

const grid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
  gap: '6',
  maxW: 'container.frame',
});

export const Sources: Story = {
  render: () => (
    <div
      className={css({
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(440px, 100%), 1fr))',
        gap: '6',
        maxW: 'container.frame',
      })}
    >
      <SourceCardExample />
      <SourceCardExample person={false} />
    </div>
  ),
};
export const SourceHero: Story = {
  render: () => (
    <div className={css({ maxW: 'container.frame' })}>
      <SourceHeroExample />
    </div>
  ),
};
export const RemoteItems: Story = {
  render: () => (
    <div className={grid}>
      <RemoteItemExample state="available" />
      <RemoteItemExample state="available" selected />
      <RemoteItemExample state="downloaded" />
      <RemoteItemExample state="pending" />
      <RemoteItemExample state="failed" />
    </div>
  ),
};
