-- LeetCode Metadata Cache
-- Stores fetched problem metadata to reduce API calls
-- This is shared, public data - no RLS needed

CREATE TABLE leetcode_metadata_cache (
    slug TEXT PRIMARY KEY,
    leetcode_id TEXT NOT NULL,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    topics TEXT[] NOT NULL DEFAULT '{}',
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Index for cleanup queries
CREATE INDEX idx_leetcode_cache_expires ON leetcode_metadata_cache(expires_at);

-- Comment for documentation
COMMENT ON TABLE leetcode_metadata_cache IS 
    'Cache for LeetCode problem metadata. TTL: 7 days fresh, 30 days stale fallback.';

