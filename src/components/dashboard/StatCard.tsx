import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number | string
  iconBg: string
  iconColor: string
  trend?: { direction: 'up' | 'down'; label: string }
}

export function StatCard({ icon: Icon, label, value, iconBg, iconColor, trend }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <p
          style={{
            fontSize: 13,
            color: '#64748B',
            margin: 0,
            fontWeight: 500,
          }}
        >
          {label}
        </p>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={iconColor} />
        </div>
      </div>

      <div>
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: '#0F172A',
            margin: 0,
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: trend.direction === 'up' ? '#059669' : '#DC2626',
              }}
            >
              {trend.direction === 'up' ? '↑' : '↓'}
            </span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}
