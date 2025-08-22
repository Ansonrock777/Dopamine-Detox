"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Globe, 
  Shield, 
  Monitor,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  optional?: boolean;
  action?: () => void;
  externalLink?: string;
}

interface EnhancedOnboardingProps {
  nextDnsConnected: boolean;
  hasBlockedWebsites: boolean;
  onScrollToSection?: (section: string) => void;
}

export function EnhancedOnboarding({ 
  nextDnsConnected, 
  hasBlockedWebsites,
  onScrollToSection 
}: EnhancedOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const steps: OnboardingStep[] = [
    {
      id: 'nextdns-setup',
      title: 'Connect NextDNS Account',
      description: 'Set up NextDNS for network-level website blocking across all your devices',
      icon: Globe,
      completed: nextDnsConnected,
      action: () => onScrollToSection?.('nextdns-config')
    },
    {
      id: 'device-setup',
      title: 'Configure Your Devices',
      description: 'Follow platform-specific guides to enable DNS filtering on your devices',
      icon: Monitor,
      completed: nextDnsConnected, // Assume completed if NextDNS is connected
      action: () => onScrollToSection?.('device-setup')
    },
    {
      id: 'add-websites',
      title: 'Block Distracting Websites',
      description: 'Add specific websites or enable category-based blocking',
      icon: Shield,
      completed: hasBlockedWebsites,
      action: () => onScrollToSection?.('website-blocking')
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  // Auto-advance to next uncompleted step
  useEffect(() => {
    const nextIncompleteStep = steps.findIndex(step => !step.completed);
    if (nextIncompleteStep !== -1) {
      setCurrentStep(nextIncompleteStep);
    }
  }, [steps, nextDnsConnected, hasBlockedWebsites]);

  const handleStepClick = (index: number, step: OnboardingStep) => {
    setCurrentStep(index);
    if (step.action) {
      step.action();
    }
    if (step.externalLink) {
      window.open(step.externalLink, '_blank');
    }
  };

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('dopamine-detox-onboarding-dismissed', 'true');
    toast.success('Onboarding dismissed - you can always refer back to the setup sections below');
  };

  // Silence unused variable warning
  void dismissOnboarding;

  // Check if user has dismissed onboarding
  useEffect(() => {
    const dismissed = localStorage.getItem('dopamine-detox-onboarding-dismissed');
    if (dismissed === 'true' && progress === 100) {
      setShowOnboarding(false);
    }
  }, [progress]);

  // Don't show if everything is completed and user dismissed it
  if (!showOnboarding && progress === 100) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-white text-lg sm:text-xl">Welcome to Dopamine Detox</CardTitle>
              <p className="text-gray-400 text-sm sm:text-sm">
                Let&apos;s get your digital wellness setup configured
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-600/20 text-blue-300 border-blue-500/50 self-start sm:self-auto">
            {completedSteps}/{steps.length} Complete
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Setup Progress</span>
            <span className="text-gray-400 font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-3 sm:h-2 bg-gray-800" 
          />
        </div>

        {/* Steps */}
        <div className="space-y-2 sm:space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border transition-all cursor-pointer min-h-[60px] sm:min-h-auto ${
                step.completed
                  ? 'bg-green-900/20 border-green-500/30 hover:bg-green-900/30 active:bg-green-900/40'
                  : index === currentStep
                  ? 'bg-blue-900/20 border-blue-500/30 hover:bg-blue-900/30 active:bg-blue-900/40'
                  : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50 active:bg-gray-800/60'
              }`}
              onClick={() => handleStepClick(index, step)}
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle className="w-6 h-6 sm:w-5 sm:h-5 text-green-400" />
                ) : (
                  <Circle className={`w-6 h-6 sm:w-5 sm:h-5 ${
                    index === currentStep ? 'text-blue-400' : 'text-gray-500'
                  }`} />
                )}
              </div>
              
              <div className="flex-shrink-0">
                <step.icon className={`w-6 h-6 sm:w-5 sm:h-5 ${
                  step.completed 
                    ? 'text-green-400' 
                    : index === currentStep 
                    ? 'text-blue-400' 
                    : 'text-gray-500'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-base sm:text-sm ${
                  step.completed ? 'text-green-300' : 'text-white'
                }`}>
                  {step.title}
                  {step.optional && (
                    <Badge variant="secondary" className="ml-2 text-xs hidden sm:inline-flex">
                      Optional
                    </Badge>
                  )}
                </h4>
                <p className="text-gray-400 text-sm sm:text-xs leading-relaxed">{step.description}</p>
              </div>
              
              <ArrowRight className={`w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 ${
                step.completed ? 'text-green-400' : 'text-gray-500'
              }`} />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center pt-4 border-t border-gray-700 space-y-3 sm:space-y-0">
          <div className="flex items-center justify-center space-x-2">
            {progress < 100 && (
              <Button
                onClick={() => {
                  const nextStep = steps[currentStep];
                  if (nextStep?.action) {
                    nextStep.action();
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 min-h-[44px] sm:min-h-auto px-6"
              >
                {currentStep === 0 ? 'Get Started' : 'Continue Setup'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {progress === 100 && (
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="text-sm font-medium">Setup Complete!</span>
              </div>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}