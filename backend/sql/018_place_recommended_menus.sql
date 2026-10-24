CREATE TABLE IF NOT EXISTS place_recommended_menus (
  id SERIAL PRIMARY KEY,
  place_id INT NOT NULL REFERENCES tourist_places(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  price VARCHAR(100),
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_place_menus_place ON place_recommended_menus(place_id);
