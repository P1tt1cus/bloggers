// Event-stream selection + activation. Entries are real links; plain
// left-clicks on posts are intercepted to open the in-place reader.
import { scrollBehavior } from './prefs';
import { openReader } from './reader';
import { enterStream, flashStatus, updateStepMeter } from './status';

let entries: HTMLAnchorElement[] = [];
let selected = -1;

export function initStream(): void {
  entries = [...document.querySelectorAll<HTMLAnchorElement>('[data-ghost-entry]')];

  entries.forEach((entry, index) => {
    entry.addEventListener('click', (e) => {
      const kind = entry.dataset.kind;
      if (kind === 'artifact') {
        flashStatus('▓', 'summoning artifact…', 'handed off ↗');
        return; // native <a target="_blank"> navigation
      }
      if (kind === 'page') {
        return; // native same-tab navigation
      }
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      select(index);
      openReader(entry.dataset.slug ?? '');
    });
  });

  updateStepMeter(selected, entries.length);
}

export const hasStream = (): boolean => entries.length > 0;

export function select(index: number): void {
  if (!entries.length) return;
  const next = Math.max(0, Math.min(entries.length - 1, index));
  entries.forEach((el) => {
    delete el.dataset.ghostSelected;
    el.removeAttribute('aria-current');
  });
  selected = next;
  const el = entries[selected];
  el.dataset.ghostSelected = 'true';
  el.setAttribute('aria-current', 'true');
  el.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
  updateStepMeter(selected, entries.length);
}

export const selectNext = (): void => select(selected + 1);
export const selectPrev = (): void => select(Math.max(0, selected - 1));
export const selectFirst = (): void => select(0);
export const selectLast = (): void => select(entries.length - 1);

export function openSelected(): void {
  if (selected < 0 || selected >= entries.length) return;
  const el = entries[selected];
  const kind = el.dataset.kind;
  if (kind === 'post') {
    openReader(el.dataset.slug ?? '');
  } else if (kind === 'page') {
    window.location.href = el.href; // same-tab internal navigation
  } else {
    // Synchronous window.open keeps popup blockers happy.
    window.open(el.href, '_blank', 'noopener');
    flashStatus('▓', 'summoning artifact…', 'handed off ↗');
  }
}

export function backToStream(): void {
  enterStream(selected, entries.length);
}

export const getEntries = (): HTMLAnchorElement[] => entries;
