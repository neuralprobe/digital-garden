---
id: "ks-hooni-codex-plugin"
title: "Hooni: Durable Memory and Coordination for Codex Agents"
aliases: ["Hooni: A Local-First Codex Plugin", "Hooni: Multi-Agent Knowledge Management for Codex"]
created: "2026-07-25"
updated: "2026-07-25"
summary: "How Hooni gives Codex agents durable handoffs and a searchable Obsidian knowledge graph."
status: "active"
type: "post"
topic: "Knowledge Systems"
visibility: "public"
published: "2026-07-25T21:25:00-07:00"
slug: "hooni-codex-plugin"
cover: "/assets/a/img/covers/hooni-codex-plugin.png"
lang: "en"
parent: ["[[Knowledge Systems]]"]
depends_on: []
superseded_by: []
part_of: []
includes: []
tags: ["hooni", "codex", "obsidian", "agents", "knowledge-graph"]
---
# Hooni: Durable Memory and Coordination for Codex Agents

Coding agents are good at solving the problem in front of them. The harder
problem begins when work spans multiple sessions: one agent needs to hand
context to another, a useful decision is buried in a private notebook, or a
publication workflow must expose selected writing without exposing the vault
behind it.

[Hooni](https://github.com/neuralprobe/hooni-codex-plugin) is an open-source,
local-first Codex plugin built around those continuity problems. It connects
long-lived agents with durable mailboxes and treats Obsidian Markdown as a
searchable graph rather than a directory to scan indiscriminately.

## Two kinds of continuity

Hooni joins two systems that are usually separate:

```text
Codex sessions <-> Durable mailboxes
       |
       v
  Hooni commands
       |
       +-> Obsidian Markdown
       |        |
       |        v
       |   SQLite FTS5 index
       |
       +-> Privacy-gated export
```

The first is *agent continuity*. Messages are stored in durable, at-least-once
mailboxes before an idle agent receives a short notification. An agent can
inspect pending messages, reply to the exact message that prompted the work,
and acknowledge it only after the request is handled. The substantive context
survives even when a terminal notification does not.

The second is *knowledge continuity*. Hooni incrementally indexes an Obsidian
vault into SQLite FTS5 outside the vault. An agent can search first, inspect the
most likely note, and traverse bounded relationships such as parents,
dependencies, and wikilinks. That makes retrieval deliberate and keeps
unrelated private notes out of the working context.

## The workflow in practice

A typical Hooni workflow begins with a human request, expands from one Codex
agent to another only when useful, and returns the result for review. Time moves
from top to bottom, while horizontal arrows show communication:

```text
Human              Codex Agent #1       Codex Agent #2
  |                      |                    |
  |-- request ---------->|                    |
  |                      | [search vault]     |
  |                      |                    |
  |                      |-- durable task --->|
  |                      |                    | [read mailbox]
  |                      |                    | [search/edit]
  |                      |<-- reply + ack ----|
  |                      | [integrate]        |
  |                      | [validate links]   |
  |<-- review draft -----|                    |
  |-- approve/publish -->|                    |
  |                      |                    |
  v                      v                    v
   \                     |                   /
    \                    |                  /
     +-------------------+-----------------+
                         |
                         v
      +---------------------------------------------+
      | Obsidian Vault (Knowledge Graph)            |
      |                                             |
      | Graph-ready Markdown                        |
      | - stable IDs, frontmatter, and wikilinks    |
      | - notes created and maintained by agents    |
      |                                             |
      | Hooni-managed retrieval                     |
      | - incremental indexing and link validation  |
      | - SQLite metadata and graph relations       |
      | - FTS5 full-text search and traversal       |
      +---------------------------------------------+
                         |
              +----------+----------+
              |                     |
              v                     v
   +----------------------+  +----------------------+
   | Human reuse          |  | Agent reuse          |
   | - read in Obsidian   |  | - FTS5 ranked search |
   | - Digital Garden     |  | - inspect documents  |
   | - follow wikilinks   |  | - traverse the graph |
   +----------+-----------+  +-----------+----------+
              \                         /
               +-----------+-----------+
                           |
                           v
               New questions and work
```

The durable mailbox carries the complete handoff rather than relying on a
terminal notification. Both agents search before reading broadly, and their
work converges on graph-ready Markdown in the same Obsidian vault. Hooni keeps
that vault incrementally indexed in SQLite, exposes its text through FTS5, and
validates the relationships encoded in frontmatter and wikilinks.

The same knowledge then flows outward again. A person can read and follow links
inside the private Obsidian vault or browse selected public notes through the
Digital Garden. An agent can run a ranked FTS5 search, inspect only the likely
documents, and traverse graph relations when neighboring context matters.
Those readings produce new questions, decisions, and edits that begin the next
cycle. Publication remains a separate, explicit step after validation and
human approval.

## Markdown remains the interface

The vault remains ordinary Markdown that is readable and editable in Obsidian.
Frontmatter gives each document a stable identity and explicit ontology;
wikilinks make contextual relationships visible to both people and tools. This
is the same principle behind [Zettelkasten as a Writing Engine](/posts/zettelkasten-as-a-writing-engine/): notes become
more useful when their identities and relationships survive the session in
which they were written.

Hooni adds validation around that interface. It reports broken or ambiguous
links instead of guessing. Its exporter includes public notes, rewrites their
wikilinks for the web, copies referenced assets, and rejects public documents
that would leak a link to a private note. That privacy boundary supports the
selective workflow described in [Building My Digital Garden](/posts/building-my-digital-garden/).

## A small command surface

The plugin presents one Hooni skill to Codex, backed by focused commands for
agent communication and vault work:

```bash
python3 scripts/talk_agent.py inbox
python3 scripts/vault_db.py search "durable knowledge"
python3 scripts/vault_db.py traverse document-id --depth 2
python3 scripts/vault_db.py validate
python3 scripts/vault_db.py export --vault blog-garden --output ./generated
```

The current `0.1.0` release is intentionally an MVP. It has no daemon and no
third-party Python dependencies; its present focus is reliable local workflows
with Codex, tmux, and Obsidian rather than a hosted collaboration service.
Schemas and commands may still evolve as real projects exercise them.

## The work should outlive the session

Hooni's central idea is simple: useful work should outlive the agent session
that produced it. Durable mailboxes keep coordination from disappearing, while
graph-ready Markdown turns each result into context that people and future
agents can find, inspect, and connect to earlier work. Human review and an
explicit publication boundary keep that accumulated memory under human
control.

The value is therefore not only in completing one task faster. It is in making
each completed task leave behind a more navigable system for the next question.
Over time, agent coordination and personal knowledge stop being separate
workflows and become one durable loop of reading, acting, reviewing, and
remembering.

If durable agent handoffs and a local knowledge graph sound useful, explore the
source, installation guide, and examples in the
[Hooni GitHub repository](https://github.com/neuralprobe/hooni-codex-plugin).
Issues and contributions are welcome.
