-- Extended categories for filtering & AI (idempotent)
INSERT INTO categories (name) VALUES
  ('ธรรมชาติ'),
  ('วัฒนธรรม'),
  ('แหล่งเรียนรู้'),
  ('ไดโนเสาร์'),
  ('ร้านอาหาร'),
  ('คาเฟ่'),
  ('ที่พัก'),
  ('ของฝาก')
ON CONFLICT (name) DO NOTHING;
