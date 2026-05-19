-- Itineraries (1-day, 2D1N, first-time trips)
CREATE TABLE IF NOT EXISTS itineraries (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  duration_days INT NOT NULL DEFAULT 1,
  duration_nights INT NOT NULL DEFAULT 0,
  audience VARCHAR(120),
  budget_level VARCHAR(80),
  summary TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS itinerary_stops (
  id SERIAL PRIMARY KEY,
  itinerary_id INT NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  place_id INT REFERENCES tourist_places(id) ON DELETE SET NULL,
  stop_name VARCHAR(255) NOT NULL,
  stop_order INT NOT NULL DEFAULT 1,
  time_slot VARCHAR(80),
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_itinerary_stops_itinerary ON itinerary_stops(itinerary_id);

-- Local foods
CREATE TABLE IF NOT EXISTS local_foods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  where_to_eat TEXT,
  price_range VARCHAR(80),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Souvenirs
CREATE TABLE IF NOT EXISTS souvenirs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  typical_price VARCHAR(120),
  tips TEXT,
  place_id INT REFERENCES tourist_places(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Stay zones
CREATE TABLE IF NOT EXISTS stay_zones (
  id SERIAL PRIMARY KEY,
  zone_name VARCHAR(120) NOT NULL,
  summary TEXT,
  pros TEXT,
  cons TEXT,
  suitable_for TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Travel guides (transport, budget, getting around)
CREATE TABLE IF NOT EXISTS travel_guides (
  id SERIAL PRIMARY KEY,
  topic VARCHAR(80) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Province-level info (family travel, first visit tips)
CREATE TABLE IF NOT EXISTS province_info (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  summary TEXT,
  is_family_friendly BOOLEAN DEFAULT true,
  family_friendly_note TEXT,
  first_time_tips TEXT,
  best_season TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO province_info (id, summary, is_family_friendly, family_friendly_note, first_time_tips, best_season)
VALUES (
  1,
  'จังหวัดกาฬสินธุ์ มีแหล่งท่องเที่ยวหลากหลาย ทั้งธรรมชาติ วัฒนธรรม ไดโนเสาร์ และแหล่งเรียนรู้ เหมาะกับการเที่ยวแบบครอบครัวและเที่ยววันเดียวจากจังหวัดใกล้เคียง',
  true,
  'มีสถานที่เหมาะกับเด็กและครอบครัวหลายแห่ง เช่น พิพิธภัณฑ์สิรินธร อุทยานไดโนเสาร์ภูเวียง และแหล่งวัฒนธรรม',
  'แนะนำเริ่มจากไฮไลต์หลัก 1–2 แห่งต่อวัน วางแผนเวลาเดินทางล่วงหน้า และเตรียมน้ำ–ครีมกันแดดสำหรับกลางแจ้ง',
  'พฤศจิกายน–กุมภาพันธ์ อากาศเย็นสบาย เหมาะเที่ยวกลางแจ้ง; ฤดูฝนมีสีเขียวสวยแต่ควรเช็คถนนก่อนออกเดินทาง'
)
ON CONFLICT (id) DO NOTHING;
