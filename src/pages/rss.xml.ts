import { getCollection } from "astro:content";
import {
  isPublication,
  sortByPublished
} from "../scripts/content-order.js";

const SITE = "https://jonghoon.blog";

function xml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const entries = sortByPublished(
    (await getCollection("posts")).filter(isPublication)
  );
  const items = entries
    .map((entry) => {
      const url = `${SITE}/posts/${entry.data.slug}/`;
      return `<item>
        <title>${xml(entry.data.title)}</title>
        <link>${url}</link>
        <guid isPermaLink="true">${url}</guid>
        <pubDate>${entry.data.published.toUTCString()}</pubDate>
        <description>${xml(entry.data.summary)}</description>
      </item>`;
    })
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Jong Hoon&apos;s Blog</title>
    <link>${SITE}/</link>
    <description>Notes on computer architecture, AI systems, and connected thinking.</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`,
    {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8"
      }
    }
  );
}
