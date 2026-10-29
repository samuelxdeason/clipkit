import type { Meta, StoryObj } from '@storybook/react-vite';
import { Folder, Maximize2, Menu, Tag, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { Heading } from './heading';
import { Icon } from './icon';
import { IconButton } from './icon-button';
import { Input } from './input';
import { SectionHeading } from './layout';
import { Text } from './text';
import * as Viewer from './viewer';
import { css } from '../../styled-system/css';

const meta = {
  title: 'Patterns/Viewer',
  excludeStories: /Example$|^stageArtwork$|^frame$/,
  parameters: {
    docs: {
      description: {
        component:
          'The window the app opens around a playing video or a photo: an Ark Dialog with the existing app’s viewer chrome. Header carries the eyebrow, the one-line title and the close control; Stage holds the media on black; Bar and Footer hold the organize shortcuts and the transport controls; Inspector holds the Organizer beside the stage, or below it when narrow.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Original geometric artwork, the same kind the library demo uses. */
export const stageArtwork = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><linearGradient id="s" x2="0" y2="1"><stop stop-color="#263c49"/><stop offset="1" stop-color="#a9b5ac"/></linearGradient></defs><rect width="960" height="540" fill="url(#s)"/><circle cx="320" cy="150" r="65" fill="#a9b5ac" opacity=".7"/><path d="M0 380 180 160 340 340 540 110 800 350 960 230V540H0Z" fill="#455563" opacity=".8"/><path d="M0 420 250 310 510 430 780 280 960 420V540H0Z" fill="#263c49"/></svg>',
)}`;

/** A story frame that keeps the fixed viewer inside its own box. */
export const frame = css({
  position: 'relative',
  h: '[640px]',
  w: 'full',
  maxW: 'container.frame',
  overflow: 'hidden',
  contain: 'layout',
  borderRadius: 'inset',
});

const sections = ['People', 'Tags', 'Collections', 'File'];
const people = [
  { name: 'Alex Morgan', initials: 'AM', linked: true, detail: 'In this video' },
  { name: 'Casey Ellis', initials: 'CE', linked: false, detail: 'Link to video' },
  { name: 'Jordan Lane', initials: 'JL', linked: false, detail: 'Link to video' },
];

export function OrganizerExample({ onClose }: { onClose?: () => void }) {
  const [section, setSection] = useState('People');
  const [linked, setLinked] = useState(people.filter((p) => p.linked).map((p) => p.name));
  return (
    <Viewer.Organizer.Root aria-label="Organize this video">
      <Viewer.Organizer.Heading>
        <SectionHeading as="h3" eyebrow="Your library" title="Make it yours" />
        <IconButton aria-label="Close organization panel" onClick={onClose}>
          <Icon glyph={X} />
        </IconButton>
      </Viewer.Organizer.Heading>
      <Viewer.Organizer.Tray aria-label="Video information sections">
        {sections.map((name) => (
          <Viewer.Organizer.TrayItem
            key={name}
            type="button"
            aria-pressed={section === name}
            onClick={() => setSection(name)}
          >
            {name}
          </Viewer.Organizer.TrayItem>
        ))}
      </Viewer.Organizer.Tray>
      <Viewer.Organizer.Feedback aria-live="polite">
        Changes save automatically.
        <Button size="compact" variant="quiet">
          Undo
        </Button>
      </Viewer.Organizer.Feedback>
      <Viewer.Organizer.Intro>
        <Heading as="h4" size="sm">
          Who’s in this video?
        </Heading>
        <Text size="sm" tone="muted">
          Link anyone you recognize. Select again to unlink.
        </Text>
      </Viewer.Organizer.Intro>
      <Input aria-label="Search people" placeholder="Search people…" defaultValue="Sam" />
      <Viewer.Organizer.Create asChild>
        <Button>＋ Create and link “Sam”</Button>
      </Viewer.Organizer.Create>
      <Viewer.Organizer.Options>
        {people.map((person) => {
          const pressed = linked.includes(person.name);
          return (
            <Viewer.Organizer.Option
              key={person.name}
              type="button"
              aria-pressed={pressed}
              onClick={() =>
                setLinked((current) =>
                  pressed
                    ? current.filter((name) => name !== person.name)
                    : [...current, person.name],
                )
              }
            >
              <Viewer.Organizer.Symbol aria-hidden="true">
                {person.initials}
              </Viewer.Organizer.Symbol>
              <Viewer.Organizer.Copy>
                <Viewer.Organizer.Name>{person.name}</Viewer.Organizer.Name>
                <Viewer.Organizer.Detail>
                  {pressed ? 'In this video' : person.detail}
                </Viewer.Organizer.Detail>
              </Viewer.Organizer.Copy>
              <Viewer.Organizer.Check aria-hidden="true">
                {pressed ? '✓' : '+'}
              </Viewer.Organizer.Check>
            </Viewer.Organizer.Option>
          );
        })}
      </Viewer.Organizer.Options>
      <Viewer.Organizer.Empty>
        No more matches. Use the create button above to add someone.
      </Viewer.Organizer.Empty>
    </Viewer.Organizer.Root>
  );
}

export function PlayerExample({ error = false }: { error?: boolean }) {
  const [open, setOpen] = useState(true);
  const [details, setDetails] = useState(true);
  return (
    <div className={frame}>
      {!open && <Button onClick={() => setOpen(true)}>Open player</Button>}
      <Viewer.Root open={open} onOpenChange={(event) => setOpen(event.open)}>
        <Viewer.Backdrop />
        <Viewer.Positioner>
          <Viewer.Window>
            <Viewer.Header>
              <Viewer.Heading>
                <Viewer.Eyebrow>Now playing</Viewer.Eyebrow>
                <Viewer.Title title="The last light">The last light</Viewer.Title>
              </Viewer.Heading>
              <Viewer.CloseTrigger asChild>
                <IconButton aria-label="Close player">
                  <Icon glyph={X} />
                </IconButton>
              </Viewer.CloseTrigger>
            </Viewer.Header>
            <Viewer.Content>
              <Viewer.Playback>
                <Viewer.Stage>
                  <Viewer.Image src={stageArtwork} alt="" />
                </Viewer.Stage>
                <Viewer.Bar>
                  <Viewer.Caption>Organize while you watch</Viewer.Caption>
                  <div className={css({ display: 'flex', flexWrap: 'wrap', gap: '2' })}>
                    <Button aria-pressed={details} onClick={() => setDetails(true)}>
                      <Icon glyph={Users} size="sm" />
                      People
                    </Button>
                    <Button>
                      <Icon glyph={Tag} size="sm" />
                      Tags
                    </Button>
                    <Button>
                      <Icon glyph={Folder} size="sm" />
                      Collections
                    </Button>
                  </div>
                </Viewer.Bar>
                <Viewer.Footer>
                  <Viewer.Caption>demo · 1080p · MP4</Viewer.Caption>
                  <Viewer.Controls>
                    <Button aria-label="Previous video">←</Button>
                    <Button aria-label="Next video">→</Button>
                    <Button aria-label="Rewind 10 seconds">↶ 10s</Button>
                    <Button aria-label="Forward 10 seconds">10s ↷</Button>
                    <Button>
                      <Icon glyph={Menu} size="sm" />
                      File details
                    </Button>
                    <Button>
                      <Icon glyph={Maximize2} size="sm" />
                      Fullscreen
                    </Button>
                  </Viewer.Controls>
                </Viewer.Footer>
                {error && (
                  <Viewer.Error role="alert">
                    This video couldn’t be played. Check that its file is available and its format
                    is supported by your browser.
                  </Viewer.Error>
                )}
              </Viewer.Playback>
              <Viewer.Inspector hidden={!details}>
                <OrganizerExample onClose={() => setDetails(false)} />
              </Viewer.Inspector>
            </Viewer.Content>
          </Viewer.Window>
        </Viewer.Positioner>
      </Viewer.Root>
    </div>
  );
}

export function PhotoExample() {
  const [open, setOpen] = useState(true);
  return (
    <div className={frame}>
      {!open && <Button onClick={() => setOpen(true)}>Open photo</Button>}
      <Viewer.Root kind="photo" open={open} onOpenChange={(event) => setOpen(event.open)}>
        <Viewer.Backdrop />
        <Viewer.Positioner>
          <Viewer.Window>
            <Viewer.Header>
              <Viewer.Heading>
                <Viewer.Eyebrow>Photo viewer</Viewer.Eyebrow>
                <Viewer.Title title="IMG_2041.jpg">IMG_2041.jpg</Viewer.Title>
              </Viewer.Heading>
              <Viewer.CloseTrigger asChild>
                <IconButton aria-label="Close photo">
                  <Icon glyph={X} />
                </IconButton>
              </Viewer.CloseTrigger>
            </Viewer.Header>
            <Viewer.Stage>
              <Viewer.Image src={stageArtwork} alt="IMG_2041.jpg" />
            </Viewer.Stage>
            <Viewer.Footer>
              <Button>← Previous</Button>
              <Viewer.Caption>3 / 24 · Summer</Viewer.Caption>
              <Button>Next →</Button>
            </Viewer.Footer>
          </Viewer.Window>
        </Viewer.Positioner>
      </Viewer.Root>
    </div>
  );
}

export const Player: Story = { render: () => <PlayerExample /> };
export const PlayerWithError: Story = { render: () => <PlayerExample error /> };
export const Photo: Story = { render: () => <PhotoExample /> };
export const Organizer: Story = {
  render: () => (
    <div className={css({ maxW: 'container.narrow' })}>
      <OrganizerExample />
    </div>
  ),
};
