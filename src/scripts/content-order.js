function dataOf(entry) {
  return entry.data ?? entry;
}

function stableKey(entry) {
  const data = dataOf(entry);
  return String(data.slug ?? data.id ?? data.title ?? entry.id ?? "");
}

function timestamp(value) {
  const parsed = value instanceof Date ? value : new Date(value);
  const result = parsed.getTime();
  return Number.isNaN(result) ? 0 : result;
}

export function comparePublishedDesc(a, b) {
  const difference =
    timestamp(dataOf(b).published) - timestamp(dataOf(a).published);
  return difference || stableKey(a).localeCompare(stableKey(b));
}

export function sortByPublished(entries) {
  return [...entries].sort(comparePublishedDesc);
}

export function isPublication(entry) {
  return ["post", "index"].includes(dataOf(entry).type);
}

function referenceKey(value) {
  let reference = String(value).trim();
  if (reference.startsWith("![[") && reference.endsWith("]]")) {
    reference = reference.slice(3, -2);
  } else if (reference.startsWith("[[") && reference.endsWith("]]")) {
    reference = reference.slice(2, -2);
  }
  return reference.split("|", 1)[0].split("#", 1)[0].trim().toLocaleLowerCase();
}

function identityKeys(entry) {
  const data = dataOf(entry);
  return [
    entry.id,
    data.id,
    data.title,
    data.slug,
    ...(Array.isArray(data.aliases) ? data.aliases : [])
  ]
    .filter(Boolean)
    .map(referenceKey);
}

function entryIdentity(entry) {
  return String(dataOf(entry).id ?? entry.id);
}

function resolverFor(entries) {
  const candidates = new Map();
  for (const entry of entries) {
    for (const key of identityKeys(entry)) {
      const matches = candidates.get(key) ?? [];
      if (!matches.includes(entry)) matches.push(entry);
      candidates.set(key, matches);
    }
  }
  return (reference, indexEntry) => {
    const matches = candidates.get(referenceKey(reference)) ?? [];
    if (matches.length === 0) {
      throw new Error(
        `${dataOf(indexEntry).title}: includes cannot resolve ${reference}`
      );
    }
    if (matches.length > 1) {
      throw new Error(
        `${dataOf(indexEntry).title}: includes is ambiguous for ${reference}`
      );
    }
    return matches[0];
  };
}

export function readingPath(indexEntry, entries) {
  const indexData = dataOf(indexEntry);
  const includes = Array.isArray(indexData.includes) ? indexData.includes : [];
  if (includes.length === 0) {
    throw new Error(`${indexData.title}: index requires an ordered includes list`);
  }

  const resolve = resolverFor(entries);
  const documents = includes.map((reference) => resolve(reference, indexEntry));
  const identities = documents.map(entryIdentity);
  if (new Set(identities).size !== identities.length) {
    throw new Error(`${indexData.title}: includes contains a duplicate document`);
  }

  const posts = documents.filter((entry) => dataOf(entry).type === "post");
  posts.forEach((entry, index) => {
    const data = dataOf(entry);
    if (data.topic && indexData.topic && data.topic !== indexData.topic) {
      throw new Error(
        `${data.title}: topic does not match index ${indexData.title}`
      );
    }
    if (data.series && indexData.series && data.series !== indexData.series) {
      throw new Error(
        `${data.title}: series does not match index ${indexData.title}`
      );
    }
    if (
      data.series_order != null &&
      Number(data.series_order) !== index + 1
    ) {
      throw new Error(
        `${data.title}: series_order must be ${index + 1} to match ${indexData.title}`
      );
    }
  });

  const path = [indexEntry, ...documents];
  for (let index = 1; index < path.length; index += 1) {
    const previous = dataOf(path[index - 1]);
    const current = dataOf(path[index]);
    if (timestamp(previous.published) >= timestamp(current.published)) {
      throw new Error(
        `${current.title}: published must be later than ${previous.title} to match the index reading order`
      );
    }
  }

  return path;
}

export function topicReadingPaths(entries) {
  const topical = entries.filter((entry) => dataOf(entry).topic);
  const indexes = topical
    .filter((entry) => dataOf(entry).type === "index")
    .sort((a, b) => {
      const topicDifference = dataOf(a).topic.localeCompare(dataOf(b).topic);
      return topicDifference || dataOf(a).title.localeCompare(dataOf(b).title);
    });

  const sections = new Map();
  const includedPosts = new Set();
  for (const indexEntry of indexes) {
    const documents = readingPath(indexEntry, entries);
    const topic = dataOf(indexEntry).topic;
    const current = sections.get(topic) ?? [];
    for (const document of documents) {
      const identity = entryIdentity(document);
      if (dataOf(document).type === "post") {
        if (includedPosts.has(identity)) {
          throw new Error(
            `${dataOf(document).title}: included by more than one topic index`
          );
        }
        includedPosts.add(identity);
      }
      current.push(document);
    }
    sections.set(topic, current);
  }

  const orphaned = topical.filter(
    (entry) =>
      dataOf(entry).type === "post" && !includedPosts.has(entryIdentity(entry))
  );
  if (orphaned.length > 0) {
    throw new Error(
      `Topic posts missing from an index: ${orphaned
        .map((entry) => dataOf(entry).title)
        .join(", ")}`
    );
  }

  return [...sections.entries()].map(([topic, documents]) => ({
    topic,
    documents
  }));
}

export function seriesNavigation(entry, entries) {
  if (dataOf(entry).type !== "post") return null;
  const identity = entryIdentity(entry);
  const indexes = entries.filter(
    (candidate) => dataOf(candidate).type === "index"
  );

  for (const indexEntry of indexes) {
    const path = readingPath(indexEntry, entries);
    const articles = path.slice(1);
    const position = articles.findIndex(
      (candidate) => entryIdentity(candidate) === identity
    );
    if (position !== -1) {
      return {
        index: indexEntry,
        previous: position > 0 ? articles[position - 1] : null,
        next: position < articles.length - 1 ? articles[position + 1] : null
      };
    }
  }
  return null;
}
