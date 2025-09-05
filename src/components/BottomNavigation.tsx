'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Target, BookOpen, LogOut, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Habits',
    href: '/habit-tracker',
    icon: Target,
  },
  {
    name: 'Setup',
    href: '/dashboard/setup-instructions',
    icon: BookOpen,
  },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  // Always show download button for testing
  const showPWADownload = true

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 safe-area-pb z-50 md:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-1 py-1 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white active:bg-gray-800'
              )}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[9px] leading-none">{item.name}</span>
            </Link>
          )
        })}
        
        {/* Download Button - only show if PWA is installable */}
        {showPWADownload && (
          <button
            onClick={() => {
              // Trigger PWA install
              if ('serviceWorker' in navigator) {
                const event = new CustomEvent('pwa-install-requested')
                window.dispatchEvent(event)
              }
            }}
            className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-1 py-1 rounded-lg text-xs font-medium transition-colors text-gray-400 hover:text-white active:bg-gray-800"
          >
            <Download className="w-4 h-4 mb-1" />
            <span className="text-[9px] leading-none">Install</span>
          </button>
        )}
        
        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-1 py-1 rounded-lg text-xs font-medium transition-colors text-gray-400 hover:text-white active:bg-gray-800"
        >
          <LogOut className="w-4 h-4 mb-1" />
          <span className="text-[9px] leading-none">Logout</span>
        </button>
      </div>
    </nav>
  )
}