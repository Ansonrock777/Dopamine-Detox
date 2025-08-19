import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { env } from '@/lib/env'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://dopaminedetox.app'),
  title: {
    default: 'Dopamine Detox - Take Back Control of Your Attention',
    template: '%s | Dopamine Detox'
  },
  description: 'Break free from digital distractions with network-level blocking that works across every device. Block social media, adult content, and addictive websites with NextDNS integration.',
  keywords: [
    'dopamine detox', 'digital wellness', 'focus', 'productivity', 'attention management',
    'nextdns', 'website blocker', 'social media addiction', 'digital addiction',
    'habit tracker', 'mindfulness', 'screen time', 'internet addiction'
  ],
  authors: [{ name: 'Dopamine Detox Team' }],
  creator: 'Dopamine Detox',
  publisher: 'Dopamine Detox',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dopaminedetox.app',
    title: 'Dopamine Detox - Break Free From Digital Addiction',
    description: 'Network-level blocking that works across every device. Block social media, adult content, and addictive websites with NextDNS integration.',
    siteName: 'Dopamine Detox',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Dopamine Detox - Break Free From Digital Addiction',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dopamine Detox - Break Free From Digital Addiction',
    description: 'Network-level blocking that works across every device. Block social media, adult content, and addictive websites.',
    images: ['/opengraph-image'],
    creator: '@dopaminedetox',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  alternates: {
    canonical: 'https://dopaminedetox.app',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#0f172a',
          colorInputBackground: '#1e293b',
          colorInputText: '#f8fafc',
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        </head>
        <body className={GeistSans.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}