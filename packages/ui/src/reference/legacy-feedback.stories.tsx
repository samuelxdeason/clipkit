import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download } from 'lucide-react';
import { Button } from '../components/button';
import { EmptyState, Notice, StatusBadge, Tag } from '../components/feedback';
import { css } from '../../styled-system/css';
import { legacyDocument } from './legacy-document';

/**
 * Tag pills, download statuses, notices and the empty panel from the
 * existing app's real stylesheets, under their recipe-driven replacements.
 * Goes away with frontend/.
 */
const meta = {
  title: 'Reference/Legacy feedback',
  parameters: { a11y: { test: 'off' }, docs: { disable: true } },
} satisfies Meta;
export default meta;

const downloadSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>';

const legacyMarkup = `
<div class="row video-card"><div class="video-card-secondary">
  <button class="tag-pill" title="Travel">Travel</button><button class="tag-pill" title="Beach">Beach</button>
</div></div>
<div class="row downloads-page">
  <span class="download-status queued">Queued</span>
  <span class="download-status downloading">Downloading</span>
  <span class="download-status done">Done</span>
  <span class="download-status error">Error</span>
  <span class="connection-state connected">Connected</span>
  <span class="connection-state">Not connected</span>
</div>
<div class="row" style="display:block;width:640px">
  <div class="manager-alert" role="alert">Couldn’t refresh your library. Showing previously loaded videos.<button>Retry</button></div>
  <div class="manager-notice" role="status">Catalogue rebuilt. 1,204 videos were re-read from disk.</div>
</div>
<div class="row" style="display:block;width:640px">
  <div class="manager-empty download-empty"><span class="empty-icon">${downloadSvg}</span><h2>Your queue is clear</h2><p>Add a video link or a page of pictures to start a download.</p></div>
</div>`;

const caption = css({ color: 'muted', fontSize: 'meta', mb: '2', mt: '6' });
const row = css({ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2' });
const block = css({ display: 'grid', gap: '4', maxW: '2xl' });

export const SideBySide: StoryObj = {
  render: () => (
    <div>
      <p className={caption}>Recipes (new)</p>
      <div className={block}>
        <div className={row}>
          <Tag onClick={() => {}} title="Travel">
            Travel
          </Tag>
          <Tag onClick={() => {}} title="Beach">
            Beach
          </Tag>
        </div>
        <div className={row}>
          <StatusBadge>Queued</StatusBadge>
          <StatusBadge tone="info">Downloading</StatusBadge>
          <StatusBadge tone="success">Done</StatusBadge>
          <StatusBadge tone="danger">Error</StatusBadge>
          <StatusBadge tone="success" dot>
            Connected
          </StatusBadge>
          <StatusBadge dot>Not connected</StatusBadge>
        </div>
        <Notice
          tone="danger"
          actions={
            <Button variant="quiet" size="compact">
              Retry
            </Button>
          }
        >
          Couldn’t refresh your library. Showing previously loaded videos.
        </Notice>
        <Notice>Catalogue rebuilt. 1,204 videos were re-read from disk.</Notice>
        <EmptyState
          symbol={<Download />}
          title="Your queue is clear"
          description="Add a video link or a page of pictures to start a download."
        />
      </div>
      <p className={caption}>frontend/ (legacy stylesheets, isolated frame)</p>
      <iframe
        title="Legacy feedback"
        srcDoc={legacyDocument(legacyMarkup)}
        className={css({ w: '5xl', maxW: 'none', h: '[760px]', border: 'none', display: 'block' })}
      />
    </div>
  ),
};
