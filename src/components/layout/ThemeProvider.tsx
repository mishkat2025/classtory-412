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
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return <>{children}</>
}
