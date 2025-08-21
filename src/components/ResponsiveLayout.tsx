'use client'

import { useResponsiveNavigation } from '@/hooks/useResponsiveNavigation'
import { Sidebar } from '@/components/Sidebar'
import { BottomNavigation } from '@/components/BottomNavigation'
import { cn } from '@/lib/utils'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
}

export function ResponsiveLayout({ children, header }: ResponsiveLayoutProps) {
  const { isMobile } = useResponsiveNavigation()

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header - only show on desktop */}
        {!isMobile && header}

        {/* Main Content */}
        <main className={cn(
          'flex-1 min-w-0',
          // Desktop padding
          'md:px-6 lg:px-8 md:py-8',
          // Mobile padding - reduced to account for bottom nav
          'px-4 py-6 pb-20',
          // Responsive spacing
          'space-y-4 md:space-y-6 lg:space-y-8'
        )}>
          {children}
        </main>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation />}
    </div>
  )
}