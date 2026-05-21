-- Initial schema for Faultend Phase 11
-- Created: April 28, 2026

-- Migration: Fix rules.id type from BIGSERIAL/BIGINT to VARCHAR(255)
-- for databases created before the schema was updated to use string IDs.
DO $$
DECLARE
    fk_constraint TEXT;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'rules'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rules' AND column_name = 'id'
        AND data_type != 'character varying'
    ) THEN
        SELECT tc.constraint_name INTO fk_constraint
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'traffic'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'rules'
            AND ccu.column_name = 'id';

        IF fk_constraint IS NOT NULL THEN
            EXECUTE format('ALTER TABLE traffic DROP CONSTRAINT %I', fk_constraint);
        END IF;

        ALTER TABLE rules ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE rules ALTER COLUMN id TYPE VARCHAR(255);
        DROP SEQUENCE IF EXISTS rules_id_seq;

        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'traffic'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'traffic' AND column_name = 'matched_rule_id'
            AND data_type != 'character varying'
        ) THEN
            ALTER TABLE traffic ALTER COLUMN matched_rule_id TYPE VARCHAR(255);
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = 'traffic'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE table_name = 'traffic' AND constraint_name = 'fk_traffic_matched_rule'
        ) THEN
            ALTER TABLE traffic ADD CONSTRAINT fk_traffic_matched_rule
                FOREIGN KEY (matched_rule_id) REFERENCES rules(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Migration: Make google_id nullable for multi-provider auth
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'google_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL;
    END IF;
END $$;

-- Users table (OAuth providers)
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  google_id     VARCHAR(255) UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  name          VARCHAR(255),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Servers table (fault servers)
CREATE TABLE IF NOT EXISTS servers (
  id            BIGSERIAL PRIMARY KEY,
  server_id     VARCHAR(255) NOT NULL UNIQUE,
  name          VARCHAR(255),
  description   TEXT,
  owner_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_token  VARCHAR(255) UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
  id            VARCHAR(255) PRIMARY KEY,
  server_id     BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  priority      INTEGER NOT NULL,
  enabled       BOOLEAN DEFAULT true,
  name          VARCHAR(255),
  method        VARCHAR(10) NOT NULL,
  path_regex    VARCHAR(500) NOT NULL,
  action        VARCHAR(10) NOT NULL CHECK (action IN ('mock', 'proxy')),
  target        TEXT,
  mock_response JSONB,
  conditions    JSONB DEFAULT '[]',
  request_headers JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Traffic table
CREATE TABLE IF NOT EXISTS traffic (
  id            BIGSERIAL PRIMARY KEY,
  server_id     BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  request_id    VARCHAR(255),
  timestamp     TIMESTAMPTZ DEFAULT NOW(),
  request       JSONB NOT NULL,
  response      JSONB,
  duration      INTEGER,
  target        TEXT,
  matched_rule_id VARCHAR(255) REFERENCES rules(id) ON DELETE SET NULL,
  error         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: Add role column to server_collaborators
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'server_collaborators' AND column_name = 'role'
    ) THEN
        ALTER TABLE server_collaborators ADD COLUMN role VARCHAR(20) DEFAULT 'collaborator';
    END IF;
END $$;

-- Server collaborators table
CREATE TABLE IF NOT EXISTS server_collaborators (
  id            BIGSERIAL PRIMARY KEY,
  server_id     BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role          VARCHAR(20) DEFAULT 'collaborator',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

-- User OAuth providers table (for multi-provider auth)
CREATE TABLE IF NOT EXISTS user_oauth_providers (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    VARCHAR(20) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_traffic_server_id ON traffic(server_id);
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rules_server_id ON rules(server_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_server_id ON server_collaborators(server_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON server_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_servers_owner_id ON servers(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_providers_user_id ON user_oauth_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_providers_provider ON user_oauth_providers(provider, provider_id);

-- Session table (for connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
