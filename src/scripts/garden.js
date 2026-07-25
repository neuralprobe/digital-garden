import * as d3 from "d3";
import {
  PRESETS,
  RELATIONS,
  clampPanelWidth,
  displayEdge,
  filterGraph,
  nodeForPostUrl,
  parseRelationState,
  relationStateKey
} from "./graph-filter.js";
import { comparePublishedDesc } from "./content-order.js";

const RELATION_LABELS = {
  parent: "Parent",
  part_of: "Part of",
  depends_on: "Depends on",
  includes: "Includes",
  wikilink: "Wiki link"
};

const RELATION_COLORS = {
  parent: "#c56838",
  part_of: "#58767a",
  depends_on: "#a78a4f",
  includes: "#775f8f",
  wikilink: "#9aa09a"
};

const graph = JSON.parse(document.querySelector("#graph-data").textContent);
const svgElement = document.querySelector("[data-graph]");
const stage = document.querySelector("[data-graph-stage]");
const timeline = document.querySelector("[data-timeline]");
const search = document.querySelector("[data-note-search]");
const readerTitle = document.querySelector("[data-reader-title]");
const readerBody = document.querySelector("[data-reader-body]");
const openNote = document.querySelector("[data-open-note]");
const graphCount = document.querySelector("[data-graph-count]");
const graphEmpty = document.querySelector("[data-graph-empty]");
const hideIsolatesInput = document.querySelector("[data-hide-isolates]");
const relationOptions = document.querySelector("[data-relation-options]");
const legend = document.querySelector("[data-graph-legend]");
const explorer = document.querySelector(".garden-explorer");
const app = document.querySelector(".garden-app");
const panelWidthsKey = "jonghoon-blog:graph-panel-widths";
const panelDefaults = { explorer: 280, reader: 470 };
const panelMinimums = { explorer: 220, reader: 320 };
const panelMaximums = { explorer: 420, reader: 650 };
const minimumGraphWidth = 420;

function titleLines(title, limit = 24) {
  const words = title.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= limit || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

const params = new URLSearchParams(window.location.search);
let selectedRelations = parseRelationState(params.get("edges") || "parent");
let hideIsolates = params.has("isolates")
  ? params.get("isolates") !== "show"
  : true;
let selectedId = params.get("focus") || graph.nodes[0]?.id || null;
let simulation;
let zoomTransform = d3.zoomIdentity;
let pendingCenterSelection = false;
const nodePositions = new Map();

function currentPanelWidth(side) {
  const value = getComputedStyle(app).getPropertyValue(`--${side}-width`);
  return Number.parseFloat(value) || panelDefaults[side];
}

function setPanelWidth(side, requested) {
  const other = side === "explorer" ? "reader" : "explorer";
  const width = clampPanelWidth(requested, {
    minimum: panelMinimums[side],
    maximum: panelMaximums[side],
    containerWidth: app.clientWidth,
    otherPanelWidth: currentPanelWidth(other),
    minimumCenterWidth: minimumGraphWidth
  });
  app.style.setProperty(`--${side}-width`, `${width}px`);
  document
    .querySelector(`[data-resize-panel="${side}"]`)
    ?.setAttribute("aria-valuenow", String(width));
  return width;
}

function savePanelWidths() {
  try {
    localStorage.setItem(
      panelWidthsKey,
      JSON.stringify({
        explorer: currentPanelWidth("explorer"),
        reader: currentPanelWidth("reader")
      })
    );
  } catch {
    // Resizing remains available when browser storage is blocked.
  }
}

try {
  const stored = JSON.parse(localStorage.getItem(panelWidthsKey) || "{}");
  for (const side of ["explorer", "reader"]) {
    if (Number.isFinite(stored[side])) setPanelWidth(side, stored[side]);
  }
} catch {
  // Ignore malformed or unavailable browser storage.
}

document.querySelectorAll("[data-resize-panel]").forEach((handle) => {
  const side = handle.dataset.resizePanel;
  let startX = 0;
  let startWidth = 0;

  const applyDelta = (delta) => {
    const direction = side === "explorer" ? 1 : -1;
    setPanelWidth(side, startWidth + delta * direction);
  };

  handle.addEventListener("pointerdown", (event) => {
    startX = event.clientX;
    startWidth = currentPanelWidth(side);
    handle.setPointerCapture(event.pointerId);
    handle.classList.add("active");
    document.body.classList.add("resizing-panels");
  });
  handle.addEventListener("pointermove", (event) => {
    if (!handle.hasPointerCapture(event.pointerId)) return;
    applyDelta(event.clientX - startX);
  });
  const finishResize = (event) => {
    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }
    handle.classList.remove("active");
    document.body.classList.remove("resizing-panels");
    savePanelWidths();
  };
  handle.addEventListener("pointerup", finishResize);
  handle.addEventListener("pointercancel", finishResize);
  handle.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    startWidth = currentPanelWidth(side);
    applyDelta(event.key === "ArrowRight" ? 14 : -14);
    savePanelWidths();
  });
  handle.addEventListener("dblclick", () => {
    setPanelWidth(side, panelDefaults[side]);
    savePanelWidths();
  });
});

hideIsolatesInput.checked = hideIsolates;

for (const relation of RELATIONS) {
  const label = document.createElement("label");
  label.innerHTML = `
    <input type="checkbox" value="${relation}" />
    <i style="--relation-color:${RELATION_COLORS[relation]}"></i>
    ${RELATION_LABELS[relation]}
  `;
  const input = label.querySelector("input");
  input.checked = selectedRelations.has(relation);
  input.addEventListener("change", () => {
    selectedRelations = new Set(
      [...relationOptions.querySelectorAll("input:checked")].map(
        (item) => item.value
      )
    );
    if (!selectedRelations.size) {
      input.checked = true;
      selectedRelations.add(relation);
    }
    renderGraph();
    syncControls();
    writeUrl();
  });
  relationOptions.append(label);
}

for (const relation of RELATIONS) {
  const item = document.createElement("span");
  item.innerHTML = `<i style="--relation-color:${RELATION_COLORS[relation]}"></i>${RELATION_LABELS[relation]}`;
  legend.append(item);
}

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedRelations = new Set(PRESETS[button.dataset.preset]);
    hideIsolates = button.dataset.preset !== "all";
    hideIsolatesInput.checked = hideIsolates;
    renderGraph();
    syncControls();
    writeUrl();
  });
});

hideIsolatesInput.addEventListener("change", () => {
  hideIsolates = hideIsolatesInput.checked;
  renderGraph();
  writeUrl();
});

search.addEventListener("input", () => renderTimeline(search.value));

document.querySelector("[data-open-explorer]").addEventListener("click", () => {
  explorer.classList.add("open");
});
document.querySelector("[data-close-panel]").addEventListener("click", () => {
  explorer.classList.remove("open");
});

readerBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest("a[href]");
  if (!(link instanceof HTMLAnchorElement)) return;
  const node = nodeForPostUrl(
    graph.nodes,
    link.href,
    window.location.origin
  );
  if (!node) return;
  event.preventDefault();
  selectNode(node.id);
});

function writeUrl() {
  const next = new URL(window.location.href);
  next.searchParams.set("edges", relationStateKey(selectedRelations));
  if (selectedId) next.searchParams.set("focus", selectedId);
  if (!hideIsolates) next.searchParams.set("isolates", "show");
  else next.searchParams.delete("isolates");
  window.history.replaceState({}, "", next);
}

function syncControls() {
  relationOptions.querySelectorAll("input").forEach((input) => {
    input.checked = selectedRelations.has(input.value);
  });
  document.querySelectorAll("[data-preset]").forEach((button) => {
    const preset = PRESETS[button.dataset.preset];
    button.classList.toggle(
      "active",
      preset.length === selectedRelations.size &&
        preset.every((relation) => selectedRelations.has(relation))
    );
  });
}

function renderTimeline(query = "") {
  const normalized = query.trim().toLowerCase();
  const nodes = [...graph.nodes]
    .filter(
      (node) =>
        !normalized ||
        node.title.toLowerCase().includes(normalized) ||
        node.summary.toLowerCase().includes(normalized)
    )
    .sort(comparePublishedDesc);
  const groups = Map.groupBy(nodes, (node) => node.published.slice(0, 4));
  timeline.replaceChildren();
  for (const [year, items] of groups) {
    const section = document.createElement("section");
    const heading = document.createElement("h3");
    heading.textContent = year;
    section.append(heading);
    for (const node of items) {
      const button = document.createElement("button");
      button.className = node.id === selectedId ? "active" : "";
      button.innerHTML = `<span>${node.title}</span><small>${node.summary}</small>`;
      button.addEventListener("click", () => selectNode(node.id));
      section.append(button);
    }
    timeline.append(section);
  }
  if (!nodes.length) {
    timeline.innerHTML = `<p class="no-results">No notes match that search.</p>`;
  }
}

async function selectNode(id, { updateGraph = true } = {}) {
  const node = graph.nodes.find((item) => item.id === id);
  if (!node) return;
  const selectionChanged = selectedId !== id;
  selectedId = id;
  readerTitle.textContent = node.title;
  openNote.href = `/posts/${node.slug}/`;
  readerBody.innerHTML = `<div class="reader-loading">Loading note…</div>`;
  renderTimeline(search.value);
  if (updateGraph) {
    pendingCenterSelection = selectionChanged;
    renderGraph();
  }
  writeUrl();
  explorer.classList.remove("open");
  try {
    const response = await fetch(`/posts/${node.slug}/`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const documentFragment = new DOMParser().parseFromString(html, "text/html");
    const article = documentFragment.querySelector("[data-article]");
    if (!article) throw new Error("Article fragment missing");
    article.querySelector(".article-header")?.remove();
    readerBody.replaceChildren(article);
  } catch (error) {
    readerBody.innerHTML = `
      <div class="reader-error">
        <p>The note preview could not be loaded.</p>
        <a href="/posts/${node.slug}/">Open the full article</a>
      </div>
    `;
  }
}

function renderGraph({ centerSelection = pendingCenterSelection } = {}) {
  simulation?.nodes().forEach((item) => {
    if (Number.isFinite(item.x) && Number.isFinite(item.y)) {
      nodePositions.set(item.id, { x: item.x, y: item.y });
    }
  });
  simulation?.stop();
  const filtered = filterGraph(graph, selectedRelations, hideIsolates);
  const nodes = filtered.nodes.map((node) => ({
    ...node,
    ...(nodePositions.get(node.id) || {})
  }));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const rawEdges = filtered.edges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map(displayEdge);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges = rawEdges.map((edge) => ({
    ...edge,
    source: nodeById.get(edge.source),
    target: nodeById.get(edge.target)
  }));
  const parentOnly =
    selectedRelations.size === 1 && selectedRelations.has("parent");

  graphCount.textContent = `${nodes.length} nodes · ${edges.length} edges`;
  graphEmpty.hidden = nodes.length > 0;

  const width = Math.max(stage.clientWidth, 320);
  const height = Math.max(stage.clientHeight, 420);
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();
  svg.attr("viewBox", [0, 0, width, height]);

  const defs = svg.append("defs");
  for (const relation of RELATIONS) {
    defs
      .append("marker")
      .attr("id", `arrow-${relation}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", RELATION_COLORS[relation])
      .attr("d", "M0,-5L10,0L0,5");
  }

  const root = svg.append("g");
  const zoom = d3
    .zoom()
    .scaleExtent([0.35, 2.6])
    .on("zoom", (event) => {
      zoomTransform = event.transform;
      root.attr("transform", event.transform);
    });
  svg.call(zoom).call(zoom.transform, zoomTransform);

  const links = root
    .append("g")
    .attr("class", "graph-links")
    .selectAll("line")
    .data(edges)
    .join("line")
    .attr("stroke", (edge) => RELATION_COLORS[edge.relation])
    .attr("stroke-opacity", (edge) => (edge.relation === "wikilink" ? 0.28 : 0.72))
    .attr("stroke-width", (edge) => (edge.relation === "wikilink" ? 1 : 1.8))
    .attr("marker-end", (edge) => `url(#arrow-${edge.relation})`);

  const node = root
    .append("g")
    .attr("class", "graph-nodes")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-label", (item) => item.title)
    .classed("selected", (item) => item.id === selectedId)
    .on("click", (_event, item) => selectNode(item.id))
    .on("keydown", (event, item) => {
      if (event.key === "Enter" || event.key === " ") selectNode(item.id);
    });

  node
    .append("circle")
    .attr("r", (item) => (item.id === selectedId ? 11 : item.series_order ? 7 : 9))
    .attr("stroke-width", 2.2);

  node
    .append("text")
    .attr("text-anchor", "middle")
    .attr("y", 23)
    .each(function (item) {
      d3.select(this)
        .selectAll("tspan")
        .data(titleLines(item.title))
        .join("tspan")
        .attr("x", 0)
        .attr("dy", (_line, index) => (index === 0 ? 0 : "1.12em"))
        .text((line) => line);
    });

  node.append("title").text((item) => `${item.title}\n${item.summary}`);

  const updatePositions = () => {
    links
      .attr("x1", (edge) => edge.source.x)
      .attr("y1", (edge) => edge.source.y)
      .attr("x2", (edge) => edge.target.x)
      .attr("y2", (edge) => edge.target.y);
    node.attr("transform", (item) => `translate(${item.x},${item.y})`);
    nodes.forEach((item) => {
      if (Number.isFinite(item.x) && Number.isFinite(item.y)) {
        nodePositions.set(item.id, { x: item.x, y: item.y });
      }
    });
  };

  if (parentOnly) {
    const incoming = new Map(nodes.map((item) => [item.id, 0]));
    const children = new Map(nodes.map((item) => [item.id, []]));
    for (const edge of edges) {
      incoming.set(edge.target.id, (incoming.get(edge.target.id) || 0) + 1);
      children.get(edge.source.id)?.push(edge.target.id);
    }
    const roots = nodes
      .filter((item) => incoming.get(item.id) === 0)
      .map((item) => item.id);
    const levels = [];
    const queue = roots.map((id) => [id, 0]);
    const visited = new Set();
    while (queue.length) {
      const [id, depth] = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      levels[depth] ??= [];
      levels[depth].push(id);
      for (const child of children.get(id) || []) {
        queue.push([child, depth + 1]);
      }
    }
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        levels[0] ??= [];
        levels[0].push(node.id);
      }
    }
    const verticalStep =
      levels.length > 1 ? Math.min(190, (height - 150) / (levels.length - 1)) : 0;
    levels.forEach((ids, depth) => {
      ids.forEach((id, index) => {
        const item = nodeById.get(id);
        item.x = ((index + 1) * width) / (ids.length + 1);
        item.y = levels.length > 1 ? 76 + depth * verticalStep : height / 2;
        item.hierarchyX = item.x;
        item.hierarchyY = item.y;
      });
    });
    simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(edges).id((item) => item.id).distance(118).strength(0.72)
      )
      .force("charge", d3.forceManyBody().strength(-240))
      .force("x", d3.forceX((item) => item.hierarchyX).strength(0.18))
      .force("y", d3.forceY((item) => item.hierarchyY).strength(0.68))
      .force("collision", d3.forceCollide().radius(54))
      .on("tick", updatePositions);
    simulation.tick(60);
    updatePositions();
    simulation.alpha(0.16).restart();
  } else {
    simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink(edges).id((item) => item.id).distance(118).strength(0.75)
      )
      .force("charge", d3.forceManyBody().strength(-360))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(54))
      .on("tick", updatePositions);
    simulation.tick(100);
    updatePositions();
    simulation.alpha(0.18).restart();
  }

  node.call(
    d3
      .drag()
      .on("start", (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event) => {
        if (!event.active) simulation.alphaTarget(0);
        if (!parentOnly) {
          event.subject.fx = null;
          event.subject.fy = null;
        }
      })
  );

  const focusedNode = nodes.find((item) => item.id === selectedId);
  if (centerSelection && focusedNode) {
    const scale = zoomTransform.k;
    const target = d3.zoomIdentity
      .translate(width / 2 - focusedNode.x * scale, height / 2 - focusedNode.y * scale)
      .scale(scale);
    svg
      .transition()
      .duration(650)
      .ease(d3.easeCubicInOut)
      .call(zoom.transform, target);
  }
  pendingCenterSelection = false;
}

syncControls();
renderTimeline();
renderGraph({ centerSelection: true });
if (selectedId) selectNode(selectedId, { updateGraph: false });

let resizeTimer;
new ResizeObserver(() => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(renderGraph, 120);
}).observe(stage);
