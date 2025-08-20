import { Metadata } from "next";
import { LandingPageContent } from "@/components/LandingPageContent";

export const metadata: Metadata = {
  title: "Break Free From Digital Addiction | Dopamine Detox",
  description:
    "Network-level blocking that works across every device. Block social media, adult content, gaming, and shopping addiction with NextDNS integration. Start your digital detox today.",
  openGraph: {
    title: "Break Free From Digital Addiction | Dopamine Detox",
    description:
      "Network-level blocking that works across every device. Block social media, adult content, gaming, and shopping addiction with NextDNS integration.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Dopamine Detox",
  description:
    "Digital wellness app with network-level blocking for breaking digital addictions across all devices",
  url: "https://dopaminedetox.in",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "127",
  },
  features: [
    "Network-level blocking",
    "Cross-device protection",
    "Category-based blocking",
    "Habit tracking",
    "Reflection wall",
    "NextDNS integration",
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex min-h-screen flex-col bg-background">
        <LandingPageContent />
      </div>
    </>
  );
}
