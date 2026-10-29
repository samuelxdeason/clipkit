import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageExample } from '../components/settings.stories';
import { css } from '../../styled-system/css';
import { legacyDocument } from './legacy-document';

/**
 * The existing app's Settings page from its real stylesheets beside the
 * recipes. Goes away with frontend/.
 */
const meta = {
  title: 'Reference/Legacy settings',
  parameters: { a11y: { test: 'off' }, docs: { disable: true } },
} satisfies Meta;
export default meta;

const caption = css({ color: 'muted', fontSize: 'meta', mb: '2', mt: '6' });
const frame = css({
  w: 'container.frame',
  maxW: 'none',
  h: '[760px]',
  border: 'none',
  display: 'block',
});

const glyph =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.2 3.4A2 2 0 0 0 7.5 2.5H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>';
const lock =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const nav = (id: string, label: string, detail: string, active = false) =>
  `<button aria-pressed="${active}" class="${active ? 'active' : ''}">${glyph}<span class="settings-nav-copy"><strong>${label}</strong><small>${detail}</small></span></button>`;

const markup = `
<div class="utility-page settings-page">
  <nav class="settings-navigation" aria-label="Settings sections">${nav('general', 'Library', 'Location & storage', true)}${nav('connections', 'Connections', 'Accounts & access')}${nav('maintenance', 'Maintenance', 'Backup & media care')}</nav>
  <div class="settings-detail">
    <header class="settings-section-heading"><span class="settings-eyebrow">MAKE CLIPKIT YOURS</span><h2>Your library</h2><p>Storage and library information, in one place.</p></header>
    <section class="settings-group"><h2>Library &amp; storage</h2><div class="settings-card">
      <div class="setting-row"><span class="setting-icon">${glyph}</span><div class="setting-copy"><strong>Library location</strong><p>Your media and catalogue are stored here.</p></div><div class="setting-control"></div></div>
      <div class="setting-path"><code>D:\\Media\\Library</code></div>
      <div class="storage-summary" aria-label="Library storage summary"><div><strong>22.7 GB</strong><span>Library storage</span></div><div><strong>1,204</strong><span>Videos</span></div><div><strong>38</strong><span>People</span></div></div>
      <div class="storage-breakdown"><h3>Storage by source</h3><div class="storage-track" aria-hidden="true"><span style="width:62%;background:var(--ui-chart-1)"></span><span style="width:28%;background:var(--ui-chart-2)"></span><span style="width:10%;background:var(--ui-chart-3)"></span></div><div class="storage-legend"><span><i style="background:var(--ui-chart-1)"></i>youtube <b>14.2 GB</b></span><span><i style="background:var(--ui-chart-2)"></i>x <b>6.4 GB</b></span><span><i style="background:var(--ui-chart-3)"></i>local <b>2.1 GB</b></span></div></div>
    </div></section>
    <footer class="utility-footnote">${lock}Your library stays in your vault.</footer>
  </div>
</div>`;

export const Page: StoryObj = {
  render: () => (
    <div>
      <p className={caption}>Recipes (new)</p>
      <PageExample />
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe title="Legacy settings page" srcDoc={legacyDocument(markup)} className={frame} />
    </div>
  ),
};
