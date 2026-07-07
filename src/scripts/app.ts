/**
 * Client entry for the ghost session chrome.
 *
 * data-ghost-* contract — the ONLY selectors client JS may use:
 *   body[data-ghost-mode]              'stream' | 'reading' (CSS derives visibility)
 *   [data-ghost-entry]                 stream row <a> (+ data-slug/-kind/-title/-date)
 *   [data-ghost-stream]                stream list
 *   [data-ghost-stream-region]         banner + stream wrapper (hidden while reading)
 *   [data-ghost-template="slug"]       inert rendered post HTML (+ data-words/-minutes)
 *   [data-ghost-reader]                reader panel (+ -title/-meta/-body/-cap children)
 *   [data-ghost-overlay="keymap|search"] overlays (+ [data-ghost-overlay-close] backdrops)
 *   [data-ghost-search-input|-results|-status|-label]
 *   [data-ghost-status]                footer (+ -glyph/-context/-meter/-hint children)
 *   [data-ghost-spinner="name"]        spinner frames (animated by the motion layer)
 *   [data-ghost-cursor]                blinking ▊ (pure CSS)
 *   [data-ghost-boot-line|-status]     boot-reveal targets (motion layer)
 */
import { initStatus } from './status';
import { initStream, backToStream } from './stream';
import { initReader } from './reader';
import { initSearch } from './search';
import { initKeys } from './keys';
import { initMotion } from './motion';

/** Home href, resolved from the footer brand link (base-path aware). */
export function withHome(): string {
  return (
    document.querySelector<HTMLAnchorElement>('[data-ghost-status] a')?.href ?? '/'
  );
}

function init(): void {
  initStatus();
  initStream();
  initReader(backToStream);
  initSearch();
  initKeys();
  initMotion();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
