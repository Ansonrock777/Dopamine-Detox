'use client'

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs'

export function useAuth() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerkAuth()

  return {
    user,
    loading: !isLoaded,
    signOut,
    isSignedIn: !!user
  }
}