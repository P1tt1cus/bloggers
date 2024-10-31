import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://yourusername.github.io',
  base: '/your-repo-name',
  integrations: [mdx()],
  markdown: {
    shikiConfig: {
      theme: 'tokyo-night',
      wrap: true
    }
  }
});