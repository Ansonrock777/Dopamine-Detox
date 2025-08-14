# 📚 Database Scripts Overview

This folder contains all the SQL scripts needed to set up your Dopamine Detox application with different authentication methods.

## 🎯 **Which Script Should You Use?**

### **Starting Fresh with Clerk Auth** ✅ **RECOMMENDED**
**Use:** `main-schema.sql`
- Complete schema with quest system
- Designed for Clerk authentication
- Includes all new features (always-on blocking, focus rules, quests)
- Follow the `SETUP-GUIDE.md` for step-by-step instructions

### **Migrating from Supabase Auth to Clerk**
**Use:** `clerk-migration.sql` THEN `main-schema.sql`
1. First run `clerk-migration.sql` to update existing schema
2. Then run quest-related sections from `main-schema.sql`

### **Using Supabase Auth (Legacy)**
**Use:** `schema.sql` + `migration-customizable-features.sql`
- Original Supabase auth setup
- Add customizable features with migration
- No quest system included

---

## 📁 **File Descriptions**

### `main-schema.sql` 🎯
**Complete modern schema with:**
- ✅ Clerk authentication support
- ✅ User profiles synced via webhooks
- ✅ Always-on website blocking/grayscale
- ✅ Time-based focus rules
- ✅ Complete quest system with gamification
- ✅ User stats, achievements, and levels
- ✅ Focus session tracking
- ✅ Row Level Security (RLS)
- ✅ Automated triggers and functions

### `clerk-schema.sql`
**Original Clerk-specific schema (basic features only)**
- Clerk authentication
- Basic website blocking/grayscale
- Focus presets and timers
- No quest system

### `schema.sql`
**Original Supabase auth schema**
- Supabase native authentication
- Basic features only
- Legacy format

### `migration-customizable-features.sql`
**Adds customizable features to existing schema**
- Always-on blocking/grayscale toggles
- Time-based website rules
- Updates for enhanced focus mode

### `clerk-migration.sql`
**Migration script for existing databases**
- Converts UUID user IDs to TEXT (for Clerk)
- Adds new feature columns
- Updates foreign keys and RLS policies
- Safe migration with backup recommendations

---

## 🚀 **Recommended Setup Process**

### **For New Projects:**
1. Read `SETUP-GUIDE.md` completely
2. Set up Supabase project
3. Set up Clerk application
4. Run `main-schema.sql` in Supabase SQL Editor
5. Configure Clerk webhook
6. Test the integration

### **For Existing Projects:**
1. **Backup your database first!** ⚠️
2. Determine your current auth method
3. Choose appropriate migration path
4. Test on a staging environment first
5. Update your application code if needed

---

## 🎮 **Quest System Features**

The new quest system (in `main-schema.sql`) includes:

### **Quest Types:**
- **Daily Quests**: Reset every day
- **Weekly Quests**: Reset every week  
- **One-time Quests**: Complete once
- **Streak Quests**: Build consistent habits

### **Quest Categories:**
- 🎯 **Focus**: Concentration and deep work
- 🧠 **Digital Wellness**: Healthy tech habits
- ⚡ **Productivity**: Efficiency improvements
- 🧘 **Mindfulness**: Awareness and reflection
- 🔥 **Streak Building**: Consistency challenges

### **Gamification Features:**
- **Points System**: Earn points for completing quests
- **Levels**: Progress through levels based on points
- **Achievements**: Unlock badges and milestones
- **Streaks**: Track consecutive days of activity
- **Stats Dashboard**: Comprehensive user analytics

### **Sample Quests:**
- "Complete Your First Focus Session" (100 points)
- "Deep Work Master" - 3x 45-min sessions (500 points)
- "Block the Distractions" - Add 5 blocked sites (150 points)
- "Daily Focus Warrior" - 7-day streak (300 points)

---

## 🔗 **Database Relationships**

```
profiles (Clerk users)
├── blocked_websites (always-on blocking)
├── grayscale_websites (always-on grayscale)
├── website_rules (time-based rules)
├── user_quests (quest progress)
├── quest_activities (activity log)
├── user_achievements (earned badges)
├── focus_sessions (session tracking)
├── user_stats (levels & points)
├── timers (legacy feature)
└── focus_presets (legacy feature)

quest_categories
└── quests (available quests)
    └── user_quests (user progress)
```

---

## 🛠️ **Environment Variables Needed**

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Webhook (for Edge Function)
CLERK_WEBHOOK_SECRET=whsec_...
```

---

## 🚨 **Important Notes**

1. **Always backup your database** before running migrations
2. **Test on staging** before applying to production
3. **Clerk user IDs are TEXT**, not UUID like Supabase auth
4. **RLS policies** require setting user context via `set_current_user_id()`
5. **Webhooks are required** for Clerk → Supabase user sync
6. **Edge Functions need environment variables** for webhook handling

---

## 📞 **Need Help?**

1. Check `SETUP-GUIDE.md` for detailed instructions
2. Review Supabase logs for database errors
3. Check Clerk webhook logs for sync issues
4. Verify environment variables are set correctly
5. Test each component step by step

---

**Happy coding! 🚀**