const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,158}[a-z0-9])?$/;
const voterPattern = /^[a-zA-Z0-9_-]{16,80}$/;

function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

function sameOrigin(request, url) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === url.origin;
  } catch {
    return false;
  }
}

async function getLikes(database, slug) {
  const row = await database
    .prepare("SELECT count FROM post_likes WHERE slug = ?1")
    .bind(slug)
    .first();
  return Number(row?.count ?? 0);
}

async function updateLike(database, slug, voterId, liked) {
  const vote = liked
    ? database
        .prepare(
          "INSERT OR IGNORE INTO like_votes (slug, voter_id) VALUES (?1, ?2)"
        )
        .bind(slug, voterId)
    : database
        .prepare("DELETE FROM like_votes WHERE slug = ?1 AND voter_id = ?2")
        .bind(slug, voterId);
  const refreshCount = database
    .prepare(
      `INSERT INTO post_likes (slug, count, updated_at)
       VALUES (?1, (SELECT COUNT(*) FROM like_votes WHERE slug = ?1), unixepoch())
       ON CONFLICT (slug) DO UPDATE SET
         count = excluded.count,
         updated_at = excluded.updated_at`
    )
    .bind(slug);
  const readCount = database
    .prepare("SELECT count FROM post_likes WHERE slug = ?1")
    .bind(slug);
  const results = await database.batch([vote, refreshCount, readCount]);
  return Number(results[2]?.results?.[0]?.count ?? 0);
}

async function handleLikes(request, env, url, slug) {
  if (!env.DB) {
    return json(
      { error: "Like storage is not configured." },
      503,
      { "Retry-After": "300" }
    );
  }

  try {
    if (request.method === "GET") {
      return json({ count: await getLikes(env.DB, slug) });
    }

    if (request.method !== "POST") {
      return json(
        { error: "Method not allowed." },
        405,
        { Allow: "GET, POST" }
      );
    }

    if (!sameOrigin(request, url)) {
      return json({ error: "Cross-origin requests are not allowed." }, 403);
    }

    const body = await request.json();
    if (
      !body ||
      !voterPattern.test(body.voterId ?? "") ||
      typeof body.liked !== "boolean"
    ) {
      return json({ error: "Invalid Like request." }, 400);
    }

    const count = await updateLike(
      env.DB,
      slug,
      body.voterId,
      body.liked
    );
    return json({ count, liked: body.liked });
  } catch (error) {
    console.error("Like API failed", error);
    return json(
      { error: "Likes are temporarily unavailable." },
      503,
      { "Retry-After": "60" }
    );
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/api\/likes\/([^/]+)$/);
    if (match) {
      const slug = decodeURIComponent(match[1]);
      if (!slugPattern.test(slug)) {
        return json({ error: "Invalid post slug." }, 400);
      }
      return handleLikes(request, env, url, slug);
    }
    if (url.pathname.startsWith("/api/")) {
      return json({ error: "API route not found." }, 404);
    }
    return env.ASSETS.fetch(request);
  }
};
