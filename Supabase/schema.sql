
-- GOLF CHARITY SUBSCRIPTION PLATFORM

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on every new signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'subscriber'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- SUBSCRIPTIONS
-- Using PayPal as PCI-compliant 
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (
    status IN ('active', 'cancelled', 'lapsed', 'inactive')
  ),
  paypal_subscription_id TEXT UNIQUE,
  paypal_order_id TEXT,
  amount_paid NUMERIC(10,2),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SCORES
-- Max 5 per user, Stableford 1-45, rolling (oldest auto-deleted)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  date_played DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: after insert, delete oldest if user has more than 5
CREATE OR REPLACE FUNCTION enforce_rolling_scores()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM scores
  WHERE id IN (
    SELECT id FROM scores
    WHERE user_id = NEW.user_id
    ORDER BY date_played ASC, created_at ASC
    OFFSET 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rolling_score_limit
  AFTER INSERT ON scores
  FOR EACH ROW EXECUTE FUNCTION enforce_rolling_scores();

-- CHARITIES
CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  website_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  events JSONB DEFAULT '[]',
  -- events format: [{"title": "", "date": "", "description": ""}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER CHARITY SELECTIONS
-- User selects charity at signup, min 10% contribution
CREATE TABLE user_charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  contribution_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00
    CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);


-- INDEPENDENT DONATIONS
-- Not tied to gameplay 
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  paypal_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'failed')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DRAWS
-- Monthly draws with prize pool logic
CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_month DATE NOT NULL UNIQUE, -- always first day of month e.g. 2026-03-01
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'simulated', 'published')
  ),
  draw_type TEXT NOT NULL DEFAULT 'random' CHECK (
    draw_type IN ('random', 'algorithmic')
  ),
  draw_numbers INTEGER[],          -- 5 numbers after simulation
  total_pool NUMERIC(10,2) DEFAULT 0,
  pool_5match NUMERIC(10,2) DEFAULT 0,   -- 40% of total_pool
  pool_4match NUMERIC(10,2) DEFAULT 0,   -- 35% of total_pool
  pool_3match NUMERIC(10,2) DEFAULT 0,   -- 25% of total_pool
  jackpot_carried_over NUMERIC(10,2) DEFAULT 0,
  active_subscriber_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DRAW ENTRIES
-- Snapshot of user scores at time of draw
CREATE TABLE draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_scores INTEGER[],
  numbers_matched INTEGER DEFAULT 0 CHECK (
    numbers_matched >= 0 AND numbers_matched <= 5
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

-- WINNERS
-- Created after draw published for 3/4/5 match users
CREATE TABLE winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_type INTEGER NOT NULL CHECK (match_type IN (3, 4, 5)),
  prize_amount NUMERIC(10,2),
  proof_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'approved', 'rejected')
  ),
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    payout_status IN ('pending', 'paid')
  ),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_date_played ON scores(date_played DESC);
CREATE INDEX idx_charities_featured ON charities(is_featured);
CREATE INDEX idx_draws_status ON draws(status);
CREATE INDEX idx_draws_month ON draws(draw_month DESC);
CREATE INDEX idx_draw_entries_draw_id ON draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user_id ON draw_entries(user_id);
CREATE INDEX idx_winners_draw_id ON winners(draw_id);
CREATE INDEX idx_winners_user_id ON winners(user_id);
CREATE INDEX idx_winners_verification ON winners(verification_status);
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_charity_id ON donations(charity_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── SUBSCRIPTIONS ──
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── SCORES ──
CREATE POLICY "Users can manage own scores"
  ON scores FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all scores"
  ON scores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── CHARITIES ──
CREATE POLICY "Anyone can read charities"
  ON charities FOR SELECT
  USING (TRUE);

CREATE POLICY "Admin can manage charities"
  ON charities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── USER CHARITIES ──
CREATE POLICY "Users can manage own charity selection"
  ON user_charities FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all charity selections"
  ON user_charities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── DONATIONS ──
CREATE POLICY "Users can manage own donations"
  ON donations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all donations"
  ON donations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── DRAWS ──
CREATE POLICY "Anyone can read published draws"
  ON draws FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admin can manage all draws"
  ON draws FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── DRAW ENTRIES ──
CREATE POLICY "Users can read own draw entries"
  ON draw_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all draw entries"
  ON draw_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── WINNERS ──
CREATE POLICY "Users can read own winnings"
  ON winners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload proof"
  ON winners FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all winners"
  ON winners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );