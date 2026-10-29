import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronLeft, ChevronRight, Film, Play } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { ChoiceSelect } from './choice-select';
import { Comparison, DecisionBar, ReviewNav } from './duplicates';
import { StatusBadge } from './feedback';
import { Heading } from './heading';
import { Icon } from './icon';
import { IconButton } from './icon-button';
import { Text } from './text';
import { css } from '../../styled-system/css';

const meta = {
  title: 'Patterns/Duplicates',
  excludeStories: /Example$/,
  parameters: {
    docs: {
      description: {
        component:
          'The duplicate review surfaces: the queue navigation with its progress and pager, the comparison table with one column per copy, and the sticky decision bar.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export function NavExample() {
  const [group, setGroup] = useState('1');
  return (
    <ReviewNav.Root aria-label="Review groups">
      <ReviewNav.Progress>
        <Text as="span" variant="eyebrow" tone="muted">
          Review queue
        </Text>
        <ReviewNav.Count>3 groups left</ReviewNav.Count>
        <ReviewNav.Caption>7 videos to compare · 2 reviewed this session</ReviewNav.Caption>
      </ReviewNav.Progress>
      <ReviewNav.Pager>
        <IconButton
          aria-label="Previous group"
          disabled={group === '1'}
          onClick={() => setGroup(String(Number(group) - 1))}
        >
          <Icon glyph={ChevronLeft} />
        </IconButton>
        <ChoiceSelect
          hideLabel
          label="Jump to group"
          value={group}
          onChange={setGroup}
          options={['1', '2', '3'].map((value) => ({
            value,
            label: `Group ${value} of 3 · 2 videos`,
          }))}
        />
        <IconButton
          aria-label="Next group"
          disabled={group === '3'}
          onClick={() => setGroup(String(Number(group) + 1))}
        >
          <Icon glyph={ChevronRight} />
        </IconButton>
      </ReviewNav.Pager>
    </ReviewNav.Root>
  );
}

const copies = [
  {
    title: 'The last light',
    resolution: '1,920 × 1,080',
    note: 'Highest resolution',
    highlight: true,
    duration: '12:40',
    size: '212.4 MB',
    sizeNote: '18.2 MB larger',
  },
  {
    title: 'the_last_light_final_v2',
    resolution: '1,280 × 720',
    note: 'Landscape',
    highlight: false,
    duration: '12:40',
    size: '194.2 MB',
    sizeNote: 'Smallest file',
    sizeHighlight: true,
  },
];

export function ComparisonExample() {
  const [keep, setKeep] = useState([true, false]);
  return (
    <div>
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '3.5',
          mb: '4',
        })}
      >
        <Heading size="sm">Compare 2 videos</Heading>
        <div className={css({ display: 'flex', gap: '2' })}>
          <Button>Preview side by side</Button>
          <Button aria-pressed>Fewer details</Button>
        </div>
      </div>
      <Comparison.Root>
        <Comparison.Scroll
          tabIndex={0}
          role="region"
          aria-label="Video comparison. Scroll horizontally to see more copies."
        >
          <Comparison.Table style={{ '--copies': 2 } as React.CSSProperties}>
            <thead>
              <tr>
                <Comparison.RowLabel scope="col">
                  <span>Copies</span>
                  <small>Play to check the content.</small>
                </Comparison.RowLabel>
                {copies.map((copy, i) => (
                  <th scope="col" key={copy.title} data-recycle={keep[i] ? undefined : ''}>
                    <Comparison.CopyHeading>
                      <span>Copy {i + 1}</span>
                      <StatusBadge tone={keep[i] ? 'success' : 'warning'}>
                        {keep[i] ? '✓ Keep' : 'Recycle'}
                      </StatusBadge>
                    </Comparison.CopyHeading>
                    <Comparison.Preview>
                      <button type="button" aria-label={`Play copy ${i + 1}: ${copy.title}`}>
                        <span className={css({ display: 'grid', placeItems: 'center', gap: '3' })}>
                          <Film aria-hidden="true" />
                          <Text as="span" size="sm" tone="muted">
                            No preview image
                          </Text>
                        </span>
                        <Comparison.Play>
                          <Icon glyph={Play} size="sm" /> Play
                        </Comparison.Play>
                      </button>
                    </Comparison.Preview>
                    <Comparison.Title title={copy.title}>{copy.title}</Comparison.Title>
                    <div
                      className={css({
                        display: 'flex',
                        alignItems: 'stretch',
                        flexWrap: 'wrap',
                        gap: '2.5',
                        mt: '3.5',
                      })}
                    >
                      <Comparison.Choice data-choice={keep[i] ? 'keep' : 'recycle'}>
                        <input
                          type="checkbox"
                          aria-label={`Keep copy ${i + 1}`}
                          checked={keep[i]}
                          onChange={() =>
                            setKeep((value) => value.map((item, j) => (j === i ? !item : item)))
                          }
                          className={css({
                            w: '6',
                            h: '6',
                            flexShrink: '0',
                            accentColor: 'accent',
                          })}
                        />
                        <Comparison.ChoiceCopy>
                          <strong>{keep[i] ? 'Keep this video' : 'Recycle this video'}</strong>
                          <small>
                            {keep[i] ? 'Stays in your library' : 'Moves to Recycle bin when saved'}
                          </small>
                        </Comparison.ChoiceCopy>
                      </Comparison.Choice>
                      <Button
                        className={css({ alignSelf: 'center' })}
                        aria-label={`Keep only copy ${i + 1}`}
                      >
                        Keep only this
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <Comparison.RowLabel scope="row">Resolution</Comparison.RowLabel>
                {copies.map((copy, i) => (
                  <td key={copy.title} data-recycle={keep[i] ? undefined : ''}>
                    <Comparison.Value>{copy.resolution}</Comparison.Value>
                    <Comparison.Note data-highlight={copy.highlight ? '' : undefined}>
                      {copy.note}
                    </Comparison.Note>
                  </td>
                ))}
              </tr>
              <tr>
                <Comparison.RowLabel scope="row">Duration</Comparison.RowLabel>
                {copies.map((copy, i) => (
                  <td key={copy.title} data-recycle={keep[i] ? undefined : ''}>
                    <Comparison.Value>{copy.duration}</Comparison.Value>
                    <Comparison.Note>Same length</Comparison.Note>
                  </td>
                ))}
              </tr>
              <tr>
                <Comparison.RowLabel scope="row">File size</Comparison.RowLabel>
                {copies.map((copy, i) => (
                  <td key={copy.title} data-recycle={keep[i] ? undefined : ''}>
                    <Comparison.Value>{copy.size}</Comparison.Value>
                    <Comparison.Note data-highlight={copy.sizeHighlight ? '' : undefined}>
                      {copy.sizeNote}
                    </Comparison.Note>
                  </td>
                ))}
              </tr>
              <tr>
                <Comparison.RowLabel scope="row">Location</Comparison.RowLabel>
                {copies.map((copy, i) => (
                  <td key={copy.title} data-recycle={keep[i] ? undefined : ''}>
                    <Comparison.Path>D:\Media\Library\media\{copy.title}.mp4</Comparison.Path>
                  </td>
                ))}
              </tr>
            </tbody>
          </Comparison.Table>
        </Comparison.Scroll>
        <Comparison.Caption>
          Higher resolution and larger files don’t always mean better quality. Preview the content
          before choosing.
        </Comparison.Caption>
      </Comparison.Root>
      <DecisionBar.Root>
        <DecisionBar.Summary aria-live="polite" aria-atomic="true">
          <DecisionBar.Count>
            {keep.filter(Boolean).length} to keep <span>·</span> {keep.filter((k) => !k).length} to
            recycle
          </DecisionBar.Count>
          <DecisionBar.Note>
            194.2 MB will move to Recycle bin. Files are not permanently deleted.
          </DecisionBar.Note>
        </DecisionBar.Summary>
        <DecisionBar.Actions>
          <Button>Skip for now</Button>
          <Button>Keep all</Button>
          <Button variant="primary">Save &amp; next</Button>
        </DecisionBar.Actions>
      </DecisionBar.Root>
    </div>
  );
}

export const Navigation: Story = { render: () => <NavExample /> };
export const Review: Story = {
  render: () => (
    <div className={css({ maxW: 'container.frame' })}>
      <ComparisonExample />
    </div>
  ),
};
