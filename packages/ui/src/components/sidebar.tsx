import { ark } from '@ark-ui/react/factory';
import { createSlotRecipeContext } from '../../styled-system/jsx';
import { sidebar } from '../../styled-system/recipes';

/**
 * The app sidebar shell. The app composes its routes inside:
 *
 *   <Sidebar.Root aria-label="Library navigation">
 *     <Sidebar.Brand> <Sidebar.Mark/> <div><Sidebar.Wordmark/><Sidebar.Tagline/></div> </Sidebar.Brand>
 *     <Sidebar.Nav> <Sidebar.Group> <Sidebar.Label/> <Sidebar.Item asChild><a/></Sidebar.Item> … </Sidebar.Group> </Sidebar.Nav>
 *     <Sidebar.Footer>…</Sidebar.Footer>
 *   </Sidebar.Root>
 *
 * Item is a button; render a link with asChild and mark the current route
 * with aria-current="page". Count sits at the trailing edge of an Item.
 */
const { withProvider, withContext } = createSlotRecipeContext(sidebar);

export const Root = withProvider(ark.aside, 'root');
export const Brand = withContext(ark.a, 'brand');
export const Mark = withContext(ark.span, 'mark');
export const Wordmark = withContext(ark.p, 'wordmark');
export const Tagline = withContext(ark.p, 'tagline');
export const Nav = withContext(ark.nav, 'nav');
export const Group = withContext(ark.div, 'group');
export const Label = withContext(ark.p, 'label');
export const Item = withContext(ark.button, 'item');
export const Count = withContext(ark.span, 'count');
export const Footer = withContext(ark.div, 'footer');
export const Summary = withContext(ark.summary, 'summary');
