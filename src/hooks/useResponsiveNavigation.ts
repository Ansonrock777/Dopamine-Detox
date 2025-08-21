import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

export function useResponsiveNavigation() {
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(isMobileSize)
      
      // Close mobile sidebar when switching to desktop
      if (!isMobileSize) {
        setShowMobileSidebar(false)
      }
    }

    // Check on mount
    checkScreenSize()

    // Add event listener
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(prev => !prev)
  }

  const closeMobileSidebar = () => {
    setShowMobileSidebar(false)
  }

  return {
    isMobile,
    showMobileSidebar,
    toggleMobileSidebar,
    closeMobileSidebar
  }
}