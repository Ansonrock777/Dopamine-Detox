'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, Home, Settings, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Habit Tracker',
    href: '/habit-tracker',
    icon: Target,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className={cn(
        "bg-gray-900 border-r border-gray-800 h-screen sticky top-0 transition-all duration-300 ease-in-out",
        isHovered ? "w-64" : "w-20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        <div className={cn(
          "flex items-center mb-8 transition-all duration-300",
          isHovered ? "space-x-2" : "justify-center"
        )}>
          <Brain className="w-8 h-8 text-blue-500 flex-shrink-0" />
          <span className={cn(
            "text-xl font-bold text-white transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          )}>
            Dopamine Detox
          </span>
        </div>
        
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                  isHovered ? 'space-x-3' : 'justify-center',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
                title={!isHovered ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn(
                  "transition-opacity duration-300",
                  isHovered ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}