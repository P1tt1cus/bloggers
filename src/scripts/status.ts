// Status footer segments. Text content is discrete state (not animation),
// so it updates under prefers-reduced-motion too; only the transient
// flashes are time-based and they resolve instantly when motion is off.
import { prefersReduced } from './prefs';

const CTX_CELLS = 8;
const FLASH_MS = 1400;

let glyphEl: HTMLElement | null;
let contextEl: HTMLElement | null;
let meterEl: HTMLElement | null;
let hintEl: HTMLElement | null;

let restingGlyph = '⌁';
let restingContext = 'online';
let flashTimer: number | undefined;
let rafPending = false;

export function initStatus(): void {
  glyphEl = document.querySelector('[data-ghost-status-glyph]');
  contextEl = document.querySelector('[data-ghost-status-context]');
  meterEl = document.querySelector('[data-ghost-status-meter]');
  hintEl = document.querySelector('[data-ghost-status-hint]');

  restingGlyph = glyphEl?.textContent ?? '⌁';
  restingContext = contextEl?.textContent ?? 'online';

  window.addEventListener(
    'scroll',
    () => {
      if (document.body.dataset.ghostMode !== 'reading' || rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        updateReadingProgress();
      });
    },
    { passive: true },
  );

  // Standalone post pages load straight into reading mode and may never fire
  // a scroll event (short posts), so seed the ctx meter from the start.
  if (document.body.dataset.ghostMode === 'reading') {
    meterEl?.setAttribute('aria-label', 'reading progress');
    updateReadingProgress();
  }
}

export function enterReading(slug: string): void {
  restingGlyph = '◍';
  restingContext = `reading ${slug}`;
  if (glyphEl) glyphEl.textContent = restingGlyph;
  if (contextEl) contextEl.textContent = restingContext;
  if (hintEl) hintEl.textContent = 'esc back';
  if (meterEl) {
    meterEl.setAttribute('role', 'progressbar');
    meterEl.setAttribute('aria-label', 'reading progress');
    meterEl.setAttribute('aria-valuemin', '0');
    meterEl.setAttribute('aria-valuemax', '100');
    meterEl.removeAttribute('aria-hidden');
  }
  updateReadingProgress();
}

export function enterStream(selected: number, total: number): void {
  restingGlyph = '⌁';
  restingContext = 'online';
  if (glyphEl) glyphEl.textContent = restingGlyph;
  if (contextEl) contextEl.textContent = restingContext;
  if (hintEl) hintEl.textContent = '▲▼ j/k · ⏎ open · ? keys';
  if (meterEl) {
    meterEl.removeAttribute('role');
    meterEl.removeAttribute('aria-label');
    meterEl.removeAttribute('aria-valuemin');
    meterEl.removeAttribute('aria-valuemax');
    meterEl.removeAttribute('aria-valuenow');
    // The step counter is a decorative position glyph string; hide the raw
    // ●●◌◌ from assistive tech.
    meterEl.setAttribute('aria-hidden', 'true');
  }
  updateStepMeter(selected, total);
}

export function updateStepMeter(selected: number, total: number): void {
  if (!meterEl || document.body.dataset.ghostMode !== 'stream') return;
  const cells = Math.min(total, CTX_CELLS);
  if (selected < 0) {
    meterEl.textContent = `${'◌'.repeat(cells)} –/${total}`;
    return;
  }
  const filled = total <= CTX_CELLS ? selected + 1 : Math.round(((selected + 1) / total) * cells);
  meterEl.textContent = `${'●'.repeat(filled)}${'◌'.repeat(cells - filled)} ${selected + 1}/${total}`;
}

export function updateReadingProgress(): void {
  if (!meterEl || document.body.dataset.ghostMode !== 'reading') return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const frac = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
  const filled = Math.round(frac * CTX_CELLS);
  const pct = Math.round(frac * 100);
  meterEl.textContent = `ctx ${'▓'.repeat(filled)}${'░'.repeat(CTX_CELLS - filled)} ${pct}%`;
  meterEl.setAttribute('aria-valuenow', String(pct));
}

/** Transient one-line message in the context segment, then revert. */
export function flashStatus(glyph: string, text: string, doneText?: string): void {
  if (!contextEl || !glyphEl) return;
  window.clearTimeout(flashTimer);

  if (prefersReduced()) {
    // No timed theater — resolve straight to the final state.
    if (doneText) {
      contextEl.textContent = doneText;
      flashTimer = window.setTimeout(revert, FLASH_MS);
    }
    return;
  }

  glyphEl.textContent = glyph;
  contextEl.textContent = text;
  flashTimer = window.setTimeout(() => {
    if (doneText && contextEl && glyphEl) {
      glyphEl.textContent = '✓';
      contextEl.textContent = doneText;
      flashTimer = window.setTimeout(revert, FLASH_MS / 2);
    } else {
      revert();
    }
  }, FLASH_MS / 2);
}

function revert(): void {
  if (glyphEl) glyphEl.textContent = restingGlyph;
  if (contextEl) contextEl.textContent = restingContext;
}
