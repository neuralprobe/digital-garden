import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./generated/content" }),
  schema: z.looseObject({
      id: z.string(),
      title: z.string(),
      aliases: z.array(z.string()).default([]),
      created: z.coerce.date(),
      updated: z.coerce.date(),
      published: z.coerce.date(),
      summary: z.string().max(100),
      status: z.enum(["active", "superseded", "archived"]),
      type: z.enum(["post", "index", "page"]),
      topic: z.string().optional(),
      visibility: z.enum(["public", "unlisted"]),
      slug: z.string(),
      lang: z.string().default("en"),
      tags: z.array(z.string()).default([]),
      series: z.string().nullable().optional(),
      series_order: z.coerce.number().nullable().optional(),
      featured: z.boolean().default(false),
      cover: z.string().nullable().optional(),
      legacy_url: z.string().optional(),
      includes: z.array(z.string()).default([])
    })
});

export const collections = { posts };
