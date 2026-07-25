CREATE TABLE IF NOT EXISTS like_votes (
  slug TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (slug, voter_id)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS post_likes (
  slug TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
) WITHOUT ROWID;
