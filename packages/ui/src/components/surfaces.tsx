import { ark } from '@ark-ui/react/factory';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { createSlotRecipeContext, styled } from '../../styled-system/jsx';
import {
  accent,
  avatar,
  breadcrumbs,
  disclosure,
  iconTile,
  identity,
  panel,
  previewImage,
  progressBar,
  rule,
  stat,
  textLink,
  type IdentityVariantProps,
} from '../../styled-system/recipes';

/** `.settings-card` and friends: a bordered panel; `accent` adds a tone bar. */
export const Panel = styled(ark.div, panel);

/** A hairline on one side with its spacing. */
export const Rule = styled(ark.div, rule);

/** A label over a large tabular number. */
const statContext = createSlotRecipeContext(stat);
export const Stat = {
  Root: statContext.withProvider(ark.div, 'root'),
  Label: statContext.withContext(ark.dt, 'label'),
  Value: statContext.withContext(ark.dd, 'value'),
};

/** A native progress bar in the active-work colour. */
export const ProgressBar = styled(ark.progress, progressBar);

/** A 48px glyph tile on the field surface. */
export const IconTile = styled(ark.span, iconTile);

export const identityTones = ['plum', 'rose', 'blue', 'amber'] as const;
export type IdentityTone = (typeof identityTones)[number];

/** Colours its content with an identity tone; `wash` paints a radial field instead. */
export const Identity = styled(ark.span, identity);
export type IdentityProps = ComponentPropsWithoutRef<typeof Identity>;
export const identityClass = (props: IdentityVariantProps) => identity(props);

/** `.person-avatar`: initials or a portrait in an identity-tinted frame. */
const avatarContext = createSlotRecipeContext(avatar);
export const Avatar = {
  Root: avatarContext.withProvider(ark.div, 'root'),
  Frame: avatarContext.withContext(ark.div, 'frame'),
  Wash: avatarContext.withContext(ark.span, 'wash'),
  Initials: avatarContext.withContext(ark.span, 'initials'),
  Glow: avatarContext.withContext(ark.span, 'glow'),
  Image: avatarContext.withContext(ark.img, 'image'),
};

/** The muted path above a profile or collection. */
export const Breadcrumbs = forwardRef<
  HTMLElement,
  ComponentPropsWithoutRef<'nav'> & { children: ReactNode }
>(function Breadcrumbs({ className, ...props }, ref) {
  return (
    <nav
      aria-label="Breadcrumbs"
      {...props}
      ref={ref}
      className={[breadcrumbs(), className].filter(Boolean).join(' ')}
    />
  );
});

/** A details element whose summary reads as a quiet control. */
const disclosureContext = createSlotRecipeContext(disclosure);
export const Disclosure = {
  Root: disclosureContext.withProvider(ark.details, 'root'),
  Summary: disclosureContext.withContext(ark.summary, 'summary'),
  Content: disclosureContext.withContext(ark.div, 'content'),
};

/** An inline link in running copy. */
export const TextLink = styled(ark.a, textLink);

/** The accent-coloured mark in a wordmark. */
export const Accent = styled(ark.span, accent);

/** A contained preview image on the control radius. */
export const PreviewImage = styled(ark.img, previewImage);
