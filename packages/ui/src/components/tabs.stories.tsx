import type { Meta, StoryObj } from '@storybook/react-vite';
import { Film, Image, Users } from 'lucide-react';
import { useState } from 'react';
import * as Tabs from './tabs';
import { Icon } from './icon';
import { Text } from './text';

const meta = {
  title: 'Controls/Tabs',
  parameters: {
    docs: {
      description: {
        component:
          "The existing app's tab row: text tabs on a hairline, the selected one underlined in cherry. Activation is manual: arrows move focus, Enter or Space switches. Use Tabs for content panels; a Button with aria-pressed is a toggle, not a tab.",
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { value: 'videos', label: 'Videos', glyph: Film },
  { value: 'photos', label: 'Photos', glyph: Image },
  { value: 'accounts', label: 'Accounts', glyph: Users },
];

function Example({ icons = false }: { icons?: boolean }) {
  const [value, setValue] = useState('videos');
  return (
    <Tabs.Root value={value} onValueChange={(details) => setValue(details.value)}>
      <Tabs.List aria-label="Person content">
        {items.map((item) => (
          <Tabs.Trigger key={item.value} value={item.value}>
            {icons && <Icon glyph={item.glyph} size="sm" />}
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {items.map((item) => (
        <Tabs.Content key={item.value} value={item.value}>
          <Text tone="muted">{item.label} panel</Text>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

export const Default: Story = { render: () => <Example /> };
export const WithIcons: Story = { render: () => <Example icons /> };
