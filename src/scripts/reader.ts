// In-place reader: clones inert <template> post HTML into the panel.
// The URL hash (#read-slug) is the single source of truth — every open and
// close routes through history, so browser Back/Forward, Esc, direct load,
// and refresh all stay in sync.
import { scrollBehavior } from './prefs';
import { enterReading, flashStatus } from './status';

const HASH_PREFIX = '#read-';

let readerEl: HTMLElement | null;
let bodyEl: HTMLElement | null;
let titleEl: HTMLElement | null;
let metaEl: HTMLElement | null;
let capEl: HTMLElement | null;

let openSlug: string | null = null;
let savedScrollY = 0;
let onCloseToStream: (() => void) | null = null;

export function initReader(onClose: () => void): void {
  readerEl = document.querySelector('[data-ghost-reader]');
  bodyEl = document.querySelector('[data-ghost-reader-body]');
  titleEl = document.querySelector('[data-ghost-reader-title]');
  metaEl = document.querySelector('[data-ghost-reader-meta]');
  capEl = document.querySelector('[data-ghost-reader-cap]');
  onCloseToStream = onClose;

  document
    .querySelector('[data-ghost-reader-close]')
    ?.addEventListener('click', (e) => {
      e.preventDefault();
      closeReader();
    });

  window.addEventListener('popstate', reconcileHash);
  reconcileHash(); // reopen (or strip) a reader hash present on initial load
}

export const isReaderOpen = (): boolean => openSlug !== null;

function slugFromHash(): string | null {
  return location.hash.startsWith(HASH_PREFIX)
    ? decodeURIComponent(location.hash.slice(HASH_PREFIX.length))
    : null;
}

function hasTemplate(slug: string): boolean {
  return !!document.querySelector(`[data-ghost-template="${CSS.escape(slug)}"]`);
}

/** Sync DOM to the current hash. Called on load and on every popstate. */
function reconcileHash(): void {
  const wanted = slugFromHash();
  if (wanted && wanted !== openSlug) {
    if (hasTemplate(wanted)) renderOpen(wanted);
    else if (readerEl) {
      // Stale hash for a post that doesn't exist here — strip without a new entry.
      history.replaceState(null, '', location.pathname + location.search);
    }
  } else if (!wanted && openSlug) {
    renderClose();
  }
}

/** User-initiated open: push a history entry, then render. */
export function openReader(slug: string): void {
  if (!readerEl || openSlug === slug || !hasTemplate(slug)) return;
  history.pushState({ ghostRead: slug }, '', `${HASH_PREFIX}${slug}`);
  renderOpen(slug);
}

/** User-initiated close: walk history back so the URL/hash stays truthful. */
export function closeReader(): void {
  if (!openSlug) return;
  if ((history.state as { ghostRead?: string } | null)?.ghostRead) {
    history.back(); // popstate → reconcileHash → renderClose
  } else {
    // Reader was opened by a direct #read- load (no entry of ours to pop).
    history.replaceState(null, '', location.pathname + location.search);
    renderClose();
  }
}

function renderOpen(slug: string): void {
  const template = document.querySelector<HTMLTemplateElement>(
    `[data-ghost-template="${CSS.escape(slug)}"]`,
  );
  const entry = document.querySelector<HTMLElement>(
    `[data-ghost-entry][data-slug="${CSS.escape(slug)}"]`,
  );
  if (!template || !readerEl || !bodyEl) return;

  savedScrollY = window.scrollY;
  bodyEl.replaceChildren(template.content.cloneNode(true), buildStreamTail());
  if (titleEl) titleEl.textContent = entry?.dataset.title ?? slug;
  if (metaEl) metaEl.textContent = `${entry?.dataset.date ?? ''} · ${template.dataset.minutes} min read`;
  if (capEl) capEl.textContent = `✓ ${template.dataset.words} words · rendered in ghost-mode`;

  document.body.dataset.ghostMode = 'reading';
  readerEl.hidden = false;
  window.scrollTo({ top: 0, behavior: 'auto' });
  readerEl.focus({ preventScroll: true });
  openSlug = slug;

  enterReading(slug);
  flashStatus('◍', 'materializing…', 'done');
}

function renderClose(): void {
  if (!openSlug || !readerEl || !bodyEl) return;
  openSlug = null;

  readerEl.hidden = true;
  bodyEl.replaceChildren();
  document.body.dataset.ghostMode = 'stream';
  window.scrollTo({ top: savedScrollY, behavior: 'auto' });

  // Any overlay open over the reader must close with it — after the mode flip
  // so focus restoration lands on the stream, not the now-hidden reader.
  document.dispatchEvent(new CustomEvent('ghost:reset-overlays'));

  onCloseToStream?.();
  flashStatus('†', 'killed read_post · back to stream');
}

/** `…▊` streaming tail after the last content block (spec §02/§06). */
function buildStreamTail(): HTMLElement {
  const tail = document.createElement('p');
  tail.className = 'stream-tail';
  tail.setAttribute('aria-hidden', 'true');
  const dots = document.createElement('span');
  dots.dataset.ghostSpinner = 'streamdots';
  dots.textContent = '…';
  const cursor = document.createElement('span');
  cursor.setAttribute('data-ghost-cursor', '');
  tail.append(dots, cursor);
  return tail;
}

/** Scroll the document by two prose lines (derived — no pixel grid). */
export function readerScrollStep(dir: 1 | -1): void {
  const lineHeight = bodyEl ? parseFloat(getComputedStyle(bodyEl).lineHeight) : 24;
  window.scrollBy({ top: dir * 2 * lineHeight, behavior: scrollBehavior() });
}

export function readerScrollEdge(edge: 'top' | 'bottom'): void {
  window.scrollTo({
    top: edge === 'top' ? 0 : document.documentElement.scrollHeight,
    behavior: scrollBehavior(),
  });
}
