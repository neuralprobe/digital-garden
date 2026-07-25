import test from "node:test";
import assert from "node:assert/strict";
import {
  isPublication,
  seriesNavigation,
  sortByPublished,
  topicReadingPaths
} from "../src/scripts/content-order.js";

function entry(id, data) {
  return { id, data: { id, ...data } };
}

const overview = entry("overview", {
  title: "Architecture",
  slug: "architecture",
  type: "index",
  topic: "Architecture",
  series: "Architecture Series",
  published: "2026-07-24T08:00:00-07:00",
  includes: ["[[First Article]]", "[[Second Article]]"]
});
const first = entry("first", {
  title: "First Article",
  slug: "first-article",
  type: "post",
  topic: "Architecture",
  series: "Architecture Series",
  series_order: 1,
  published: "2026-07-24T09:00:00-07:00"
});
const second = entry("second", {
  title: "Second Article",
  slug: "second-article",
  type: "post",
  topic: "Architecture",
  series: "Architecture Series",
  series_order: 2,
  published: "2026-07-24T10:00:00-07:00"
});

test("topic order follows the index includes list, not collection order", () => {
  const topics = topicReadingPaths([second, overview, first]);
  assert.deepEqual(
    topics[0].documents.map((document) => document.data.id),
    ["overview", "first", "second"]
  );
});

test("series navigation reuses the index reading path", () => {
  const navigation = seriesNavigation(second, [second, overview, first]);
  assert.equal(navigation.index.data.id, "overview");
  assert.equal(navigation.previous.data.id, "first");
  assert.equal(navigation.next, null);
});

test("topic validation rejects series_order that disagrees with the index", () => {
  const wrong = entry("wrong", {
    ...first.data,
    id: "wrong",
    title: "First Article",
    series_order: 2
  });
  assert.throws(
    () => topicReadingPaths([overview, wrong, second]),
    /series_order must be 1/
  );
});

test("topic validation rejects posts omitted from every index", () => {
  const orphan = entry("orphan", {
    title: "Orphan",
    slug: "orphan",
    type: "post",
    topic: "Architecture",
    published: "2026-07-24"
  });
  assert.throws(
    () => topicReadingPaths([overview, first, second, orphan]),
    /Topic posts missing from an index: Orphan/
  );
});

test("topic validation rejects publication dates that reverse reading order", () => {
  const tooEarly = entry("too-early", {
    ...second.data,
    id: "too-early",
    title: "Second Article",
    published: "2026-07-24T08:30:00-07:00"
  });
  assert.throws(
    () => topicReadingPaths([overview, first, tooEarly]),
    /published must be later than First Article/
  );
});

test("publication order has a stable slug tie-breaker", () => {
  const tiedSecond = entry("second", {
    ...second.data,
    published: first.data.published
  });
  const ordered = sortByPublished([
    tiedSecond,
    entry("newest", {
      title: "Newest",
      slug: "newest",
      type: "post",
      published: "2026-07-25"
    }),
    first
  ]);
  assert.deepEqual(
    ordered.map((document) => document.data.slug),
    ["newest", "first-article", "second-article"]
  );
});

test("published indexes appear alongside essays, while pages do not", () => {
  assert.equal(isPublication(overview), true);
  assert.equal(isPublication(first), true);
  assert.equal(
    isPublication(entry("about", { title: "About", type: "page" })),
    false
  );
});
