import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Text } from './text';
import { css } from '../../styled-system/css';

const meta = {
  title: 'Patterns/Metadata',
  parameters: {
    docs: {
      description: {
        component:
          'Compact controls are for secondary card metadata, not primary form actions. Keep tag colors semantic and card typography shared. Use the app-owned MediaCardCaption for actual library cards.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {
  render: () => (
    <section
      aria-label="Metadata example"
      className={css({
        w: 'full',
        maxW: '[320px]',
        bg: 'surface',
        borderWidth: '1px',
        borderColor: 'line',
        borderRadius: 'panel',
        px: '3.5',
        py: '3',
        display: 'grid',
        gap: '2',
      })}
    >
      <Text as="h2" textStyle="cardTitle">
        An evening by the water
      </Text>
      <Text textStyle="metadata" tone="muted">
        Alex Morgan, Casey Ellis
      </Text>
      <div className={css({ display: 'flex', gap: '1', alignItems: 'center' })}>
        <Button variant="tag" size="compact">
          Travel
        </Button>
        <Button variant="tag" size="compact">
          Quiet moments
        </Button>
        <Button variant="quiet" size="compact" ml="auto">
          File info
        </Button>
      </div>
    </section>
  ),
};

function SelectionStates() {
  const [checked, setChecked] = useState(false);
  return (
    <div className={css({ display: 'grid', gap: '3' })}>
      <Checkbox label="Select item" checked={checked} onCheckedChange={setChecked} />
      <Checkbox label="Selected item" checked onCheckedChange={() => {}} />
      <Checkbox label="Some selected" checked="indeterminate" onCheckedChange={() => {}} />
      <Checkbox label="Unavailable item" checked disabled onCheckedChange={() => {}} />
    </div>
  );
}
export const Selection: Story = { render: () => <SelectionStates /> };
