CREATE TABLE IF NOT EXISTS tournaments (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  version bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id text PRIMARY KEY,
  tournament_id text NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('scheduled', 'live', 'completed')),
  home_name text NOT NULL,
  away_name text NOT NULL,
  home_score integer NOT NULL DEFAULT 0 CHECK (home_score >= 0),
  away_score integer NOT NULL DEFAULT 0 CHECK (away_score >= 0),
  version bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_log (
  stream_id text NOT NULL,
  sequence bigint NOT NULL,
  event_id uuid NOT NULL DEFAULT gen_random_uuid(),
  schema_version integer NOT NULL DEFAULT 1,
  aggregate_version bigint NOT NULL,
  type text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  correlation_id uuid NOT NULL,
  payload jsonb NOT NULL,
  PRIMARY KEY (stream_id, sequence),
  UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS event_log_replay_idx
  ON event_log (stream_id, sequence ASC);

CREATE TABLE IF NOT EXISTS demo_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash char(64) NOT NULL UNIQUE,
  actor_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('viewer', 'operator', 'admin')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_sessions_expiry_idx
  ON demo_sessions (expires_at);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  actor_id text NOT NULL,
  operation text NOT NULL,
  key text NOT NULL,
  request_hash char(64) NOT NULL,
  status text NOT NULL CHECK (status IN ('processing', 'completed')),
  response_status integer,
  response_body jsonb,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_id, operation, key)
);

CREATE INDEX IF NOT EXISTS idempotency_expiry_idx
  ON idempotency_keys (expires_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tournament_id text NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  actor_id text NOT NULL,
  action text NOT NULL,
  correlation_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO tournaments (id, slug, name, version)
VALUES ('northern-circuit-2026', 'northern-circuit-invitational', 'Northern Circuit Invitational', 42)
ON CONFLICT (id) DO NOTHING;

INSERT INTO matches (id, tournament_id, status, home_name, away_name, home_score, away_score, version)
VALUES ('upper-final', 'northern-circuit-2026', 'live', 'Black Kite', 'Northstar', 13, 11, 42)
ON CONFLICT (id) DO NOTHING;
