# Dopamine Detox

A digital wellness web app that helps users break free from distracting apps and websites using **NextDNS network-level blocking**. Unlike traditional app blockers that only work on a single device, Dopamine Detox blocks at the DNS level — working across every device on your network.

## Features

### Network-Level Blocking
- Block specific websites and apps via NextDNS DNS filtering
- **Category-based blocking** — block entire categories (social media, adult content, news, shopping, gaming) with one toggle
- Works across all devices: phone, laptop, tablet, smart TV, gaming console

### Reflection Wall
- When you try to access blocked content, you face thoughtful reflection questions before proceeding
- Configurable question sets and cooldown periods
- Turns mindless scrolling into a conscious choice

### Habit Tracking
- Visual grid-based habit tracking throughout the day
- Streak and consistency calculations
- Calendar view for long-term progress

### Payment
- One-time payment via Polar ($66) gates access to all features
- Webhook-based subscription activation

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 18, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Auth**: Clerk (webhooks sync users to Supabase)
- **DNS Filtering**: NextDNS API
- **Payments**: Polar
- **Hosting**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application
- A [NextDNS](https://nextdns.io) account

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/Ansonrock777/Dopamine-Detox.git
   cd Dopamine-Detox
   npm install
   ```

2. Copy `env.example` to `.env.local` and fill in your keys:
   ```bash
   cp env.example .env.local
   ```

3. Run the database schema in your Supabase SQL Editor:
   - Execute `scripts/mvp-schema.sql`

4. Set up the Clerk webhook to sync users to Supabase.

5. Start the dev server:
   ```bash
   npm run dev
   ```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:clean` | Clean `.next` cache and start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run Playwright end-to-end tests |

## Project Structure

```
src/
  app/
    page.tsx              # Landing page
    dashboard/            # Main dashboard (blocking, categories, NextDNS config)
    habit-tracker/        # Habit tracking interface
    reflection-wall/      # Reflection wall page
    api/                  # API routes (habits, NextDNS, webhooks, etc.)
  components/             # React components
    ui/                   # shadcn/ui primitives
  hooks/                  # Custom React hooks
  lib/                    # Database, NextDNS, utilities
  types/                  # TypeScript type definitions
scripts/
  mvp-schema.sql          # Complete database schema
public/                   # Static assets, PWA manifest, service worker
```

## Environment Variables

See `env.example` for the full list. Required:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase operations
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — Clerk auth
- `CLERK_WEBHOOK_SECRET` — Webhook verification

## License

Private project.
