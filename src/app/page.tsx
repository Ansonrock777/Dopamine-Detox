"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { DemoModal } from "@/components/DemoModal";
import { Brain, Shield, Timer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const { loading, isSignedIn } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, loading, router]);

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold">Dopamine Detox</span>
          </div>
          {!loading && isSignedIn ? (
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => openAuthModal('signin')}
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                Sign In
              </Button>
              <Button
                onClick={() => openAuthModal('signup')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Take Back Control of Your Attention
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Break free from the relentless cycle of pings, likes, and endless
            scrolls with science-backed tools designed to rewire your brain&apos;s
            reward pathways.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!loading && isSignedIn ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                onClick={() => openAuthModal('signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Start Your Detox Journey
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsDemoOpen(true)}
              className="border-gray-700 text-white hover:bg-gray-800 px-8 py-3 bg-transparent"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Science-Backed Digital Wellness
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Website Blocking</h3>
              <p className="text-gray-400">
                Block the sites and apps that most distract you, interrupting
                those automatic habit loops before they start.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-gray-600 rounded mx-auto mb-4 flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Grayscale Mode</h3>
              <p className="text-gray-400">
                Turn temptations into grayscale to blunt their instant appeal
                and reduce the dopamine hit from colorful interfaces.
              </p>
            </div>
            <div className="text-center p-6">
              <Timer className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Focus Timers</h3>
              <p className="text-gray-400">
                Set independent timers for blocking and grayscale modes, or
                create custom Focus Presets for different scenarios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How Dopamine Detox Works
          </h2>
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Identify Your Triggers
                </h3>
                <p className="text-gray-400">
                  Every notification hijacks your brain&apos;s reward system,
                  flooding you with tiny hits of dopamine and depleting your
                  willpower before you even realize it.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Configure Your Defenses
                </h3>
                <p className="text-gray-400">
                  Set up your blocklist, timers, and custom Focus Presets in our
                  clean, dark-mode dashboard. Schedule one-off focus sessions or
                  set up daily recurring blocks.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Train Your Brain</h3>
                <p className="text-gray-400">
                  Instead of mindlessly clicking through, you&apos;ll be forced to
                  pause on a Reflection Wall and answer simple questions,
                  rewiring your brain&apos;s reward pathways.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Start Training Your Brain for Real Discipline
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Sign up in seconds with your email account, configure your NextDNS
            settings, and start strengthening your deep-work stamina—one
            distraction at a time.
          </p>
          {!loading && isSignedIn ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 font-semibold"
              >
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              onClick={() => openAuthModal('signup')}
              className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 font-semibold"
            >
              Get Started Now - Free
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="container mx-auto text-center text-gray-400">
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
      
      <DemoModal 
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />
    </div>
  );
}
