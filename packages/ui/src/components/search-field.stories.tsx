import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SearchField } from './search-field';

const meta = {
  title: 'Controls/SearchField',
  component: SearchField,
  parameters: {
    docs: {
      description: {
        component:
          "The existing app's search field at the regular control height: leading glyph, the input, an optional shortcut hint while empty, and a clear control once there is text. Focus shows the cherry border and selection halo on the wrapper. The label is required and read by assistive technology.",
      },
    },
  },
} satisfies Meta<typeof SearchField>;
export default meta;
type Story = StoryObj<typeof meta>;

function Example(props: Partial<React.ComponentProps<typeof SearchField>>) {
  const [value, setValue] = useState(props.value ?? '');
  return (
    <SearchField
      label="Search this view"
      placeholder="Search titles, people, tags, or filenames…"
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

export const Default: Story = {
  args: { label: 'Search this view', value: '', onChange: () => {} },
  render: () => <Example />,
};
export const WithHint: Story = {
  args: { label: 'Search this view', value: '', onChange: () => {} },
  render: () => <Example hint="Ctrl K" />,
};
export const WithValue: Story = {
  args: { label: 'Search this view', value: 'beach', onChange: () => {} },
  render: () => <Example value="beach day" hint="Ctrl K" />,
};
export const Compact: Story = {
  args: { label: 'Search this view', value: '', onChange: () => {} },
  render: () => <Example size="compact" placeholder="Filter options…" />,
};
