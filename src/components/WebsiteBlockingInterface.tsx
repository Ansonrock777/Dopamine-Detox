"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Plus, 
  Trash2, 
  Globe,
  AlertCircle,
  Search
} from "lucide-react";
import { toast } from "sonner";
import type { BlockedWebsite } from "@/types";
import { DeletionReflectionWall } from "./DeletionReflectionWall";

export function WebsiteBlockingInterface() {
  const { user } = useAuth();
  const [blockedSites, setBlockedSites] = useState<BlockedWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [newWebsite, setNewWebsite] = useState("");
  const [websiteError, setWebsiteError] = useState("");
  
  // Reflection wall state
  const [showReflectionWall, setShowReflectionWall] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState<{id: string, url: string} | null>(null);

  const fetchBlockedWebsites = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/websites/blocked');
      if (!response.ok) {
        throw new Error('Failed to fetch blocked websites');
      }
      const data = await response.json();
      setBlockedSites(data.websites || []);
    } catch (error) {
      console.error('Error fetching blocked websites:', error);
      toast.error('Failed to load blocked websites');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBlockedWebsites();
    }
  }, [user, fetchBlockedWebsites]);

  const validateUrl = (url: string): boolean => {
    const cleanUrl = url.trim().toLowerCase();
    
    // Remove protocol if present
    const urlWithoutProtocol = cleanUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return domainRegex.test(urlWithoutProtocol);
  };

  const cleanUrl = (url: string): string => {
    return url.trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, ''); // Remove path
  };

  const handleAddWebsite = async () => {
    if (!newWebsite.trim() || adding) return;

    const cleanedUrl = cleanUrl(newWebsite);
    
    if (!validateUrl(cleanedUrl)) {
      setWebsiteError('Please enter a valid domain (e.g., "facebook.com", "youtube.com")');
      return;
    }

    // Check if already exists
    if (blockedSites.some(site => site.url === cleanedUrl)) {
      setWebsiteError('This website is already in your blocklist');
      return;
    }

    setAdding(true);
    setWebsiteError("");

    try {
      const response = await fetch('/api/websites/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanedUrl, isAlwaysOn: true })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add website');
      }

      const data = await response.json();
      setBlockedSites([data.website, ...blockedSites]);
      setNewWebsite("");
      toast.success(`Successfully blocked ${cleanedUrl}`);
    } catch (error) {
      console.error('Error adding website:', error);
      setWebsiteError(error instanceof Error ? error.message : 'Failed to add website');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveWebsite = (id: string, url: string) => {
    setWebsiteToDelete({ id, url });
    setShowReflectionWall(true);
  };

  const handleConfirmDelete = async (websiteId: string) => {
    try {
      const response = await fetch('/api/websites/blocked', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: websiteId })
      });

      if (!response.ok) {
        throw new Error('Failed to remove website');
      }

      setBlockedSites(blockedSites.filter(site => site.id !== websiteId));
      const deletedSite = blockedSites.find(site => site.id === websiteId);
      toast.success(`Removed ${deletedSite?.url || 'website'} from blocklist`);
      
      // Reset reflection wall state
      setShowReflectionWall(false);
      setWebsiteToDelete(null);
    } catch (error) {
      console.error('Error removing website:', error);
      toast.error('Failed to remove website');
    }
  };

  const handleCancelDelete = () => {
    setShowReflectionWall(false);
    setWebsiteToDelete(null);
  };


  // Filter websites based on search
  const filteredSites = blockedSites.filter(site =>
    site.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-white flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Loading blocked websites...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showReflectionWall && websiteToDelete && (
        <DeletionReflectionWall
          websiteUrl={websiteToDelete.url}
          websiteId={websiteToDelete.id}
          onCancel={handleCancelDelete}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
      
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-500" />
                Website Blocking
              </CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                Block distracting websites across all your devices
              </p>
            </div>
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{blockedSites.length}</div>
                <div className="text-xs text-gray-400">Total Blocked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{blockedSites.length}</div>
                <div className="text-xs text-gray-400">Blocked</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add Website Form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Plus className="w-5 h-5 mr-2 text-blue-500" />
            Block New Website
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Website Domain</Label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  value={newWebsite}
                  onChange={(e) => {
                    setNewWebsite(e.target.value);
                    setWebsiteError("");
                  }}
                  placeholder="e.g., facebook.com, youtube.com, reddit.com"
                  className="bg-gray-800 border-gray-700 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddWebsite()}
                />
                {websiteError && (
                  <div className="flex items-center mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {websiteError}
                  </div>
                )}
              </div>
              <Button
                onClick={handleAddWebsite}
                disabled={adding || !newWebsite.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {adding ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Block Website
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Globe className="w-4 h-4 text-blue-400 mt-0.5" />
              <div className="text-blue-300 text-sm">
                <p className="font-semibold mb-1">How it works:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Enter just the domain name (e.g., &quot;facebook.com&quot;)</li>
                  <li>• Works across all devices when connected to NextDNS</li>
                  <li>• Blocks the entire website including subdomains</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Websites List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Blocked Websites</CardTitle>
            {blockedSites.length > 0 && (
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search websites..."
                  className="w-48 bg-gray-800 border-gray-700 text-white text-sm"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {blockedSites.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No websites blocked yet</h3>
              <p className="text-gray-500">Add your first distracting website to get started.</p>
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No results found</h3>
              <p className="text-gray-500">Try a different search term.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div>
                      <div className="text-white font-medium">{site.url}</div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant="destructive"
                          className="text-xs"
                        >
                          Blocked
                        </Badge>
                        <span className="text-gray-400 text-xs">
                          Added {new Date(site.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveWebsite(site.id, site.url)}
                      className="border-red-500 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
