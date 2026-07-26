# Jong Hoon's Blog

An Astro static site generated from a Hooni-managed Obsidian blog vault.

## Control flow

1. Write and link notes in Obsidian.
2. Hooni indexes and validates the vault.
3. `npm run export` asks Hooni to produce a public-only snapshot in
   `generated/`.
4. Astro renders that snapshot as article pages, RSS, and a D3 knowledge
   garden.
5. `npm run privacy-check` rejects a build if private source paths or
   provenance fields leak into `dist/`.

The website never reads the vault directly. Hooni is the publication boundary:
only notes marked `visibility: public` are exported, links to non-public notes
fail validation, Obsidian wikilinks become site URLs, and embedded assets are
copied into the generated public directory.

`generated/` is the public Hooni export snapshot used by the site build. It may
be committed because it contains only public content; never put the private
source vault or Hooni runtime state in this repository. `dist/` is build output
and remains ignored.

## Local development

From WSL:

```bash
cd /home/jonghoon/code/jonghoon-blog
npm run dev
```

Open <http://localhost:4321>. The knowledge garden is at
<http://localhost:4321/graph/>.

To test the complete Cloudflare Worker and local D1 Like flow:

```bash
npm run dev:full
```

Open <http://localhost:8787>. Local Like data is persisted by Wrangler beneath
`.wrangler/` and is never mixed with production data.

After changing vault notes, restart `npm run dev` or run `npm run export`.
Before publishing, run:

```bash
npm run build
npm run preview
```

## Content requirements

A public post needs the normal Hooni note fields plus:

```yaml
type: post
visibility: public
published: 2026-07-24
slug: stable-url-slug
lang: en
tags:
  - example
```

Optional site fields are `series`, `series_order`, `featured`, `cover`, and
`legacy_url`. Keep slugs stable after publication. Draft and private notes
should use `visibility: private`.

Topic reading paths come from each public index note's ordered `includes`
list. Keep the human-readable numbered list in the index body in the same
order. `series_order` remains a validation field: the build fails when it
disagrees with the corresponding position in `includes`, when an include
cannot be resolved, or when a topical post is missing from every index.
Posts and RSS include both essays and index overviews in reverse publication
order. Within a reading path, assign earlier publication timestamps to earlier
items; the index overview must be published before the documents it includes.

The vault mirrors the established `myVault` structure: posts live at the vault
root, indexes in `index/`, templates in `template/`, and attachments beneath
`a/`. Hooni excludes templates and attachment support files through
`.hooniignore`.

## Deployment

`wrangler.jsonc` is ready for Cloudflare Workers Static Assets. The production
Worker is deployed with the `jonghoon-blog` service, and `jonghoon.blog` is
attached as its custom domain. A local deployment runs:

```bash
npm run deploy
```

For a separate Cloudflare account, create a D1 database, set its ID in the top
level `DB` binding, and apply the migration before deploying:

```bash
wrangler d1 create jonghoon-blog-likes
npm run likes:migrate:remote
npm run deploy
```

The `env.local` binding is local-only. Keep it separate from the production
binding when developing locally.

The first migrated WordPress URL is retained as a local legacy redirect page.
Production migration should also add a Cloudflare 301 redirect and preserve a
complete URL map before DNS is changed.
