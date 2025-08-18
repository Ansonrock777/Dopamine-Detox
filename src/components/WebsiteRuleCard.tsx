"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { X, Edit, Check, Clock, Shield } from "lucide-react";
import type { WebsiteRule } from "@/types";

interface WebsiteRuleCardProps {
  rule: WebsiteRule;
  onUpdate: (id: string, updates: Partial<WebsiteRule>) => void;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export function WebsiteRuleCard({ rule, onUpdate, onToggle, onDelete }: WebsiteRuleCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(rule.url);
  const [editStartTime, setEditStartTime] = useState(rule.start_time);
  const [editEndTime, setEditEndTime] = useState(rule.end_time);
  const [editAction, setEditAction] = useState(rule.action);

  const handleSave = () => {
    onUpdate(rule.id, {
      url: editUrl.trim(),
      start_time: editStartTime,
      end_time: editEndTime,
      action: editAction,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditUrl(rule.url);
    setEditStartTime(rule.start_time);
    setEditEndTime(rule.end_time);
    setEditAction(rule.action);
    setIsEditing(false);
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    };
    
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  if (isEditing) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Website Input */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Website</Label>
              <Input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="example.com"
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>

            {/* Time Range */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Start Time</Label>
              <Input
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">End Time</Label>
              <Input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>

            {/* Action */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Action</Label>
              <Select value={editAction} onValueChange={(value: "block") => setEditAction(value)}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-600">
                  <SelectItem value="block" className="text-white">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-red-500" />
                      Block
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
              className="border-gray-600 text-gray-300"
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-gray-700 transition-colors ${
      rule.is_active ? 'bg-gray-800' : 'bg-gray-800/50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Rule Display */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Website */}
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="text-white font-medium truncate">{rule.url}</div>
            </div>

            {/* Time Range */}
            <div className="flex items-center space-x-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm whitespace-nowrap">
                {formatTimeRange(rule.start_time, rule.end_time)}
              </span>
            </div>

            {/* Action Badge */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-red-900/30 text-red-400 px-2 py-1 rounded text-sm">
                <Shield className="w-3 h-3" />
                <span>Block</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3 ml-4">
            {/* Active Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={rule.is_active}
                onCheckedChange={(checked) => onToggle(rule.id, checked)}
                className="data-[state=checked]:bg-blue-600"
              />
              <span className="text-sm text-gray-400">
                {rule.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Edit Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-gray-300"
            >
              <Edit className="w-4 h-4" />
            </Button>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(rule.id)}
              className="text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}