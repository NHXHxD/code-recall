-- FSRS Migration
-- Migrates review_state table from SM-2 (ease factor) to FSRS (difficulty + stability)
--
-- This migration:
-- 1. Adds new FSRS columns: difficulty, stability, lapses
-- 2. Migrates existing ease values to difficulty
-- 3. Sets initial stability from existing interval_days
-- 4. Drops the old ease column

-- ============================================
-- Step 1: Add new FSRS columns
-- ============================================

-- Add difficulty column (FSRS D parameter, 1-10 scale, lower = easier)
ALTER TABLE review_state
ADD COLUMN IF NOT EXISTS difficulty REAL DEFAULT 5.0 NOT NULL;

-- Add stability column (FSRS S parameter, memory stability in days)
ALTER TABLE review_state
ADD COLUMN IF NOT EXISTS stability REAL DEFAULT 1.0 NOT NULL;

-- Add lapses column (count of failures/Again ratings)
ALTER TABLE review_state
ADD COLUMN IF NOT EXISTS lapses INTEGER DEFAULT 0 NOT NULL;

-- ============================================
-- Step 2: Migrate existing data
-- ============================================

-- Convert SM-2 ease factor to FSRS difficulty
-- Formula: difficulty = clamp(11 - ease * 4, 1, 10)
-- Examples:
--   ease 2.5 (default) → difficulty ~1.0 (easy)
--   ease 1.3 (minimum) → difficulty ~5.8 (harder)
--   ease 2.8 (maximum) → difficulty ~-0.2 → clamped to 1.0
UPDATE review_state
SET difficulty = GREATEST(1.0, LEAST(10.0, 11.0 - ease * 4.0))
WHERE ease IS NOT NULL;

-- Use existing interval_days as initial stability estimate
-- This is reasonable since interval roughly represents how long memory lasts
UPDATE review_state
SET stability = GREATEST(0.1, LEAST(365.0, interval_days))
WHERE interval_days IS NOT NULL AND interval_days > 0;

-- Initialize lapses to 0 for all existing records
-- (We don't have historical failure data to estimate from)
UPDATE review_state
SET lapses = 0
WHERE lapses IS NULL;

-- ============================================
-- Step 3: Drop old ease column
-- ============================================

-- Remove the SM-2 ease factor column (no longer needed)
ALTER TABLE review_state
DROP COLUMN IF EXISTS ease;

-- ============================================
-- Notes for rollback (manual, if needed):
-- ============================================
-- To rollback this migration, you would need to:
-- 1. ALTER TABLE review_state ADD COLUMN ease REAL DEFAULT 2.5;
-- 2. UPDATE review_state SET ease = (11.0 - difficulty) / 4.0;
-- 3. ALTER TABLE review_state DROP COLUMN difficulty;
-- 4. ALTER TABLE review_state DROP COLUMN stability;
-- 5. ALTER TABLE review_state DROP COLUMN lapses;
