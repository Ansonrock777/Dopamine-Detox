"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { DemoModal } from "@/components/DemoModal";
import { Brain, Shield, Timer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export function LandingPageContent() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const { loading, isSignedIn } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, loading, router]);

  const openAuthModal = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Brain className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">
                Dopamine Detox
              </span>
            </Link>
          </div>

          {!loading && isSignedIn ? (
            <Link href="/dashboard" className="ml-auto">
              <Button>Go to Dashboard</Button>
            </Link>
          ) : (
            <div className="ml-auto flex items-center space-x-2">
              <Button onClick={() => openAuthModal("signin")} variant="ghost">
                Sign In
              </Button>
              <Button onClick={() => openAuthModal("signup")}>Sign Up</Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
            Break Free From Digital Addiction
          </h1>
          <h2 className="text-xl font-semibold sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground">
            The Only Solution That Works Across{" "}
            <span className="text-primary font-bold">Every Device</span>
          </h2>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Stop trying to block apps one by one. Start blocking at the network
            level.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!loading && isSignedIn ? (
              <Link href="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
              </Link>
            ) : (
              <Button size="lg" onClick={() => openAuthModal("signup")}>
                End Your Addiction Today
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsDemoOpen(true)}
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Why Others Fail Section */}
      <section className="space-y-6 bg-secondary py-16">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl text-destructive">
            🚫 Why Every Other Method Fails
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-background rounded-lg">
              <p className="text-lg text-muted-foreground">
                <span className="font-bold">App blockers?</span> Easily
                bypassed. Delete the app, use incognito mode, or switch devices.
              </p>
            </div>
            <div className="p-6 bg-background rounded-lg">
              <p className="text-lg text-muted-foreground">
                <span className="font-bold">Browser extensions?</span> Only work
                on one browser. What about your phone? Your tablet? Your smart
                TV?
              </p>
            </div>
            <div className="p-6 bg-background rounded-lg">
              <p className="text-lg text-muted-foreground">
                <span className="font-bold">Willpower alone?</span> We all know
                how that ends.
              </p>
            </div>
          </div>
          <p className="max-w-[42rem] text-2xl font-bold leading-normal text-foreground">
            The truth: Unless you block at the network level, you&apos;re just
            playing whack-a-mole with your addiction.
          </p>
        </div>
      </section>

      {/* Network Level Solution */}
      <section className="py-16">
        <div className="container max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            ⚡ The Only Way That Actually Works
          </h2>
          <p className="text-xl text-center text-muted-foreground mb-8">
            <span className="font-bold text-primary">Dopamine Detox</span> uses{" "}
            <span className="font-bold text-green-400">
              NextDNS network-level blocking
            </span>{" "}
            - the same technology that protects enterprise networks from
            threats. When you block something, it&apos;s blocked on:
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-2">Your Phone</h3>
              <p className="text-muted-foreground">iOS & Android</p>
            </div>
            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-lg font-semibold mb-2">Your Laptop</h3>
              <p className="text-muted-foreground">Mac, Windows, Linux</p>
            </div>
            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="text-4xl mb-4">📺</div>
              <h3 className="text-lg font-semibold mb-2">Smart TV & Gaming</h3>
              <p className="text-muted-foreground">Every device in your home</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-center text-green-400">
            There&apos;s literally no way around it.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary">
        <div className="container max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            🧠 Block The Addiction, Replace The Habit
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">🛡️ Reflection Wall</h3>
              <p className="text-muted-foreground">
                When you try to access blocked content, you face yourself: 3
                thoughtful questions and a 2-minute mindful pause. No more
                mindless scrolling.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-red-600 rounded mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">📵</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Category Blocking</h3>
              <p className="text-muted-foreground">
                Block entire addiction categories: Social Media, Adult Content,
                News, Shopping, Gaming. Don&apos;t play games with your addiction.
              </p>
            </div>
            <div className="text-center p-6">
              <Timer className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">
                📈 Habit Replacement
              </h3>
              <p className="text-muted-foreground">
                Blocking isn&apos;t enough. Visual habit tracking, progress insights,
                and calendar view to replace scroll time with reading, exercise,
                relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            🔒 Why Network-Level Blocking Is The Only Real Solution
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border rounded-lg">
              <thead>
                <tr className="bg-muted">
                  <th className="px-6 py-4 font-semibold">Feature</th>
                  <th className="px-6 py-4 font-semibold text-destructive">
                    Traditional App Blockers
                  </th>
                  <th className="px-6 py-4 font-semibold text-green-400">
                    Dopamine Detox (Network-Level)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-6 py-4 font-semibold">Device Coverage</td>
                  <td className="px-6 py-4 text-destructive">
                    ❌ Works on 1 device only
                  </td>
                  <td className="px-6 py-4 text-green-400">
                    ✅ Works on ALL devices
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-6 py-4 font-semibold">Bypass Protection</td>
                  <td className="px-6 py-4 text-destructive">
                    ❌ Easy to bypass/disable
                  </td>
                  <td className="px-6 py-4 text-green-400">
                    ✅ Impossible to bypass
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-6 py-4 font-semibold">App Deletion</td>
                  <td className="px-6 py-4 text-destructive">
                    ❌ Can delete the app
                  </td>
                  <td className="px-6 py-4 text-green-400">
                    ✅ Built into your internet
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-6 py-4 font-semibold">Incognito Mode</td>
                  <td className="px-6 py-4 text-destructive">
                    ❌ Incognito mode works
                  </td>
                  <td className="px-6 py-4 text-green-400">
                    ✅ Blocks at DNS level
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xl font-bold text-center mt-8">
            When you&apos;re serious about breaking an addiction, you need a solution
            that&apos;s more determined than your cravings.
          </p>
        </div>
      </section>

      {/* Perfect For Section */}
      <section className="py-16 bg-secondary">
        <div className="container max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            🎯 Perfect For Breaking These Addictions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-background rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-blue-400">
                📱 Social Media Addiction
              </h3>
              <p className="text-muted-foreground">
                Instagram, TikTok, Facebook, Twitter, Snapchat
              </p>
            </div>
            <div className="p-6 bg-background rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-red-400">
                🔞 Adult Content Addiction
              </h3>
              <p className="text-muted-foreground">
                Complete network protection across all devices
              </p>
            </div>
            <div className="p-6 bg-background rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">
                📰 News/Politics Addiction
              </h3>
              <p className="text-muted-foreground">
                Break the doom-scrolling cycle
              </p>
            </div>
            <div className="p-6 bg-background rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-green-400">
                🛒 Shopping Addiction
              </h3>
              <p className="text-muted-foreground">
                Stop impulse purchases and retail therapy
              </p>
            </div>
            <div className="p-6 bg-background rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-purple-400">
                🎮 Gaming Addiction
              </h3>
              <p className="text-muted-foreground">
                Reclaim your time and focus
              </p>
            </div>
            <div className="p-6 bg-background rounded-lg">
              <h3 className="text-xl font-semibold mb-3 text-orange-400">
                📺 Entertainment Addiction
              </h3>
              <p className="text-muted-foreground">
                End mindless YouTube consumption
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ⚡ Get Started in 5 Minutes
          </h2>
          <div className="max-w-2xl mx-auto mb-8 text-left">
            <div className="space-y-3 text-lg">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  1
                </span>
                <span>Sign up for your account</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  2
                </span>
                <span>Connect your NextDNS (free account works)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  3
                </span>
                <span>Choose what to block (categories or specific sites)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  4
                </span>
                <span>Set up on all devices with our simple guides</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  5
                </span>
                <span>Start building better habits immediately</span>
              </div>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mb-8">
            Your addiction ends today. Your new life begins now.
          </p>
          {!loading && isSignedIn ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-white text-primary-foreground hover:bg-gray-100"
              >
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              onClick={() => openAuthModal("signup")}
              className="bg-white text-primary-foreground hover:bg-gray-100"
            >
              End Your Addiction Today - Free
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container text-center text-muted-foreground">
          <p>
            &copy; 2024 Dopamine Detox. Take control of your digital habits.
          </p>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />

      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </>
  );
}