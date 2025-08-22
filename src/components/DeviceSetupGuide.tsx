"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Monitor, 
  Smartphone, 
  Router, 
  ExternalLink,
  CheckCircle,
  Copy
} from "lucide-react";
import { toast } from "sonner";

interface DeviceSetupGuideProps {
  nextDnsProfileId?: string;
  nextDnsAccountId?: string;
}

export function DeviceSetupGuide({ nextDnsProfileId }: DeviceSetupGuideProps) {
  const [copiedText, setCopiedText] = useState<string>("");

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedText(""), 2000);
    } catch (_error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const dnsServers = nextDnsProfileId 
    ? [`${nextDnsProfileId}.dns.nextdns.io`, `${nextDnsProfileId}.dns2.nextdns.io`]
    : ["45.90.28.205", "45.90.30.205"];

  const platforms = [
    {
      id: "windows",
      name: "Windows",
      icon: Monitor,
      steps: [
        "Right-click the network icon in the system tray",
        "Select 'Open Network & Internet settings'",
        "Click 'Change adapter options'",
        "Right-click your active network connection and select 'Properties'",
        "Select 'Internet Protocol Version 4 (TCP/IPv4)' and click 'Properties'",
        "Select 'Use the following DNS server addresses'",
        `Enter Preferred DNS: ${dnsServers[0]}`,
        `Enter Alternate DNS: ${dnsServers[1]}`,
        "Click 'OK' to save settings",
        "Restart your browser or flush DNS with 'ipconfig /flushdns' in Command Prompt"
      ]
    },
    {
      id: "macos",
      name: "macOS",
      icon: Monitor,
      steps: [
        "Click the Apple menu and select 'System Preferences'",
        "Click 'Network'",
        "Select your active network connection (Wi-Fi or Ethernet)",
        "Click 'Advanced...'",
        "Click the 'DNS' tab",
        "Click the '+' button to add DNS servers",
        `Add ${dnsServers[0]}`,
        `Add ${dnsServers[1]}`,
        "Click 'OK' and then 'Apply'",
        "Flush DNS cache by running 'sudo dscacheutil -flushcache' in Terminal"
      ]
    },
    {
      id: "ios",
      name: "iPhone/iPad",
      icon: Smartphone,
      steps: [
        "Open the Settings app",
        "Tap 'Wi-Fi'",
        "Tap the 'i' icon next to your connected network",
        "Tap 'Configure DNS'",
        "Select 'Manual'",
        "Remove existing DNS servers",
        `Add ${dnsServers[0]}`,
        `Add ${dnsServers[1]}`,
        "Tap 'Save'",
        "Restart your device to ensure changes take effect"
      ]
    },
    {
      id: "android",
      name: "Android",
      icon: Smartphone,
      steps: [
        "Open Settings and go to 'Network & Internet' or 'Wi-Fi'",
        "Long-press your connected Wi-Fi network",
        "Tap 'Modify network' or 'Manage network settings'",
        "Tap 'Advanced options' or 'Show advanced options'",
        "Change 'IP settings' to 'Static'",
        "Scroll down to find DNS settings",
        `Set DNS 1 to ${dnsServers[0]}`,
        `Set DNS 2 to ${dnsServers[1]}`,
        "Tap 'Save'",
        "Restart your device to apply changes"
      ]
    },
    {
      id: "router",
      name: "Router (All Devices)",
      icon: Router,
      steps: [
        "Open your web browser and navigate to your router's IP address (usually 192.168.1.1 or 192.168.0.1)",
        "Log in with your admin credentials",
        "Look for 'DNS Settings', 'Network Settings', or 'Internet Settings'",
        "Find the DNS server configuration section",
        `Set Primary DNS to ${dnsServers[0]}`,
        `Set Secondary DNS to ${dnsServers[1]}`,
        "Save the settings",
        "Restart your router",
        "All connected devices will now use NextDNS filtering",
        "Note: This method protects all devices on your network automatically"
      ]
    }
  ];

  if (!nextDnsProfileId) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Monitor className="w-5 h-5 mr-2 text-blue-500" />
            Device Setup Guide
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Connect your NextDNS account first to access device setup instructions
          </p>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Monitor className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">
            Complete your NextDNS setup above to get platform-specific configuration instructions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Monitor className="w-5 h-5 mr-2 text-blue-500" />
          Device Setup Guide
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Configure your devices to use NextDNS for network-level blocking
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* DNS Server Info */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-300 font-semibold mb-2">Your NextDNS Servers:</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
              <code className="text-green-400 text-sm">{dnsServers[0]}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(dnsServers[0], "Primary DNS")}
                className="text-gray-400 hover:text-white h-8"
              >
                {copiedText === "Primary DNS" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
              <code className="text-green-400 text-sm">{dnsServers[1]}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(dnsServers[1], "Secondary DNS")}
                className="text-gray-400 hover:text-white h-8"
              >
                {copiedText === "Secondary DNS" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Platform Tabs */}
        <Tabs defaultValue="windows" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            {platforms.map((platform) => (
              <TabsTrigger
                key={platform.id}
                value={platform.id}
                className="flex items-center space-x-1 data-[state=active]:bg-gray-700"
              >
                <platform.icon className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">{platform.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {platforms.map((platform) => (
            <TabsContent key={platform.id} value={platform.id} className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <platform.icon className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-semibold text-white">
                    {platform.name} Setup
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {platform.id === 'router' ? 'Recommended' : 'Manual'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {platform.steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Platform-specific notes */}
                {platform.id === 'router' && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <h4 className="text-green-300 font-semibold">Recommended Approach</h4>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Router-level configuration protects all devices on your network automatically, 
                      including smart TVs, gaming consoles, and guest devices.
                    </p>
                  </div>
                )}

                {platform.id === 'ios' && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <h4 className="text-yellow-300 font-semibold mb-2">iOS Note:</h4>
                    <p className="text-gray-300 text-sm">
                      iOS only applies custom DNS to Wi-Fi networks. For cellular data protection, 
                      consider using the NextDNS iOS app from the App Store.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Additional Resources */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-white font-semibold mb-3">Additional Resources</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => window.open('https://help.nextdns.io/t/m1hmv0h/how-to-setup-nextdns-on-windows', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Official NextDNS Setup Guides
            </Button>
            <Button
              variant="outline"
              className="justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => window.open(`https://test.nextdns.io/?config=${nextDnsProfileId}`, '_blank')}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Test Your Setup
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}