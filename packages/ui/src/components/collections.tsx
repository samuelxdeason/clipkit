import { ark } from '@ark-ui/react/factory';
import type { ComponentProps } from 'react';
import { createSlotRecipeContext, styled } from '../../styled-system/jsx';
import {
  collectionHero,
  coverMosaic,
  folderCard,
  folderTree,
  type CoverMosaicVariantProps,
} from '../../styled-system/recipes';
import type { StyledComponent } from '../../styled-system/types';

/**
 * Up to three cover images in one tile. Pass `count` as the number of
 * images rendered; the first spans both rows when there are three.
 */
export type CoverMosaicProps = ComponentProps<typeof CoverMosaic>;
export const CoverMosaic = styled('div', coverMosaic) as StyledComponent<
  'div',
  CoverMosaicVariantProps
>;

/**
 * The hero at the top of a collection: Cover (wrap it in Identity for the
 * tone), then Copy holding Eyebrow, a PageHeader, Caption and the facts.
 */
const hero = createSlotRecipeContext(collectionHero);
export const Hero = {
  Root: hero.withProvider(ark.header, 'root'),
  Cover: hero.withContext(ark.div, 'cover'),
  Copy: hero.withContext(ark.div, 'copy'),
  Eyebrow: hero.withContext(ark.p, 'eyebrow'),
  Caption: hero.withContext(ark.p, 'caption'),
};

/**
 * A subfolder row: Open is the link or button that opens it, with Icon,
 * Copy (Name, Detail); Action is the new-subfolder control at the end.
 */
const folder = createSlotRecipeContext(folderCard);
export const FolderCard = {
  Root: folder.withProvider(ark.article, 'root'),
  Open: folder.withContext(ark.a, 'open'),
  Icon: folder.withContext(ark.span, 'icon'),
  Copy: folder.withContext(ark.span, 'copy'),
  Name: folder.withContext(ark.strong, 'name'),
  Detail: folder.withContext(ark.small, 'detail'),
  Action: folder.withContext(ark.button, 'action'),
};

/**
 * The sidebar's folder outline. Heading holds the collapse toggle, the
 * root link and the new-collection control; Tools the find box; Scroll the
 * Rows. A Row is Expand (button with aria-expanded) then Open (link or
 * button); mark the current one with data-active. Path is the ancestry line
 * under a search match; Empty the message when nothing matches.
 */
const tree = createSlotRecipeContext(folderTree);
export const FolderTree = {
  Root: tree.withProvider(ark.nav, 'root'),
  Heading: tree.withContext(ark.div, 'heading'),
  Tools: tree.withContext(ark.div, 'tools'),
  Scroll: tree.withContext(ark.div, 'scroll'),
  Row: tree.withContext(ark.div, 'row'),
  Expand: tree.withContext(ark.button, 'expand'),
  Open: tree.withContext(ark.a, 'open'),
  Path: tree.withContext(ark.small, 'path'),
  Empty: tree.withContext(ark.p, 'empty'),
};
