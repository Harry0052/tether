CREATE TABLE trusted_relations (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users (id),
  helper_id TEXT NOT NULL REFERENCES users (id),
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE UNIQUE INDEX trusted_pair_idx ON trusted_relations (owner_id, helper_id);
CREATE INDEX trusted_owner_idx ON trusted_relations (owner_id);
CREATE INDEX trusted_helper_idx ON trusted_relations (helper_id);

CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users (id),
  task_id TEXT NOT NULL REFERENCES tasks (id),
  token_hash TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL CHECK (scope IN ('suggest')),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  used_by TEXT REFERENCES users (id),
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX invitations_owner_idx ON invitations (owner_id, created_at);

CREATE TABLE capability_grants (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users (id),
  helper_id TEXT NOT NULL REFERENCES users (id),
  task_id TEXT NOT NULL REFERENCES tasks (id),
  invitation_id TEXT REFERENCES invitations (id),
  scope TEXT NOT NULL CHECK (scope IN ('suggest')),
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX grants_helper_task_idx ON capability_grants (helper_id, task_id);
CREATE INDEX grants_owner_helper_idx ON capability_grants (owner_id, helper_id);
