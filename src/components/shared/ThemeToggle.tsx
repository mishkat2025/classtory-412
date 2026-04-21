'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  /** When true, renders a compact icon-only button (for sidebar) */
  compact?: boolean
  /** Extra style overrides for the button */
  style?: React.CSSProperties
}

export function ThemeToggle({ compact = false, style }: ThemeToggleProps) {
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

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: compact ? 28 : 32,
        height: compact ? 28 : 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#A5B4FC',
        flexShrink: 0,
        transition: 'background-color 150ms ease, color 150ms ease',
        ...style,
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.15)'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.08)'
        ;(e.currentTarget as HTMLButtonElement).style.color = '#A5B4FC'
      }}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
