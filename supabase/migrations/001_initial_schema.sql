-- Code Recall Database Schema
-- Spaced repetition for LeetCode problems

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- Synced with Supabase Auth
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- PROBLEMS TABLE
-- Core problem metadata
-- ============================================
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leetcode_id TEXT,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    topics TEXT[] DEFAULT '{}',
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_problems_user_id ON problems(user_id);

-- ============================================
-- NOTES TABLE
-- Structured notes per problem
-- ============================================
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT DEFAULT '',
    key_idea TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notes_problem_id ON notes(problem_id);
CREATE UNIQUE INDEX idx_notes_problem_user ON notes(problem_id, user_id);

-- ============================================
-- REVIEW_STATE TABLE
-- Current scheduling state (one row per user × problem)
-- ============================================
CREATE TABLE review_state (
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    due_at TIMESTAMPTZ NOT NULL,
    interval_days REAL DEFAULT 1 NOT NULL,
    ease REAL DEFAULT 2.5 NOT NULL,
    reps INTEGER DEFAULT 0 NOT NULL,
    last_review_at TIMESTAMPTZ,
    last_grade INTEGER,
    suspended BOOLEAN DEFAULT FALSE NOT NULL,
    PRIMARY KEY (problem_id, user_id)
);

CREATE INDEX idx_review_state_due ON review_state(user_id, due_at) WHERE NOT suspended;

-- ============================================
-- REVIEW_LOG TABLE
-- Append-only history of all reviews
-- ============================================
CREATE TABLE review_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    grade INTEGER NOT NULL CHECK (grade >= 0 AND grade <= 5),
    time_spent INTEGER, -- in seconds
    outcome TEXT CHECK (outcome IN ('solved', 'partial', 'failed')),
    reflection TEXT
);

CREATE INDEX idx_review_log_problem ON review_log(problem_id);
CREATE INDEX idx_review_log_user_date ON review_log(user_id, reviewed_at);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_log ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own data
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Problems policies
CREATE POLICY "Users can view own problems"
    ON problems FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own problems"
    ON problems FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own problems"
    ON problems FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own problems"
    ON problems FOR DELETE
    USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view own notes"
    ON notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
    ON notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
    ON notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
    ON notes FOR DELETE
    USING (auth.uid() = user_id);

-- Review state policies
CREATE POLICY "Users can view own review state"
    ON review_state FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own review state"
    ON review_state FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review state"
    ON review_state FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own review state"
    ON review_state FOR DELETE
    USING (auth.uid() = user_id);

-- Review log policies
CREATE POLICY "Users can view own review logs"
    ON review_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own review logs"
    ON review_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Auto-create user profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

