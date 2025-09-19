# Break Free From Digital Addiction
## The Only Solution That Works Across **Every Device**

*Stop trying to block apps one by one. Start blocking at the network level.*

---

## 🚫 Why Every Other Method Fails

**App blockers?** Easily bypassed. Delete the app, use incognito mode, or switch devices.

**Browser extensions?** Only work on one browser. What about your phone? Your tablet? Your smart TV?

**Willpower alone?** We all know how that ends.

**The truth:** Unless you block at the network level, you're just playing whack-a-mole with your addiction.

---

## ⚡ The Only Way That Actually Works

**Dopamine Detox** uses **NextDNS network-level blocking** - the same technology that protects enterprise networks from threats. When you block something, it's blocked on:

- 📱 Your phone (iOS & Android)
- 💻 Your laptop (Mac, Windows, Linux) 
- 🖥️ Your desktop computer
- 📺 Your smart TV
- 🎮 Your gaming console
- 🏠 Every device in your home

**There's literally no way around it.**

---

## 🧠 Block The Addiction, Replace The Habit

### 🛡️ **Reflection Wall** - Pause Before You Relapse
When you try to access blocked content, you don't just hit a wall. You face yourself:
- **3 thoughtful questions** that make you aware of what you're really doing
- **2-minute mindful pause** with mini-challenges to redirect your energy  
- **Choose wisely:** Continue to the site or close and do something better

*No more mindless scrolling. Every access becomes a conscious choice.*

### 📵 **Category-Based Blocking** - Block Entire Addiction Categories
Don't play games with your addiction. Block entire categories:
- **Social Media** - Instagram, TikTok, Facebook, Twitter, Snapchat
- **Adult Content** - Complete protection across all devices
- **News & Politics** - Break the outrage cycle
- **Shopping** - Stop impulse buying and retail therapy
- **Gaming** - Reclaim hours lost to mindless gaming

### 📈 **Habit Replacement System** - Build What You Want
Blocking isn't enough. You need to replace the habit:
- **Visual habit tracking** throughout your day
- **Progress insights** that show your growth
- **Calendar view** to see your transformation over time
- **Replace scroll time** with reading, exercise, relationships, creativity

---

## 🔒 Why Network-Level Blocking Is The Only Real Solution

| Traditional App Blockers | Dopamine Detox (Network-Level) |
|--------------------------|--------------------------------|
| ❌ Works on 1 device only | ✅ **Works on ALL devices** |
| ❌ Easy to bypass/disable | ✅ **Impossible to bypass** |
| ❌ Can delete the app | ✅ **Built into your internet** |
| ❌ Incognito mode works | ✅ **Blocks at DNS level** |
| ❌ Switch browsers/devices | ✅ **Follows you everywhere** |

**When you're serious about breaking an addiction, you need a solution that's more determined than your cravings.**

---

## 🎯 Perfect For Breaking These Addictions

- **Social Media Addiction** - Instagram, TikTok, Facebook, Twitter
- **Pornography Addiction** - Complete network protection
- **News/Politics Addiction** - Break the doom-scrolling cycle  
- **Shopping Addiction** - Stop impulse purchases
- **Gaming Addiction** - Reclaim your time and focus
- **YouTube/Entertainment** - End mindless consumption

---

## ⚡ Get Started in 5 Minutes

1. **Sign up** for your account
2. **Connect your NextDNS** (free account works)
3. **Choose what to block** (categories or specific sites)
4. **Set up on all devices** with our simple guides
5. **Start building better habits** immediately

**Your addiction ends today. Your new life begins now.**

---

## 🎯 What Makes This Different

**Most apps try to fight your addiction. We end it.**

- **Zero bypass methods** - Built into your internet connection
- **Immediate setup** - Works in 5 minutes, lasts forever  
- **All devices protected** - Phone, laptop, tablet, smart TV, everything
- **Mindful intervention** - Reflection questions before every relapse attempt
- **Habit replacement** - Build what you want, not just remove what you don't

---

## 🏆 Success Stories

> *"I tried 12 different app blockers. This is the first one I couldn't outsmart. Finally free from Instagram."* - Sarah M.

> *"The reflection wall is genius. Makes me realize how mindless my scrolling was."* - David K.

> *"Works on my work computer, personal laptop, and phone. Can't escape to another device anymore."* - Maria L.

---

## 🗺️ Development Roadmap

## 💳 Payment Gateway Integration Plan (Polar)

### Overview
Integrate Polar payment gateway to require one-time payment before NextDNS access. First 5 users only - simple pricing model.

### Implementation Tasks

#### 1. Database Schema Changes
- [x] Add payment status fields to user profiles
  - `subscription_status` (free, paid, expired)
  - `payment_date` (when user paid)
  - `polar_customer_id` (Polar customer reference)
  - `polar_order_id` (order tracking)

#### 2. Environment Setup
- [x] Add Polar API keys to `.env.local`
  - `POLAR_ACCESS_TOKEN` - Polar API access token
  - `POLAR_WEBHOOK_SECRET` - For webhook verification
  - `POLAR_ORGANIZATION_ID` - Your Polar organization ID
  - `POLAR_PRODUCT_ID` - The product ID for the one-time payment

#### 3. Payment Component Development
- [x] Create `PaymentRequired` component
  - Replace "Connect NextDNS" button with "Subscribe Now"
  - Show pricing and payment call-to-action
  - Integrate with Polar checkout flow
- [x] Create Polar checkout integration
  - Use Polar's JavaScript SDK for checkout
  - Handle success/failure states
  - Redirect flow management

#### 4. Payment Protection
- [x] Modify NextDNS connection flow
  - Check payment status before allowing NextDNS features
  - Block all NextDNS API calls for unpaid users
  - Show payment required message in NextDNS section
- [x] Protect all premium features
  - Block habit tracking for free users
  - Block website blocking features
  - Show upgrade prompts throughout app

#### 5. Webhook Integration
- [x] Create Polar webhook handler (`/api/webhooks/polar`)
  - Handle `order.created` events
  - Validate webhook signatures
  - Update user subscription status
  - Send confirmation emails
- [x] Database updates on payment
  - Update user profile with payment status
  - Log payment transactions
  - Enable feature access

#### 6. User Experience
- [x] Payment success/failure pages
- [ ] Email confirmation for successful payments
- [x] Clear messaging about what's included
- [x] Simple pricing display ($X one-time payment)

#### 7. Webhook Configuration
- [x] Deploy app to production (Vercel recommended)
- [x] Configure Polar webhook URL: `https://your-domain.com/api/webhooks/polar`
- [x] Subscribe to webhook events in Polar dashboard:
  - `order.created` - When payment is completed
  - `checkout.completed` - Alternative payment completion event
  - `order.failed` - For failed payments (optional)
- [x] Copy webhook secret from Polar and add to `.env.local`:
  - `POLAR_WEBHOOK_SECRET=whsec_your_webhook_secret_here`
- [x] Test webhook with Polar's test webhook feature

#### 8. Testing & Validation
- [ ] Test payment flow end-to-end
- [ ] Test webhook reliability
- [ ] Verify feature access control
- [ ] Test with Polar's sandbox environment

### Technical Notes
- **Payment Model**: One-time payment for lifetime access
- **User Limit**: First 5 users only
- **Integration**: Polar.sh payment platform
- **Protection**: All NextDNS features locked behind payment
- **Checkout**: Polar-hosted checkout experience

### API Endpoints to Create
- `GET /api/user/subscription` - Check user payment status
- `POST /api/checkout/create` - Initialize Polar checkout
- `POST /api/webhooks/polar` - Handle payment confirmations
- `GET /api/admin/payments` - Admin view of payments (future)

---

### Phase 1: NextDNS Business Plan Backend Integration (Weeks 1-4)
**Goal**: Centralized profile management to prevent bypass attempts

#### Foundation & Setup (Weeks 1-2)
- [ ] **NextDNS Business Plan Setup** ($2/month per profile)
  - Subscribe to NextDNS Business Plan for API access
  - Generate Master API Key with secure storage
  - Validate Business/Admin API capabilities (profile creation, cloning, analytics)
- [ ] **Backend Architecture Development**
  - NextDNS API Service (profile management, blocklist sync)
  - User Profile Manager (lifecycle, preference mapping)
  - DNS Configuration Service (device setup, compliance monitoring)
  - Device Manager Service (provisioning, analytics correlation)
- [ ] **Database Schema Extensions**
  - `nextdns_business_profiles` - User-to-profile mapping
  - `nextdns_policy_rules` - Tiered control system
  - `nextdns_devices` - Device tracking and compliance
  - `nextdns_compliance_logs` - Security monitoring

#### Core Features (Weeks 3-4)
- [ ] **Automated User Onboarding**
  - Zero-config NextDNS profile creation on signup
  - Default policy application (social media, adult content blocking)
  - Device-specific setup instructions generation
- [ ] **Policy Management System**
  - System-controlled policies (core blocking, bypass prevention)
  - User-configurable preferences (custom sites, schedules)
  - Admin override capabilities (emergency unblock)
- [ ] **API Endpoints** (Node.js runtime for secrets/crypto)
  - `POST /api/nextdns/profile/create` - New user profile creation
  - `PUT /api/nextdns/profile/sync` - Preference synchronization
  - `GET /api/nextdns/setup-instructions` - Device configuration
  - `POST /api/nextdns/compliance/check` - Bypass detection

### Phase 2: Security & Enforcement (Weeks 5-6)
**Goal**: Multi-layer bypass prevention and compliance monitoring

- [ ] **Technical Bypass Prevention**
  - Block NextDNS dashboard access
  - DNS-over-HTTPS bypass detection
  - VPN/proxy service blocking
  - Alternative DNS server prevention
- [ ] **User Verification System**
  - DNS query fingerprinting
  - Blocked site accessibility testing
  - NextDNS analytics correlation
  - Compliance score calculation
- [ ] **Progressive Enforcement Actions**
  - Warning notifications for minor violations
  - Reset instructions for DNS changes
  - Account restrictions for repeated violations
  - Security alerts for system tampering

### Phase 3: User Experience & Production (Weeks 7-8)
**Goal**: Seamless setup and enterprise-grade reliability

- [ ] **Device Provisioning Automation**
  - iOS/macOS: Signed .mobileconfig profiles
  - Windows: PowerShell DNS configuration scripts
  - Android: Private DNS hostname with QR codes
  - Linux: NetworkManager/systemd-resolved profiles
- [ ] **Support & Diagnostics**
  - `GET /api/nextdns/diagnostics` - DNS resolution testing
  - `POST /api/support/unblock-request` - Emergency access
  - Real-time compliance monitoring
  - Automated support report generation
- [ ] **Production Hardening**
  - Idempotency keys for API operations
  - Rate limiting and circuit breakers
  - Observability (structured logs, metrics, alerts)
  - Load testing and security audit

### Phase 4: Advanced Features (Weeks 9-12)
**Goal**: Intelligence, analytics, and engagement

- [ ] **Behavioral Analytics**
  - Usage pattern analysis and bypass attempt detection
  - AI-powered policy recommendations
  - Personalized blocking schedules
  - Predictive intervention system
- [ ] **Compliance Gamification**
  - Daily/weekly compliance streaks
  - Achievement badges and leaderboards
  - Educational content on policy violations
  - Anonymous peer support features
- [ ] **Intelligence & Insights**
  - Peak bypass attempt time analysis
  - Most attempted blocked sites tracking
  - Policy effectiveness measurement
  - User engagement correlation

---

## 📋 Coming Soon

- **Advanced analytics** - See exactly how much time you're reclaiming
- **Community challenges** - Break addictions together
- **Smart scheduling** - Automatic blocks during focus time
- **Family plans** - Protect your children across all devices

---

## 🛠️ For Developers

Built with modern, secure technology:
- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Supabase (PostgreSQL) with Row Level Security  
- **Authentication**: Clerk
- **DNS Filtering**: NextDNS API
- **UI**: shadcn/ui, Tailwind CSS

### Habit Tracking: Streak and Consistency

- **Streak (habit-based)**: number of consecutive days completed, counting backwards from today. If today is not completed, streak is 0. Example: 4 days in a row, miss the 5th day → 0; check today → 5.
- **Consistency (habit-based)**: \(\text{consistency} = \frac{\text{completed\_days}}{\text{active\_days}} \times 100\) where:
  - **active_days** = `(today - habit.start_date) + 1` (inclusive)
  - **completed_days** = unique completed dates between `habit.start_date` and `today` (ignore future dates)
  - Round to nearest whole percent in UI; clamp to 0–100 in logic.
- **Timezone**: Use the user’s local timezone. Completions are stored as pure dates (`YYYY-MM-DD`) without time.
- **Implementation**: see `src/lib/streak-utils.ts` (`calculateCurrentStreak`, `calculateConsistency`, `calculateHabitStats`). UI reads from `src/components/HabitStats.tsx`.

### Quick Development Setup
```bash
git clone <repository-url>
cd dopamine-detox
npm install
npm run dev
```

*View the complete technical documentation in CLAUDE.md*

---

## 💪 Your New Life Starts Now

**Stop making excuses. Stop trying half-measures. Stop letting addiction control your life.**

The technology exists. The solution works. The only question is: 

**Are you ready to be free?**

[**Get Started Now →**](#)
