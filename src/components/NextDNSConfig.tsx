"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Shield, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import type { NextDNSAccount, NextDNSCategory, NextDNSSyncLog } from "@/types";
import { CategoryReflectionWall } from "@/components/CategoryReflectionWall";

type NextDNSProfileConfig = {
  id: string;
  user_id: string;
  profile_name: string;
  endpoint_id: string;
  dns_server_primary: string;
  dns_server_secondary: string;
  dns_over_tls: string;
  dns_over_https: string;
  ipv6_address_1?: string;
  ipv6_address_2?: string;
  is_business_account: boolean;
  last_synced: string;
  created_at: string;
  updated_at: string;
};

export function NextDNSConfig() {
  const { user } = useAuth();
  const [account, setAccount] = useState<NextDNSAccount | null>(null);
  const [categories, setCategories] = useState<NextDNSCategory[]>([]);
  const [syncLog, setSyncLog] = useState<NextDNSSyncLog[]>([]);
  const [profileConfig, setProfileConfig] = useState<NextDNSProfileConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // DNS configuration from business profile
  const [, setDnsConfig] = useState<{
    primary: string;
    secondary: string;
    ipv6Primary?: string;
    ipv6Secondary?: string;
    setupInstructions?: Record<string, string>;
  } | null>(null);
  const [showDnsInstructions, setShowDnsInstructions] = useState(false);
  
  
  // Reflection wall state
  const [showReflectionWall, setShowReflectionWall] = useState(false);
  const [pendingCategoryChange, setPendingCategoryChange] = useState<{
    categoryId: string;
    categoryName: string;
    targetState: boolean;
  } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const [accountRes, categoriesRes, syncLogRes, profileConfigRes] = await Promise.all([
        fetch('/api/nextdns/account').catch((error) => {
          console.error('Failed to fetch account:', error);
          return new Response(null, { status: 500 });
        }),
        fetch('/api/nextdns/categories').catch((error) => {
          console.error('Failed to fetch categories:', error);
          return new Response(null, { status: 500 });
        }),
        fetch('/api/nextdns/sync').catch((error) => {
          console.error('Failed to fetch sync log:', error);
          return new Response(null, { status: 500 });
        }),
        fetch('/api/nextdns/profile-config').catch((error) => {
          console.error('Failed to fetch profile config:', error);
          return new Response(null, { status: 500 });
        })
      ]);

      if (accountRes.ok) {
        const accountData = await accountRes.json();
        console.log('Account data received:', accountData);
        setAccount(accountData.account);
        
        // If it's a business profile, set DNS configuration
        if (accountData.dnsConfiguration) {
          setDnsConfig(accountData.dnsConfiguration);
        }
      } else {
        console.log('Account request failed or no account connected');
        setAccount(null);
        setDnsConfig(null);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        console.log('Categories data received:', categoriesData);
        setCategories(categoriesData.categories || []);
      } else {
        console.log('Categories request failed');
        setCategories([]);
      }

      if (syncLogRes.ok) {
        const syncLogData = await syncLogRes.json();
        console.log('Sync log data received:', syncLogData);
        setSyncLog(syncLogData.syncLog || []);
      } else {
        console.log('Sync log request failed');
        setSyncLog([]);
      }

      if (profileConfigRes.ok) {
        const profileConfigData = await profileConfigRes.json();
        console.log('Profile config data received:', profileConfigData);
        setProfileConfig(profileConfigData.config || null);
      } else {
        console.log('Profile config request failed');
        setProfileConfig(null);
      }
    } catch (error) {
      console.error('Error fetching NextDNS data:', error);
      toast.error('Failed to load NextDNS configuration');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Handle automatic NextDNS connection 
  const handleConnectNextDNS = async () => {
    setConnecting(true);
    try {
      console.log('🔄 Creating automatic NextDNS profile...');
      
      const response = await fetch('/api/nextdns/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profileName: 'Dopamine Detox'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create NextDNS profile');
      }

      const data = await response.json();
      console.log('✅ NextDNS profile created:', data);
      
      setAccount(data.account);
      if (data.dnsConfiguration) {
        setDnsConfig(data.dnsConfiguration);
        setShowDnsInstructions(true);
      }
      
      // Refresh data to get initialized categories
      await fetchData();
      
      toast.success(data.message || 'NextDNS profile created successfully!');
    } catch (error) {
      console.error('❌ Error creating NextDNS profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create NextDNS profile');
    } finally {
      setConnecting(false);
    }
  };

  const handleCategoryToggle = async (categoryId: string, isBlocked: boolean) => {
    const category = categories.find(cat => cat.category_id === categoryId);
    
    // If trying to unblock (turn off blocking), show reflection wall
    if (category && category.is_blocked && !isBlocked) {
      setPendingCategoryChange({
        categoryId,
        categoryName: category.category_name || categoryId,
        targetState: isBlocked
      });
      setShowReflectionWall(true);
      return;
    }

    // For blocking (turning on), proceed immediately
    await executeCategoryToggle(categoryId, isBlocked);
  };

  const executeCategoryToggle = async (categoryId: string, isBlocked: boolean) => {
    // Optimistic UI update - update state immediately for instant feedback
    setCategories(categories.map(cat => 
      cat.category_id === categoryId 
        ? { ...cat, is_blocked: isBlocked, updated_at: new Date().toISOString() }
        : cat
    ));

    try {
      const response = await fetch('/api/nextdns/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, isBlocked })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setCategories(categories.map(cat => 
          cat.category_id === categoryId 
            ? { ...cat, is_blocked: !isBlocked }
            : cat
        ));
        throw new Error('Failed to update category');
      }

      const data = await response.json();
      // Update with server response to ensure consistency
      setCategories(categories.map(cat => 
        cat.category_id === categoryId ? data.category : cat
      ));

      const categoryName = data.category.category_name || categories.find(c => c.category_id === categoryId)?.category_name || categoryId;
      toast.success(`${categoryName} ${isBlocked ? 'blocked' : 'unblocked'} and synced to NextDNS`);
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category - changes reverted');
    }
  };

  const handleReflectionWallCancel = () => {
    setShowReflectionWall(false);
    setPendingCategoryChange(null);
  };

  const handleReflectionWallConfirm = async (categoryId: string) => {
    if (pendingCategoryChange) {
      await executeCategoryToggle(categoryId, pendingCategoryChange.targetState);
    }
    setShowReflectionWall(false);
    setPendingCategoryChange(null);
  };


  const handleSyncProfileConfig = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/nextdns/profile-config/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to sync profile configuration');
      }

      const data = await response.json();
      setProfileConfig(data.config);
      toast.success('Profile configuration synced successfully');
    } catch (error) {
      console.error('Error syncing profile config:', error);
      toast.error('Failed to sync profile configuration');
    } finally {
      setSyncing(false);
    }
  };

  const handleRemoveAccount = async () => {
    try {
      const response = await fetch('/api/nextdns/account', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove NextDNS account');
      }

      setAccount(null);
      setCategories([]);
      setSyncLog([]);
      setProfileConfig(null);
      toast.success('NextDNS account removed successfully');
    } catch (error) {
      console.error('Error removing NextDNS account:', error);
      toast.error('Failed to remove NextDNS account');
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-white flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Loading NextDNS configuration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Reflection Wall Modal */}
      {showReflectionWall && pendingCategoryChange && (
        <CategoryReflectionWall
          categoryName={pendingCategoryChange.categoryName}
          categoryId={pendingCategoryChange.categoryId}
          onCancel={handleReflectionWallCancel}
          onConfirmUnblock={handleReflectionWallConfirm}
        />
      )}
      
    <div className="space-y-6">
      {/* NextDNS Account Status */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Globe className="w-5 h-5 mr-2 text-blue-500" />
            NextDNS Integration
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Network-level DNS filtering for all your devices
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!account ? (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  NextDNS Not Connected
                </h3>
                <p className="text-gray-500 mb-6">
                  Get instant network-wide blocking across all your devices
                </p>
                
                <Button
                  onClick={handleConnectNextDNS}
                  disabled={connecting}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  size="lg"
                >
                  {connecting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {connecting ? 'Creating Profile...' : 'Get Started with NextDNS'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                    <span className="text-white font-medium">{account.profile_name}</span>
                    {account.is_business_profile && (
                      <Badge variant="secondary" className="bg-blue-600">
                        Auto-Managed
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    ID: {account.profile_id}
                    {!account.is_business_profile && ` • API Key: ${account.api_key}`}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <div className="text-green-400 text-sm flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {account.is_business_profile ? 'Auto-managed' : 'Auto-sync enabled'}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRemoveAccount}
                    className="border-red-500 text-red-400 hover:bg-red-900/20"
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {/* DNS Configuration - Show for all profiles */}
              {profileConfig && (
                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-blue-300 font-semibold">DNS Configuration</h4>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSyncProfileConfig}
                        disabled={syncing}
                        className="text-blue-300 hover:text-blue-200"
                      >
                        {syncing ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-300 mr-1"></div>
                        ) : null}
                        {syncing ? 'Syncing...' : 'Sync'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDnsInstructions(!showDnsInstructions)}
                        className="text-blue-300 hover:text-blue-200"
                      >
                        {showDnsInstructions ? 'Hide' : 'Show'} Setup Instructions
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {/* ID Field */}
                    <div className="bg-gray-800 p-3 rounded border mb-3">
                      <p className="text-gray-300 font-medium mb-1">ID</p>
                      <code className="text-green-400 text-xs bg-gray-900 px-2 py-1 rounded">
                        {profileConfig.endpoint_id}
                      </code>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="bg-gray-800 p-3 rounded border">
                        <p className="text-gray-300 font-medium mb-1">Primary DNS</p>
                        <code className="text-green-400 text-xs bg-gray-900 px-2 py-1 rounded">
                          {profileConfig.dns_server_primary}
                        </code>
                      </div>
                      <div className="bg-gray-800 p-3 rounded border">
                        <p className="text-gray-300 font-medium mb-1">Secondary DNS</p>
                        <code className="text-green-400 text-xs bg-gray-900 px-2 py-1 rounded">
                          {profileConfig.dns_server_secondary}
                        </code>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-gray-800 p-3 rounded border">
                        <p className="text-gray-300 font-medium mb-1">DNS-over-TLS/QUIC</p>
                        <code className="text-green-400 text-xs bg-gray-900 px-2 py-1 rounded">
                          {profileConfig.dns_over_tls}
                        </code>
                      </div>
                      <div className="bg-gray-800 p-3 rounded border">
                        <p className="text-gray-300 font-medium mb-1">DNS-over-HTTPS</p>
                        <code className="text-green-400 text-xs bg-gray-900 px-2 py-1 rounded">
                          {profileConfig.dns_over_https}
                        </code>
                      </div>
                    </div>

                    {profileConfig.ipv6_address_1 && profileConfig.ipv6_address_2 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div className="bg-gray-800 p-3 rounded border">
                          <p className="text-gray-300 font-medium mb-1">IPv6 Primary</p>
                          <code className="text-green-400 text-xs bg-gray-900 px-2 py-1 rounded">
                            {profileConfig.ipv6_address_1}
                          </code>
                        </div>
                        <div className="bg-gray-800 p-3 rounded border">
                          <p className="text-gray-300 font-medium mb-1">IPv6 Secondary</p>
                          <code className="text-green-400 text-xs bg-gray-900 px-2 py-1 rounded">
                            {profileConfig.ipv6_address_2}
                          </code>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mt-2">
                      Last synced: {new Date(profileConfig.last_synced).toLocaleString()}
                    </div>
                  </div>

                  {showDnsInstructions && (
                    <div className="mt-4 pt-4 border-t border-blue-500/30">
                      <h5 className="text-blue-300 font-medium mb-3">Device Setup Instructions:</h5>
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="bg-gray-800 p-3 rounded">
                            <strong className="text-white">📱 iOS/iPhone:</strong>
                            <p className="text-gray-300 mt-1">Settings → General → VPN & Device Management → DNS → Configure DNS → Manual. Enter DNS servers above.</p>
                          </div>
                          <div className="bg-gray-800 p-3 rounded">
                            <strong className="text-white">🤖 Android:</strong>
                            <p className="text-gray-300 mt-1">Settings → Network & Internet → Advanced → Private DNS → Private DNS provider hostname. Use: {profileConfig.dns_over_tls}</p>
                          </div>
                          <div className="bg-gray-800 p-3 rounded">
                            <strong className="text-white">🪟 Windows:</strong>
                            <p className="text-gray-300 mt-1">Settings → Network & Internet → Change adapter options → Properties → TCP/IPv4 → Properties. Use custom DNS servers.</p>
                          </div>
                          <div className="bg-gray-800 p-3 rounded">
                            <strong className="text-white">🍎 macOS:</strong>
                            <p className="text-gray-300 mt-1">System Preferences → Network → Advanced → DNS. Add the DNS servers to the list.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Management */}
      {account && categories.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-500" />
              Category Blocking
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Block entire categories of websites and apps across all devices
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.category_id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div>
                    <span className="text-white font-medium">{category.category_name}</span>
                    <p className="text-gray-400 text-xs">{category.category_id}</p>
                  </div>
                  <Switch
                    checked={category.is_blocked}
                    onCheckedChange={(checked) => 
                      handleCategoryToggle(category.category_id, checked)
                    }
                    className="data-[state=checked]:bg-red-600"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Status */}
      {account && syncLog.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-400" />
              Sync History
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Recent synchronization activity with NextDNS
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncLog.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : log.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    )}
                    <div>
                      <span className="text-white text-sm font-medium">
                        {log.operation} {log.resource_type}
                      </span>
                      <p className="text-gray-400 text-xs">{log.resource_id}</p>
                      {log.error_message && (
                        <p className="text-red-400 text-xs">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}