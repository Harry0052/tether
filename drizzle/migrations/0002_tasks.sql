CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users (id),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  template_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'completed')),
  due_on TEXT,
  origin TEXT NOT NULL CHECK (origin IN ('user', 'demo_seed')),
  idempotency_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX tasks_owner_idx ON tasks (owner_id, updated_at);

CREATE UNIQUE INDEX tasks_owner_idempotency_idx ON tasks (owner_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE task_steps (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks (id),
  ordinal INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'done')),
  done_at TEXT
);

CREATE UNIQUE INDEX task_steps_ordinal_idx ON task_steps (task_id, ordinal);
CREATE INDEX task_steps_task_idx ON task_steps (task_id);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  actor_id TEXT,
  type TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL
);

CREATE INDEX audit_task_idx ON audit_events (task_id, occurred_at);

CREATE TABLE metric_events (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users (id),
  name TEXT NOT NULL,
  task_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX metric_owner_idx ON metric_events (owner_id, name);
CREATE UNIQUE INDEX metric_task_name_idx ON metric_events (name, task_id);
