# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run tests
npm run test:e2e
```

## Project Architecture

This is a **Dopamine Detox** application - a digital wellness solution that helps users break free from distracting apps and websites using NextDNS network-level blocking. Build better focus habits through DNS filtering, category-based blocks, and mindful reflection - working across all your devices automatically.

### Web Dashboard (Next.js 15 + React 19)
- **Framework**: Next.js 15 with App Router, React 19, TypeScript
- **UI**: shadcn/ui components with Tailwind CSS
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Clerk with Supabase integration via webhooks
- **DNS Filtering**: NextDNS API integration for network-level blocking
- **Structure**:
  - `src/app/dashboard/` - Main dashboard interface for managing settings
  - `src/lib/database.ts` - Database operations with RLS context handling
  - `src/lib/supabase.ts` - Supabase client configuration
  - `src/components/` - UI components including shadcn/ui primitives

## MVP Features

### 🔒 App & Website Blocking
- Block specific apps and websites (Instagram, YouTube, etc.)
- **Reflection Wall**: Answer thoughtful questions before accessing blocked content
- Helps you pause and think before unlocking distractions

### 📵 Category-Based Blocking
Block entire categories of distracting content:
- **Social Media** (Facebook, Instagram, Twitter)
- **Adult Content** (Pornography sites)  
- **News** (News websites and apps)
- **Shopping** (E-commerce and addictive shopping sites)
- **Gaming** (Gaming websites and platforms)

*Powered by NextDNS for network-level filtering across all devices*

## Key Technical Patterns

### Database Operations with RLS
All database functions in `src/lib/database.ts` use a `setUserContext` helper that calls `supabase.rpc('set_current_user_id')` for Row Level Security. This pattern is critical for multi-tenant security:

```typescript
const setUserContext = async (userId: string) => {
  await supabase.rpc('set_current_user_id', { user_id: userId })
}
```

### Authentication Flow
- Users authenticate via Clerk
- Clerk webhook integration creates/updates user profiles
- RLS policies enforce data isolation per user

### NextDNS Integration
- Individual NextDNS account setup per user
- API Key, Account ID, Profile ID storage in database
- Real-time sync of blocking rules via NextDNS API
- Category-based blocking configuration

## Database Schema

Key tables (managed by scripts in `scripts/` directory):
- `profiles` - User data from Clerk authentication
- `blocked_websites` - Individual website/domain blocking
- `website_rules` - Time-based focus rules
- `nextdns_accounts` - NextDNS user account configuration
- `nextdns_categories` - Category-based blocking settings
- `nextdns_sync_log` - Tracking API sync operations

## Environment Setup

Required environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - For webhook operations
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `CLERK_SECRET_KEY` - Clerk server-side operations
- `CLERK_WEBHOOK_SECRET` - For webhook verification

## Database Setup

1. Run `scripts/mvp-schema.sql` in Supabase SQL Editor
2. Set up Clerk webhook for user profile synchronization
3. Configure NextDNS API integration

### Database Schema Changes

When database changes are needed:
1. **Create a new SQL file** in the `scripts/` directory with a descriptive name (e.g., `add-reflection-questions.sql`)
2. Include the complete SQL changes (CREATE TABLE, ALTER TABLE, etc.)
3. Wait for user confirmation that the script has been run in Supabase
4. **Delete the temporary SQL file** once confirmed
5. **Update `scripts/mvp-schema.sql`** to include the changes for future deployments

This workflow ensures database changes are properly tracked and the main schema file stays current.

## Code Conventions

Based on `.cursorrules`:
- TypeScript with strict typing
- Next.js App Router patterns
- Tailwind for styling
- All components in `src/components/`
- API routes in `src/app/api/`
- Utilities and helpers in `src/lib/`
- shadcn for UI