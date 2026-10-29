import { ark } from '@ark-ui/react/factory';
import { createSlotRecipeContext } from '../../styled-system/jsx';
import { settingsCard, settingsNav, storageSummary } from '../../styled-system/recipes';

/**
 * The Settings section navigation: Items are buttons with aria-pressed,
 * each holding an icon and Copy (Title, Detail).
 */
const nav = createSlotRecipeContext(settingsNav);
export const SettingsNav = {
  Root: nav.withProvider(ark.nav, 'root'),
  Item: nav.withContext(ark.button, 'item'),
  Copy: nav.withContext(ark.span, 'copy'),
  Title: nav.withContext(ark.strong, 'title'),
  Detail: nav.withContext(ark.small, 'detail'),
};

/**
 * A card of settings: Rows of Icon, Copy (Title, Detail) and Control;
 * Path is the code line under a row, Storage the summary below it.
 */
const card = createSlotRecipeContext(settingsCard);
export const SettingsCard = {
  Root: card.withProvider(ark.div, 'root'),
  Row: card.withContext(ark.div, 'row'),
  Icon: card.withContext(ark.span, 'icon'),
  Copy: card.withContext(ark.div, 'copy'),
  Title: card.withContext(ark.strong, 'title'),
  Detail: card.withContext(ark.p, 'detail'),
  Control: card.withContext(ark.div, 'control'),
  Path: card.withContext(ark.code, 'path'),
};

/**
 * The storage summary: Root wraps Tiles (each a Tile of Value over Label) and a Breakdown with
 * its Heading, the Track of Segments and the Legend of Items with a Dot.
 */
const storage = createSlotRecipeContext(storageSummary);
export const Storage = {
  Root: storage.withProvider(ark.div, 'root'),
  Tiles: storage.withContext(ark.div, 'tiles'),
  Tile: storage.withContext(ark.div, 'tile'),
  Value: storage.withContext(ark.strong, 'value'),
  Label: storage.withContext(ark.span, 'label'),
  Breakdown: storage.withContext(ark.div, 'breakdown'),
  Heading: storage.withContext(ark.h3, 'heading'),
  Track: storage.withContext(ark.div, 'track'),
  Segment: storage.withContext(ark.span, 'segment'),
  Legend: storage.withContext(ark.div, 'legend'),
  Item: storage.withContext(ark.span, 'item'),
  Dot: storage.withContext(ark.i, 'dot'),
};
