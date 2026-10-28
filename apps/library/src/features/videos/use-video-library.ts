import { useMemo, useState } from 'react';
import { initialVideos } from './fixtures';
import { emptyFilters, filterVideos, pageSize, type Filters, type Video } from './model';

export function useVideoLibrary() {
  const [videos, setVideos] = useState(initialVideos);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState('medium');
  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [removed, setRemoved] = useState<Video[]>([]);
  const matches = useMemo(() => filterVideos(videos, filters, sort), [videos, filters, sort]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(matches.length / pageSize)));
  const visible = matches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function updateFilters(next: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
    setSelected([]);
  }
  function updateSort(value: string) {
    setSort(value);
    setPage(1);
    setSelected([]);
  }
  function toggleManage() {
    setManage((value) => !value);
    setSelected([]);
  }
  function toggleSelection(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...new Set([...current, id])] : current.filter((value) => value !== id),
    );
  }
  function selectPage(checked: boolean) {
    setSelected(checked ? visible.map((video) => video.id) : []);
  }
  function changePage(value: number) {
    setPage(value);
    setSelected([]);
  }
  function favorite(id: string) {
    setVideos((current) =>
      current.map((video) => (video.id === id ? { ...video, favorite: !video.favorite } : video)),
    );
  }
  function favoriteSelected() {
    setVideos((current) =>
      current.map((video) => (selected.includes(video.id) ? { ...video, favorite: true } : video)),
    );
    setNotice(`${selected.length} demo videos added to favorites.`);
    setSelected([]);
  }
  function collect(name: string) {
    setVideos((current) =>
      current.map((video) =>
        selected.includes(video.id) ? { ...video, collection: name } : video,
      ),
    );
    setNotice(`${selected.length} demo videos added to “${name}”.`);
    setSelected([]);
  }
  function removeSelected() {
    const items = videos.filter((video) => selected.includes(video.id));
    setRemoved(items);
    setVideos((current) => current.filter((video) => !selected.includes(video.id)));
    setNotice(`${items.length} items removed from this demo. No files were deleted.`);
    setSelected([]);
  }
  function undo() {
    setVideos((current) => [...current, ...removed]);
    setRemoved([]);
    setNotice('Demo items restored.');
  }
  function reset() {
    setVideos(initialVideos);
    setFilters(emptyFilters);
    setPage(1);
    setSelected([]);
    setRemoved([]);
    setNotice('Demo library reset.');
  }
  return {
    videos,
    filters,
    updateFilters,
    sort,
    updateSort,
    page: currentPage,
    changePage,
    size,
    setSize,
    manage,
    toggleManage,
    selected,
    toggleSelection,
    selectPage,
    visible,
    matches,
    notice,
    favorite,
    favoriteSelected,
    collect,
    removeSelected,
    removed,
    undo,
    reset,
  };
}
