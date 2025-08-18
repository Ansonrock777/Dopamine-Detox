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
