'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, Home, BookOpen, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

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
    name: 'Setup Instructions',
    href: '/dashboard/setup-instructions',
    icon: BookOpen,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <div 
      className={cn(
        "bg-gray-900 border-r border-gray-800 h-screen sticky top-0 transition-all duration-300 ease-in-out overflow-hidden",
        // Base width for small screens
        "w-20",
        // Medium screens: hover behavior
        isHovered ? "md:w-64" : "md:w-20", 
        // Large screens: always full width, override hover behavior
        "lg:w-64"
      )}
      onMouseEnter={() => !isLargeScreen && setIsHovered(true)}
      onMouseLeave={() => !isLargeScreen && setIsHovered(false)}
    >
      <div className="p-6">
        <div className={cn(
          "flex items-center mb-8 transition-all duration-300",
          // Always spaced on large screens
          "lg:space-x-2",
          // Medium screens: space when hovered, center when not
          isHovered ? "md:space-x-2" : "md:justify-center"
        )}>
          <Brain className="w-8 h-8 text-blue-500 flex-shrink-0" />
          <span className={cn(
            "text-xl font-bold text-white transition-all duration-300",
            // Always visible on large screens
            "lg:opacity-100 lg:w-auto lg:block",
            // Medium screens: show on hover
            isHovered ? "md:opacity-100 md:w-auto md:block" : "md:opacity-0 md:w-0 md:overflow-hidden md:hidden"
          )}>
            Dopamine Detox
          </span>
        </div>
        
        <nav className="space-y-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-300 min-h-11 space-x-3',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800 active:bg-gray-700'
                )}
                title={(!isHovered && !isLargeScreen) ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="transition-all duration-300 opacity-100 w-auto block">
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