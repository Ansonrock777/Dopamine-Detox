"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";


import { WebsiteBlockingInterface } from "@/components/WebsiteBlockingInterface";
import { NextDNSConfig } from "@/components/NextDNSConfig";
import { DeviceSetupGuide } from "@/components/DeviceSetupGuide";
import { EnhancedOnboarding } from "@/components/EnhancedOnboarding";

import { toast } from "sonner";
import {
  getBlockedWebsites,
} from "@/lib/database";
import { testSupabaseConnection } from "@/lib/supabase";
import type { BlockedWebsite, NextDNSAccount } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [blockedSites, setBlockedSites] = useState<BlockedWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextDnsAccount, setNextDnsAccount] = useState<NextDNSAccount | null>(
    null
  );

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      console.log("Testing Supabase connection...");
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest) {
        throw new Error("Failed to connect to database");
      }

      console.log("Fetching user data for user:", user.id);
      console.log("Full user object:", JSON.stringify(user, null, 2));
      const [blocked, nextDnsRes] = await Promise.all([
        getBlockedWebsites(user.id),
        fetch("/api/nextdns/account").catch((error) => {
          console.error("Failed to fetch NextDNS account:", error);
          return new Response(null, { status: 500 });
        }),
      ]);

      setBlockedSites(blocked);

      if (nextDnsRes.ok) {
        const nextDnsData = await nextDnsRes.json();
        console.log("NextDNS account data received:", nextDnsData);
        setNextDnsAccount(nextDnsData.account);
      } else {
        console.log("NextDNS account not connected or request failed");
        setNextDnsAccount(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        error: error,
      });
      toast.error(
        `Failed to load data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
            Welcome back,{" "}
            {user?.firstName ||
              user?.emailAddresses?.[0]?.emailAddress?.split("@")[0]}
            !
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            Manage your digital wellness with NextDNS network-level blocking,
            category filtering, and customizable focus rules.
          </p>
        </div>
      </div>

      {/* Enhanced Onboarding */}
      <div className="w-full">
        <EnhancedOnboarding
          nextDnsConnected={!!nextDnsAccount}
          hasBlockedWebsites={blockedSites.length > 0}
          onScrollToSection={(section) => {
            const element = document.getElementById(section);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
        />
      </div>





      {/* NextDNS Configuration */}
      <div id="nextdns-config" className="w-full">
        <NextDNSConfig />
      </div>

      {/* Device Setup Guide */}
      <div id="device-setup" className="w-full">
        <DeviceSetupGuide
          nextDnsProfileId={nextDnsAccount?.profile_id}
          nextDnsAccountId={nextDnsAccount?.id}
        />
      </div>

      {/* Website Blocking Interface */}
      <div id="website-blocking" className="w-full">
        <WebsiteBlockingInterface />
      </div>

    </div>
  );
}
