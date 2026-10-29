/* eslint-disable no-restricted-imports -- the one sanctioned bridge to the
   existing app: its stylesheets as text, for the side-by-side reference story
   while screens are ported. Deleted together with frontend/. */
// The existing app's stylesheets, in the order its entry point loads them.
// Imported as text so they never touch the catalogue's own document; the
// reference story places them in an isolated frame.
import tokens from '@clipkit/design-tokens/tokens.css?raw';
import style from '../../../../frontend/src/style.css?raw';
import manager from '../../../../frontend/src/manager.css?raw';
import designSystem from '../../../../frontend/src/design-system.css?raw';
import workspace from '../../../../frontend/src/workspace.css?raw';
import albums from '../../../../frontend/src/albums.css?raw';
import libraryBrowsing from '../../../../frontend/src/library-browsing.css?raw';
import afterHours from '../../../../frontend/src/after-hours.css?raw';
import uiSystem from '../../../../frontend/src/ui-system.css?raw';
import mediaViewers from '../../../../frontend/src/media-viewers.css?raw';
import libraryCards from '../../../../frontend/src/library-cards.css?raw';
import browsingControls from '../../../../frontend/src/browsing-controls.css?raw';
import brandTheme from '../../../../frontend/src/brand-theme.css?raw';
import typography from '../../../../frontend/src/typography.css?raw';
import iconSystem from '../../../../frontend/src/icon-system.css?raw';
import surfaceSystem from '../../../../frontend/src/surface-system.css?raw';
import browseLayout from '../../../../frontend/src/browse-layout.css?raw';
import interactionSystem from '../../../../frontend/src/interaction-system.css?raw';
// The player loads its organizer sheet from its own module, after the rest.
import watchOrganizer from '../../../../frontend/src/watch-organizer.css?raw';

const sheets = [
  tokens,
  style,
  manager,
  designSystem,
  workspace,
  albums,
  libraryBrowsing,
  afterHours,
  uiSystem,
  mediaViewers,
  libraryCards,
  browsingControls,
  brandTheme,
  typography,
  iconSystem,
  surfaceSystem,
  browseLayout,
  interactionSystem,
  watchOrganizer,
];

// style.css starts with @tailwind directives the frame cannot process; this is
// the part of Tailwind's preflight the controls depend on.
const frame = `
  *, ::before, ::after { box-sizing: border-box; border: 0 solid; }
  button, input, select, textarea { font: inherit; color: inherit; margin: 0; padding: 0; }
  button, [role="button"] { background-color: transparent; background-image: none; cursor: pointer; }
  svg { display: block; }
  html, body { margin: 0; background: transparent; }
  .finder-shell { padding: 2px; background: transparent; }
  .finder-shell .row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .finder-shell .row + .row { margin-top: 12px; }
`;

/** A standalone document that renders `markup` under the legacy theme. */
export function legacyDocument(markup: string, extraCss = ''): string {
  // Relative font URLs cannot resolve inside the frame; the legacy button
  // uses the system font, so dropping the declarations loses nothing here.
  const css = sheets.join('\n').replace(/@font-face\s*{[^}]*}/g, '');
  // The app mounts under `.manager.finder-shell`; both classes scope rules.
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}${frame}${extraCss}</style></head><body><div class="manager finder-shell">${markup}</div></body></html>`;
}
