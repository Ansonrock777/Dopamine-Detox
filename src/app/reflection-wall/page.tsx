"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Clock,
  ExternalLink,
  X,
  Heart,
  Dumbbell,
  CheckCircle2,
} from "lucide-react";

const REFLECTION_QUESTIONS = [
  {
    id: "feeling",
    question:
      "What feeling are you trying to escape right now — boredom, fear, anxiety, or something else?",
    placeholder: "Take a moment to identify what you're really feeling...",
  },
  {
    id: "habit",
    question:
      "What habit did you choose to replace this with and what's one specific first step you can do right now?",
    placeholder: "Think about the positive habit you want to build instead...",
  },
  {
    id: "cost",
    question:
      "If you give in now, what will that cost your goals (today & this week)? If you do the habit instead, how will you feel in 1 hour?",
    placeholder: "Consider the real impact of your choice on your goals...",
  },
];

const MINI_TASKS = [
  {
    id: "pushups",
    title: "Physical Movement",
    description: "Do some push-ups (any number you can manage)",
    icon: Dumbbell,
    tip: "Even 1-5 push-ups can reset your energy and focus",
  },
  {
    id: "gratitude",
    title: "Gratitude Practice",
    description: "Think of something you are grateful for",
    icon: Heart,
    tip: "Focus on something specific that happened today or this week",
  },
];

function ReflectionWallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const site = searchParams.get("site") || "this website";

  // State management
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"questions" | "tasks" | "complete">(
    "questions"
  );
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Check if all questions are answered
  const allQuestionsAnswered = REFLECTION_QUESTIONS.every(
    (q) => answers[q.id]?.trim().length > 0
  );

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            setPhase("complete");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Calculate progress percentage
  const progressPercentage = ((120 - timeRemaining) / 120) * 100;

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleProceed = () => {
    if (!allQuestionsAnswered) return;
    setPhase("tasks");
    setIsTimerActive(true);
  };

  const handleContinueToSite = () => {
    // Open the original site in a new tab
    const url = site.startsWith("http") ? site : `https://${site}`;
    window.open(url, "_blank");
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  const handleSkipTimer = () => {
    setTimeRemaining(0);
    setIsTimerActive(false);
    setPhase("complete");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm mb-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Brain className="w-12 h-12 text-blue-500" />
            </div>
            <CardTitle className="text-white text-2xl mb-2">
              Reflection Wall
            </CardTitle>
            <p className="text-gray-400">
              You&apos;re trying to access{" "}
              <span className="text-blue-400 font-medium">{site}</span>
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Take a moment to reflect before proceeding
            </p>
          </CardHeader>
        </Card>

        {/* Questions Phase */}
        {phase === "questions" && (
          <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                Reflection Questions
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Answer these questions honestly to proceed
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {REFLECTION_QUESTIONS.map((q, index) => (
                <div key={q.id} className="space-y-3">
                  <Label className="text-gray-300 text-base font-medium">
                    {index + 1}. {q.question}
                  </Label>
                  <Textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 min-h-[100px] resize-none"
                    rows={4}
                  />
                </div>
              ))}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
                <Button
                  onClick={handleProceed}
                  disabled={!allQuestionsAnswered}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Tasks
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks Phase */}
        {phase === "tasks" && (
          <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-xl flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-orange-500" />
                    Mini Challenge
                  </CardTitle>
                  <p className="text-gray-400 text-sm">
                    Complete these tasks before accessing the site
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono text-orange-400">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-xs text-gray-500">Time remaining</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <Progress
                  value={progressPercentage}
                  className="h-2 bg-gray-800"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MINI_TASKS.map((task) => {
                  const IconComponent = task.icon;
                  return (
                    <div
                      key={task.id}
                      className="bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-6 h-6 text-green-500" />
                        <h3 className="text-white font-medium">{task.title}</h3>
                      </div>
                      <p className="text-gray-300">{task.description}</p>
                      <p className="text-gray-500 text-sm italic">{task.tip}</p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="text-blue-300 text-sm">
                    <p className="font-semibold mb-1">Take your time:</p>
                    <p>
                      Use this 2-minute window to reset your mindset and energy.
                      These small actions can help break the autopilot pattern
                      and make you more intentional about your choices.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
                <Button
                  onClick={handleSkipTimer}
                  variant="outline"
                  className="border-orange-500 text-orange-400 hover:bg-orange-900/20"
                >
                  Skip Timer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Phase */}
        {phase === "complete" && (
          <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <CardTitle className="text-white text-xl">
                Challenge Complete!
              </CardTitle>
              <p className="text-gray-400">
                You&apos;ve taken time to reflect and reset. What would you like
                to do?
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
                <h3 className="text-white font-medium mb-2">Remember:</h3>
                <p className="text-gray-300 text-sm">
                  You have the power to choose how you spend your time. Every
                  decision is an opportunity to align with your goals and
                  values.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Choose Focus Instead
                </Button>
                <Button
                  onClick={handleContinueToSite}
                  className="bg-blue-600 hover:bg-blue-700 flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Continue to {site}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ReflectionWallPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <div className="text-white flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span>Loading reflection wall...</span>
          </div>
        </div>
      }
    >
      <ReflectionWallContent />
    </Suspense>
  );
}
