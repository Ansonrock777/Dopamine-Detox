'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { ResponsiveLayout } from '@/components/ResponsiveLayout'

export default function DashboardLayout({
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

  const header = (
    <header className="border-b border-gray-800">
      <div className="px-4 py-4 md:px-6 lg:px-8 flex items-center justify-end">
        <div className="flex items-center space-x-2 md:space-x-4">
          <span className="text-gray-400 text-sm md:text-base hidden sm:block truncate max-w-48">
            {user?.emailAddresses?.[0]?.emailAddress}
          </span>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="border-gray-700 text-white hover:bg-gray-800 min-h-11"
          >
            <LogOut className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  )

  return (
    <ResponsiveLayout header={header}>
      {children}
    </ResponsiveLayout>
  )
}