import { Fragment, useEffect, useRef, useState } from 'react';
import { Folder, Heart, Maximize2, Menu, Minimize2, Tag, Users, X } from 'lucide-react';
import {
  Button,
  Heading,
  Icon,
  IconButton,
  Identity,
  Input,
  Notice,
  Portal,
  SectionHeading,
  Text,
  Viewer,
} from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { identityToneName } from '../../components/browsing/identity-style';
import type { LibraryClient } from '../../services/library-client';
import { formatDuration, type Video } from './model';
import { sectionNames, useWatchOrganizer, type WatchSection } from './use-watch-organizer';

const shortcuts = css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2' });
const titleForm = css({ display: 'grid', gap: '2' });

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] || '')
    .join('')
    .toLocaleUpperCase();
}

/**
 * The watch window: the existing app's player with its organize inspector.
 * Playback position is saved every ten seconds, on pause, at the end and on
 * close; the first play marks the video watched. Escape closes the inspector
 * first, then the player. In the synthetic demo no file is loaded and the
 * organizer edits session state only.
 */
export function VideoPlayer({
  video,
  client,
  onClose,
  onPrevious,
  onNext,
  onChanged,
}: {
  video: Video;
  client: LibraryClient | null;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onChanged?: () => void;
}) {
  const demo = !client || !video.source;
  const [details, setDetails] = useState(false);
  const [section, setSection] = useState<WatchSection>('people');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const organizer = useWatchOrganizer({ video, client, onChanged });

  // Position bookkeeping, as in the existing player.
  const key = video.source ? { site: video.source.site, id: video.source.id } : null;
  const loaded = useRef(false);
  const lastSaved = useRef(0);
  const lastPosition = useRef(video.source?.position || 0);
  const total = useRef(video.source?.duration || video.duration || 0);
  const writes = useRef(Promise.resolve());
  const save = useRef(() => {});
  save.current = () => {
    if (!client || !key || !loaded.current) return;
    const position = lastPosition.current;
    const duration = total.current;
    writes.current = writes.current
      .then(() => client.position(key, position, duration))
      .then(() => setSaveError(''))
      .catch(() => setSaveError('Your playback position couldn’t be saved.'));
  };
  useEffect(() => {
    const changed = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', changed);
    return () => {
      save.current();
      document.removeEventListener('fullscreenchange', changed);
    };
  }, []);
  useEffect(() => setQuery(''), [section]);

  function openSection(next: WatchSection) {
    setSection(next);
    setDetails(true);
  }
  function seek(seconds: number) {
    const element = player.current;
    if (element && Number.isFinite(element.duration))
      element.currentTime = Math.max(0, Math.min(element.duration, element.currentTime + seconds));
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (windowRef.current?.requestFullscreen) await windowRef.current.requestFullscreen();
      else setError('Fullscreen isn’t available in this browser. You can still watch here.');
    } catch {
      setError('Fullscreen couldn’t open. You can still watch here.');
    }
  }

  const found = organizer.matches(section, query);
  const sectionTitle = {
    people: 'Who’s in this video?',
    tags: 'Make it easy to find',
    collections: 'Find a home for this video',
    file: '',
  }[section];
  const sectionCopy = {
    people: 'Link anyone you recognize. Select again to unlink.',
    tags: 'Add a few useful labels. Select again to remove.',
    collections: 'Add to as many collections as you like.',
    file: '',
  }[section];
  const noun = sectionNames[section].toLocaleLowerCase();
  const listEmpty =
    section === 'people'
      ? !found.peopleMatches.length
      : section === 'tags'
        ? !found.tagMatches.length
        : !found.collectionMatches.length;
  const source = video.source;
  const facts = source
    ? [
        ['Source', source.site || 'Local'],
        [
          'Resolution',
          source.width && source.height ? `${source.width} × ${source.height}` : 'Unknown',
        ],
        ['Duration', source.duration ? formatDuration(source.duration) : 'Unknown'],
        ['File size', source.filesize ? `${Math.round(source.filesize / 1048576)} MB` : 'Unknown'],
        ['Added', source.added || 'Unknown'],
        ['Original title', source.source_title || source.title],
        ['File path', source.filepath],
      ]
    : [
        ['Source', 'demo'],
        ['Duration', formatDuration(video.duration)],
        ['Resolution', video.resolution],
      ];

  return (
    <Viewer.Root
      open
      onOpenChange={(event) => {
        if (!event.open) onClose();
      }}
      closeOnEscape={!details}
    >
      <Portal>
        <Viewer.Backdrop />
        <Viewer.Positioner>
          <Viewer.Window
            ref={windowRef}
            data-portrait={
              video.source?.height && video.source.width && video.source.height > video.source.width
                ? ''
                : undefined
            }
            onKeyDown={(event) => {
              if (event.key === 'Escape' && details && !document.fullscreenElement) {
                event.preventDefault();
                event.stopPropagation();
                setDetails(false);
              }
            }}
          >
            <Viewer.Header>
              <Viewer.Heading>
                <Viewer.Eyebrow>Now playing</Viewer.Eyebrow>
                <Viewer.Title title={video.title}>{video.title}</Viewer.Title>
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
                  {demo ? (
                    video.artwork && <Viewer.Image src={video.artwork} alt="" />
                  ) : (
                    <Viewer.Video
                      ref={player}
                      src={client!.media(source!.filepath)}
                      poster={video.artwork}
                      controls
                      autoPlay
                      playsInline
                      preload="metadata"
                      aria-label="Video player"
                      onLoadedMetadata={(event) => {
                        const element = event.currentTarget;
                        total.current = Number.isFinite(element.duration)
                          ? element.duration
                          : source?.duration || 0;
                        const resume = source?.position || 0;
                        if (resume && resume < total.current - 2) element.currentTime = resume;
                        loaded.current = true;
                      }}
                      onPlay={() => {
                        client!
                          .markWatched(key!)
                          .catch(() => setSaveError('Watch history couldn’t be updated.'));
                      }}
                      onTimeUpdate={(event) => {
                        lastPosition.current = event.currentTarget.currentTime;
                        if (Date.now() - lastSaved.current > 10000) {
                          lastSaved.current = Date.now();
                          save.current();
                        }
                      }}
                      onPause={() => save.current()}
                      onEnded={() => {
                        lastPosition.current = total.current;
                        save.current();
                      }}
                      onError={() =>
                        setError(
                          'This video couldn’t be played. Check that its file is available and its format is supported by your browser.',
                        )
                      }
                    />
                  )}
                </Viewer.Stage>
                <Viewer.Bar>
                  <Viewer.Caption>Organize while you watch</Viewer.Caption>
                  <div className={shortcuts}>
                    {(['people', 'tags', 'collections'] as const).map((name) => (
                      <Button
                        key={name}
                        aria-pressed={details && section === name}
                        onClick={() => openSection(name)}
                      >
                        <Icon
                          glyph={name === 'people' ? Users : name === 'tags' ? Tag : Folder}
                          size="sm"
                        />
                        {sectionNames[name]}
                      </Button>
                    ))}
                  </div>
                </Viewer.Bar>
                <Viewer.Footer>
                  <Viewer.Caption>
                    {demo
                      ? 'Synthetic preview · no video file is loaded.'
                      : [
                          source?.site,
                          source?.height ? `${source.height}p` : '',
                          source?.filename?.includes('.')
                            ? source.filename.split('.').pop()!.toUpperCase()
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                  </Viewer.Caption>
                  <Viewer.Controls>
                    <Button onClick={onPrevious} disabled={!onPrevious} aria-label="Previous video">
                      ←
                    </Button>
                    <Button onClick={onNext} disabled={!onNext} aria-label="Next video">
                      →
                    </Button>
                    <Button
                      onClick={() => seek(-10)}
                      disabled={demo}
                      aria-label="Rewind 10 seconds"
                    >
                      ↶ 10s
                    </Button>
                    <Button
                      onClick={() => seek(10)}
                      disabled={demo}
                      aria-label="Forward 10 seconds"
                    >
                      10s ↷
                    </Button>
                    <Button
                      aria-pressed={details && section === 'file'}
                      onClick={() => openSection('file')}
                    >
                      <Icon glyph={Menu} size="sm" />
                      File details
                    </Button>
                    <Button onClick={() => void toggleFullscreen()}>
                      <Icon glyph={fullscreen ? Minimize2 : Maximize2} size="sm" />
                      {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    </Button>
                  </Viewer.Controls>
                </Viewer.Footer>
                {(error || saveError) && (
                  <Viewer.Error role="alert">{error || saveError}</Viewer.Error>
                )}
              </Viewer.Playback>
              <Viewer.Inspector hidden={!details}>
                <Viewer.Organizer.Root aria-label="Organize this video" aria-busy={organizer.busy}>
                  <Viewer.Organizer.Heading>
                    <SectionHeading as="h3" eyebrow="Your library" title="Make it yours" />
                    <IconButton
                      aria-label="Close organization panel"
                      onClick={() => setDetails(false)}
                    >
                      <Icon glyph={X} />
                    </IconButton>
                  </Viewer.Organizer.Heading>
                  <Viewer.Organizer.Tray aria-label="Video information sections">
                    {(Object.keys(sectionNames) as WatchSection[]).map((name) => (
                      <Viewer.Organizer.TrayItem
                        key={name}
                        type="button"
                        aria-pressed={section === name}
                        onClick={() => setSection(name)}
                      >
                        {sectionNames[name]}
                      </Viewer.Organizer.TrayItem>
                    ))}
                  </Viewer.Organizer.Tray>
                  <Viewer.Organizer.Feedback aria-live="polite">
                    <span>
                      {organizer.busy
                        ? 'Saving…'
                        : organizer.notice ||
                          (organizer.demo
                            ? 'Changes last for this session only.'
                            : 'Changes save automatically.')}
                    </span>
                    {organizer.canUndo && !organizer.busy && (
                      <Button size="compact" variant="quiet" onClick={organizer.runUndo}>
                        Undo
                      </Button>
                    )}
                  </Viewer.Organizer.Feedback>
                  {organizer.error && (
                    <Notice tone="danger" className={css({ mb: '3' })}>
                      {organizer.error}
                    </Notice>
                  )}
                  {section !== 'file' ? (
                    <>
                      <Viewer.Organizer.Intro>
                        <Heading as="h4" size="sm">
                          {sectionTitle}
                        </Heading>
                        <Text size="sm" tone="muted">
                          {sectionCopy}
                        </Text>
                      </Viewer.Organizer.Intro>
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          if (!organizer.disabled && found.canCreate)
                            organizer.create(section, found.term);
                        }}
                      >
                        <Input
                          aria-label={`Search ${noun}`}
                          placeholder={`Search ${noun}…`}
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          disabled={organizer.loading || !!organizer.loadError}
                        />
                      </form>
                      {organizer.loadError ? (
                        <Viewer.Organizer.Empty role="alert">
                          {organizer.loadError}{' '}
                          <Button size="compact" variant="quiet" onClick={organizer.retry}>
                            Try again
                          </Button>
                        </Viewer.Organizer.Empty>
                      ) : organizer.loading ? (
                        <Viewer.Organizer.Empty role="status">
                          Loading your library…
                        </Viewer.Organizer.Empty>
                      ) : (
                        <>
                          {found.canCreate && (
                            <Viewer.Organizer.Create asChild>
                              <Button
                                disabled={organizer.disabled}
                                onClick={() => organizer.create(section, found.term)}
                              >
                                ＋{' '}
                                {section === 'people'
                                  ? 'Create and link'
                                  : section === 'tags'
                                    ? 'Create tag'
                                    : 'Create collection'}{' '}
                                “{found.term}”
                              </Button>
                            </Viewer.Organizer.Create>
                          )}
                          <Viewer.Organizer.Options>
                            {section === 'people' &&
                              found.peopleMatches.map(({ name, person }) => {
                                const auto = organizer.automatic.includes(name);
                                const linked = auto || organizer.models.includes(name);
                                const label = person?.nickname || name;
                                return (
                                  <Viewer.Organizer.Option
                                    key={name}
                                    type="button"
                                    aria-pressed={linked}
                                    disabled={organizer.disabled || auto}
                                    onClick={() => organizer.togglePerson(name)}
                                  >
                                    <Viewer.Organizer.Symbol aria-hidden="true">
                                      {person?.thumbnail && client ? (
                                        <img
                                          src={client.media(person.thumbnail)}
                                          alt=""
                                          loading="lazy"
                                        />
                                      ) : (
                                        <Identity tone={identityToneName(name)}>
                                          {initials(label)}
                                        </Identity>
                                      )}
                                    </Viewer.Organizer.Symbol>
                                    <Viewer.Organizer.Copy>
                                      <Viewer.Organizer.Name>{label}</Viewer.Organizer.Name>
                                      <Viewer.Organizer.Detail>
                                        {auto
                                          ? 'Linked through a source account'
                                          : person?.nickname
                                            ? name
                                            : linked
                                              ? 'In this video'
                                              : 'Link to video'}
                                      </Viewer.Organizer.Detail>
                                    </Viewer.Organizer.Copy>
                                    <Viewer.Organizer.Check aria-hidden="true">
                                      {linked ? '✓' : '+'}
                                    </Viewer.Organizer.Check>
                                  </Viewer.Organizer.Option>
                                );
                              })}
                            {section === 'tags' &&
                              found.tagMatches.map((name) => {
                                const linked = organizer.labels.includes(name);
                                return (
                                  <Viewer.Organizer.Option
                                    key={name}
                                    type="button"
                                    aria-pressed={linked}
                                    disabled={organizer.disabled}
                                    onClick={() => organizer.toggleTag(name)}
                                  >
                                    <Viewer.Organizer.Symbol aria-hidden="true">
                                      #
                                    </Viewer.Organizer.Symbol>
                                    <Viewer.Organizer.Copy>
                                      <Viewer.Organizer.Name>{name}</Viewer.Organizer.Name>
                                      <Viewer.Organizer.Detail>
                                        {linked ? 'Added to this video' : 'Add tag'}
                                      </Viewer.Organizer.Detail>
                                    </Viewer.Organizer.Copy>
                                    <Viewer.Organizer.Check aria-hidden="true">
                                      {linked ? '✓' : '+'}
                                    </Viewer.Organizer.Check>
                                  </Viewer.Organizer.Option>
                                );
                              })}
                            {section === 'collections' &&
                              found.collectionMatches.map((collection) => {
                                const linked = organizer.memberships.includes(collection.id);
                                const parent = collection.parentId
                                  ? organizer.collections.find((c) => c.id === collection.parentId)
                                      ?.name || 'Nested collection'
                                  : 'Collection';
                                return (
                                  <Viewer.Organizer.Option
                                    key={collection.id}
                                    type="button"
                                    aria-pressed={linked}
                                    disabled={organizer.disabled}
                                    onClick={() => organizer.toggleCollection(collection.id)}
                                  >
                                    <Viewer.Organizer.Symbol aria-hidden="true">
                                      <Folder />
                                    </Viewer.Organizer.Symbol>
                                    <Viewer.Organizer.Copy>
                                      <Viewer.Organizer.Name>
                                        {collection.name}
                                      </Viewer.Organizer.Name>
                                      <Viewer.Organizer.Detail>
                                        {parent}
                                        {linked ? ' · Added' : ''}
                                      </Viewer.Organizer.Detail>
                                    </Viewer.Organizer.Copy>
                                    <Viewer.Organizer.Check aria-hidden="true">
                                      {linked ? '✓' : '+'}
                                    </Viewer.Organizer.Check>
                                  </Viewer.Organizer.Option>
                                );
                              })}
                          </Viewer.Organizer.Options>
                          {listEmpty && (
                            <Viewer.Organizer.Empty>
                              {found.term
                                ? 'No matches. Use the create button above to add something new.'
                                : `No ${noun} yet. Type a name to get started.`}
                            </Viewer.Organizer.Empty>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <Viewer.Organizer.File>
                      <form
                        className={titleForm}
                        onSubmit={(event) => {
                          event.preventDefault();
                          organizer.saveTitle();
                        }}
                      >
                        <Text as="label" variant="label">
                          Video title
                          <Input
                            value={organizer.title}
                            onChange={(event) => organizer.setTitle(event.target.value)}
                            disabled={organizer.busy}
                          />
                        </Text>
                        {organizer.title.trim() !== organizer.savedTitle && (
                          <Button
                            type="submit"
                            variant="primary"
                            disabled={organizer.busy || !organizer.title.trim()}
                          >
                            Save title
                          </Button>
                        )}
                      </form>
                      <Button
                        aria-pressed={organizer.favorite}
                        disabled={organizer.busy}
                        onClick={organizer.toggleFavorite}
                      >
                        <Icon glyph={Heart} size="sm" />
                        {organizer.favorite ? 'Favorited' : 'Add to favorites'}
                      </Button>
                      <Viewer.Organizer.Facts>
                        {facts.map(([term, value]) => (
                          <Fragment key={term}>
                            <dt>{term}</dt>
                            <dd>{value}</dd>
                          </Fragment>
                        ))}
                      </Viewer.Organizer.Facts>
                      {source?.webpage_url && (
                        <Text as="label" variant="label">
                          Source link
                          <Input
                            readOnly
                            value={source.webpage_url}
                            onFocus={(event) => event.target.select()}
                          />
                        </Text>
                      )}
                    </Viewer.Organizer.File>
                  )}
                </Viewer.Organizer.Root>
              </Viewer.Inspector>
            </Viewer.Content>
          </Viewer.Window>
        </Viewer.Positioner>
      </Portal>
    </Viewer.Root>
  );
}
