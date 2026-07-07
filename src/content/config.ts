import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

// Standalone self-contained HTML pages served verbatim from public/blog/.
// Each entry is a YAML sidecar holding the listing metadata.
const artifacts = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    file: z.string(),
  }),
});

export const collections = { posts, artifacts };
