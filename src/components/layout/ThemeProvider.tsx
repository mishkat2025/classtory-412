'use client'

import { useEffect } from 'react'

/**
 * Reads the saved theme from localStorage on mount and applies
 * the `dark` class to <html>. No React context needed — ThemeToggle
 * reads/writes documentElement.classList directly.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return <>{children}</>
}
