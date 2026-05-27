-- AI 私教 MVP 数据库 Schema

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  short_code VARCHAR(8) UNIQUE,
  password_hash VARCHAR(100),
  is_anonymous BOOLEAN DEFAULT true,
  goal VARCHAR(20),
  available_days INTEGER,
  available_minutes INTEGER,
  environment VARCHAR(20),
  experience VARCHAR(20),
  diet_restrictions JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',
  height REAL,
  weight REAL,
  body_fat REAL,
  gender VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_drafts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  week_number INTEGER NOT NULL,
  revision_number INTEGER DEFAULT 0,
  status VARCHAR(30) DEFAULT 'pending_confirmation',
  weekly_plan JSONB NOT NULL,
  user_feedbacks JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  week_number INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  draft_id UUID REFERENCES plan_drafts(id),
  confirmed_at TIMESTAMP,
  weekly_plan JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_check_ins (
  id UUID PRIMARY KEY,
  plan_id UUID REFERENCES plans(id),
  date DATE NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  training_percent INTEGER,
  note TEXT,
  reason TEXT,
  source VARCHAR(20) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_diet_reviews (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  week_number INTEGER NOT NULL,
  plan_id UUID REFERENCES plans(id),
  diet_percent INTEGER NOT NULL,
  diet_note TEXT,
  diet_tags JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_user_week ON plans(user_id, week_number);
CREATE INDEX IF NOT EXISTS idx_checkins_plan ON training_check_ins(plan_id);
CREATE INDEX IF NOT EXISTS idx_diet_user_week ON weekly_diet_reviews(user_id, week_number);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id, created_at);

-- Prevent duplicate check-ins on the same day for the same plan
DO $$ BEGIN
  ALTER TABLE training_check_ins ADD CONSTRAINT uq_checkin_plan_date UNIQUE (plan_id, date);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Prevent duplicate diet reviews for the same user+week
DO $$ BEGIN
  ALTER TABLE weekly_diet_reviews ADD CONSTRAINT uq_diet_user_week UNIQUE (user_id, week_number);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
