import { getCollection, type CollectionEntry } from 'astro:content';
import { withBase } from './url';

export interface PostTransmission {
  kind: 'post';
  slug: string;
  title: string;
  date: Date;
  description: string;
  href: string;
  words: number;
  minutes: number;
  entry: CollectionEntry<'posts'>;
}

export interface ArtifactTransmission {
  kind: 'artifact';
  slug: string;
  title: string;
  date: Date;
  description: string;
  href: string;
}

/** An in-repo .astro page (e.g. the component gallery) listed in the stream. */
export interface PageTransmission {
  kind: 'page';
  slug: string;
  title: string;
  date: Date;
  description: string;
  href: string;
}

export type Transmission = PostTransmission | ArtifactTransmission | PageTransmission;

const WORDS_PER_MINUTE = 200;

/** Markdown posts + standalone HTML artifacts as one typed list, newest first. */
export async function getTransmissions(): Promise<Transmission[]> {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const artifacts = await getCollection('artifacts');

  const postEntries: Transmission[] = posts.map((entry) => {
    const words = entry.body.split(/\s+/).filter(Boolean).length;
    return {
      kind: 'post',
      slug: entry.slug,
      title: entry.data.title,
      date: entry.data.date,
      description: entry.data.description,
      href: withBase(`blog/${entry.slug}/`),
      words,
      minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
      entry,
    };
  });

  const artifactEntries: Transmission[] = artifacts.map((entry) => ({
    kind: 'artifact',
    slug: entry.id,
    title: entry.data.title,
    date: entry.data.date,
    description: entry.data.description,
    href: withBase(`blog/${entry.data.file}`),
  }));

  const pages: Transmission[] = [
    {
      kind: 'page',
      slug: 'components',
      title: 'UI Components',
      date: new Date('2026-07-08'),
      description: 'A live gallery of the terminal UI kit — palette, glyphs, spinners, panels',
      href: withBase('blog/components/'),
    },
  ];

  return [...postEntries, ...artifactEntries, ...pages].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
}

export const formatDate = (date: Date): string => date.toISOString().slice(0, 10);
