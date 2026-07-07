// The only place URLs learn about the deploy base path. BASE_URL carries a
// trailing slash in Astro 4, so both sides are normalized before joining.
export const withBase = (path: string): string =>
  import.meta.env.BASE_URL.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
