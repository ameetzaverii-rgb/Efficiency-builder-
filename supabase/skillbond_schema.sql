-- SkillBond tables (prefixed sb_ to avoid conflicts with existing GSL tables)

CREATE TABLE IF NOT EXISTS sb_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  name text NOT NULL,
  website text,
  escrow_balance_cents int NOT NULL DEFAULT 0,
  stripe_customer_id text,
  kyc_status text NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sb_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id uuid NOT NULL REFERENCES sb_platforms(id),
  title text NOT NULL,
  skill_vertical text NOT NULL,
  brief_url text,
  rubric_json jsonb,
  reward_cents int NOT NULL,
  max_submissions int NOT NULL DEFAULT 100,
  deadline timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','closed','expired')),
  escrow_reserved_cents int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sb_learners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  country text,
  skill_tags text[] NOT NULL DEFAULT '{}',
  stripe_connect_id text,
  wallet_balance_cents int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sb_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES sb_challenges(id),
  learner_id uuid NOT NULL REFERENCES sb_learners(id),
  submission_url text NOT NULL,
  reflection_text text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','grading','passed','failed','appealed','human_review')),
  ai_score numeric(5,2),
  ai_confidence numeric(3,2),
  ai_verdict text,
  human_override boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz,
  UNIQUE(challenge_id, learner_id)
);

CREATE TABLE IF NOT EXISTS sb_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('escrow_deposit','reward_release','listing_fee','platform_refund','withdrawal')),
  platform_id uuid REFERENCES sb_platforms(id),
  learner_id uuid REFERENCES sb_learners(id),
  challenge_id uuid REFERENCES sb_challenges(id),
  submission_id uuid REFERENCES sb_submissions(id),
  amount_cents int NOT NULL,
  stripe_transfer_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
