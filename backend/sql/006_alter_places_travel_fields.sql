-- Extended fields for AI travel assistant
ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS opening_hours TEXT;
ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS best_visit_time TEXT;
ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS ticket_price TEXT;
ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS activities TEXT;
ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS suitable_for TEXT;
ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS highlights TEXT;
ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS faq TEXT;
ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS is_must_visit BOOLEAN DEFAULT false;
ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS is_recommended_first_trip BOOLEAN DEFAULT false;
ALTER TABLE tourist_places ADD COLUMN IF NOT EXISTS estimated_visit_hours NUMERIC(4, 1);

CREATE INDEX IF NOT EXISTS idx_places_must_visit ON tourist_places(is_must_visit) WHERE is_must_visit = true;
CREATE INDEX IF NOT EXISTS idx_places_first_trip ON tourist_places(is_recommended_first_trip) WHERE is_recommended_first_trip = true;
