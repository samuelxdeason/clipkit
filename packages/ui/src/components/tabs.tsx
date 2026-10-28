'use client';
import { Tabs as ArkTabs } from '@ark-ui/react/tabs';
import type { ComponentProps } from 'react';
import { createSlotRecipeContext } from '../../styled-system/jsx';
import { tabs } from '../../styled-system/recipes';

/**
 * Ark tabs with the existing app's two treatments. Manual activation is the
 * default so arrow keys move focus without switching heavy content; pass
 * `activationMode="automatic"` for light panels.
 */
const { withProvider, withContext } = createSlotRecipeContext(tabs);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(ArkTabs.Root, 'root', {
  defaultProps: { activationMode: 'manual' },
});
export const RootProvider = withProvider(ArkTabs.RootProvider, 'root');
export const List = withContext(ArkTabs.List, 'list');
export const Trigger = withContext(ArkTabs.Trigger, 'trigger');
export const Indicator = withContext(ArkTabs.Indicator, 'indicator');
export const Content = withContext(ArkTabs.Content, 'content');

export { TabsContext as Context } from '@ark-ui/react/tabs';
