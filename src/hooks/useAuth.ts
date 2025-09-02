'use client'

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs'

export function useAuth() {
  const { user, isLoaded } = useUser()
  const { signOut: clerkSignOut } = useClerkAuth()

  const signOut = async () => {
    await clerkSignOut()
    // Force reload to clear any remaining session data
    window.location.reload()
  }

  return {
    user,
    loading: !isLoaded,
    signOut,
    isSignedIn: !!user
  }
}