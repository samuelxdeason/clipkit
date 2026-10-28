import { Heading, Text } from '@clipkit/ui';
import { css } from '@clipkit/ui/css';

/** Shared library title/subtitle rhythm, matching the established desktop header. */
export function PageIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className={css({ minW: '0', display: 'grid', gap: '1' })}>
      <Heading as="h1" size="lg">
        {title}
      </Heading>
      <Text size="sm" tone="muted">
        {description}
      </Text>
    </div>
  );
}
