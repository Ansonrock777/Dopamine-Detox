"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Shield, 
  ArrowRight, 
  RotateCcw,
  CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";

interface ReflectionQuestion {
  id: string;
  question: string;
  category: string;
}

interface ReflectionWallProps {
  websiteUrl: string;
  category?: string;
  onProceed?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export function ReflectionWall({ 
  websiteUrl, 
  category = 'general',
  onProceed,
  onCancel,
  isModal = false 
}: ReflectionWallProps) {
  const [question, setQuestion] = useState<ReflectionQuestion | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchReflectionQuestion = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/reflection/questions?category=${category}&limit=1`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reflection question');
      }

      if (data.questions && data.questions.length > 0) {
        setQuestion(data.questions[0]);
      } else {
        // Fallback question if none found
        setQuestion({
          id: 'fallback',
          question: 'Take a moment to think: Is this the best use of your time right now?',
          category: 'general'
        });
      }
      
    } catch (error) {
      console.error('Error fetching reflection question:', error);
      toast.error('Failed to load reflection question');
      
      // Fallback question on error
      setQuestion({
        id: 'fallback',
        question: 'Take a moment to think: Is this the best use of your time right now?',
        category: 'general'
      });
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchReflectionQuestion();
  }, [category, fetchReflectionQuestion]);

  const handleSubmitReflection = async (wasUnblocked: boolean) => {
    if (!question || !response.trim()) {
      toast.error('Please write a thoughtful response before continuing');
      return;
    }

    setSubmitting(true);

    try {
      const apiResponse = await fetch('/api/reflection/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: question.id,
          response: response.trim(),
          website_url: websiteUrl,
          was_unblocked: wasUnblocked
        }),
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(data.error || 'Failed to save reflection');
      }

      if (wasUnblocked) {
        toast.success('Reflection saved. You may now proceed.');
        onProceed?.();
      } else {
        toast.success('Great choice! Reflection saved.');
        onCancel?.();
      }

    } catch (error) {
      console.error('Error saving reflection:', error);
      toast.error('Failed to save reflection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'social_media': return '📱';
      case 'shopping': return '🛒';
      case 'news': return '📰';
      case 'gaming': return '🎮';
      default: return '🧠';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'social_media': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'shopping': return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'news': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'gaming': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800 max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading reflection question...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${isModal ? 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50' : ''}`}>
      <Card className="bg-gray-900 border-gray-800 max-w-2xl mx-auto">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-orange-500/10 rounded-full">
              <Brain className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          
          <CardTitle className="text-2xl text-white mb-2">
            Take a Moment to Reflect
          </CardTitle>
          
          <div className="flex items-center justify-center space-x-4">
            <Badge className={getCategoryColor(question?.category || 'general')}>
              {getCategoryIcon(question?.category || 'general')} {question?.category || 'General'}
            </Badge>
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              <Shield className="w-3 h-3 mr-1" />
              {websiteUrl}
            </Badge>
          </div>
          
          <p className="text-gray-400 text-sm mt-3">
            Before accessing this content, let&apos;s pause and think about your intentions.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {question && (
            <>
              {/* Reflection Question */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-orange-400" />
                  Reflection Question
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {question.question}
                </p>
              </div>

              {/* Response Textarea */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">
                  Your thoughtful response:
                </label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Take your time to write a thoughtful response..."
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[120px] resize-none"
                  maxLength={500}
                />
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Take your time - there&apos;s no rush</span>
                  <span>{response.length}/500</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={() => handleSubmitReflection(false)}
                  disabled={submitting || !response.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  I&apos;ll Do Something Else
                </Button>
                
                <Button
                  onClick={() => handleSubmitReflection(true)}
                  disabled={submitting || !response.trim()}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2"></div>
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Continue to Site
                </Button>
              </div>

              {/* New Question Button */}
              <div className="text-center pt-2">
                <Button
                  onClick={fetchReflectionQuestion}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-300"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Get Different Question
                </Button>
              </div>
            </>
          )}

          {/* Tips */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              💡 <strong>Tip:</strong> Research shows that pausing before impulsive actions helps build self-awareness and better decision-making over time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}