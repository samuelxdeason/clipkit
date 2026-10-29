import { ark } from '@ark-ui/react/factory';
import { createSlotRecipeContext } from '../../styled-system/jsx';
import { mediaItem, sourceCard } from '../../styled-system/recipes';

/**
 * A followed source in the directory: Art (a picture or initials) beside
 * Copy (Name, Meta, Stats of Stat, Checked), with Actions across the
 * bottom. Name is the button that opens the source.
 */
const source = createSlotRecipeContext(sourceCard);
export const SourceCard = {
  Root: source.withProvider(ark.article, 'root'),
  Art: source.withContext(ark.span, 'art'),
  Copy: source.withContext(ark.div, 'copy'),
  Name: source.withContext(ark.button, 'name'),
  Meta: source.withContext(ark.p, 'meta'),
  Stats: source.withContext(ark.div, 'stats'),
  Stat: source.withContext(ark.span, 'stat'),
  Checked: source.withContext(ark.small, 'checked'),
  Actions: source.withContext(ark.div, 'actions'),
};

/**
 * One remote item: Preview (a button when it plays) with Play and the
 * corner Mark, then Copy (Title, Line, Original) and the Actions row with
 * its status. Set data-selected on Root for a selected item.
 */
const remote = createSlotRecipeContext(mediaItem);
export const RemoteItem = {
  Root: remote.withProvider(ark.article, 'root'),
  Mark: remote.withContext(ark.span, 'mark'),
  Preview: remote.withContext(ark.div, 'preview'),
  Play: remote.withContext(ark.span, 'play'),
  Copy: remote.withContext(ark.div, 'copy'),
  Title: remote.withContext(ark.button, 'title'),
  Line: remote.withContext(ark.p, 'line'),
  Original: remote.withContext(ark.p, 'original'),
  Actions: remote.withContext(ark.div, 'actions'),
};
