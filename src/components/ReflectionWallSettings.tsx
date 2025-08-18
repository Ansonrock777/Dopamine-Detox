"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Clock, 
  MessageSquare, 
  History,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface ReflectionSettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  require_response: boolean;
  cooldown_minutes: number;
  questions_per_session: number;
  created_at: string;
  updated_at: string;
}

interface ReflectionResponse {
  id: string;
  website_url: string;
  response: string;
  was_unblocked: boolean;
  reflected_at: string;
  reflection_questions: {
    question: string;
    category: string;
  };
}

export function ReflectionWallSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReflectionSettings | null>(null);
  const [recentResponses, setRecentResponses] = useState<ReflectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch settings and recent responses in parallel
      const [settingsRes, responsesRes] = await Promise.all([
        fetch('/api/reflection/settings'),
        fetch('/api/reflection/responses?limit=5')
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.settings);
      }

      if (responsesRes.ok) {
        const responsesData = await responsesRes.json();
        setRecentResponses(responsesData.responses || []);
      }

    } catch (error) {
      console.error('Error fetching reflection data:', error);
      toast.error('Failed to load reflection settings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const updateSettings = async (updates: Partial<ReflectionSettings>) => {
    if (!user || saving) return;

    setSaving(true);
    try {
      const response = await fetch('/api/reflection/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update settings');
      }

      const data = await response.json();
      setSettings(data.settings);
      toast.success('Reflection settings updated');

    } catch (error) {
      console.error('Error updating reflection settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const getStats = () => {
    const total = recentResponses.length;
    const proceeded = recentResponses.filter(r => r.was_unblocked).length;
    const reflected = total - proceeded;
    
    return {
      total,
      reflected,
      proceeded,
      reflectionRate: total > 0 ? Math.round((reflected / total) * 100) : 0
    };
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-white flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            <span>Loading reflection settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Reflection Wall Configuration */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Brain className="w-5 h-5 mr-2 text-orange-500" />
            Reflection Wall Settings
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Configure how and when the reflection wall appears to help you pause before accessing distracting content.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings && (
            <>
              {/* Enable/Disable Reflection Wall */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white font-medium">Enable Reflection Wall</Label>
                  <p className="text-gray-400 text-sm">
                    Show thoughtful questions before accessing blocked content
                  </p>
                </div>
                <Switch
                  checked={settings.is_enabled}
                  onCheckedChange={(checked) => 
                    updateSettings({ is_enabled: checked })
                  }
                  disabled={saving}
                  className="data-[state=checked]:bg-orange-600"
                />
              </div>

              {settings.is_enabled && (
                <>
                  {/* Require Response */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-white font-medium">Require Written Response</Label>
                      <p className="text-gray-400 text-sm">
                        User must write a thoughtful response to proceed
                      </p>
                    </div>
                    <Switch
                      checked={settings.require_response}
                      onCheckedChange={(checked) => 
                        updateSettings({ require_response: checked })
                      }
                      disabled={saving}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>

                  {/* Cooldown Period */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white font-medium">Cooldown Period</Label>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        <Clock className="w-3 h-3 mr-1" />
                        {settings.cooldown_minutes} minutes
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm">
                      How long after reflecting before showing the wall again for the same site
                    </p>
                    <Slider
                      value={[settings.cooldown_minutes]}
                      onValueChange={([value]) => 
                        updateSettings({ cooldown_minutes: value })
                      }
                      min={5}
                      max={120}
                      step={5}
                      className="py-4"
                      disabled={saving}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>5 min</span>
                      <span>60 min</span>
                      <span>120 min</span>
                    </div>
                  </div>

                  {/* Questions Per Session */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-white font-medium">Questions Per Session</Label>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {settings.questions_per_session}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm">
                      How many reflection questions to show at once
                    </p>
                    <Slider
                      value={[settings.questions_per_session]}
                      onValueChange={([value]) => 
                        updateSettings({ questions_per_session: value })
                      }
                      min={1}
                      max={3}
                      step={1}
                      className="py-4"
                      disabled={saving}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 question</span>
                      <span>2 questions</span>
                      <span>3 questions</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Reflection Statistics */}
      {recentResponses.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Reflection Impact
            </CardTitle>
            <p className="text-gray-400 text-sm">
              Your recent reflection activity and mindful choices
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-gray-400">Total Reflections</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.reflected}</div>
                <div className="text-xs text-gray-400">Chose Differently</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-400">{stats.proceeded}</div>
                <div className="text-xs text-gray-400">Continued</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.reflectionRate}%</div>
                <div className="text-xs text-gray-400">Mindful Rate</div>
              </div>
            </div>

            {/* Recent Reflections */}
            <div className="space-y-2">
              <h4 className="text-white font-medium flex items-center">
                <History className="w-4 h-4 mr-2" />
                Recent Reflections
              </h4>
              {recentResponses.slice(0, 3).map((response) => (
                <div
                  key={response.id}
                  className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">
                      {response.website_url}
                    </span>
                    <Badge 
                      className={response.was_unblocked 
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' 
                        : 'bg-green-500/10 text-green-400 border-green-500/30'
                      }
                    >
                      {response.was_unblocked ? 'Continued' : 'Chose Differently'}
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">
                    &quot;{response.response.substring(0, 100)}...&quot;
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{response.reflection_questions.category}</span>
                    <span>{new Date(response.reflected_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}