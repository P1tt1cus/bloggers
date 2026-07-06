// The motion layer: one shared ticker drives every text spinner (CSS
// steps() can't swap glyph strings), plus the one-time boot reveal.
// Everything here is opt-IN: with JS off or prefers-reduced-motion on,
// the page renders complete and static with resolved spinner frames.
import { SPINNERS, TICK_MS, type SpinnerName } from '../lib/ghost';
import { onMotionPreferenceChange, prefersReduced } from './prefs';

const BOOT_KEY = 'pitticus-booted';
const BOOT_BAR_CELLS = 22;

let timer: number | undefined;
let t = 0;

function spinnerEls(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-ghost-spinner]')];
}

function tick(): void {
  t++;
  for (const el of spinnerEls()) {
    const def = SPINNERS[el.dataset.ghostSpinner as SpinnerName];
    if (!def || el.offsetParent === null) continue;
    if (t % def.div === 0) {
      el.textContent = def.frames[Math.floor(t / def.div) % def.frames.length];
    }
  }
}

function start(): void {
  if (timer === undefined) timer = window.setInterval(tick, TICK_MS);
}

function pause(): void {
  if (timer !== undefined) {
    window.clearInterval(timer);
    timer = undefined;
  }
}

/** Stop and render every spinner's resolved static frame. */
function stopResolved(): void {
  pause();
  for (const el of spinnerEls()) {
    const def = SPINNERS[el.dataset.ghostSpinner as SpinnerName];
    if (def) el.textContent = def.resolved;
  }
}

export function initMotion(): void {
  if (!prefersReduced()) {
    start();
    bootReveal();
  }

  onMotionPreferenceChange((reduced) => (reduced ? stopResolved() : start()));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else if (!prefersReduced()) start();
  });
}

/* ── boot reveal (index only, once per session, any input skips) ──────── */

function bootReveal(): void {
  const banner = document.querySelector<HTMLElement>('[data-ghost-banner]');
  if (!banner || sessionStorage.getItem(BOOT_KEY)) return;
  sessionStorage.setItem(BOOT_KEY, '1');

  const lines = [...banner.querySelectorAll<HTMLElement>('[data-ghost-boot-line]')];
  const statusEl = banner.querySelector<HTMLElement>('[data-ghost-boot-status]');
  const entries = [...document.querySelectorAll<HTMLElement>('[data-ghost-entry]')];
  const finalStatus = statusEl?.innerHTML ?? '';

  const timeouts: number[] = [];
  let finished = false;

  // Markup is visible by default; hiding happens only here, right before
  // the staggered reveal — a JS failure can never blank the hero.
  for (const el of [...lines, ...entries]) el.style.opacity = '0';

  const finish = (): void => {
    if (finished) return;
    finished = true;
    for (const id of timeouts) window.clearTimeout(id);
    for (const el of [...lines, ...entries]) el.style.opacity = '';
    if (statusEl) statusEl.innerHTML = finalStatus;
    document.removeEventListener('keydown', finish, true);
    document.removeEventListener('pointerdown', finish, true);
  };
  document.addEventListener('keydown', finish, true);
  document.addEventListener('pointerdown', finish, true);

  const later = (ms: number, fn: () => void): void => {
    timeouts.push(window.setTimeout(fn, ms));
  };

  // Banner + boot text lines pop in top-to-bottom (no fades — terminal pop).
  let at = 120;
  for (const line of lines) {
    const el = line;
    later(at, () => (el.style.opacity = ''));
    at += 90;
  }

  // Status line: phase-edge progress bar, then a SÉANCE scan, then resolve.
  if (statusEl) {
    const barStart = at + 80;
    for (let step = 0; step <= 10; step++) {
      later(barStart + step * 70, () => {
        const filled = Math.round((step / 10) * BOOT_BAR_CELLS);
        statusEl.textContent = `${'█'.repeat(filled)}▓▒░${'·'.repeat(
          Math.max(0, BOOT_BAR_CELLS - filled),
        )}  ${step * 10}%`;
      });
    }
    const seanceStart = barStart + 11 * 70;
    for (let frame = 0; frame < 6; frame++) {
      later(seanceStart + frame * TICK_MS, () => {
        statusEl.textContent = `${SPINNERS.seance.frames[frame]} scanning ~/posts…`;
      });
    }
    later(seanceStart + 6 * TICK_MS + 100, () => {
      statusEl.innerHTML = finalStatus;
    });
  }

  // Stream rows pop in behind the boot text.
  const streamStart = at + 60;
  entries.forEach((el, i) => later(streamStart + i * 60, () => (el.style.opacity = '')));

  // Whole reveal is bounded; whatever happens, settle by 4s.
  later(4000, finish);
}
