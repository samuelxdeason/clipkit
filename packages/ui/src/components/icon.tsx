import type { LucideIcon } from 'lucide-react';

export interface IconProps {
  glyph: LucideIcon;
  size?: 'sm' | 'md';
}

/** Decorative glyph. Label the surrounding control, not the SVG. */
export function Icon({ glyph: Glyph, size = 'md' }: IconProps) {
  return (
    <Glyph size={size === 'sm' ? 16 : 20} strokeWidth={1.7} aria-hidden="true" focusable="false" />
  );
}
