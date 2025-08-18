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
  ExternalLink,
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
  }, [nextDnsConnected, hasBlockedWebsites]);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Info className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Welcome to Dopamine Detox</CardTitle>
              <p className="text-gray-400 text-sm">
                Let&apos;s get your digital wellness setup configured
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-600/20 text-blue-300 border-blue-500/50">
            {completedSteps}/{steps.length} Complete
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Setup Progress</span>
            <span className="text-gray-400">{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 bg-gray-800" 
          />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center space-x-4 p-4 rounded-lg border transition-all cursor-pointer ${
                step.completed
                  ? 'bg-green-900/20 border-green-500/30 hover:bg-green-900/30'
                  : index === currentStep
                  ? 'bg-blue-900/20 border-blue-500/30 hover:bg-blue-900/30'
                  : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50'
              }`}
              onClick={() => handleStepClick(index, step)}
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <Circle className={`w-6 h-6 ${
                    index === currentStep ? 'text-blue-400' : 'text-gray-500'
                  }`} />
                )}
              </div>
              
              <div className="flex-shrink-0">
                <step.icon className={`w-5 h-5 ${
                  step.completed 
                    ? 'text-green-400' 
                    : index === currentStep 
                    ? 'text-blue-400' 
                    : 'text-gray-500'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium ${
                  step.completed ? 'text-green-300' : 'text-white'
                }`}>
                  {step.title}
                  {step.optional && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Optional
                    </Badge>
                  )}
                </h4>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </div>
              
              <ArrowRight className={`w-4 h-4 flex-shrink-0 ${
                step.completed ? 'text-green-400' : 'text-gray-500'
              }`} />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissOnboarding}
            className="text-gray-400 hover:text-white"
          >
            Dismiss Guide
          </Button>
          
          <div className="flex items-center space-x-2">
            {progress < 100 && (
              <Button
                onClick={() => {
                  const nextStep = steps[currentStep];
                  if (nextStep?.action) {
                    nextStep.action();
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {currentStep === 0 ? 'Get Started' : 'Continue Setup'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            
            {progress === 100 && (
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Setup Complete!</span>
              </div>
            )}
          </div>
        </div>

        {/* Help Links */}
        <div className="text-center pt-2 border-t border-gray-700">
          <p className="text-gray-500 text-xs mb-2">Need help?</p>
          <div className="flex justify-center space-x-4 text-xs">
            <button
              onClick={() => window.open('https://help.nextdns.io', '_blank')}
              className="text-blue-400 hover:text-blue-300 flex items-center"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              NextDNS Help
            </button>
            <button
              onClick={() => window.open('https://github.com/your-repo/issues', '_blank')}
              className="text-blue-400 hover:text-blue-300 flex items-center"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Support
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}