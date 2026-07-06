// THE single keydown dispatcher. Priorities: search overlay > keymap
// overlay > space leader > mode bindings. Bindings never fire while a text
// input has focus, and Space never scrolls the page.
import * as stream from './stream';
import * as reader from './reader';
import * as search from './search';
import { withHome } from './app';

const LEADER_HOLD_MS = 350;

let keymapOverlay: HTMLElement | null;
let spaceLeader = false;
let leaderTimer: number | undefined;

export function initKeys(): void {
  keymapOverlay = document.querySelector('[data-ghost-overlay="keymap"]');

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
}

function keymapVisible(): boolean {
  return !!keymapOverlay && !keymapOverlay.hidden;
}

function showKeymap(): void {
  if (keymapOverlay) keymapOverlay.hidden = false;
}

function hideKeymap(): void {
  if (keymapOverlay) keymapOverlay.hidden = true;
}

function clearLeader(): void {
  spaceLeader = false;
  window.clearTimeout(leaderTimer);
  hideKeymap();
}

function onKeydown(e: KeyboardEvent): void {
  const target = e.target as HTMLElement;
  const typing =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable;

  // Search overlay owns its keys via the input's own handler; catch Escape
  // here in case focus escaped the input.
  if (search.isSearchOpen()) {
    if (e.key === 'Escape') {
      e.preventDefault();
      search.closeSearch();
    }
    return;
  }

  if (keymapVisible()) {
    // Any key dismisses; space+s still reaches search from the leader path.
    if (spaceLeader && e.key.toLowerCase() === 's') {
      e.preventDefault();
      clearLeader();
      search.openSearch();
      return;
    }
    if (e.key !== ' ') {
      e.preventDefault();
      clearLeader();
    }
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
