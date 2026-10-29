'use client';
import { Dialog } from '@ark-ui/react/dialog';
import { ark } from '@ark-ui/react/factory';
import { createSlotRecipeContext } from '../../styled-system/jsx';
import { organizer, viewer } from '../../styled-system/recipes';

/**
 * The window the existing app opens around a playing video or a photo. It is
 * an Ark Dialog, so it traps focus, closes on Escape and returns focus to the
 * control that opened it; the recipe supplies the chrome. Compose it as
 * Root > Backdrop + Positioner > Window > Header, Content (Playback > Stage,
 * Bar, Footer, Error; Inspector), Footer. Media is `Video` or `Image`.
 */
const view = createSlotRecipeContext(viewer);

export const Root = view.withRootProvider(Dialog.Root, {
  defaultProps: { unmountOnExit: true, lazyMount: true },
});
export const Backdrop = view.withContext(Dialog.Backdrop, 'backdrop');
export const Positioner = view.withContext(Dialog.Positioner, 'positioner');
export const Window = view.withContext(Dialog.Content, 'window');
export const Title = view.withContext(Dialog.Title, 'title');
export const CloseTrigger = Dialog.CloseTrigger;
export const Header = view.withContext(ark.header, 'header');
export const Heading = view.withContext(ark.div, 'heading');
export const Eyebrow = view.withContext(ark.span, 'eyebrow');
export const Content = view.withContext(ark.div, 'content');
export const Playback = view.withContext(ark.div, 'playback');
export const Stage = view.withContext(ark.div, 'stage');
export const Video = view.withContext(ark.video, 'media');
export const Image = view.withContext(ark.img, 'media');
export const Bar = view.withContext(ark.div, 'bar');
export const Caption = view.withContext(ark.span, 'caption');
export const Footer = view.withContext(ark.footer, 'footer');
export const Controls = view.withContext(ark.div, 'controls');
export const Error = view.withContext(ark.p, 'error');
export const Inspector = view.withContext(ark.aside, 'inspector');

export { DialogContext as Context } from '@ark-ui/react/dialog';

/**
 * The organize inspector's parts. Root is a labelled section; Tray holds
 * pressed TrayItem buttons for the section switch; Option is one pressed
 * choice row with a Symbol, Copy (Name and Detail) and a Check.
 */
const organize = createSlotRecipeContext(organizer);

export const Organizer = {
  Root: organize.withProvider(ark.section, 'root'),
  Heading: organize.withContext(ark.header, 'heading'),
  Tray: organize.withContext(ark.nav, 'tray'),
  TrayItem: organize.withContext(ark.button, 'trayItem'),
  Feedback: organize.withContext(ark.div, 'feedback'),
  Intro: organize.withContext(ark.div, 'intro'),
  Create: organize.withContext(ark.div, 'create'),
  Options: organize.withContext(ark.div, 'options'),
  Option: organize.withContext(ark.button, 'option'),
  Symbol: organize.withContext(ark.span, 'symbol'),
  Copy: organize.withContext(ark.span, 'copy'),
  Name: organize.withContext(ark.strong, 'name'),
  Detail: organize.withContext(ark.small, 'detail'),
  Check: organize.withContext(ark.span, 'check'),
  Empty: organize.withContext(ark.p, 'empty'),
  File: organize.withContext(ark.div, 'file'),
  Facts: organize.withContext(ark.dl, 'facts'),
};
