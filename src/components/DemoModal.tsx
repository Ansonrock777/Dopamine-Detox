"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, X, Shield, Globe, Settings } from "lucide-react";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const demoSteps = [
    {
      title: "Welcome to Dopamine Detox",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Dopamine Detox helps you regain control over your digital habits using NextDNS to block distracting websites and apps at the network level—across all your devices.
          </p>
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Key Features:</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-red-500" />
                Block websites and apps across all devices
              </li>
              <li className="flex items-center">
                <Globe className="w-4 h-4 mr-2 text-blue-500" />
                Network-level DNS filtering with NextDNS
              </li>
              <li className="flex items-center">
                <Settings className="w-4 h-4 mr-2 text-blue-500" />
                Block entire categories (social media, gaming, etc.)
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Step 1: Setup NextDNS Account",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            First, you&apos;ll need to create a NextDNS account and configure your devices to use NextDNS for DNS resolution.
          </p>
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-semibold mb-2">Setup Steps:</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-300 text-sm">
              <li>Create a free NextDNS account at nextdns.io</li>
              <li>Follow their setup guide for your device/router</li>
              <li>Get your NextDNS API key from account settings</li>
              <li>Come back here to configure your blocking rules</li>
            </ol>
          </div>
          <div className="mock-browser bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="flex-1 bg-gray-700 rounded text-xs text-gray-400 px-2 py-1">
                nextdns.io/setup
              </div>
            </div>
            <div className="bg-gray-900 rounded p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h5 className="text-white font-medium">NextDNS</h5>
                    <p className="text-gray-400 text-sm">The new firewall for the modern Internet</p>
                  </div>
                </div>
                <Button className="bg-green-600 hover:bg-green-700 text-xs">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 2: Configure Your Blocking Rules",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Use our dashboard to configure which websites to block, categories to filter, and set up time-based focus rules.
          </p>
          <div className="mock-dashboard bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="text-white font-semibold mb-3">Dashboard Preview</h4>
            <div className="space-y-3">
              <div className="bg-red-900/20 border border-red-500/30 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">facebook.com</span>
                  <span className="text-red-400 text-xs">Blocked</span>
                </div>
              </div>
              <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 text-sm">Social Networks (Category)</span>
                  <span className="text-purple-400 text-xs">Category Blocked</span>
                </div>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">youtube.com (9AM-5PM)</span>
                  <span className="text-blue-400 text-xs">Time Rule</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Step 3: Connect & Sync",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Connect your NextDNS account to automatically sync your blocking rules and categories.
          </p>
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h4 className="text-green-300 font-semibold mb-2">Sync Features:</h4>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li>• Automatic NextDNS profile updates</li>
              <li>• Real-time rule synchronization</li>
              <li>• Cross-device consistency</li>
              <li>• Category-based blocking</li>
            </ul>
          </div>
          <div className="text-center">
            <Button className="bg-green-600 hover:bg-green-700">
              Connect NextDNS
            </Button>
          </div>
        </div>
      )
    },
    {
      title: "Start Your Digital Wellness Journey",
      content: (
        <div className="space-y-4 text-center">
          <div className="text-6xl mb-4">🧠</div>
          <p className="text-gray-300">
            You&apos;re all set! NextDNS will now block distractions across all your devices, helping you stay focused and productive.
          </p>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Ready to Get Started?</h4>
            <p className="text-gray-200 text-sm">
              Sign up to access your personalized dashboard and start building better digital habits today.
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800"
        aria-describedby="demo-description"
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            <span className="flex items-center">
              <Play className="w-5 h-5 mr-2 text-blue-500" />
              {demoSteps[currentStep].title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
              aria-label="Close demo"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6" id="demo-description">
          {demoSteps[currentStep].content}
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 pt-4">
          <div className="flex space-x-1" role="progressbar" aria-label={`Step ${currentStep + 1} of ${demoSteps.length}`}>
            {demoSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-500' : 'bg-gray-600'
                }`}
                aria-label={`Step ${index + 1}${index === currentStep ? ' (current)' : ''}`}
              />
            ))}
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            >
              Previous
            </Button>
            
            {currentStep === demoSteps.length - 1 ? (
              <Button
                onClick={handleClose}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}