import { css, cva } from '@clipkit/ui/css';
import { identityIndex } from './directory-model';

const tones = [
  css({ color: 'identity.plum' }),
  css({ color: 'identity.rose' }),
  css({ color: 'identity.blue' }),
  css({ color: 'identity.amber' }),
];

/** Names, not ordering or current filters, choose decorative identity colors. */
export function identityTone(name: string) {
  return tones[identityIndex(name)];
}

const wash = cva({
  base: { position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '0' },
  variants: {
    placement: {
      card: {
        background: '[radial-gradient(ellipse at 50% 85%, currentColor, transparent 80%)]',
        opacity: '0.24',
      },
      tag: {
        background: '[radial-gradient(ellipse at 0% 0%, currentColor, transparent 85%)]',
        opacity: '0.14',
      },
      hero: {
        background: '[radial-gradient(ellipse at 0% 0%, currentColor, transparent 72%)]',
        opacity: '0.18',
      },
    },
  },
});

/** Color sits behind readable neutral text; it never communicates selection or status. */
export function IdentityWash({
  name,
  placement,
}: {
  name: string;
  placement: 'card' | 'hero' | 'tag';
}) {
  return <span aria-hidden="true" className={`${identityTone(name)} ${wash({ placement })}`} />;
}
