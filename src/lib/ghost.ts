// The VOX/GHOST design-system vocabulary — the single source of glyphs,
// spinner frame tables, and the animation tick, imported by both server
// components (Glyph.astro, Spinner.astro) and client scripts (motion.ts).
// Frame tables are verbatim from the VOX TUI Graphics Spec v0.1.

export const TICK_MS = 110;

export const GLYPHS = {
  queued: '◌',
  thinking: '◍',
  tool: '◈',
  done: '✓',
  failed: '✗',
  warn: '⚠',
  killed: '†',
  await: '⌁',
} as const;

export type GlyphName = keyof typeof GLYPHS;

export interface SpinnerDef {
  frames: readonly string[];
  /** Advance one frame every `div` ticks. */
  div: number;
  /** Static frame rendered under prefers-reduced-motion. */
  resolved: string;
}

export const SPINNERS = {
  materialize: {
    frames: ['·', '∘', '○', '◍', '●', '◍', '○', '∘'],
    div: 1,
    resolved: '●',
  },
  seance: {
    frames: ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'],
    div: 1,
    resolved: '⠁',
  },
  phase: {
    frames: ['░', '▒', '▓', '█', '▓', '▒'],
    div: 2,
    resolved: '█',
  },
  drift: {
    frames: [
      '▓░·      ',
      ' ▓░·     ',
      '  ▓░·    ',
      '   ▓░·   ',
      '    ▓░·  ',
      '     ▓░· ',
      '      ▓░·',
      '       ▓░',
      '        ▓',
      '         ',
    ],
    div: 1,
    resolved: '   ▓░·   ',
  },
  whisper: {
    frames: ['   ', '·  ', '·· ', '···', ' ··', '  ·'],
    div: 2,
    resolved: '···',
  },
  session: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    div: 1,
    resolved: '⠿',
  },
  streamdots: {
    frames: ['', '.', '..', '…'],
    div: 4,
    resolved: '…',
  },
} as const satisfies Record<string, SpinnerDef>;

export type SpinnerName = keyof typeof SPINNERS;
