"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import type { WebsiteRule } from "@/types";

interface AddWebsiteRuleFormProps {
  onAdd: (rule: Omit<WebsiteRule, 'id' | 'user_id' | 'created_at'>) => void;
  loading?: boolean;
}

export function AddWebsiteRuleForm({ onAdd, loading = false }: AddWebsiteRuleFormProps) {
  const [url, setUrl] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const action = "block" as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;

    onAdd({
      url: url.trim(),
      start_time: startTime,
      end_time: endTime,
      action,
      is_active: true,
    });

    // Reset form only if not loading (will be reset when operation completes)
    if (!loading) {
      setUrl("");
      setStartTime("09:00");
      setEndTime("17:00");
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Plus className="w-5 h-5 mr-2 text-blue-500" />
          Add Website Rule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Website Input */}
            <div className="space-y-2">
              <Label className="text-gray-300">Website</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="example.com"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label className="text-gray-300">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label className="text-gray-300">End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

          </div>

          <Button 
            type="submit" 
            disabled={loading || !url.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding Rule...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}