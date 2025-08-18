"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Shield,
} from "lucide-react";

interface CategoryReflectionWallProps {
  categoryName: string;
  categoryId: string;
  onCancel: () => void;
  onConfirmUnblock: (categoryId: string) => void;
}

interface Question {
  id: string;
  question: string;
  placeholder: string;
  minLength: number;
}

const reflectionQuestions: Question[] = [
  {
    id: "feeling_escape",
    question:
      "What feeling are you trying to escape right now — boredom, stress, anxiety, or something else?",
    placeholder: "Be honest about what you're feeling and trying to avoid...",
    minLength: 20,
  },
  {
    id: "replacement_activity",
    question:
      "What productive activity could you do instead right now? What's one specific action you can take in the next 5 minutes?",
    placeholder:
      "Describe a specific alternative activity and your immediate next step...",
    minLength: 30,
  },
  {
    id: "cost_benefit",
    question:
      "If you unblock this category now, how will you feel in 1 hour vs. if you stay focused on your goals? What will this cost you today?",
    placeholder:
      "Think about the short-term vs. long-term consequences of your choice...",
    minLength: 40,
  },
];

export function CategoryReflectionWall({
  categoryName,
  categoryId,
  onCancel,
  onConfirmUnblock,
}: CategoryReflectionWallProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
  const [timerStarted, setTimerStarted] = useState(false);
  const [canUnblock, setCanUnblock] = useState(false);

  const currentQuestion = reflectionQuestions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / reflectionQuestions.length) * 100;

  useEffect(() => {
    if (timerStarted && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      setCanUnblock(true);
    }
  }, [timeRemaining, timerStarted]);

  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    });
  };

  const isCurrentAnswerValid = () => {
    const answer = answers[currentQuestion.id] || "";
    return answer.trim().length >= currentQuestion.minLength;
  };

  const handleNext = () => {
    if (currentQuestionIndex < reflectionQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsComplete(true);
      setTimerStarted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleConfirmUnblock = () => {
    onConfirmUnblock(categoryId);
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <Card className="bg-gray-900 border-gray-800 max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              Reflection Complete - Cooling Off Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-yellow-400 text-6xl font-bold mb-2">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-gray-400">
                Time remaining before you can unblock{" "}
                <span className="text-white font-medium">{categoryName}</span> category
              </p>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="text-yellow-300 text-sm">
                  <p className="font-semibold mb-2">
                    Use this time to reflect on your answers:
                  </p>
                  <ul className="space-y-1 text-xs">
                    <li>
                      • Consider if unblocking this category aligns with your
                      goals
                    </li>
                    <li>• Think about the productive alternatives you identified</li>
                    <li>
                      • Remember why you blocked this category in the first place
                    </li>
                    <li>• Prepare a strategy for mindful usage if you proceed</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Keep Blocked
              </Button>
              <Button
                onClick={handleConfirmUnblock}
                disabled={!canUnblock}
                className={`flex-1 ${
                  canUnblock
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
              >
                {canUnblock ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Unblock Category
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Wait {formatTime(timeRemaining)}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="bg-gray-900 border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Brain className="w-5 h-5 mr-2 text-purple-500" />
              Reflection Wall
            </CardTitle>
            <Button
              onClick={onCancel}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">
              You&apos;re about to unblock the{" "}
              <span className="text-white font-medium flex items-center">
                <Shield className="w-4 h-4 mr-1 text-red-500" />
                {categoryName}
              </span>{" "}
              category
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>
                  Question {currentQuestionIndex + 1} of{" "}
                  {reflectionQuestions.length}
                </span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-purple-400 mt-0.5" />
              <div className="text-purple-300 text-sm">
                <p className="font-semibold mb-1">Take a moment to reflect</p>
                <p>
                  Answer these questions thoughtfully to ensure you&apos;re
                  making a conscious decision about unblocking this category.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-white text-lg font-medium">
                {currentQuestion.question}
              </Label>
              <p className="text-gray-400 text-sm mt-1">
                Minimum {currentQuestion.minLength} characters required
              </p>
            </div>

            <Textarea
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="bg-gray-800 border-gray-700 text-white min-h-[120px] resize-none"
              rows={5}
            />

            <div className="text-right text-xs text-gray-400">
              {(answers[currentQuestion.id] || "").length} /{" "}
              {currentQuestion.minLength} characters
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isCurrentAnswerValid()}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {currentQuestionIndex === reflectionQuestions.length - 1 ? (
                <>
                  Complete Reflection
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next Question
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}