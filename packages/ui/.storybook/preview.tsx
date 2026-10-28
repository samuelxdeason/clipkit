import type { Preview } from '@storybook/react-vite';
import '../styled-system/styles.css';
import '../src/theme/fonts.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    a11y: { test: 'error' },
    backgrounds: { disable: true },
  },
};
export default preview;
