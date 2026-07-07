CREATE TABLE IF NOT EXISTS agent_secrets (
  agent_id UUID PRIMARY KEY REFERENCES agents(id),
  provider TEXT NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  encrypted_wallet_secret TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE agent_secrets
  ADD COLUMN IF NOT EXISTS encrypted_wallet_secret TEXT;

CREATE TABLE IF NOT EXISTS agent_claim_codes (
  code TEXT PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  expires_at TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,
  claimed_by_wallet TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_claim_codes_agent_id_idx ON agent_claim_codes (agent_id);
