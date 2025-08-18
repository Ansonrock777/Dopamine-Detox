'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'

export default function HabitTrackerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isSignedIn) {
      router.push('/')
    }
  }, [isSignedIn, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-800">
          <div className="px-6 py-4 flex items-center justify-end">
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">
                {user?.emailAddresses?.[0]?.emailAddress}
              </span>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 py-8 bg-gray-950 text-white">
          {children}
        </main>
      </div>
    </div>
  )
}