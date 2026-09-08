CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'place_section') THEN
    CREATE TYPE place_section AS ENUM ('cafe', 'restaurant');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section       place_section NOT NULL,
  place_name    TEXT NOT NULL,
  city          TEXT,
  description   TEXT,
  image_url     TEXT NOT NULL,
  cloudinary_id TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_section ON photos (section);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos (created_at DESC);
