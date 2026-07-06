// grep overlay. Stream mode: filter entries live. Reading mode: wrap
// matches in <mark> within single text nodes (Shiki spans survive), jump
// with scrollIntoView — no line arithmetic anywhere.
import { scrollBehavior } from './prefs';
import { openReader } from './reader';
import { getEntries } from './stream';

interface ReadingMatch {
  mark: HTMLElement;
}

interface StreamMatch {
  entry: HTMLAnchorElement;
}

let overlay: HTMLElement | null;
let input: HTMLInputElement | null;
let resultsEl: HTMLElement | null;
let statusEl: HTMLElement | null;
let labelEl: HTMLElement | null;
let driftRow: HTMLElement | null;

let openFlag = false;
let active = -1;
let readingMatches: ReadingMatch[] = [];
let streamMatches: StreamMatch[] = [];
let markedParents = new Set<HTMLElement>();

export function initSearch(): void {
  overlay = document.querySelector('[data-ghost-overlay="search"]');
  input = document.querySelector('[data-ghost-search-input]');
  resultsEl = document.querySelector('[data-ghost-search-results]');
  statusEl = document.querySelector('[data-ghost-search-status]');
  labelEl = document.querySelector('[data-ghost-search-label]');
  driftRow = overlay?.querySelector('.drift-row') ?? null;

  input?.addEventListener('input', () => runQuery());
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      cycle(e.shiftKey ? -1 : 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      activate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeSearch();
    } else {
      e.stopPropagation();
    }
  });
}

export const isSearchOpen = (): boolean => openFlag;

export function openSearch(): void {
  if (!overlay || !input) return;
  openFlag = true;
  overlay.hidden = false;
  const reading = document.body.dataset.ghostMode === 'reading';
  if (labelEl) labelEl.textContent = reading ? 'searching transmission…' : 'searching transmissions…';
  input.value = '';
  input.focus();
  runQuery();
}

export function closeSearch(): void {
  if (!overlay) return;
  openFlag = false;
  overlay.hidden = true;
  clearMarks();
  undimEntries();
  renderStatus('');
  if (resultsEl) resultsEl.replaceChildren();
  (document.querySelector('[data-ghost-reader]') as HTMLElement | null)?.focus?.({
    preventScroll: true,
  });
}

function runQuery(): void {
  const q = input?.value.trim() ?? '';
  active = -1;
  driftRow?.classList.toggle('active', q.length > 0);

  const started = performance.now();
  if (document.body.dataset.ghostMode === 'reading') {
    runReadingQuery(q, started);
  } else {
    runStreamQuery(q, started);
  }
}

/* ── stream mode: live filter ─────────────────────────────────────────── */

function runStreamQuery(q: string, started: number): void {
  streamMatches = [];
  if (resultsEl) resultsEl.replaceChildren();
  undimEntries();
  if (!q) {
    renderStatus('');
    return;
  }

  const needle = q.toLowerCase();
  for (const entry of getEntries()) {
    const haystack = `${entry.dataset.title ?? ''} ${
      entry.querySelector('.desc')?.textContent ?? ''
    }`.toLowerCase();
    if (haystack.includes(needle)) {
      streamMatches.push({ entry });
    } else {
      entry.classList.add('ghost-dimmed');
    }
  }

  const ms = Math.max(1, Math.round(performance.now() - started));
  renderStatus(
    streamMatches.length
      ? `✓ ${streamMatches.length} match${streamMatches.length === 1 ? '' : 'es'} · ${ms}ms`
      : '✗ no matches',
  );

  streamMatches.forEach(({ entry }, i) => {
    const li = document.createElement('li');
    const date = document.createElement('span');
    date.className = 'r-date';
    date.textContent = `${entry.dataset.date ?? ''}  `;
    const glyph = document.createElement('span');
    glyph.className = 'r-glyph';
    glyph.textContent = entry.dataset.kind === 'artifact' ? '◈ ' : '✓ ';
    const kind = document.createElement('span');
    kind.className = 'r-kind';
    kind.textContent = `${entry.dataset.kind}  `;
    const title = document.createElement('span');
    title.textContent = entry.dataset.title ?? '';
    li.append(date, glyph, kind, title);
    li.addEventListener('click', () => {
      active = i;
      activate();
    });
    resultsEl?.append(li);
  });
  if (streamMatches.length) setActive(0);
}

function undimEntries(): void {
  getEntries().forEach((entry) => entry.classList.remove('ghost-dimmed'));
}

/* ── reading mode: mark + jump ────────────────────────────────────────── */

function runReadingQuery(q: string, started: number): void {
  clearMarks();
  readingMatches = [];
  if (resultsEl) resultsEl.replaceChildren();
  if (!q) {
    renderStatus('');
    return;
  }

  const prose = document.querySelector('[data-ghost-reader-body]');
  if (!prose) return;

  const needle = q.toLowerCase();
  const walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT);
  const hits: { node: Text; index: number }[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const text = node.data.toLowerCase();
    let from = 0;
    let at: number;
    while ((at = text.indexOf(needle, from)) !== -1) {
      hits.push({ node, index: at });
      from = at + needle.length;
    }
  }

  // Wrap back-to-front so earlier offsets stay valid within each node.
  for (let i = hits.length - 1; i >= 0; i--) {
    const { node: hitNode, index } = hits[i];
    const range = document.createRange();
    range.setStart(hitNode, index);
    range.setEnd(hitNode, index + q.length);
    const mark = document.createElement('mark');
    mark.className = 'ghost-match';
    range.surroundContents(mark);
    if (mark.parentElement) markedParents.add(mark.parentElement);
    readingMatches.unshift({ mark });
  }

  const ms = Math.max(1, Math.round(performance.now() - started));
  renderStatus(
    readingMatches.length
      ? `✓ ${readingMatches.length} match${readingMatches.length === 1 ? '' : 'es'} · ${ms}ms`
      : '✗ no matches',
  );

  readingMatches.forEach(({ mark }, i) => {
    const li = document.createElement('li');
    const ctx = document.createElement('span');
    ctx.className = 'r-ctx';
    const parentText = mark.parentElement?.textContent ?? '';
    const pos = parentText.toLowerCase().indexOf(needle);
    const before = parentText.slice(Math.max(0, pos - 28), Math.max(0, pos));
    const after = parentText.slice(pos + q.length, pos + q.length + 36);
    ctx.textContent = `…${before}`;
    const hit = document.createElement('mark');
    hit.textContent = parentText.slice(pos, pos + q.length);
    const tail = document.createElement('span');
    tail.className = 'r-ctx';
    tail.textContent = `${after}…`;
    li.append(ctx, hit, tail);
    li.addEventListener('click', () => {
      active = i;
      activate();
    });
    resultsEl?.append(li);
  });
  if (readingMatches.length) setActive(0);
}

function clearMarks(): void {
  for (const { mark } of readingMatches) {
    mark.replaceWith(document.createTextNode(mark.textContent ?? ''));
  }
  for (const parent of markedParents) parent.normalize();
  markedParents = new Set();
  readingMatches = [];
}

/* ── shared selection/activation ──────────────────────────────────────── */

function matchCount(): number {
  return document.body.dataset.ghostMode === 'reading'
    ? readingMatches.length
    : streamMatches.length;
}

function setActive(i: number): void {
  const count = matchCount();
  if (!count) return;
  active = ((i % count) + count) % count;
  resultsEl?.querySelectorAll('li').forEach((li, idx) => li.classList.toggle('active', idx === active));
  if (document.body.dataset.ghostMode === 'reading') {
    readingMatches.forEach(({ mark }, idx) => mark.classList.toggle('active', idx === active));
    readingMatches[active]?.mark.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
  }
  resultsEl
    ?.querySelectorAll('li')
    [active]?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
}

function cycle(dir: 1 | -1): void {
  setActive(active + dir);
}

function activate(): void {
  if (document.body.dataset.ghostMode === 'reading') {
    const match = readingMatches[active];
    if (!match) return;
    const target = match.mark.parentElement;
    closeSearch();
    if (target) {
      target.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
      target.classList.add('ghost-flash');
      window.setTimeout(() => target.classList.remove('ghost-flash'), 1300);
    }
  } else {
    const match = streamMatches[active];
    if (!match) return;
    closeSearch();
    if (match.entry.dataset.kind === 'post') {
      openReader(match.entry.dataset.slug ?? '');
    } else {
      window.open(match.entry.href, '_blank', 'noopener');
    }
  }
}

function renderStatus(text: string): void {
  if (statusEl) statusEl.textContent = text;
}
