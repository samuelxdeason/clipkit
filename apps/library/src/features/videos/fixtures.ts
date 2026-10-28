import type { Video } from './model';

export const people = ['Alex Morgan', 'Casey Ellis', 'Jordan Lane'];
export const tags = ['Travel', 'Quiet moments', 'After hours', 'Favorites'];
const titles = [
  'The last light',
  'A little further away',
  'Blue hour',
  'Somewhere slow',
  'An evening to remember',
  'Under an open sky',
  'Golden silence',
  'A different perspective',
  'Stay a while',
  'Between the mountains',
  'City after rain',
  'The long way home',
];

// Original geometric artwork, not remote media or representations of real people.
function artwork(index: number) {
  const palettes = [
    ['#263c49', '#a9b5ac', '#455563'],
    ['#5b3440', '#d7ad8a', '#302c42'],
    ['#203f3f', '#83b3a8', '#273741'],
    ['#3d3456', '#b2a4cb', '#28283c'],
  ];
  const [sky, light, land] = palettes[index % palettes.length];
  const portrait = index % 4 === 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${portrait ? 540 : 960}" height="${portrait ? 960 : 540}" viewBox="0 0 960 540" preserveAspectRatio="none"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset="1" stop-color="${light}"/></linearGradient><linearGradient id="water" x2="0" y2="1"><stop stop-color="${light}" stop-opacity=".4"/><stop offset="1" stop-color="${sky}"/></linearGradient></defs><rect width="960" height="540" fill="url(#sky)"/><circle cx="${180 + (index % 5) * 140}" cy="150" r="65" fill="${light}" opacity=".7"/><path d="M0 380 180 160 340 340 540 110 800 350 960 230V540H0Z" fill="${land}" opacity=".8"/><path d="M0 420 250 310 510 430 780 280 960 420V540H0Z" fill="${sky}"/><rect y="425" width="960" height="115" fill="url(#water)"/><path d="M180 470h350m-230 24h480m-660 24h480" stroke="${light}" opacity=".18"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const initialVideos: Video[] = Array.from({ length: 38 }, (_, index) => ({
  id: `demo-${index + 1}`,
  title: `${titles[index % titles.length]}${index >= titles.length ? ` · ${Math.floor(index / titles.length) + 1}` : ''}`,
  person: index % 7 === 0 ? '' : people[index % people.length],
  tags: index % 6 === 0 ? [] : [tags[index % tags.length]],
  duration: 240 + index * 43,
  progress: index % 5 === 0 ? 1 : index % 3 === 0 ? 0.36 : 0,
  favorite: index % 4 === 0,
  resolution: index % 3 === 0 ? '4K' : '1080p',
  added: index,
  artwork: index === 33 ? undefined : artwork(index),
}));
