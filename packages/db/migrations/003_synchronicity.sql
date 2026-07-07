ALTER TABLE pulses
  ADD COLUMN IF NOT EXISTS sport TEXT,
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS template_id TEXT,
  ADD COLUMN IF NOT EXISTS trigger_source TEXT,
  ADD COLUMN IF NOT EXISTS settlement_meta JSONB;

CREATE INDEX IF NOT EXISTS pulses_topic_status_idx
  ON pulses (topic, status);
