"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Shield, 
  Settings, 
  RotateCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Plus,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import type { NextDNSAccount, NextDNSCategory, NextDNSSyncLog } from "@/types";
import { CategoryReflectionWall } from "@/components/CategoryReflectionWall";

export function NextDNSConfig() {
  const { user } = useAuth();
  const [account, setAccount] = useState<NextDNSAccount | null>(null);
  const [categories, setCategories] = useState<NextDNSCategory[]>([]);
  const [syncLog, setSyncLog] = useState<NextDNSSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Setup form state
  const [setupForm, setSetupForm] = useState({
    apiKey: '',
    profileId: '',
    profileName: 'Dopamine Detox'
  });
  const [showSetupForm, setShowSetupForm] = useState(false);
  
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
      const [accountRes, categoriesRes, syncLogRes] = await Promise.all([
        fetch('/api/nextdns/account').catch((error) => {
          console.error('Failed to fetch account:', error);
          return { ok: false };
        }),
        fetch('/api/nextdns/categories').catch((error) => {
          console.error('Failed to fetch categories:', error);
          return { ok: false };
        }),
        fetch('/api/nextdns/sync').catch((error) => {
          console.error('Failed to fetch sync log:', error);
          return { ok: false };
        })
      ]);

      if (accountRes.ok) {
        const accountData = await accountRes.json();
        console.log('Account data received:', accountData);
        setAccount(accountData.account);
      } else {
        console.log('Account request failed or no account connected');
        setAccount(null);
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

  const handleSetupAccount = async () => {
    if (!setupForm.apiKey || !setupForm.profileId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSettingUp(true);
    try {
      const response = await fetch('/api/nextdns/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect to NextDNS account');
      }

      const data = await response.json();
      setAccount(data.account);
      setShowSetupForm(false);
      setSetupForm({ apiKey: '', profileId: '', profileName: 'Dopamine Detox' });
      
      // Refresh data to get initialized categories
      await fetchData();
      
      toast.success('NextDNS account connected successfully!');
    } catch (error) {
      console.error('Error connecting to NextDNS account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect to NextDNS account');
    } finally {
      setSettingUp(false);
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

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/nextdns/sync', {
        method: 'POST'
      });

      if (!response.ok) {
        console.error('Sync response not ok:', response.status, response.statusText);
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        console.error('Sync error details:', error);
        throw new Error(error.error || 'Failed to sync with NextDNS');
      }

      await fetchData(); // Refresh sync log
      toast.success('Successfully synced with NextDNS!');
    } catch (error) {
      console.error('Error syncing with NextDNS:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync with NextDNS');
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
                <p className="text-gray-500 mb-4">
                  Connect your NextDNS account to enable network-wide blocking
                </p>
                <Button
                  onClick={() => setShowSetupForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Connect NextDNS
                </Button>
              </div>
              
              {showSetupForm && (
                <div className="border-t border-gray-700 pt-4 space-y-4">
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold mb-2">Setup Instructions:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-gray-300 text-sm">
                      <li>Create a NextDNS account at <a href="https://nextdns.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center">nextdns.io <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                      <li>Go to <a href="https://my.nextdns.io/account" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center">account settings <ExternalLink className="w-3 h-3 ml-1" /></a> and generate an API key</li>
                      <li>Copy your Profile ID from Setup → Endpoints → ID</li>
                      <li>Enter the details below</li>
                    </ol>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key *</Label>
                      <div className="relative">
                        <Input
                          id="apiKey"
                          type={showApiKey ? "text" : "password"}
                          placeholder="Enter your NextDNS API key"
                          value={setupForm.apiKey}
                          onChange={(e) => setSetupForm({ ...setupForm, apiKey: e.target.value })}
                          className="bg-gray-800 border-gray-700 text-white pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profileId">Profile ID *</Label>
                      <Input
                        id="profileId"
                        placeholder="Your NextDNS profile ID (e.g., 649b14)"
                        value={setupForm.profileId}
                        onChange={(e) => setSetupForm({ ...setupForm, profileId: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profileName">Profile Name</Label>
                      <Input
                        id="profileName"
                        placeholder="Dopamine Detox"
                        value={setupForm.profileName}
                        onChange={(e) => setSetupForm({ ...setupForm, profileName: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSetupAccount}
                      disabled={settingUp}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {settingUp ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Connect Account
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowSetupForm(false)}
                      className="border-gray-700 text-gray-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
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
                  </div>
                  <p className="text-gray-400 text-sm">
                    Profile: {account.profile_id} • API Key: {account.api_key}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <div className="text-green-400 text-sm flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Auto-sync enabled
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