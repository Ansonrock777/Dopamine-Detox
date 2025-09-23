"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Lock, CheckCircle, Star, Clock } from "lucide-react";
import { toast } from "sonner";

export function PaymentRequired() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      console.log('🔄 Creating Polar checkout...');

      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceAmount: 6600, // $66.00 in cents
          productName: 'Dopamine Detox Pro',
          productDescription: 'Lifetime access to network-level blocking'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout');
      }

      const data = await response.json();
      console.log('✅ Checkout created:', data);

      // Redirect to Polar checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('❌ Error creating checkout:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Lock className="w-5 h-5 mr-2 text-yellow-500" />
          Premium Access Required
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Unlock network-level blocking across all your devices
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-8">
          <Lock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Early Access - Limited to First 5 Users
          </h3>
          <p className="text-gray-400 mb-6">
            Get lifetime access to the most powerful digital wellness tool ever built
          </p>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-baseline justify-center space-x-2 mb-2">
              <span className="text-4xl font-bold text-white">$66</span>
              <span className="text-gray-400">one-time</span>
            </div>
            <Badge variant="secondary" className="bg-yellow-600 text-yellow-100">
              <Star className="w-3 h-3 mr-1" />
              Early Bird Special
            </Badge>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8 text-left">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Network-Level Blocking</p>
                <p className="text-gray-400 text-sm">Works on every device - phone, laptop, smart TV, gaming console</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Impossible to Bypass</p>
                <p className="text-gray-400 text-sm">Built into your internet connection - no apps to delete or disable</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Category-Based Blocking</p>
                <p className="text-gray-400 text-sm">Block entire categories: social media, adult content, gaming, shopping</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Reflection Wall</p>
                <p className="text-gray-400 text-sm">Mindful questions before accessing blocked content</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Habit Tracking</p>
                <p className="text-gray-400 text-sm">Visual progress tracking and streak building</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Lifetime Access</p>
                <p className="text-gray-400 text-sm">One payment, lifetime access - no monthly fees</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={isProcessing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full text-lg py-6"
            size="lg"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <CreditCard className="w-5 h-5 mr-2" />
            )}
            {isProcessing ? 'Creating Checkout...' : 'Get Lifetime Access - $66'}
          </Button>

          <p className="text-gray-500 text-xs mt-4">
            Secure payment powered by Polar. Cancel anytime before payment completes.
          </p>
        </div>

        {/* Limited availability notice */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-300 text-sm font-medium">Limited Early Access</span>
          </div>
          <p className="text-yellow-200 text-sm mt-1">
            Only the first 5 users get this special pricing. After that, the price will increase significantly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}