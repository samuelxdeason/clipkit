import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowDownToLine, Clock, Film, Heart } from 'lucide-react';
import { Button } from './button';
import { Icon } from './icon';
import {
  Accent,
  Avatar,
  Breadcrumbs,
  Disclosure,
  IconTile,
  Identity,
  Panel,
  PreviewImage,
  ProgressBar,
  Rule,
  Stat,
  TextLink,
} from './surfaces';
import { Text } from './text';
import { Textarea } from './textarea';
import { css } from '../../styled-system/css';

const meta = {
  title: 'Patterns/Surfaces',
  parameters: {
    docs: {
      description: {
        component:
          'The small surfaces and text roles pages used to draw inline. Panel is the bordered surface with optional accent bar and floating elevation; Rule is a hairline with its spacing; Stat is a label over a tabular number; Identity colours decoratively from a name; Avatar frames initials or a portrait; Disclosure, Breadcrumbs, TextLink, Accent, IconTile, ProgressBar, PreviewImage and Textarea cover the rest.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const stack = css({ display: 'grid', gap: '4', maxW: '2xl' });
const row = css({ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '3' });

export const Panels: Story = {
  render: () => (
    <div className={stack}>
      <Panel>
        <Text>A plain panel at the regular padding.</Text>
      </Panel>
      <Panel accent="info" className={row}>
        <IconTile tone="info">
          <ArrowDownToLine />
        </IconTile>
        <div className={css({ flex: '1', display: 'grid', gap: '2' })}>
          <Text>A running download, with the active-work bar.</Text>
          <ProgressBar aria-label="Download progress" max={100} value={42} />
        </div>
      </Panel>
      <Panel accent="selected" elevation="floating" padding="compact" className={row}>
        <Text size="sm" tone="muted">
          3 selected
        </Text>
        <Button size="compact">Add to collection</Button>
        <Button size="compact" variant="danger">
          Move to trash
        </Button>
      </Panel>
    </div>
  ),
};

export const Stats: Story = {
  render: () => (
    <Rule asChild side="top">
      <dl
        className={css({
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '4',
        })}
      >
        <Stat.Root>
          <Stat.Label>
            <Identity tone="plum">
              <Icon glyph={Film} size="sm" />
            </Identity>
            Videos
          </Stat.Label>
          <Stat.Value>1,204</Stat.Value>
        </Stat.Root>
        <Stat.Root>
          <Stat.Label>
            <Identity tone="plum">
              <Icon glyph={Heart} size="sm" />
            </Identity>
            Favorites
          </Stat.Label>
          <Stat.Value>86</Stat.Value>
        </Stat.Root>
        <Stat.Root tone="info">
          <Stat.Label>
            <Icon glyph={ArrowDownToLine} size="sm" />
            In progress
          </Stat.Label>
          <Stat.Value>2</Stat.Value>
        </Stat.Root>
        <Stat.Root tone="danger">
          <Stat.Label>
            <Icon glyph={Clock} size="sm" />
            Needs attention
          </Stat.Label>
          <Stat.Value>1</Stat.Value>
        </Stat.Root>
      </dl>
    </Rule>
  ),
};

export const IdentityAndAvatars: Story = {
  render: () => (
    <div className={row}>
      {(['plum', 'rose', 'blue', 'amber'] as const).map((tone) => (
        <Identity key={tone} asChild tone={tone}>
          <Avatar.Root shape="round" className={css({ w: '24' })}>
            <Avatar.Frame>
              <Avatar.Wash aria-hidden="true" />
              <Avatar.Initials aria-hidden="true">AM</Avatar.Initials>
            </Avatar.Frame>
          </Avatar.Root>
        </Identity>
      ))}
      <Identity asChild tone="rose">
        <Avatar.Root shape="portrait" className={css({ w: '32' })}>
          <Avatar.Glow aria-hidden="true" />
          <Avatar.Frame>
            <Avatar.Wash aria-hidden="true" />
            <Avatar.Initials aria-hidden="true">CE</Avatar.Initials>
          </Avatar.Frame>
        </Avatar.Root>
      </Identity>
    </div>
  ),
};

export const Copy: Story = {
  render: () => (
    <div className={stack}>
      <Breadcrumbs>
        <a href="#">People</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Alex Morgan</span>
      </Breadcrumbs>
      <Text as="p" size="md">
        clipkit<Accent>.</Accent> keeps its wordmark dot in cherry.
      </Text>
      <Identity asChild tone="blue">
        <Text as="span" variant="eyebrow">
          Person in your library
        </Text>
      </Identity>
      <Text>
        Running copy can hold an <TextLink href="#">inline link</TextLink> without a button.
      </Text>
      <Disclosure.Root>
        <Disclosure.Summary>Library connection</Disclosure.Summary>
        <Disclosure.Content>Use the address of your running backend.</Disclosure.Content>
      </Disclosure.Root>
      <Disclosure.Root tone="danger">
        <Disclosure.Summary>View error details</Disclosure.Summary>
        <Disclosure.Content>HTTP Error 410: Gone</Disclosure.Content>
      </Disclosure.Root>
      <Textarea aria-label="Links" placeholder="Paste one link per line" />
      <PreviewImage
        alt=""
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='360'%3E%3Crect width='100%25' height='100%25' fill='%2329262a'/%3E%3C/svg%3E"
      />
    </div>
  ),
};
