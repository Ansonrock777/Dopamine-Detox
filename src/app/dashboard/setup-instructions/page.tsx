"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, 
  Smartphone, 
  Router, 
  ExternalLink,
  Play,
  Apple
} from "lucide-react";

export default function SetupInstructionsPage() {
  const deviceInstructions = [
    {
      id: "router",
      name: "Router Setup",
      icon: Router,
      description: "Set up NextDNS on your router to protect all devices on your network",
      type: "video",
      link: "https://youtu.be/7mUMOJLDVj4?si=yiG7ODqtxeYcZzrA",
      buttonText: "Watch Router Setup Video",
      badge: "Recommended",
      badgeVariant: "default" as const
    },
    {
      id: "android",
      name: "Android Setup",
      icon: Smartphone,
      description: "Configure NextDNS on your Android device",
      type: "video",
      link: "https://youtube.com/shorts/7SwClCO0l9A?si=BTYhNTDA6WPXtEsR",
      buttonText: "Watch Android Setup Video",
      badge: "Quick Setup",
      badgeVariant: "secondary" as const
    },
    {
      id: "apple",
      name: "Mac & iOS Setup",
      icon: Apple,
      description: "Follow the official NextDNS setup guide for Apple devices",
      type: "direct",
      link: "https://apple.nextdns.io/",
      buttonText: "Open Apple Setup Guide",
      badge: "Official Guide",
      badgeVariant: "outline" as const
    },
    {
      id: "windows",
      name: "Windows Setup", 
      icon: Monitor,
      description: "Configure NextDNS on your Windows computer",
      type: "guide",
      link: "https://help.nextdns.io/t/m1hmv0h/how-to-setup-nextdns-on-windows",
      buttonText: "View Windows Setup Guide",
      badge: "Official Guide",
      badgeVariant: "outline" as const
    }
  ];

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Setup Instructions
        </h1>
        <p className="text-gray-400">
          Follow these device-specific guides to configure NextDNS and enable network-level blocking across all your devices.
        </p>
      </div>

      {/* Instructions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {deviceInstructions.map((device) => {
          const Icon = device.icon;
          
          return (
            <Card key={device.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-600/20">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">
                        {device.name}
                      </CardTitle>
                    </div>
                  </div>
                  <Badge variant={device.badgeVariant} className="text-xs">
                    {device.badge}
                  </Badge>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {device.description}
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => openLink(device.link)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {device.type === 'video' && <Play className="w-4 h-4 mr-2" />}
                  {device.type === 'direct' && <ExternalLink className="w-4 h-4 mr-2" />}
                  {device.type === 'guide' && <ExternalLink className="w-4 h-4 mr-2" />}
                  {device.buttonText}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Information */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <ExternalLink className="w-5 h-5 mr-2 text-blue-500" />
            Why Setup NextDNS?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Router className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Network-Level Blocking</h4>
              <p className="text-gray-400 text-sm">
                Block distracting websites and apps across all your devices automatically
              </p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Monitor className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Cross-Device Protection</h4>
              <p className="text-gray-400 text-sm">
                Works on computers, phones, tablets, smart TVs, and gaming consoles
              </p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Real-Time Sync</h4>
              <p className="text-gray-400 text-sm">
                Changes made in this dashboard apply instantly to all connected devices
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}