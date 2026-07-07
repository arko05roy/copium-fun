-- copium.fun core schema (AGILE-PLAN §4.2)

CREATE TABLE fixtures (
  txline_fixture_id BIGINT PRIMARY KEY,
  home_name TEXT,
  away_name TEXT,
  kickoff_at TIMESTAMPTZ,
  phase TEXT DEFAULT 'NS',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pulses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id BIGINT REFERENCES fixtures(txline_fixture_id),
  pulse_type TEXT NOT NULL,
  question TEXT NOT NULL,
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  line_pct NUMERIC(5,2),
  crowd_yes_pct NUMERIC(5,2) DEFAULT 50,
  status TEXT DEFAULT 'open',
  onchain_pool_pubkey TEXT,
  odds_message_id TEXT,
  odds_proof JSONB,
  settlement_root BYTEA,
  winning_side TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_id UUID REFERENCES pulses(id),
  user_id UUID,
  agent_id UUID,
  side TEXT CHECK (side IN ('yes','no')),
  stake BIGINT NOT NULL,
  onchain_position_pubkey TEXT,
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  wallet_pubkey TEXT NOT NULL,
  onchain_agent_pubkey TEXT,
  config JSONB DEFAULT '{}'
);

CREATE TABLE agent_secrets (
  agent_id UUID PRIMARY KEY REFERENCES agents(id),
  provider TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  encrypted_wallet_secret TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_claim_codes (
  code TEXT PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  expires_at TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,
  claimed_by_wallet TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  pulse_id UUID REFERENCES pulses(id),
  side TEXT,
  stake BIGINT,
  reasoning TEXT,
  signature TEXT,
  execute_tx TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  fixture_id BIGINT REFERENCES fixtures(txline_fixture_id),
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE room_members (
  room_id UUID REFERENCES rooms(id),
  user_id UUID,
  duel_points INT DEFAULT 0,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  pulse_id UUID REFERENCES pulses(id),
  label TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE proof_bundles (
  pulse_id UUID PRIMARY KEY REFERENCES pulses(id),
  truth_json JSONB,
  settlement_json JSONB,
  verify_tx TEXT,
  bundle_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE simulator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id BIGINT,
  bundle JSONB,
  cursor INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE copy_subscriptions (
  user_id UUID,
  agent_id UUID REFERENCES agents(id),
  max_stake BIGINT,
  mode TEXT CHECK (mode IN ('copy','fade')),
  PRIMARY KEY (user_id, agent_id)
);

CREATE INDEX pulses_fixture_status_idx ON pulses (fixture_id, status);
CREATE INDEX pulses_closes_at_idx ON pulses (closes_at) WHERE status = 'open';
CREATE INDEX agent_trades_pulse_id_idx ON agent_trades (pulse_id);
CREATE INDEX positions_pulse_id_idx ON positions (pulse_id);
CREATE INDEX agent_claim_codes_agent_id_idx ON agent_claim_codes (agent_id);
