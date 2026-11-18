CREATE TABLE action_proposals (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks (id),
  step_id TEXT REFERENCES task_steps (id),
  author_id TEXT NOT NULL REFERENCES users (id),
  kind TEXT NOT NULL CHECK (kind IN ('complete_step', 'comment')),
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined')),
  idempotency_key TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX proposals_task_idx ON action_proposals (task_id, status);
CREATE UNIQUE INDEX proposals_idem_idx ON action_proposals (author_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE approval_events (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL UNIQUE REFERENCES action_proposals (id),
  owner_id TEXT NOT NULL REFERENCES users (id),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'declined')),
  occurred_at TEXT NOT NULL
);
