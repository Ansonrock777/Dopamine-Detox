"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export interface PaymentStatus {
  hasPaid: boolean;
  subscriptionStatus: 'free' | 'paid' | 'expired';
  paymentDate?: string;
  loading: boolean;
  error?: string;
}

export function usePayment(): PaymentStatus {
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    hasPaid: false,
    subscriptionStatus: 'free',
    loading: true
  });

  useEffect(() => {
    if (!user) {
      setPaymentStatus({
        hasPaid: false,
        subscriptionStatus: 'free',
        loading: false
      });
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        console.log('🔍 Checking user payment status...');

        const response = await fetch('/api/user/subscription');

        if (!response.ok) {
          throw new Error('Failed to fetch payment status');
        }

        const data = await response.json();
        console.log('💰 Payment status received:', data);

        setPaymentStatus({
          hasPaid: data.hasPaid,
          subscriptionStatus: data.subscriptionStatus,
          paymentDate: data.paymentDate,
          loading: false
        });
      } catch (error) {
        console.error('❌ Error checking payment status:', error);
        setPaymentStatus({
          hasPaid: false,
          subscriptionStatus: 'free',
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to check payment status'
        });
      }
    };

    checkPaymentStatus();
  }, [user]);

  return paymentStatus;
}