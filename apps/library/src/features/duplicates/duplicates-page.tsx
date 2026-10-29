import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Film, Folder, Play } from 'lucide-react';
import {
  Button,
  ChoiceSelect,
  Comparison,
  DecisionBar,
  EmptyState,
  Heading,
  Icon,
  IconButton,
  Notice,
  PageHeader,
  Popover,
  Portal,
  ReviewNav,
  SectionHeading,
  StatusBadge,
  Text,
} from '@clipkit/ui';
import { css } from '@clipkit/ui/css';
import { LibraryShell } from '../../app/library-shell';
import { useLibraryResource } from '../../services/use-library-resource';
import type { CatalogueVideo, LibraryClient } from '../../services/library-client';
import { comparisonRows, formatBytes, videoKey, type DuplicateGroup } from './model';

export interface PlayerControls {
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onChanged: () => void;
}

async function loadDuplicates(api: LibraryClient, signal: AbortSignal) {
  const [groups, recycleFolder] = await Promise.all([
    api.duplicateGroups(signal),
    api.duplicateRecycleFolder(signal),
  ]);
  return { groups: groups || [], recycleFolder };
}

/**
 * The duplicate review queue, as in the existing app: one group at a time,
 * its copies side by side with their facts, a keep-or-recycle choice for
 * each, and a decision that moves the discarded copies to the vault's
 * recycle folder. Groups resolved in this session leave the queue at once.
 */
export function DuplicatesPage({
  renderPlayer,
}: {
  renderPlayer: (
    video: CatalogueVideo,
    client: LibraryClient,
    controls: PlayerControls,
  ) => ReactNode;
}) {
  const library = useLibraryResource(loadDuplicates);
  const resolved = useRef(new Set<number>());
  const groups = (library.data?.groups || []).filter((group) => !resolved.current.has(group.id));
  const [activeId, setActiveId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string[]>>({});
  const [notice, setNotice] = useState('');
  const [reviewed, setReviewed] = useState(0);
  const [playing, setPlaying] = useState<CatalogueVideo | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const index = Math.max(
    0,
    groups.findIndex((group) => group.id === activeId),
  );
  const group = groups[index];
  useEffect(() => {
    if (group && activeId !== group.id) setActiveId(group.id);
    if (moveFocus.current) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: 'nearest' });
      moveFocus.current = false;
    }
  }, [group?.id, activeId, group]);
  function navigate(id: number) {
    moveFocus.current = true;
    setActiveId(id);
  }
  async function save(keep: CatalogueVideo[]) {
    if (!group) return;
    const current = group;
    const removed = current.videos.length - keep.length;
    const next = groups[index + 1] || groups[index - 1];
    const done = await library.mutate(
      (api) => api.resolveDuplicateGroup(current.id, keep),
      removed
        ? `Kept ${keep.length}. Moved ${removed} video${removed === 1 ? '' : 's'} to Recycle bin.`
        : `Kept all ${keep.length} videos. Group cleared.`,
    );
    if (!done) return;
    resolved.current.add(current.id);
    setReviewed((value) => value + 1);
    setNotice('');
    setDrafts((value) => {
      const rest = { ...value };
      delete rest[current.id];
      return rest;
    });
    moveFocus.current = true;
    setActiveId(next?.id ?? null);
  }
  const media = (path: string) => library.client?.media(path) || '';

  return (
    <LibraryShell page="duplicates">
      <PageHeader
        title="Potential duplicates"
        description="Compare the copies you marked and choose what stays."
      />
      <div
        className={css({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '4',
          mb: '5',
        })}
      >
        <SectionHeading
          surface
          eyebrow="Review your library"
          title="Compare the copies. Choose what stays."
          description="Check the details, preview each version, then save your decision."
          className={css({ flex: '1', minW: '[min(100%, 320px)]' })}
        />
        <Popover.Root positioning={{ placement: 'bottom-end', strategy: 'fixed', gutter: 8 }}>
          <Popover.Trigger asChild>
            <Button>
              <Icon glyph={Folder} size="sm" />
              About recycling
            </Button>
          </Popover.Trigger>
          <Portal>
            <Popover.Positioner>
              <Popover.Content aria-label="About recycling">
                <Popover.Title>Your files stay on this drive</Popover.Title>
                <Popover.Description>
                  Recycled videos leave your library and move here. Delete them manually later to
                  free space.
                </Popover.Description>
                <Text as="code" size="sm" className={css({ overflowWrap: 'anywhere' })}>
                  {library.data?.recycleFolder || 'Folder unavailable'}
                </Text>
              </Popover.Content>
            </Popover.Positioner>
          </Portal>
        </Popover.Root>
      </div>
      {(notice || library.notice) && (
        <Notice
          className={css({ mb: '4' })}
          actions={
            <Button variant="quiet" size="compact" onClick={() => setNotice('')}>
              Dismiss
            </Button>
          }
        >
          {notice || library.notice}
        </Notice>
      )}
      {library.error && (
        <Notice
          tone="danger"
          className={css({ mb: '4' })}
          actions={
            <Button
              variant="quiet"
              size="compact"
              disabled={library.busy}
              onClick={() => void library.refresh()}
            >
              Refresh queue
            </Button>
          }
        >
          {library.error}
        </Notice>
      )}
      {library.loading && !library.data ? (
        <EmptyState
          state="loading"
          title="Loading potential duplicates…"
          description="Preparing your review queue."
        />
      ) : group ? (
        <>
          <ReviewNav.Root aria-label="Review groups" className={css({ mb: '5' })}>
            <ReviewNav.Progress>
              <Text as="span" variant="eyebrow" tone="muted">
                Review queue
              </Text>
              <ReviewNav.Count>
                {groups.length} group{groups.length === 1 ? '' : 's'} left
              </ReviewNav.Count>
              <ReviewNav.Caption>
                {groups.reduce((total, entry) => total + entry.videos.length, 0)} videos to compare
                · {reviewed} reviewed this session
              </ReviewNav.Caption>
            </ReviewNav.Progress>
            <ReviewNav.Pager>
              <IconButton
                aria-label="Previous group"
                disabled={library.busy || index === 0}
                onClick={() => navigate(groups[index - 1].id)}
              >
                <Icon glyph={ChevronLeft} />
              </IconButton>
              <ChoiceSelect
                hideLabel
                label="Jump to group"
                value={String(group.id)}
                onChange={(value) => navigate(Number(value))}
                options={groups.map((entry, i) => ({
                  value: String(entry.id),
                  label: `Group ${i + 1} of ${groups.length} · ${entry.videos.length} videos`,
                }))}
              />
              <IconButton
                aria-label="Next group"
                disabled={library.busy || index === groups.length - 1}
                onClick={() => navigate(groups[index + 1].id)}
              >
                <Icon glyph={ChevronRight} />
              </IconButton>
            </ReviewNav.Pager>
          </ReviewNav.Root>
          <ReviewGroup
            key={group.id}
            heading={heading}
            group={group}
            media={media}
            busy={library.busy}
            keep={drafts[group.id] ?? group.videos.map(videoKey)}
            onKeep={(keys) => setDrafts((value) => ({ ...value, [group.id]: keys }))}
            onPlay={setPlaying}
            onSave={save}
            onSkip={() => navigate(groups[(index + 1) % groups.length].id)}
            canSkip={groups.length > 1}
          />
        </>
      ) : (
        !library.error && (
          <EmptyState
            symbol={<Film />}
            title={reviewed ? 'All reviewed' : 'No potential duplicates'}
            description={
              reviewed
                ? 'Your decisions are saved. Recycled files stay in the Recycle bin folder until you delete them.'
                : 'Select two or more videos in your library, then choose “Mark as potential duplicates”.'
            }
          />
        )
      )}
      {playing &&
        library.client &&
        renderPlayer(playing, library.client, {
          onClose: () => setPlaying(null),
          onChanged: () => void library.refresh(),
        })}
    </LibraryShell>
  );
}

function ReviewGroup({
  heading,
  group,
  media,
  busy,
  keep,
  onKeep,
  onPlay,
  onSave,
  onSkip,
  canSkip,
}: {
  heading: React.RefObject<HTMLHeadingElement>;
  group: DuplicateGroup;
  media: (path: string) => string;
  busy: boolean;
  keep: string[];
  onKeep: (keys: string[]) => void;
  onPlay: (video: CatalogueVideo) => void;
  onSave: (keep: CatalogueVideo[]) => Promise<void>;
  onSkip: () => void;
  canSkip: boolean;
}) {
  const [details, setDetails] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewErrors, setPreviewErrors] = useState<Set<string>>(() => new Set());
  const [failedPosters, setFailedPosters] = useState<Set<string>>(() => new Set());
  const table = useRef<HTMLTableElement>(null);
  const kept = (video: CatalogueVideo) => keep.includes(videoKey(video));
  const selected = group.videos.filter(kept);
  const discarded = group.videos.filter((video) => !kept(video));
  const recycledBytes = discarded.reduce((sum, video) => sum + (video.filesize || 0), 0);
  const rows = comparisonRows(group.videos);
  function toggle(video: CatalogueVideo) {
    const key = videoKey(video);
    onKeep(keep.includes(key) ? keep.filter((item) => item !== key) : [...keep, key]);
  }
  function save(videos: CatalogueVideo[]) {
    table.current?.querySelectorAll('video').forEach((element) => {
      element.pause();
      element.removeAttribute('src');
      element.load();
    });
    setPreview(false);
    void onSave(videos);
  }
  const added = (video: CatalogueVideo) => {
    const stamp = Date.parse((video.added || '').replace(' ', 'T'));
    return Number.isNaN(stamp) ? 'Unknown' : new Date(stamp).toLocaleDateString();
  };
  return (
    <div className={css({ minW: '0' })}>
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
        <Heading ref={heading} size="sm" tabIndex={-1} className={css({ outline: 'none' })}>
          Compare {group.videos.length} videos
        </Heading>
        <div className={css({ display: 'flex', flexWrap: 'wrap', gap: '2' })}>
          <Button
            aria-pressed={preview}
            disabled={busy}
            onClick={() => setPreview((value) => !value)}
          >
            {preview ? 'Show thumbnails' : 'Preview side by side'}
          </Button>
          <Button aria-pressed={details} onClick={() => setDetails((value) => !value)}>
            {details ? 'Fewer details' : 'More details'}
          </Button>
        </div>
      </div>
      <Comparison.Root>
        <Comparison.Scroll
          tabIndex={0}
          role="region"
          aria-label="Video comparison. Scroll horizontally to see more copies."
        >
          <Comparison.Table
            ref={table}
            style={{ '--copies': group.videos.length } as React.CSSProperties}
          >
            <caption className={css({ srOnly: true })}>
              Compare resolution, duration, file size, and metadata. Highest resolution describes
              pixel count, not verified image quality.
            </caption>
            <thead>
              <tr>
                <Comparison.RowLabel scope="col">
                  <span>Copies</span>
                  <small>Play to check the content.</small>
                </Comparison.RowLabel>
                {group.videos.map((video, i) => {
                  const key = videoKey(video);
                  const keeping = kept(video);
                  const title = video.title || video.filename || 'Untitled video';
                  return (
                    <th scope="col" key={key} data-recycle={keeping ? undefined : ''}>
                      <Comparison.CopyHeading>
                        <span>Copy {i + 1}</span>
                        <StatusBadge tone={keeping ? 'success' : 'warning'}>
                          {keeping ? '✓ Keep' : 'Recycle'}
                        </StatusBadge>
                      </Comparison.CopyHeading>
                      <Comparison.Preview>
                        {preview && previewErrors.has(key) ? (
                          <Text size="sm" tone="muted" role="status" textAlign="center" p="4">
                            Preview unavailable for this file.
                          </Text>
                        ) : preview ? (
                          <video
                            src={media(video.filepath)}
                            poster={video.thumbnail ? media(video.thumbnail) : undefined}
                            controls
                            preload="metadata"
                            playsInline
                            aria-label={`Preview copy ${i + 1}`}
                            onError={() => setPreviewErrors((value) => new Set([...value, key]))}
                            onPlay={(event) => {
                              const current = event.currentTarget;
                              table.current?.querySelectorAll('video').forEach((element) => {
                                if (element !== current) element.pause();
                              });
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            aria-label={`Play copy ${i + 1}: ${title}`}
                            disabled={busy}
                            onClick={() => onPlay(video)}
                          >
                            {video.thumbnail && !failedPosters.has(key) ? (
                              <img
                                src={media(video.thumbnail)}
                                alt=""
                                loading="lazy"
                                onError={() =>
                                  setFailedPosters((value) => new Set([...value, key]))
                                }
                              />
                            ) : (
                              <span
                                className={css({ display: 'grid', placeItems: 'center', gap: '3' })}
                              >
                                <Film aria-hidden="true" />
                                <Text as="span" size="sm" tone="muted">
                                  No preview image
                                </Text>
                              </span>
                            )}
                            <Comparison.Play>
                              <Icon glyph={Play} size="sm" /> Play
                            </Comparison.Play>
                          </button>
                        )}
                      </Comparison.Preview>
                      <Comparison.Title title={title}>{title}</Comparison.Title>
                      <div
                        className={css({
                          display: 'flex',
                          alignItems: 'stretch',
                          flexWrap: 'wrap',
                          gap: '2.5',
                          mt: '3.5',
                        })}
                      >
                        <Comparison.Choice data-choice={keeping ? 'keep' : 'recycle'}>
                          <input
                            type="checkbox"
                            aria-label={`Keep copy ${i + 1}`}
                            checked={keeping}
                            disabled={busy}
                            onChange={() => toggle(video)}
                            className={css({
                              w: '6',
                              h: '6',
                              flexShrink: '0',
                              accentColor: 'accent',
                            })}
                          />
                          <Comparison.ChoiceCopy>
                            <strong>{keeping ? 'Keep this video' : 'Recycle this video'}</strong>
                            <small>
                              {keeping
                                ? 'Stays in your library'
                                : 'Moves to Recycle bin when saved'}
                            </small>
                          </Comparison.ChoiceCopy>
                        </Comparison.Choice>
                        <Button
                          className={css({ alignSelf: 'center' })}
                          disabled={busy || (selected.length === 1 && keeping)}
                          aria-label={`Keep only copy ${i + 1}`}
                          onClick={() => onKeep([key])}
                        >
                          Keep only this
                        </Button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <Comparison.RowLabel scope="row">{row.label}</Comparison.RowLabel>
                  {row.cells.map((cell, i) => (
                    <td
                      key={videoKey(group.videos[i])}
                      data-recycle={kept(group.videos[i]) ? undefined : ''}
                    >
                      <Comparison.Value>{cell.value}</Comparison.Value>
                      {cell.note && (
                        <Comparison.Note data-highlight={cell.highlight ? '' : undefined}>
                          {cell.note}
                        </Comparison.Note>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {details &&
                (
                  [
                    ['Added', (video: CatalogueVideo) => added(video), false],
                    [
                      'People',
                      (video: CatalogueVideo) => video.people?.join(', ') || 'None assigned',
                      false,
                    ],
                    [
                      'Tags',
                      (video: CatalogueVideo) => video.labels?.join(', ') || 'No tags',
                      false,
                    ],
                    ['Filename', (video: CatalogueVideo) => video.filename || 'Unknown', true],
                    ['Location', (video: CatalogueVideo) => video.filepath || 'Unknown', true],
                  ] as const
                ).map(([label, read, path]) => (
                  <tr key={label}>
                    <Comparison.RowLabel scope="row">{label}</Comparison.RowLabel>
                    {group.videos.map((video) => (
                      <td key={videoKey(video)} data-recycle={kept(video) ? undefined : ''}>
                        {path ? <Comparison.Path>{read(video)}</Comparison.Path> : read(video)}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </Comparison.Table>
        </Comparison.Scroll>
        <Comparison.Caption>
          Higher resolution and larger files don’t always mean better quality. Preview the content
          before choosing.{group.videos.length > 2 && ' Scroll sideways to compare every copy.'}
        </Comparison.Caption>
      </Comparison.Root>
      <DecisionBar.Root>
        <DecisionBar.Summary aria-live="polite" aria-atomic="true">
          <DecisionBar.Count>
            {selected.length} to keep <span>·</span> {discarded.length} to recycle
          </DecisionBar.Count>
          <DecisionBar.Note>
            {!selected.length
              ? 'Choose at least one video to keep.'
              : discarded.length
                ? `${
                    recycledBytes
                      ? `${formatBytes(recycledBytes)}${discarded.some((video) => !video.filesize) ? '+' : ''} will move to Recycle bin. `
                      : ''
                  }Files are not permanently deleted.`
                : 'All copies are currently marked to keep.'}
          </DecisionBar.Note>
        </DecisionBar.Summary>
        <DecisionBar.Actions>
          <Button disabled={busy || !canSkip} onClick={onSkip}>
            Skip for now
          </Button>
          <Button disabled={busy} onClick={() => save(group.videos)}>
            Keep all
          </Button>
          <Button
            variant="primary"
            disabled={busy || !selected.length || !discarded.length}
            loading={busy}
            loadingText="Saving…"
            onClick={() => save(selected)}
          >
            {canSkip ? 'Save & next' : 'Save & finish'}
          </Button>
        </DecisionBar.Actions>
      </DecisionBar.Root>
    </div>
  );
}
