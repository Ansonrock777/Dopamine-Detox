"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="bg-gray-900 border-gray-800 max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white mb-2">
            Payment Successful! 🎉
          </CardTitle>
          <p className="text-gray-400">
            Welcome to Dopamine Detox Pro - You now have lifetime access to network-level blocking
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Sparkles className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold text-white">You&apos;re all set!</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Network-level blocking activated across all devices</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Category-based filtering (social media, adult content, gaming)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Reflection wall for mindful browsing</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Habit tracking and progress insights</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Lifetime access - no recurring fees</span>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <Button
              onClick={handleGoToDashboard}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full"
              size="lg"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>

            <p className="text-gray-500 text-sm">
              Redirecting to dashboard in {countdown} seconds...
            </p>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-medium mb-2">What&apos;s Next?</h4>
            <div className="text-blue-200 text-sm space-y-1">
              <p>1. Set up NextDNS on your devices for instant blocking</p>
              <p>2. Configure your blocking categories</p>
              <p>3. Start tracking your digital wellness habits</p>
              <p>4. Experience true freedom from digital distractions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}