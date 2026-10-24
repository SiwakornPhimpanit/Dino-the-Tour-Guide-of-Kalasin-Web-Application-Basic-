-- Display order for tourist places. Lower numbers appear first.
-- Backfill once, using the previous list order, so existing pages do not jump.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tourist_places'
      AND column_name = 'display_order'
  ) THEN
    ALTER TABLE tourist_places
      ADD COLUMN display_order INT NOT NULL DEFAULT 0;

    UPDATE tourist_places tp
    SET display_order = ranked.n
    FROM (
      SELECT
        id,
        row_number() OVER (
          ORDER BY
            coalesce(is_recommended_first_trip, false) DESC,
            coalesce(is_must_visit, false) DESC,
            created_at DESC,
            id ASC
        )::int AS n
      FROM tourist_places
    ) ranked
    WHERE tp.id = ranked.id;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_places_display_order ON tourist_places (display_order);
