// In-place reader: clones inert <template> post HTML into the panel.
// history.pushState on open + popstate handling make browser Back = Esc.
import { scrollBehavior } from './prefs';
import { enterReading, flashStatus } from './status';

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

  window.addEventListener('popstate', () => {
    if (openSlug && !window.location.hash.startsWith('#read-')) {
      closeReader({ fromHistory: true });
    }
  });
}

export const isReaderOpen = (): boolean => openSlug !== null;

export function openReader(slug: string): void {
  const template = document.querySelector<HTMLTemplateElement>(
    `[data-ghost-template="${CSS.escape(slug)}"]`,
  );
  const entry = document.querySelector<HTMLElement>(
    `[data-ghost-entry][data-slug="${CSS.escape(slug)}"]`,
  );
  if (!template || !readerEl || !bodyEl) return;

  savedScrollY = window.scrollY;
  bodyEl.replaceChildren(template.content.cloneNode(true));
  if (titleEl) titleEl.textContent = entry?.dataset.title ?? slug;
  if (metaEl) metaEl.textContent = `${entry?.dataset.date ?? ''} · ${template.dataset.minutes} min read`;
  if (capEl) capEl.textContent = `✓ ${template.dataset.words} words · rendered in ghost-mode`;

  document.body.dataset.ghostMode = 'reading';
  readerEl.hidden = false;
  window.scrollTo({ top: 0, behavior: 'auto' });
  readerEl.focus({ preventScroll: true });

  history.pushState({ ghostRead: slug }, '', `#read-${slug}`);
  openSlug = slug;

  enterReading(slug);
  flashStatus('◍', 'materializing…', 'done');
}

export function closeReader(opts: { fromHistory?: boolean } = {}): void {
  if (!openSlug || !readerEl || !bodyEl) return;
  openSlug = null;

  readerEl.hidden = true;
  bodyEl.replaceChildren();
  document.body.dataset.ghostMode = 'stream';
  window.scrollTo({ top: savedScrollY, behavior: 'auto' });

  // Pop our own hash entry unless history already did it (Back button).
  if (!opts.fromHistory && (history.state as { ghostRead?: string } | null)?.ghostRead) {
    history.back();
  }

  onCloseToStream?.();
  flashStatus('†', 'killed read_post · back to stream');
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
