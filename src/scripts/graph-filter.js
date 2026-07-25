export const RELATIONS = [
  "parent",
  "part_of",
  "depends_on",
  "includes",
  "wikilink"
];

export const PRESETS = {
  all: RELATIONS,
  parent: ["parent"],
  structure: ["parent", "part_of", "includes"],
  dependencies: ["depends_on"],
  links: ["wikilink"]
};

export function parseRelationState(value) {
  if (!value || value === "all") return new Set(PRESETS.all);
  const relations = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => RELATIONS.includes(item));
  return new Set(relations.length ? relations : PRESETS.parent);
}

export function relationStateKey(selected) {
  if (selected.size === RELATIONS.length) return "all";
  return RELATIONS.filter((relation) => selected.has(relation)).join(",");
}

export function filterGraph(graph, selected, hideIsolates = false) {
  const edges = graph.edges.filter((edge) => selected.has(edge.relation));
  if (!hideIsolates) {
    return { nodes: [...graph.nodes], edges };
  }
  const connected = new Set(
    edges.flatMap((edge) => [
      typeof edge.source === "object" ? edge.source.id : edge.source,
      typeof edge.target === "object" ? edge.target.id : edge.target
    ])
  );
  return {
    nodes: graph.nodes.filter((node) => connected.has(node.id)),
    edges
  };
}

export function displayEdge(edge) {
  if (edge.relation !== "parent") return { ...edge };
  return {
    ...edge,
    source: typeof edge.target === "object" ? edge.target.id : edge.target,
    target: typeof edge.source === "object" ? edge.source.id : edge.source
  };
}

export function clampPanelWidth(
  requested,
  {
    minimum,
    maximum,
    containerWidth,
    otherPanelWidth,
    minimumCenterWidth,
    handleWidth = 16
  }
) {
  const availableMaximum =
    containerWidth - otherPanelWidth - minimumCenterWidth - handleWidth;
  const effectiveMaximum = Math.max(
    minimum,
    Math.min(maximum, availableMaximum)
  );
  return Math.round(Math.min(effectiveMaximum, Math.max(minimum, requested)));
}

export function nodeForPostUrl(nodes, href, origin) {
  const url = new URL(href, origin);
  if (url.origin !== new URL(origin).origin) return null;
  const match = url.pathname.match(/^\/posts\/([^/]+)\/?$/);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]);
  return nodes.find((node) => node.slug === slug) || null;
}

export function relatedDocuments(graph, documentId) {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const collect = (edges, relatedId) => {
    const seen = new Set();
    return edges.flatMap((edge) => {
      const id = relatedId(edge);
      const node = nodes.get(id);
      if (!node || seen.has(id)) return [];
      seen.add(id);
      return [node];
    });
  };

  return {
    parent: collect(
      graph.edges.filter(
        (edge) => edge.relation === "parent" && edge.source === documentId
      ),
      (edge) => edge.target
    ),
    links: collect(
      graph.edges.filter(
        (edge) => edge.relation === "wikilink" && edge.source === documentId
      ),
      (edge) => edge.target
    ),
    backlinks: collect(
      graph.edges.filter(
        (edge) => edge.relation === "wikilink" && edge.target === documentId
      ),
      (edge) => edge.source
    )
  };
}
