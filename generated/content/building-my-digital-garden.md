---
id: "ks-building-digital-garden"
title: "Building My Digital Garden"
created: "2026-07-24"
updated: "2026-07-25"
summary: "A private Obsidian vault becomes a selective, connected, and maintainable public garden."
status: "active"
type: "post"
topic: "Knowledge Systems"
visibility: "public"
published: "2026-07-24T10:00:00-07:00"
slug: "building-my-digital-garden"
cover: "/assets/a/img/covers/building-my-digital-garden.webp"
lang: "en"
tags: ["digital-garden", "obsidian", "knowledge-graph", "hooni"]
series: "Knowledge Systems"
series_order: "2"
featured: false
parent: ["[[Knowledge Systems]]"]
depends_on: ["[[Zettelkasten as a Writing Engine]]"]
superseded_by: []
part_of: []
includes: []
---
# Building My Digital Garden

A long technical career produces notes faster than a person can maintain a filing system. Computer architecture overlaps with memory systems, machine learning, compilers, hardware design, performance modeling, and software frameworks. A useful observation may belong to several of those subjects at once.

At first, folders feel orderly. Later, the collection reaches a threshold where deciding where a note belongs takes more effort than writing it. Material accumulates chronologically, relationships disappear, and older work becomes difficult to reuse. I think of this as the *notebook-scalability problem*.

A digital garden is my attempt to solve that problem without pretending that knowledge is finished.

## Why a garden rather than an archive

An archive emphasizes preservation. A garden emphasizes continuing care.

Notes are planted as small ideas, revised when understanding improves, connected to neighboring ideas, and occasionally pruned when a newer explanation supersedes them. Index notes create paths through mature areas. Sparse areas reveal what still needs attention.

This is also why `Topics` is a better navigation label for this site than `Archive`. Chronology remains useful, but subject entry points reveal the structure that makes a note reusable.

The practice depends on the habits described in [Zettelkasten as a Writing Engine](/posts/zettelkasten-as-a-writing-engine/): capture quickly, convert worthwhile material into durable notes, and let larger subjects emerge from repeated connections.

## One source, two audiences

The human and the agent need different interfaces to the same knowledge.

For a person, the vault is ordinary Markdown viewed in Obsidian. Titles, folders, backlinks, tags, and wiki-style links make the collection approachable. The files remain portable and readable without a proprietary database.

For an agent, opening every Markdown file would waste context and hide important distinctions. [Hooni](https://github.com/neuralprobe/hooni-codex-plugin) builds a SQLite index with FTS5 search, stores stable document identities and ontology, and supports bounded graph traversal. The agent first sees ranked titles and summaries, then reads only the documents and neighbors that justify closer attention.

Neither interface replaces the other. They meet at the Markdown note.

## The current publication pipeline

The current system has a deliberate boundary:

1. My primary Obsidian vault, `myVault`, remains the broad second brain and research library.
2. The dedicated `blog` vault contains material selected and rewritten for publication.
3. [Hooni](https://github.com/neuralprobe/hooni-codex-plugin) validates required metadata, stable slugs, assets, and document relationships.
4. [Hooni](https://github.com/neuralprobe/hooni-codex-plugin) exports only notes explicitly marked `visibility: public`.
5. [Astro](https://github.com/neuralprobe/digital-garden) turns that derived snapshot into static article, topic, RSS, and graph pages.
6. [A static host](https://jonghoon.blog/) can publish the result without exposing the private vault or its index.

The private-to-public boundary is explicit at every step:

```text
+------------------+      +------------------+
| myVault          |      | blog vault       |
| private research | ---> | edited in English|
+------------------+      +------------------+
                               |
                               v
                     Hooni validate and export
                               |
                               v
                         Astro static build
                               |
                               v
                          Public website
```

The [website](https://jonghoon.blog/) never reads `myVault` directly. Provenance can remain in the private source note while Hooni strip\s internal source fields from the public export.

## The graph is an alternate table of contents

A decorative graph quickly becomes noise. A [useful graph](https://jonghoon.blog/garden) lets the reader ask a narrower question.

This garden distinguishes strong ontology edges—such as `parent`, `part_of`, `depends_on`, and `includes`—from contextual links found in prose. The default parent view shows a clean hierarchy. Other filters expose dependencies or every connection when the additional density is useful.

The conventional interfaces remain beside it:

- `Posts` presents writing chronologically.
- `Topics` presents broad subjects and expandable lists.
- `Graph` presents relationships.
- each article has its own stable page.

The views are complementary. A reader should never be required to understand the graph before reading an article.

## Gardening as a maintenance loop

The system only works if maintenance is cheaper than neglect. My recurring loop is:

- capture new material;
- search for related notes before creating another;
- rewrite useful fragments as durable explanations;
- add a small number of meaningful relations;
- update an index when a subject becomes navigable;
- validate links and metadata;
- publish only after an editorial pass;
- revisit old notes when new evidence changes them.

An agent can help with search, consistency, validation, and mechanical publication. The human still decides what matters, what is ready, and what should remain private.

## What success looks like

The goal is not a perfectly classified vault. It is a system that continues to produce understanding after years of use.

A successful garden makes forgotten work discoverable, turns reading into future writing, and gives unfinished ideas a place to mature without presenting them as settled truth. Its value grows not because every note is public, but because the paths between carefully chosen notes become easier to follow.
