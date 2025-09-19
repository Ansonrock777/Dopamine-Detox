"use client";

import { ReactNode } from "react";
import { usePayment } from "@/hooks/usePayment";
import { PaymentRequired } from "@/components/PaymentRequired";
import { Card, CardContent } from "@/components/ui/card";

interface PaymentProtectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function PaymentProtection({
  children,
  fallback,
  showUpgradePrompt = true
}: PaymentProtectionProps) {
  const { hasPaid, loading } = usePayment();

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-white flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Checking access permissions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasPaid) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return <PaymentRequired />;
    }

    return null;
  }

  return <>{children}</>;
}