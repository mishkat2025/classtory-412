'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  Upload,
  Download,
  Trash2,
  File,
  FileText,
  Image as ImageIcon,
  Video,
  Sheet,
  FolderOpen,
  Loader2,
  Copy,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/client'
import { CopyToClassroomModal } from './CopyToClassroomModal'
import type { MaterialFull } from './types'
import type { Profile } from '@/lib/types'

interface MaterialsListProps {
  initialMaterials: MaterialFull[]
  classroom_id: string
  isTeacher: boolean
  profile: Profile
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileConfig(mimeType: string): {
  Icon: React.ElementType
  color: string
  bg: string
} {
  if (mimeType.startsWith('image/'))
    return { Icon: ImageIcon, color: '#2563EB', bg: '#DBEAFE' }
  if (mimeType.startsWith('video/'))
    return { Icon: Video, color: '#7C3AED', bg: '#EDE9FE' }
  if (mimeType === 'application/pdf')
    return { Icon: FileText, color: '#DC2626', bg: 'var(--color-danger-light)' }
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType.includes('csv')
  )
    return { Icon: Sheet, color: '#059669', bg: 'var(--color-success-light)' }
  if (mimeType.includes('word') || mimeType.includes('document'))
    return { Icon: FileText, color: '#2563EB', bg: '#DBEAFE' }
  return { Icon: File, color: 'var(--color-text-secondary)', bg: 'var(--color-surface-2)' }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function MaterialsList({
  initialMaterials,
  classroom_id,
  isTeacher,
  profile,
}: MaterialsListProps) {
  const [materials, setMaterials] = useState<MaterialFull[]>(initialMaterials)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copyingItem, setCopyingItem] = useState<MaterialFull | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  /* ── Download (signed URL) ─────────────────────────────── */
  async function handleDownload(material: MaterialFull) {
    const { data, error } = await supabase.storage
      .from('materials')
      .createSignedUrl(material.file_url, 60)

    if (error || !data?.signedUrl) {
      toast.error('Could not generate download link.')
      return
    }

    const a = document.createElement('a')
    a.href = data.signedUrl
    a.download = material.title
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }

  /* ── Upload ────────────────────────────────────────────── */
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50 MB.')
      return
    }

    setUploading(true)
    const safeName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '')
    const storagePath = `${classroom_id}/${nanoid(8)}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const { data, error: dbError } = await supabase
      .from('materials')
      .insert({
        classroom_id,
        title: file.name,
        file_url: storagePath,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        uploaded_by: profile.id,
      })
      .select('*, uploader:profiles(full_name)')
      .single()

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (dbError) {
      toast.error('File uploaded but record failed to save.')
      return
    }

    toast.success(`"${file.name}" uploaded.`)
    setMaterials(prev => [data as MaterialFull, ...prev])
  }

  /* ── Delete ────────────────────────────────────────────── */
  async function handleDelete(material: MaterialFull) {
    if (!window.confirm(`Delete "${material.title}"? This cannot be undone.`)) return

    setDeletingId(material.id)

    const { error: storageError } = await supabase.storage
      .from('materials')
      .remove([material.file_url])

    if (storageError) {
      toast.error('Failed to delete file from storage.')
      setDeletingId(null)
      return
    }

    const { error: dbError } = await supabase
      .from('materials')
      .delete()
      .eq('id', material.id)

    setDeletingId(null)

    if (dbError) {
      toast.error('File deleted but record removal failed.')
      return
    }

    toast.success(`"${material.title}" deleted.`)
    setMaterials(prev => prev.filter(m => m.id !== material.id))
  }

  /* ── Copy to classroom ─────────────────────────────────── */
  async function handleCopyMaterial(targetClassroomId: string) {
    if (!copyingItem) return
    const { error } = await supabase.from('materials').insert({
      classroom_id: targetClassroomId,
      title: copyingItem.title,
      file_url: copyingItem.file_url,
      file_type: copyingItem.file_type,
      file_size: copyingItem.file_size,
      uploaded_by: profile.id,
    })
    if (error) toast.error('Copy failed: ' + error.message)
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {copyingItem && (
        <CopyToClassroomModal
          contentType="material"
          contentPreview={copyingItem.title}
          currentClassroomId={classroom_id}
          teacherId={profile.id}
          onClose={() => setCopyingItem(null)}
          onCopy={handleCopyMaterial}
        />
      )}
      {/* Upload button (teacher only) */}
      {isTeacher && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
          {uploading && (
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={14} className="animate-spin" color="#4F46E5" />
              Uploading…
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept="*/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 36,
              padding: '0 14px',
              backgroundColor: uploading ? '#E2E8F0' : '#4F46E5',
              color: uploading ? '#94A3B8' : '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'background-color 150ms ease',
            }}
          >
            <Upload size={14} />
            Upload File
          </button>
        </div>
      )}

      {/* File list */}
      {materials.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 14,
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <FolderOpen size={24} color="#4F46E5" />
          </div>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 6px 0',
            }}
          >
            No materials yet
          </p>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
            {isTeacher
              ? 'Upload files for your students.'
              : 'Your teacher hasn\'t uploaded any materials yet.'}
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isTeacher ? '1fr 140px 100px 120px 110px' : '1fr 140px 100px 120px 52px',
              padding: '0 20px',
              height: 40,
              backgroundColor: 'var(--color-surface-2)',
              borderBottom: '1px solid var(--color-border)',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {['File', 'Uploaded by', 'Size', 'Date', ''].map((h, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  textAlign: i >= 1 ? 'center' : 'left',
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {materials.map((material, i) => {
            const { Icon, color, bg } = getFileConfig(material.file_type)
            const isDeleting = deletingId === material.id

            return (
              <div
                key={material.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isTeacher ? '1fr 140px 100px 120px 110px' : '1fr 140px 100px 120px 52px',
                  padding: '0 20px',
                  minHeight: 52,
                  borderBottom:
                    i < materials.length - 1 ? '1px solid var(--color-border)' : 'none',
                  alignItems: 'center',
                  gap: 12,
                  opacity: isDeleting ? 0.5 : 1,
                  transition: 'background-color 120ms ease, opacity 150ms ease',
                }}
                onMouseEnter={e =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-surface-2)')
                }
                onMouseLeave={e =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                }
              >
                {/* File name + icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      backgroundColor: bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={17} color={color} />
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {material.title}
                  </span>
                </div>

                {/* Uploader */}
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--color-text-secondary)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {material.uploader?.full_name ?? '—'}
                </span>

                {/* Size */}
                <span
                  style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}
                >
                  {formatFileSize(material.file_size) || '—'}
                </span>

                {/* Date */}
                <span
                  style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center' }}
                >
                  {formatDate(material.created_at)}
                </span>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() => handleDownload(material)}
                    title="Download"
                    style={iconBtn}
                  >
                    <Download size={15} />
                  </button>
                  {isTeacher && (
                    <>
                      <button
                        onClick={() => setCopyingItem(material)}
                        title="Copy to classroom"
                        style={{ ...iconBtn, color: 'var(--color-primary-on-tint)', backgroundColor: 'var(--color-primary-light)', border: '1px solid #C7D2FE' }}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(material)}
                        disabled={isDeleting}
                        title="Delete"
                        style={{ ...iconBtn, color: '#EF4444' }}
                      >
                        {isDeleting ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 6,
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--color-text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 120ms ease',
  padding: 0,
}
