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
-- 3. NEXTDNS INTEGRATION TABLES
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
-- 4. HELPER FUNCTIONS
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
-- 5. TRIGGERS FOR NEXTDNS SYNC
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
-- 6. ROW LEVEL SECURITY (RLS)
-- ==================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_websites ENABLE ROW LEVEL SECURITY;
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
-- 7. INDEXES FOR PERFORMANCE
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_blocked_websites_user_id ON blocked_websites(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_websites_sync_status ON blocked_websites(user_id, nextdns_synced);
CREATE INDEX IF NOT EXISTS idx_nextdns_accounts_user_id ON nextdns_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_nextdns_categories_user_id ON nextdns_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_nextdns_categories_user_category ON nextdns_categories(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_nextdns_sync_log_user_date ON nextdns_sync_log(user_id, created_at);

-- ==================================================
-- 8. WEBHOOK HANDLER FUNCTION (For Clerk integration)
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
-- 9. POPULATE INITIAL NEXTDNS CATEGORIES
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