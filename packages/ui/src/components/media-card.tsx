import { ark } from '@ark-ui/react/factory';
import { createSlotRecipeContext } from '../../styled-system/jsx';
import { mediaCard } from '../../styled-system/recipes';

/**
 * The card family shell. The app composes domain content inside:
 *
 *   <MediaCard.Root kind="video" data-selected={selected || undefined}>
 *     <MediaCard.Frame> <MediaCard.Media as button>…</MediaCard.Media> <MediaCard.Badge/> </MediaCard.Frame>
 *     <MediaCard.Body> <MediaCard.Title/> <MediaCard.Subtitle/> <MediaCard.Footer/> </MediaCard.Body>
 *   </MediaCard.Root>
 *
 * Root is an <article>; give it aria-label. Media is the one clickable
 * surface and should be a <button> (use asChild) with an accessible name.
 */
const { withProvider, withContext } = createSlotRecipeContext(mediaCard);

export const Root = withProvider(ark.article, 'root');
export const Frame = withContext(ark.div, 'frame');
export const Media = withContext(ark.button, 'media');
export const Backdrop = withContext(ark.span, 'backdrop');
export const Action = withContext(ark.button, 'action');
export const Fallback = withContext(ark.div, 'fallback');
export const Badge = withContext(ark.span, 'badge');
export const Favorite = withContext(ark.span, 'favorite');
export const Progress = withContext(ark.div, 'progress');
export const ProgressValue = withContext(ark.div, 'progressValue');
export const Select = withContext(ark.div, 'select');
export const Body = withContext(ark.div, 'body');
export const Title = withContext(ark.h2, 'title');
export const Subtitle = withContext(ark.div, 'subtitle');
export const Secondary = withContext(ark.div, 'secondary');
export const Footer = withContext(ark.div, 'footer');
export const Symbol = withContext(ark.span, 'symbol');
export const Arrow = withContext(ark.span, 'arrow');
export const Link = withContext(ark.a, 'link');
