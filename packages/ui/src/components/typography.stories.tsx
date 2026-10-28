import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from './heading';
import { Text } from './text';
import { Icon } from './icon';
import { Heart } from 'lucide-react';

const meta = {
  title: 'Foundations/Typography',
  component: Heading,
  parameters: {
    docs: {
      description: {
        component:
          'Heading size controls appearance; as controls document hierarchy. Use one h1 per page. Text provides default, muted and danger roles. Icons are decorative and named by their surrounding control. Typography uses bundled Nunito with a system fallback.',
      },
    },
  },
} satisfies Meta<typeof Heading>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Hierarchy: Story = {
  render: () => (
    <>
      <Heading as="h1" size="lg">
        Your video library
      </Heading>
      <Text tone="muted">Find a favorite. Pick up where you left off.</Text>
      <Heading>Recently added</Heading>
      <Text>Supporting copy remains easy to read.</Text>
      <Text size="sm" tone="muted">
        12 videos · updated today
      </Text>
    </>
  ),
};
export const DecorativeIcon: Story = {
  render: () => (
    <Text>
      <Icon glyph={Heart} /> Favorites
    </Text>
  ),
};
