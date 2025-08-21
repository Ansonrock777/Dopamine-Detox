'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, BookOpen, X, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const secondaryNavItems = [
  {
    name: 'Setup Instructions',
    href: '/dashboard/setup-instructions',
    icon: BookOpen,
    description: 'Device configuration guides'
  }
]

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-gray-900 border-l border-gray-800 z-50 transform transition-transform md:hidden',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-lg font-bold text-white">Dopamine Detox</h2>
                <p className="text-sm text-gray-400 truncate">
                  {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 min-h-[44px] min-w-[44px]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 p-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Additional Options
              </h3>
              {secondaryNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{item.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-800">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full border-gray-700 text-white hover:bg-gray-800 min-h-[44px]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}