import test from "node:test";
import assert from "node:assert/strict";
import {
  PRESETS,
  clampPanelWidth,
  displayEdge,
  filterGraph,
  nodeForPostUrl,
  parseRelationState,
  relatedDocuments,
  relationStateKey
} from "../src/scripts/graph-filter.js";

const graph = {
  nodes: [
    { id: "series", published: "2026-07-24" },
    { id: "article", published: "2026-07-24" },
    { id: "reference", published: "2026-07-24" },
    { id: "isolated", published: "2026-07-24" }
  ],
  edges: [
    { source: "article", target: "series", relation: "parent" },
    { source: "article", target: "reference", relation: "wikilink" }
  ]
};

test("parent preset includes only parent edges and hides isolated nodes", () => {
  const filtered = filterGraph(graph, new Set(PRESETS.parent), true);
  assert.deepEqual(
    filtered.edges.map((edge) => edge.relation),
    ["parent"]
  );
  assert.deepEqual(
    filtered.nodes.map((node) => node.id).sort(),
    ["article", "series"]
  );
});

test("parent edges display from parent to child", () => {
  assert.deepEqual(displayEdge(graph.edges[0]), {
    source: "series",
    target: "article",
    relation: "parent"
  });
});

test("relation state round trips through the URL format", () => {
  const selected = parseRelationState("parent,depends_on");
  assert.equal(relationStateKey(selected), "parent,depends_on");
  assert.deepEqual([...parseRelationState("all")], PRESETS.all);
});

test("panel width respects its bounds and leaves room for the graph", () => {
  const options = {
    minimum: 220,
    maximum: 420,
    containerWidth: 1200,
    otherPanelWidth: 470,
    minimumCenterWidth: 420
  };
  assert.equal(clampPanelWidth(100, options), 220);
  assert.equal(clampPanelWidth(900, options), 294);
  assert.equal(clampPanelWidth(280, options), 280);
});

test("internal post URLs resolve to graph nodes", () => {
  const nodes = [{ id: "note-1", slug: "connected-note" }];
  assert.equal(
    nodeForPostUrl(
      nodes,
      "https://jonghoon.blog/posts/connected-note/",
      "https://jonghoon.blog"
    )?.id,
    "note-1"
  );
  assert.equal(
    nodeForPostUrl(
      nodes,
      "https://example.com/posts/connected-note/",
      "https://jonghoon.blog"
    ),
    null
  );
});

test("related documents separate parents, outgoing links, and backlinks", () => {
  const related = relatedDocuments(
    {
      nodes: [
        { id: "article", slug: "article" },
        { id: "series", slug: "series" },
        { id: "linked", slug: "linked" },
        { id: "backlink", slug: "backlink" }
      ],
      edges: [
        { source: "article", target: "series", relation: "parent" },
        { source: "article", target: "linked", relation: "wikilink" },
        { source: "article", target: "linked", relation: "wikilink" },
        { source: "backlink", target: "article", relation: "wikilink" }
      ]
    },
    "article"
  );
  assert.deepEqual(related.parent.map((node) => node.id), ["series"]);
  assert.deepEqual(related.links.map((node) => node.id), ["linked"]);
  assert.deepEqual(related.backlinks.map((node) => node.id), ["backlink"]);
});
