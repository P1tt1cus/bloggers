// THE single keydown dispatcher. Priorities: search overlay > keymap
// overlay > space leader > mode bindings. Bindings never fire while a text
// input has focus, on modifier chords, and Space never scrolls the page.
import * as stream from './stream';
import * as reader from './reader';
import * as search from './search';
import { withHome } from './app';

const LEADER_HOLD_MS = 350;

let keymapOverlay: HTMLElement | null;
let keymapDialog: HTMLElement | null;
let spaceLeader = false;
let leaderTimer: number | undefined;
let keymapReturnFocus: HTMLElement | null = null;

export function initKeys(): void {
  keymapOverlay = document.querySelector('[data-ghost-overlay="keymap"]');
  keymapDialog = keymapOverlay?.querySelector('[role="dialog"]') ?? null;

  document.addEventListener('keydown', onKeydown);
  document.addEventListener('keyup', (e) => {
    if (e.key === ' ') clearLeader();
  });
  document.querySelectorAll('[data-ghost-overlay-close]').forEach((el) =>
    el.addEventListener('click', () => {
      hideKeymap();
      if (search.isSearchOpen()) search.closeSearch();
    }),
  );
  // When the reader closes (incl. via browser Back), any overlay over it goes too.
  document.addEventListener('ghost:reset-overlays', () => {
    clearLeader();
    if (search.isSearchOpen()) search.closeSearch();
  });
}

function keymapVisible(): boolean {
  return !!keymapOverlay && !keymapOverlay.hidden;
}

function showKeymap(): void {
  if (!keymapOverlay) return;
  keymapReturnFocus = document.activeElement as HTMLElement | null;
  keymapOverlay.hidden = false;
  keymapDialog?.focus({ preventScroll: true });
}

function hideKeymap(): void {
  if (!keymapOverlay || keymapOverlay.hidden) return;
  keymapOverlay.hidden = true;
  keymapReturnFocus?.focus?.({ preventScroll: true });
  keymapReturnFocus = null;
}

function clearLeader(): void {
  spaceLeader = false;
  window.clearTimeout(leaderTimer);
  hideKeymap();
}

function onKeydown(e: KeyboardEvent): void {
  // Never intercept browser/OS chord shortcuts (Ctrl/Cmd/Alt + key).
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const target = e.target as HTMLElement;
  const typing =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable;

  // Search overlay owns its keys via the input's own handler; here we only
  // backstop Escape and make sure Space can't scroll if focus escaped.
  if (search.isSearchOpen()) {
    if (e.key === 'Escape') {
      e.preventDefault();
      search.closeSearch();
    } else if (e.key === ' ' && !typing) {
      e.preventDefault();
    }
    return;
  }

  if (keymapVisible()) {
    if (spaceLeader && e.key.toLowerCase() === 's') {
      e.preventDefault();
      clearLeader();
      search.openSearch();
      return;
    }
    if (e.key === ' ') {
      e.preventDefault(); // hold-to-show keeps the panel; keyup dismisses
      return;
    }
    e.preventDefault(); // any other key dismisses
    clearLeader();
    return;
  }

  if (typing) return;

  if (e.key === ' ') {
    e.preventDefault(); // Space must never scroll
    if (!spaceLeader) {
      spaceLeader = true;
      leaderTimer = window.setTimeout(showKeymap, LEADER_HOLD_MS);
    }
    return;
  }

  if (spaceLeader) {
    const leaderKey = e.key.toLowerCase();
    clearLeader();
    if (leaderKey === 's') {
      e.preventDefault();
      search.openSearch();
      return;
    }
  }

  const mode = document.body.dataset.ghostMode;

  switch (e.key) {
    case 'j':
      e.preventDefault();
      if (mode === 'reading') reader.readerScrollStep(1);
      else stream.selectNext();
      break;
    case 'k':
      e.preventDefault();
      if (mode === 'reading') reader.readerScrollStep(-1);
      else stream.selectPrev();
      break;
    case 'g':
      e.preventDefault();
      if (mode === 'reading') reader.readerScrollEdge('top');
      else stream.selectFirst();
      break;
    case 'G':
      e.preventDefault();
      if (mode === 'reading') reader.readerScrollEdge('bottom');
      else stream.selectLast();
      break;
    case 'Enter':
      if (mode === 'stream') {
        // Let a focused link (stream row, brand, 404 return) activate natively.
        if (target.closest('a')) break;
        e.preventDefault();
        stream.openSelected();
      }
      break;
    case 'Escape':
      if (mode === 'reading') {
        e.preventDefault();
        if (reader.isReaderOpen()) reader.closeReader();
        else window.location.href = withHome(); // standalone post page
      }
      break;
    case '/':
      e.preventDefault();
      search.openSearch();
      break;
    case '?':
      e.preventDefault();
      showKeymap();
      break;
  }
}
