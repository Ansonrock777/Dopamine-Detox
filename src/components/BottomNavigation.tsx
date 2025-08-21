'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavigationProps {
  onMenuClick: () => void
}

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
    name: 'Menu',
    href: '#',
    icon: Menu,
    isMenu: true
  },
]

export function BottomNavigation({ onMenuClick }: BottomNavigationProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 safe-area-pb z-50 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href && !item.isMenu
          
          if (item.isMenu) {
            return (
              <button
                key={item.name}
                onClick={onMenuClick}
                className={cn(
                  'flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                  'text-gray-400 hover:text-white active:bg-gray-800'
                )}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] leading-none">{item.name}</span>
              </button>
            )
          }
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white active:bg-gray-800'
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] leading-none">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}