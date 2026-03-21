-- STEP 1: Set admin role for created admin user
-- UUID from Supabase Auth dashboard
UPDATE profiles
SET role = 'admin',
    full_name = 'Platform Admin',
    updated_at = NOW()
WHERE id = 'cb8e5cc2-87fd-47b8-a984-25f8b11b93e6';

-- STEP 2: Seed charities
INSERT INTO charities (name, description, image_url, website_url, is_featured, events) VALUES
(
  'Green for Good',
  'Green for Good is dedicated to environmental sustainability through golf events and community fundraising. Every round played contributes to reforestation efforts and clean energy initiatives across the country.',
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80',
  'https://greenforgood.org',
  TRUE,
  '[
    {"title": "Spring Golf Day", "date": "2026-04-15", "description": "Annual charity golf tournament raising funds for reforestation"},
    {"title": "Clean Energy Cup", "date": "2026-06-20", "description": "Golf event supporting renewable energy projects"}
  ]'::JSONB
),
(
  'Fairway Foundation',
  'Fairway Foundation helps underprivileged youth access golf training, equipment, and education scholarships. We believe every child deserves a fair shot at the game and at life.',
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
  'https://fairwayfoundation.org',
  TRUE,
  '[
    {"title": "Youth Golf Camp", "date": "2026-05-10", "description": "Free golf training camp for underprivileged youth"},
    {"title": "Scholarship Drive", "date": "2026-07-01", "description": "Fundraising event for education scholarships"}
  ]'::JSONB
),
(
  'Hole in One Hearts',
  'Hole in One Hearts raises critical funds for cardiac research and heart health awareness. Our golf community has already helped fund three major research breakthroughs since 2020.',
  'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=800&q=80',
  'https://holeinonehearts.org',
  TRUE,
  '[
    {"title": "Heart Health Golf Cup", "date": "2026-05-20", "description": "Golf tournament raising awareness for cardiac health"},
    {"title": "Research Fundraiser", "date": "2026-08-15", "description": "Funds go directly to cardiac research labs"}
  ]'::JSONB
),
(
  'Veterans on the Green',
  'Supporting veterans through the healing power of golf. We provide free memberships, mental health support, and community connection for those who served.',
  'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80',
  'https://veteransonthegreen.org',
  FALSE,
  '[
    {"title": "Veterans Day Tournament", "date": "2026-11-11", "description": "Annual tournament honoring and supporting veterans"}
  ]'::JSONB
),
(
  'Junior Golf Academy',
  'Nurturing the next generation of golfers with free coaching, mentorship programs, and tournament opportunities for children aged 8-18 from all backgrounds.',
  'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80',
  'https://juniorgolfacademy.org',
  FALSE,
  '[]'::JSONB
);

