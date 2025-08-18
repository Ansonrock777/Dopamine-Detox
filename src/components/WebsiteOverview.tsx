"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Shield, 
  Clock, 
  Globe, 
  X,
  Trash2
} from "lucide-react";
import type { BlockedWebsite, WebsiteRule } from "@/types";

interface WebsiteItem {
  id: string;
  url: string;
  type: "blocked" | "rule";
  status: string;
  details: string;
  isActive: boolean;
  scheduleInfo?: string;
  originalData: BlockedWebsite | WebsiteRule;
}

interface WebsiteOverviewProps {
  blockedSites: BlockedWebsite[];
  websiteRules: WebsiteRule[];
  onToggleBlocked: (id: string, isActive: boolean) => void;
  onToggleRule: (id: string, isActive: boolean) => void;
  onRemoveBlocked: (id: string) => void;
  onRemoveRule: (id: string) => void;
  onUpdateRule?: (id: string, updates: Partial<WebsiteRule>) => void;
}

export function WebsiteOverview({
  blockedSites,
  websiteRules,
  onToggleBlocked,
  onToggleRule,
  onRemoveBlocked,
  onRemoveRule,
  onUpdateRule: _onUpdateRule
}: WebsiteOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "blocked" | "rule">("all");

  // Convert all websites to unified format
  const allWebsites: WebsiteItem[] = useMemo(() => {
    const websites: WebsiteItem[] = [];

    // Add blocked websites
    blockedSites.forEach(site => {
      websites.push({
        id: site.id,
        url: site.url,
        type: "blocked",
        status: site.is_always_on ? "Always Active" : "Inactive",
        details: "Website completely blocked",
        isActive: site.is_always_on,
        originalData: site
      });
    });


    // Add website rules
    websiteRules.forEach(rule => {
      // Only blocking rules are supported now
      if (rule.action !== "block") return;
      websites.push({
        id: rule.id,
        url: rule.url,
        type: "rule",
        status: rule.is_active ? "Scheduled Active" : "Inactive",
        details: "Website blocked during focus time",
        isActive: rule.is_active,
        scheduleInfo: `${rule.start_time} - ${rule.end_time}`,
        originalData: rule
      });
    });

    return websites.sort((a, b) => a.url.localeCompare(b.url));
  }, [blockedSites, websiteRules]);

  // Filter websites based on search and type
  const filteredWebsites = useMemo(() => {
    return allWebsites.filter(website => {
      const matchesSearch = website.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === "all" || website.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [allWebsites, searchTerm, filterType]);

  // Get statistics
  const stats = useMemo(() => {
    const total = allWebsites.length;
    const active = allWebsites.filter(w => w.isActive).length;
    const byType = {
      blocked: allWebsites.filter(w => w.type === "blocked").length,
      rule: allWebsites.filter(w => w.type === "rule").length,
    };
    
    return { total, active, byType };
  }, [allWebsites]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "blocked": return <Shield className="w-4 h-4 text-red-500" />;
      case "rule": return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string, isActive: boolean) => {
    const baseClasses = "text-xs font-medium";
    switch (type) {
      case "blocked":
        return (
          <Badge variant={isActive ? "destructive" : "secondary"} className={baseClasses}>
            {isActive ? "Blocked" : "Not Active"}
          </Badge>
        );
      case "rule":
        const rule = websiteRules.find(r => r.id === filteredWebsites.find(w => w.type === "rule")?.id);
        const actionText = rule?.action === "block" ? "Block Rule" : "Grayscale Rule";
        return (
          <Badge variant={isActive ? "default" : "secondary"} className={`${baseClasses} bg-blue-600`}>
            {isActive ? actionText : "Not Active"}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const handleToggle = (website: WebsiteItem, newState: boolean) => {
    switch (website.type) {
      case "blocked":
        onToggleBlocked(website.id, newState);
        break;
      case "rule":
        onToggleRule(website.id, newState);
        break;
    }
  };

  const handleRemove = (website: WebsiteItem) => {
    switch (website.type) {
      case "blocked":
        onRemoveBlocked(website.id);
        break;
      case "rule":
        onRemoveRule(website.id);
        break;
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Globe className="w-5 h-5 mr-2 text-blue-500" />
          Website Overview
        </CardTitle>
        <p className="text-gray-400 text-sm">
          All your configured websites in one place
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Sites</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{stats.byType.blocked}</div>
            <div className="text-sm text-gray-400">Blocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.byType.rule}</div>
            <div className="text-sm text-gray-400">Rules</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search websites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-auto p-1"
                onClick={() => setSearchTerm("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <Tabs value={filterType} onValueChange={(value: string) => setFilterType(value as "all" | "blocked" | "rule")} className="w-auto">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="blocked" className="text-xs">Blocked</TabsTrigger>
              <TabsTrigger value="rule" className="text-xs">Rules</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Website List */}
        <div className="space-y-3">
          {filteredWebsites.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterType !== "all" 
                  ? "No websites match your search criteria" 
                  : "No websites configured yet"}
              </p>
            </div>
          ) : (
            filteredWebsites.map((website) => (
              <div
                key={`${website.type}-${website.id}`}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(website.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-white font-medium truncate">
                        {website.url}
                      </span>
                      {getTypeBadge(website.type, website.isActive)}
                    </div>
                    <p className="text-sm text-gray-400">{website.details}</p>
                    {website.scheduleInfo && (
                      <p className="text-xs text-blue-400 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Active: {website.scheduleInfo}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={website.isActive}
                      onCheckedChange={(checked) => handleToggle(website, checked)}
                      className={
                        website.type === "blocked" 
                          ? "data-[state=checked]:bg-red-600"
                          : "data-[state=checked]:bg-blue-600"
                      }
                    />
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {website.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(website)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        {filteredWebsites.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                allWebsites.forEach(website => {
                  if (!website.isActive) {
                    handleToggle(website, true);
                  }
                });
              }}
              className="text-green-400 border-green-400 hover:bg-green-400/10"
            >
              Enable All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                allWebsites.forEach(website => {
                  if (website.isActive) {
                    handleToggle(website, false);
                  }
                });
              }}
              className="text-red-400 border-red-400 hover:bg-red-400/10"
            >
              Disable All
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}