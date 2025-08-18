-- ==================================================
-- DOPAMINE DETOX - MVP SCHEMA (ESSENTIAL TABLES ONLY)
-- ==================================================
-- Streamlined database schema for MVP containing only essential tables
-- Includes: User profiles, Website blocking, Time-based rules, NextDNS integration
--
-- MVP Features Support:
-- ✅ Authentication (Clerk + Supabase)
-- ✅ Individual website blocking 
-- ✅ Category-based blocking (NextDNS)
-- ✅ NextDNS account integration
-- ✅ Habit tracking system with GitHub-style calendar
--
-- Removed from full schema:
-- ❌ All quest/gamification tables
-- ❌ Focus sessions tracking
-- ❌ Focus presets
-- ❌ Timers
-- ❌ User statistics

-- ==================================================
-- 1. USER PROFILES (Synced from Clerk via webhook)
-- ==================================================

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, -- Clerk user ID
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    image_url VARCHAR(500),
    username VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- 2. WEBSITE BLOCKING SYSTEM
-- ==================================================

CREATE TABLE IF NOT EXISTS blocked_websites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    url VARCHAR(255) NOT NULL,
    is_always_on BOOLEAN DEFAULT true,
    nextdns_synced BOOLEAN DEFAULT false,
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==================================================
-- 3. HABIT TRACKING SYSTEM
-- ==================================================

-- Habits table - Store individual habits
CREATE TABLE IF NOT EXISTS habits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    emoji VARCHAR(10) DEFAULT '✅',
    is_active BOOLEAN DEFAULT true,
    start_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit entries table - Track daily completions
CREATE TABLE IF NOT EXISTS habit_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(habit_id, completion_date) -- Prevent duplicate entries for same habit on same day
);

-- ==================================================
-- 4. NEXTDNS INTEGRATION TABLES
-- ==================================================

-- NextDNS user account configuration
CREATE TABLE IF NOT EXISTS nextdns_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    api_key VARCHAR(255) NOT NULL,
    profile_id VARCHAR(100) NOT NULL,
    profile_name VARCHAR(100) NOT NULL DEFAULT 'Dopamine Detox',
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- One NextDNS account per user
);

-- NextDNS blocking categories configuration
CREATE TABLE IF NOT EXISTS nextdns_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    category_id VARCHAR(50) NOT NULL, -- NextDNS category ID (e.g., 'social-networks')
    category_name VARCHAR(100) NOT NULL, -- Human readable name
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

-- NextDNS sync log for tracking changes
CREATE TABLE IF NOT EXISTS nextdns_sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    operation VARCHAR(20) NOT NULL, -- 'sync', 'add_domain', 'remove_domain', 'add_category', etc.
    resource_type VARCHAR(20) NOT NULL, -- 'domain', 'category', 'profile'
    resource_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================
-- 5. HELPER FUNCTIONS
-- ==================================================

-- Function to set current user context for RLS
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql;

-- Function to mark resources as needing sync
CREATE OR REPLACE FUNCTION mark_for_nextdns_sync(
    p_user_id TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_operation TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO nextdns_sync_log (user_id, operation, resource_type, resource_id)
    VALUES (p_user_id, p_operation, p_resource_type, p_resource_id);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has NextDNS configured
CREATE OR REPLACE FUNCTION user_has_nextdns_account(p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM nextdns_accounts 
        WHERE user_id = p_user_id AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 6. HABIT TRACKING FUNCTIONS
-- ==================================================

-- Function to calculate current streak for a habit
CREATE OR REPLACE FUNCTION calculate_habit_streak(p_habit_id UUID)
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    check_date DATE;
    found_completion BOOLEAN;
    today_completed BOOLEAN;
BEGIN
    -- Check if today is completed
    SELECT EXISTS (
        SELECT 1 FROM habit_entries 
        WHERE habit_id = p_habit_id 
        AND completion_date = CURRENT_DATE 
        AND completed = true
    ) INTO today_completed;
    
    -- If today is completed, include it in the streak
    IF today_completed THEN
        check_date := CURRENT_DATE;
        streak_count := 1; -- Start with today
        check_date := check_date - INTERVAL '1 day'; -- Move to yesterday
    ELSE
        -- If today is not completed, start from yesterday
        check_date := CURRENT_DATE - INTERVAL '1 day';
    END IF;
    
    -- Count consecutive days backwards from the starting point
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM habit_entries 
            WHERE habit_id = p_habit_id 
            AND completion_date = check_date 
            AND completed = true
        ) INTO found_completion;
        
        IF found_completion THEN
            streak_count := streak_count + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            EXIT; -- Break when we find a gap
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate consistency percentage for a habit (from start_date to today)
CREATE OR REPLACE FUNCTION calculate_habit_consistency(p_habit_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_days INTEGER;
    completed_days INTEGER;
    habit_start_date DATE;
BEGIN
    -- Get habit start date
    SELECT COALESCE(start_date, DATE(created_at)) INTO habit_start_date 
    FROM habits 
    WHERE id = p_habit_id;
    
    -- Calculate total days from start_date to today (inclusive)
    total_days := CURRENT_DATE - habit_start_date + 1;
    
    IF total_days <= 0 THEN
        RETURN 0;
    END IF;
    
    -- Count completed days since start
    SELECT COUNT(*) INTO completed_days
    FROM habit_entries
    WHERE habit_id = p_habit_id
    AND completion_date >= habit_start_date
    AND completion_date <= CURRENT_DATE
    AND completed = true;
    
    -- Return rounded percentage (0-100)
    RETURN GREATEST(0, LEAST(100, ROUND((completed_days::DECIMAL / total_days::DECIMAL) * 100)));
END;
$$ LANGUAGE plpgsql;

-- Function to get total check-ins for a habit
CREATE OR REPLACE FUNCTION get_habit_total_checkins(p_habit_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM habit_entries
        WHERE habit_id = p_habit_id
        AND completed = true
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get habit stats with all metrics (legacy - use get_habit_stats_enhanced instead)
CREATE OR REPLACE FUNCTION get_habit_stats(p_habit_id UUID)
RETURNS TABLE(
    habit_id UUID,
    current_streak INTEGER,
    consistency_percent INTEGER,
    total_checkins INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_habit_id as habit_id,
        calculate_habit_streak(p_habit_id) as current_streak,
        calculate_habit_consistency(p_habit_id) as consistency_percent,
        get_habit_total_checkins(p_habit_id) as total_checkins;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's overall habit statistics (legacy - use get_user_habit_overview_improved instead)
CREATE OR REPLACE FUNCTION get_user_habit_overview(p_user_id TEXT)
RETURNS TABLE(
    total_habits INTEGER,
    avg_streak DECIMAL,
    avg_consistency INTEGER,
    total_checkins INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(h.id)::INTEGER as total_habits,
        COALESCE(AVG(calculate_habit_streak(h.id)), 0) as avg_streak,
        COALESCE(AVG(calculate_habit_consistency(h.id)::DECIMAL), 0) as avg_consistency,
        COALESCE(SUM(get_habit_total_checkins(h.id)), 0)::INTEGER as total_checkins
    FROM habits h
    WHERE h.user_id = p_user_id
    AND h.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get habit calendar data for GitHub-style grid
CREATE OR REPLACE FUNCTION get_habit_calendar_data(
    p_user_id TEXT,
    p_habit_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE(
    date DATE,
    completed BOOLEAN
) AS $$
BEGIN
    -- Set user context for RLS
    PERFORM set_config('app.current_user_id', p_user_id, true);
    
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date as date
    )
    SELECT 
        ds.date,
        COALESCE(he.completed, false) as completed
    FROM date_series ds
    LEFT JOIN habit_entries he ON he.habit_id = p_habit_id 
        AND he.completion_date = ds.date
    ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql;

-- Function to get today's completion status
CREATE OR REPLACE FUNCTION get_habit_today_status(
    p_user_id TEXT,
    p_habit_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    is_completed BOOLEAN;
BEGIN
    -- Set user context for RLS
    PERFORM set_config('app.current_user_id', p_user_id, true);
    
    SELECT COALESCE(completed, false) INTO is_completed
    FROM habit_entries
    WHERE habit_id = p_habit_id 
    AND completion_date = CURRENT_DATE;
    
    RETURN COALESCE(is_completed, false);
END;
$$ LANGUAGE plpgsql;

-- Function to get habits with today's completion status
CREATE OR REPLACE FUNCTION get_habits_with_today_status(p_user_id TEXT)
RETURNS TABLE(
    id UUID,
    user_id TEXT,
    name VARCHAR(100),
    description VARCHAR(255),
    emoji VARCHAR(10),
    is_active BOOLEAN,
    start_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    today_completed BOOLEAN
) AS $$
BEGIN
    -- Set user context for RLS
    PERFORM set_config('app.current_user_id', p_user_id, true);
    
    RETURN QUERY
    SELECT 
        h.id,
        h.user_id,
        h.name,
        h.description,
        h.emoji,
        h.is_active,
        h.start_date,
        h.created_at,
        h.updated_at,
        COALESCE(he.completed, false) as today_completed
    FROM habits h
    LEFT JOIN habit_entries he ON he.habit_id = h.id 
        AND he.completion_date = CURRENT_DATE
    WHERE h.user_id = p_user_id 
    AND h.is_active = true
    ORDER BY 
        COALESCE(he.completed, false) ASC, -- Uncompleted first
        h.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Safe function to toggle habit completion
CREATE OR REPLACE FUNCTION safe_toggle_habit_completion(
    p_user_id TEXT,
    p_habit_id UUID,
    p_completion_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    entry_exists BOOLEAN;
    current_completed BOOLEAN;
    new_completed BOOLEAN;
BEGIN
    -- Set user context for RLS
    PERFORM set_config('app.current_user_id', p_user_id, true);
    
    -- Check if entry exists and get current completion status
    SELECT EXISTS (
        SELECT 1 FROM habit_entries 
        WHERE habit_id = p_habit_id 
        AND completion_date = p_completion_date
    ), COALESCE((
        SELECT completed FROM habit_entries 
        WHERE habit_id = p_habit_id 
        AND completion_date = p_completion_date
    ), false) 
    INTO entry_exists, current_completed;
    
    -- Toggle the completion status
    new_completed := NOT current_completed;
    
    -- Insert or update the entry
    INSERT INTO habit_entries (habit_id, user_id, completion_date, completed)
    VALUES (p_habit_id, p_user_id, p_completion_date, new_completed)
    ON CONFLICT (habit_id, completion_date)
    DO UPDATE SET 
        completed = new_completed,
        updated_at = NOW();
    
    RETURN new_completed;
END;
$$ LANGUAGE plpgsql;

-- Safe function to create a new habit
CREATE OR REPLACE FUNCTION safe_create_habit(
    p_user_id TEXT,
    p_name VARCHAR(100),
    p_description VARCHAR(255) DEFAULT NULL,
    p_emoji VARCHAR(10) DEFAULT '✅'
)
RETURNS habits AS $$
DECLARE
    new_habit habits;
BEGIN
    -- Set user context for RLS
    PERFORM set_config('app.current_user_id', p_user_id, true);
    
    INSERT INTO habits (user_id, name, description, emoji)
    VALUES (p_user_id, p_name, p_description, p_emoji)
    RETURNING * INTO new_habit;
    
    RETURN new_habit;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 6.1. ENHANCED HABIT TRACKING FUNCTIONS
-- ==================================================

-- Function to calculate maximum streak ever achieved for a habit
CREATE OR REPLACE FUNCTION calculate_habit_max_streak(p_habit_id UUID)
RETURNS INTEGER AS $$
DECLARE
    max_streak INTEGER := 0;
    current_streak INTEGER := 0;
    prev_date DATE := NULL;
    entry_date DATE;
BEGIN
    -- Loop through all completed entries in chronological order
    FOR entry_date IN 
        SELECT completion_date 
        FROM habit_entries 
        WHERE habit_id = p_habit_id AND completed = true
        ORDER BY completion_date ASC
    LOOP
        IF prev_date IS NULL THEN
            -- First entry
            current_streak := 1;
        ELSIF entry_date = prev_date + INTERVAL '1 day' THEN
            -- Consecutive day
            current_streak := current_streak + 1;
        ELSE
            -- Gap found, reset streak
            current_streak := 1;
        END IF;
        
        -- Update max if current is higher
        IF current_streak > max_streak THEN
            max_streak := current_streak;
        END IF;
        
        prev_date := entry_date;
    END LOOP;
    
    RETURN max_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to get badge level based on max streak
CREATE OR REPLACE FUNCTION get_streak_badge(max_streak INTEGER)
RETURNS TEXT AS $$
BEGIN
    CASE 
        WHEN max_streak >= 30 THEN RETURN 'unstoppable';    -- 30+ days
        WHEN max_streak >= 14 THEN RETURN 'on_fire';        -- 14+ days  
        WHEN max_streak >= 7 THEN RETURN 'steady';          -- 7+ days
        WHEN max_streak >= 3 THEN RETURN 'spark';           -- 3+ days
        WHEN max_streak >= 1 THEN RETURN 'getting_started'; -- 1+ days
        ELSE RETURN 'none';                                 -- 0 days
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Enhanced habit stats function with max streak and badge
CREATE OR REPLACE FUNCTION get_habit_stats_enhanced(p_habit_id UUID)
RETURNS TABLE(
    habit_id UUID,
    current_streak INTEGER,
    max_streak INTEGER,
    consistency_percent INTEGER,
    badge_level TEXT
) AS $$
DECLARE
    max_streak_val INTEGER;
BEGIN
    -- Calculate max streak
    max_streak_val := calculate_habit_max_streak(p_habit_id);
    
    RETURN QUERY
    SELECT 
        p_habit_id as habit_id,
        calculate_habit_streak(p_habit_id) as current_streak,
        max_streak_val as max_streak,
        calculate_habit_consistency(p_habit_id) as consistency_percent,
        get_streak_badge(max_streak_val) as badge_level;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate minimum current streak across all user's habits (global streak)
CREATE OR REPLACE FUNCTION get_user_global_streak(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    min_streak INTEGER;
    habit_count INTEGER;
BEGIN
    -- Count active habits
    SELECT COUNT(*) INTO habit_count
    FROM habits 
    WHERE user_id = p_user_id AND is_active = true;
    
    -- If no habits, return 0
    IF habit_count = 0 THEN
        RETURN 0;
    END IF;
    
    -- Get minimum current streak across all habits
    SELECT COALESCE(MIN(calculate_habit_streak(id)), 0) INTO min_streak
    FROM habits 
    WHERE user_id = p_user_id AND is_active = true;
    
    RETURN min_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to get average consistency across all user's habits
CREATE OR REPLACE FUNCTION get_user_global_consistency(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    avg_consistency DECIMAL;
BEGIN
    SELECT COALESCE(AVG(calculate_habit_consistency(id)), 0) INTO avg_consistency
    FROM habits 
    WHERE user_id = p_user_id AND is_active = true;
    
    RETURN ROUND(avg_consistency);
END;
$$ LANGUAGE plpgsql;

-- Function to get highest badge tier achieved across all user's habits
CREATE OR REPLACE FUNCTION get_user_global_trophy(p_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
    max_streak INTEGER;
BEGIN
    -- Get maximum max_streak across all habits
    SELECT COALESCE(MAX(calculate_habit_max_streak(id)), 0) INTO max_streak
    FROM habits 
    WHERE user_id = p_user_id AND is_active = true;
    
    RETURN get_streak_badge(max_streak);
END;
$$ LANGUAGE plpgsql;

-- Updated user habit overview function with correct aggregate stats
CREATE OR REPLACE FUNCTION get_user_habit_overview_improved(p_user_id TEXT)
RETURNS TABLE(
    total_habits INTEGER,
    min_current_streak INTEGER,
    avg_consistency INTEGER,
    highest_badge TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(h.id)::INTEGER as total_habits,
        get_user_global_streak(p_user_id) as min_current_streak,
        get_user_global_consistency(p_user_id) as avg_consistency,
        get_user_global_trophy(p_user_id) as highest_badge
    FROM habits h
    WHERE h.user_id = p_user_id
    AND h.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 7. TRIGGERS FOR NEXTDNS SYNC
-- ==================================================

-- Trigger to mark blocked websites for NextDNS sync
CREATE OR REPLACE FUNCTION trigger_mark_blocked_website_for_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Mark for sync when a new blocked website is added
        PERFORM mark_for_nextdns_sync(NEW.user_id, 'domain', NEW.url, 'add_domain');
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Mark for sync if is_always_on status changes
        IF NEW.is_always_on != OLD.is_always_on THEN
            IF NEW.is_always_on THEN
                PERFORM mark_for_nextdns_sync(NEW.user_id, 'domain', NEW.url, 'add_domain');
            ELSE
                PERFORM mark_for_nextdns_sync(NEW.user_id, 'domain', NEW.url, 'remove_domain');
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Mark for sync when a blocked website is removed
        PERFORM mark_for_nextdns_sync(OLD.user_id, 'domain', OLD.url, 'remove_domain');
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_blocked_websites_nextdns_sync
    AFTER INSERT OR UPDATE OR DELETE ON blocked_websites
    FOR EACH ROW
    EXECUTE FUNCTION trigger_mark_blocked_website_for_sync();

-- Trigger to mark NextDNS categories for sync
CREATE OR REPLACE FUNCTION trigger_mark_category_for_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Mark category for sync when blocked status changes
        IF TG_OP = 'INSERT' OR (NEW.is_blocked != OLD.is_blocked) THEN
            IF NEW.is_blocked THEN
                PERFORM mark_for_nextdns_sync(NEW.user_id, 'category', NEW.category_id, 'add_category');
            ELSE
                PERFORM mark_for_nextdns_sync(NEW.user_id, 'category', NEW.category_id, 'remove_category');
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_nextdns_categories_sync
    AFTER INSERT OR UPDATE ON nextdns_categories
    FOR EACH ROW
    EXECUTE FUNCTION trigger_mark_category_for_sync();


-- ==================================================
-- 8. HABIT TRIGGERS FOR AUTOMATIC UPDATES
-- ==================================================

-- Trigger to update updated_at timestamp on habits
CREATE OR REPLACE FUNCTION update_habits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_habits_timestamp
    BEFORE UPDATE ON habits
    FOR EACH ROW
    EXECUTE FUNCTION update_habits_timestamp();

-- Trigger to update updated_at timestamp on habit_entries
CREATE OR REPLACE FUNCTION update_habit_entries_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_habit_entries_timestamp
    BEFORE UPDATE ON habit_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_habit_entries_timestamp();

-- ==================================================
-- 8.1. SYNC LOG CLEANUP TRIGGER
-- ==================================================

-- Function to cleanup old sync logs (keep only latest 100 per user)
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete oldest logs if user has more than 100
  DELETE FROM nextdns_sync_log 
  WHERE user_id = NEW.user_id 
  AND id NOT IN (
    SELECT id FROM nextdns_sync_log 
    WHERE user_id = NEW.user_id 
    ORDER BY created_at DESC 
    LIMIT 100
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically cleanup old sync logs after each insert
CREATE TRIGGER trigger_cleanup_sync_logs
  AFTER INSERT ON nextdns_sync_log
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_sync_logs();

-- ==================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ==================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nextdns_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nextdns_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nextdns_sync_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies that work with Clerk user IDs (skip if exists)
DO $$ BEGIN
    CREATE POLICY "Users can view own profile" ON profiles 
    FOR SELECT USING (id = current_setting('app.current_user_id', true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile" ON profiles 
    FOR UPDATE USING (id = current_setting('app.current_user_id', true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own profile" ON profiles 
    FOR INSERT WITH CHECK (id = current_setting('app.current_user_id', true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage own blocked websites" ON blocked_websites 
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage own habits" ON habits 
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage own habit entries" ON habit_entries 
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


DO $$ BEGIN
    CREATE POLICY "Users can manage own NextDNS account" ON nextdns_accounts 
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage own NextDNS categories" ON nextdns_categories 
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view own NextDNS sync log" ON nextdns_sync_log 
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==================================================
-- 10. INDEXES FOR PERFORMANCE
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_blocked_websites_user_id ON blocked_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_websites_sync_status ON blocked_websites(user_id, nextdns_synced);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habit_entries_habit_date ON habit_entries(habit_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user_date ON habit_entries(user_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_entries_date_completed ON habit_entries(completion_date, completed);
CREATE INDEX IF NOT EXISTS idx_nextdns_accounts_user_id ON nextdns_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_nextdns_categories_user_id ON nextdns_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_nextdns_categories_user_category ON nextdns_categories(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_nextdns_sync_log_user_date ON nextdns_sync_log(user_id, created_at);

-- ==================================================
-- 11. WEBHOOK HANDLER FUNCTION (For Clerk integration)
-- ==================================================

CREATE OR REPLACE FUNCTION handle_clerk_webhook(
  event_type TEXT,
  user_data JSONB
) RETURNS VOID AS $$
DECLARE
  user_id TEXT;
  user_email TEXT;
  first_name TEXT;
  last_name TEXT;
  image_url TEXT;
  username TEXT;
BEGIN
  -- Extract user data from webhook payload
  user_id := user_data->>'id';
  user_email := COALESCE(
    user_data->'email_addresses'->0->>'email_address',
    user_data->>'primary_email_address'
  );
  first_name := user_data->>'first_name';
  last_name := user_data->>'last_name';
  image_url := user_data->>'image_url';
  username := user_data->>'username';
  
  -- Handle different event types
  CASE event_type
    WHEN 'user.created' THEN
      -- Insert new user profile
      INSERT INTO profiles (id, email, first_name, last_name, image_url, username)
      VALUES (user_id, user_email, first_name, last_name, image_url, username)
      ON CONFLICT (id) DO NOTHING;
      
    WHEN 'user.updated' THEN
      -- Update existing user profile
      UPDATE profiles 
      SET 
        email = user_email,
        first_name = first_name,
        last_name = last_name,
        image_url = image_url,
        username = username,
        updated_at = NOW()
      WHERE id = user_id;
      
    WHEN 'user.deleted' THEN
      -- Delete user profile (cascade will handle related data)
      DELETE FROM profiles WHERE id = user_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 12. POPULATE INITIAL NEXTDNS CATEGORIES
-- ==================================================

-- Insert comprehensive NextDNS categories (15 total from project website)
INSERT INTO nextdns_categories (user_id, category_id, category_name, is_blocked)
SELECT 
    p.id as user_id,
    category_data.category_id,
    category_data.category_name,
    false as is_blocked
FROM profiles p
CROSS JOIN (
    VALUES 
        ('porn', 'Porn'),
        ('gambling', 'Gambling'),
        ('dating', 'Dating'),
        ('piracy', 'Piracy'),
        ('social-networks', 'Social Networks'),
        ('gaming', 'Online Gaming'),
        ('video-streaming', 'Video Streaming')
) AS category_data(category_id, category_name)
ON CONFLICT (user_id, category_id) DO NOTHING;

-- ==================================================
-- MVP SCHEMA COMPLETE ✅
-- ==================================================