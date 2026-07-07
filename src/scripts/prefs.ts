const query = '(prefers-reduced-motion: reduce)';

export const prefersReduced = (): boolean => window.matchMedia(query).matches;

export const scrollBehavior = (): ScrollBehavior => (prefersReduced() ? 'auto' : 'smooth');

export function onMotionPreferenceChange(handler: (reduced: boolean) => void): void {
  window.matchMedia(query).addEventListener('change', (e) => handler(e.matches));
}
