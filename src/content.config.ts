import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    order: z.number().optional(),
    summary: z.string(),
    heroImage: z.string().optional(),
    externalUrl: z.string().optional(),
    videos: z
      .array(
        z.object({
          url: z.string(),
          caption: z.string().optional(),
          poster: z.string().optional(),
        })
      )
      .default([]),
    gallery: z.array(z.string()).default([]),
  }),
});

const discography = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/discography' }),
  schema: z.object({
    title: z.string(),
    order: z.number().optional(),
    credits: z.string(),
    label: z.string().optional(),
    year: z.string().optional(),
    image: z.string().optional(),
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string(),
        })
      )
      .default([]),
    soldOut: z.boolean().default(false),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: z.object({
    order: z.number().optional(),
    quote: z.string(),
    author: z.string(),
  }),
});

// Grants have no manual order — the page groups them and sorts by year.
const grants = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/grants' }),
  schema: z.object({
    year: z.string(),
    description: z.string(),
    group: z.enum(['artist', 'festival', 'philanthropic']),
  }),
});

export const collections = {
  projects,
  discography,
  testimonials,
  grants,
};
