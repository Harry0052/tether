CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('guest', 'member', 'demo', 'deleted')),
  email TEXT,
  password_hash TEXT,
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'es')),
  text_scale TEXT NOT NULL DEFAULT '1' CHECK (text_scale IN ('1', '1.15', '1.3', '1.5')),
  contrast TEXT NOT NULL DEFAULT 'standard' CHECK (contrast IN ('standard', 'high')),
  simplified INTEGER NOT NULL DEFAULT 0 CHECK (simplified IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX users_email_idx ON users (email) WHERE email IS NOT NULL;

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX sessions_user_idx ON sessions (user_id);

CREATE TABLE rate_buckets (
  bucket_key TEXT PRIMARY KEY,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL
);
