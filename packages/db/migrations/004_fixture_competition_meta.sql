ALTER TABLE fixtures
  ADD COLUMN IF NOT EXISTS competition_id BIGINT,
  ADD COLUMN IF NOT EXISTS competition_name TEXT;

CREATE INDEX IF NOT EXISTS fixtures_competition_idx
  ON fixtures (competition_id);
