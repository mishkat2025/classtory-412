interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: number
}

export function Avatar({ name, avatarUrl, size = 32 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#4F46E5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: Math.round(size * 0.38), fontWeight: 600, color: '#FFFFFF' }}>
          {initials}
        </span>
      )}
    </div>
  )
}
