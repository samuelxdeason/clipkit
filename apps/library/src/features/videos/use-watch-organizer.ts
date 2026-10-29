import { useEffect, useRef, useState } from 'react';
import type { Collection, LibraryClient, Person, VideoKey } from '../../services/library-client';
import { people as demoPeople, tags as demoTags } from './fixtures';
import type { Video } from './model';

export type WatchSection = 'people' | 'tags' | 'collections' | 'file';
export const sectionNames: Record<WatchSection, string> = {
  people: 'People',
  tags: 'Tags',
  collections: 'Collections',
  file: 'File',
};

const demoCollections: Collection[] = ['Weekend favorites', 'Watch later', 'Quiet moments'].map(
  (name, index) => ({
    id: index + 1,
    name,
    parentId: 0,
    hidden: false,
    locked: false,
    inheritedHidden: false,
    inheritedLocked: false,
  }),
);

function lower(value: string) {
  return value.toLocaleLowerCase();
}

/**
 * The organize inspector's state for one video, mirroring the existing
 * player: people, tags and collection memberships toggle one at a time, each
 * change is saved as it happens and can be undone once, and the file section
 * edits the title and favourite. Without a client (the synthetic demo) the
 * same state lives in memory for the session.
 */
export function useWatchOrganizer({
  video,
  client,
  onChanged,
}: {
  video: Video;
  client: LibraryClient | null;
  onChanged?: () => void;
}) {
  const key: VideoKey | null = video.source
    ? { site: video.source.site, id: video.source.id }
    : null;
  const demo = !client || !key;
  const [people, setPeople] = useState<Person[]>(() =>
    demo ? demoPeople.map((name) => ({ name })) : [],
  );
  const [tags, setTags] = useState<string[]>(() => (demo ? demoTags : []));
  const [collections, setCollections] = useState<Collection[]>(() => (demo ? demoCollections : []));
  const [models, setModels] = useState<string[]>(
    () => video.source?.models || video.people || (video.person ? [video.person] : []),
  );
  const [labels, setLabels] = useState<string[]>(video.tags);
  const [memberships, setMemberships] = useState<number[]>(() =>
    demo && video.collection
      ? demoCollections.filter((item) => item.name === video.collection).map((item) => item.id)
      : [],
  );
  // People attributed through a source account cannot be unlinked here.
  const [automatic] = useState(() =>
    (video.source?.people || []).filter((name) => !(video.source?.models || []).includes(name)),
  );
  const [favorite, setFavorite] = useState(video.favorite);
  const [title, setTitle] = useState(video.title);
  const [savedTitle, setSavedTitle] = useState(video.title);
  const [loading, setLoading] = useState(!demo);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [undo, setUndo] = useState<null | (() => Promise<void>)>(null);
  const guard = useRef(false);
  const site = key?.site;
  const id = key?.id;

  useEffect(() => {
    if (!client || !site || id === undefined) return;
    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);
    setLoadError('');
    Promise.all([
      client.listPeople(signal),
      client.allLabels(signal),
      client.listCollections(signal),
      client.collectionsForVideo({ site, id }, signal),
    ])
      .then(([loadedPeople, loadedTags, loadedCollections, loadedMemberships]) => {
        setPeople(loadedPeople || []);
        setTags(loadedTags || []);
        setCollections(loadedCollections || []);
        setMemberships(loadedMemberships || []);
      })
      .catch((failure) => {
        if (failure instanceof Error && failure.name === 'AbortError') return;
        setLoadError('Couldn’t load your library. Your video can keep playing.');
      })
      .finally(() => {
        if (!signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [client, site, id, attempt]);

  async function perform(
    action: () => Promise<void>,
    message: string,
    reverse?: () => Promise<void>,
  ) {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
      setNotice(message);
      setUndo(reverse ? () => reverse : null);
      onChanged?.();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Couldn’t save. Please try again.');
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }

  async function savePeople(next: string[]) {
    if (client && key) await client.people(key, next);
    setModels(next);
  }
  async function saveTags(next: string[]) {
    if (client && key) await client.labels(key, next);
    setLabels(next);
  }
  async function saveCollection(collectionId: number, add: boolean) {
    if (client && key) {
      if (add) await client.collect(collectionId, [key]);
      else await client.uncollect(collectionId, key);
    }
    setMemberships((current) =>
      add ? [...new Set([...current, collectionId])] : current.filter((n) => n !== collectionId),
    );
  }

  function togglePerson(name: string) {
    const before = models;
    const linked = before.includes(name);
    void perform(
      () => savePeople(linked ? before.filter((p) => p !== name) : [...before, name]),
      linked ? 'Person removed.' : 'Person linked to this video.',
      () => savePeople(before),
    );
  }
  function toggleTag(name: string) {
    const before = labels;
    const linked = before.includes(name);
    void perform(
      () => saveTags(linked ? before.filter((t) => t !== name) : [...before, name]),
      linked ? 'Tag removed.' : 'Tag added.',
      () => saveTags(before),
    );
  }
  function toggleCollection(collectionId: number) {
    const add = !memberships.includes(collectionId);
    void perform(
      () => saveCollection(collectionId, add),
      add ? 'Added to collection.' : 'Removed from collection.',
      () => saveCollection(collectionId, !add),
    );
  }

  function matches(section: WatchSection, query: string) {
    const term = query.trim();
    const needle = lower(term);
    const allPeople = [...new Set([...models, ...automatic, ...people.map((p) => p.name)])].map(
      (name) => ({ name, person: people.find((p) => p.name === name) }),
    );
    const allTags = [...new Set([...labels, ...tags])];
    const open = collections.filter((c) => !c.locked && !c.inheritedLocked);
    const isLinked = (name: string) => models.includes(name) || automatic.includes(name);
    const peopleMatches = allPeople
      .filter((p) => lower(`${p.name} ${p.person?.nickname || ''}`).includes(needle))
      .sort(
        (a, b) =>
          Number(isLinked(b.name)) - Number(isLinked(a.name)) || a.name.localeCompare(b.name),
      );
    const tagMatches = allTags
      .filter((t) => lower(t).includes(needle))
      .sort(
        (a, b) => Number(labels.includes(b)) - Number(labels.includes(a)) || a.localeCompare(b),
      );
    const collectionMatches = open
      .filter((c) => lower(c.name).includes(needle))
      .sort(
        (a, b) =>
          Number(memberships.includes(b.id)) - Number(memberships.includes(a.id)) ||
          a.name.localeCompare(b.name),
      );
    const canCreate =
      !!term &&
      (section === 'people'
        ? !allPeople.some((p) => [p.name, p.person?.nickname].some((n) => n && lower(n) === needle))
        : section === 'tags'
          ? !allTags.some((t) => lower(t) === needle)
          : !collections.some((c) => lower(c.name) === needle));
    return { term, peopleMatches, tagMatches, collectionMatches, canCreate };
  }

  function create(section: WatchSection, term: string) {
    const before = section === 'people' ? models : labels;
    let created = 0;
    void perform(
      async () => {
        if (section === 'people') {
          if (client) await client.createPerson(term);
          setPeople((current) => [...current, { name: term }]);
          await savePeople([...new Set([...models, term])]);
        } else if (section === 'tags') {
          await saveTags([...labels, term]);
          setTags((current) => [...new Set([...current, term])]);
        } else {
          created = client
            ? (await client.createCollection(term)).id
            : Math.max(0, ...collections.map((c) => c.id)) + 1;
          setCollections((current) => [
            ...current,
            {
              id: created,
              name: term,
              parentId: 0,
              hidden: false,
              locked: false,
              inheritedHidden: false,
              inheritedLocked: false,
            },
          ]);
          await saveCollection(created, true);
        }
      },
      section === 'people'
        ? 'Person created and linked.'
        : section === 'tags'
          ? 'Tag created and added.'
          : 'Collection created and video added.',
      () =>
        section === 'people'
          ? savePeople(before)
          : section === 'tags'
            ? saveTags(before)
            : saveCollection(created, false),
    );
  }

  function saveTitle() {
    const next = title.trim();
    if (!next) return;
    void perform(async () => {
      if (client && key) await client.setTitle(key, next);
      setSavedTitle(next);
    }, 'Title updated.');
  }
  function toggleFavorite() {
    void perform(
      async () => {
        if (client && key) await client.favorite(key, !favorite);
        setFavorite(!favorite);
      },
      favorite ? 'Removed from favorites.' : 'Added to favorites.',
    );
  }
  function runUndo() {
    if (undo) void perform(undo, 'Change undone.');
  }

  return {
    demo,
    people,
    collections,
    models,
    labels,
    memberships,
    automatic,
    favorite,
    title,
    setTitle,
    savedTitle,
    loading,
    loadError,
    retry: () => setAttempt((value) => value + 1),
    busy,
    error,
    notice,
    canUndo: !!undo,
    runUndo,
    disabled: busy || loading || !!loadError,
    matches,
    togglePerson,
    toggleTag,
    toggleCollection,
    create,
    saveTitle,
    toggleFavorite,
  };
}
