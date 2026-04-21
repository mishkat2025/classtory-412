'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  /** When true, renders a compact icon-only button (for sidebar) */
  compact?: boolean
  /**
   * 'sidebar' (default) — white-on-dark styling for the indigo sidebar
   * 'navbar'  — neutral styling that works on any page surface (light + dark)
   */
  variant?: 'sidebar' | 'navbar'
  /** Extra style overrides for the button */
  style?: React.CSSProperties
}

export function ThemeToggle({ compact = false, variant = 'sidebar', style }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false)

  // Sync state with the real DOM class on mount
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const html = document.documentElement
    if (html.classList.contains('dark')) {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  const isSidebar = variant === 'sidebar'

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: compact ? 28 : 32,
        height: compact ? 28 : 32,
        borderRadius: 8,
        backgroundColor: isSidebar ? 'rgba(255,255,255,0.08)' : 'var(--color-surface-2)',
        border: isSidebar ? 'none' : '1px solid var(--color-border)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isSidebar ? '#A5B4FC' : 'var(--color-text-secondary)',
        flexShrink: 0,
        transition: 'background-color 150ms ease, color 150ms ease',
        ...style,
      }}
      onMouseEnter={e => {
        if (isSidebar) {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.15)'
          ;(e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF'
        } else {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-border)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'
        }
      }}
      onMouseLeave={e => {
        if (isSidebar) {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.08)'
          ;(e.currentTarget as HTMLButtonElement).style.color = '#A5B4FC'
        } else {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-2)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'
        }
      }}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
