'use client'

import { useRef, useState } from 'react'
import { Upload, X, File, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  bucket: string
  path: string
  onUpload: (url: string, fileName: string, fileType: string, fileSize: number) => void
  accept?: string
  maxSizeMB?: number
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({ bucket, path, onUpload, accept, maxSizeMB = 50 }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  async function handleFile(file: File) {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Max size is ${maxSizeMB}MB.`)
      return
    }
    setSelectedFile(file)
    setUploading(true)
    setProgress(10)

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filePath = `${path}/${Date.now()}-${file.name}`

    setProgress(40)

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: false })

    if (error) {
      toast.error(`Upload failed: ${error.message}`)
      setUploading(false)
      setSelectedFile(null)
      setProgress(0)
      return
    }

    setProgress(80)

    const { data: signedData, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, 60 * 60 * 24 * 365)

    if (signError || !signedData) {
      toast.error('Failed to get file URL.')
      setUploading(false)
      setSelectedFile(null)
      setProgress(0)
      return
    }

    setProgress(100)
    onUpload(signedData.signedUrl, file.name, file.type, file.size)
    toast.success('File uploaded successfully.')
    setUploading(false)
    setProgress(0)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${isDragging ? '#4F46E5' : '#E2E8F0'}`,
          borderRadius: 10,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragging ? '#EEF2FF' : '#F8F9FC',
          transition: 'border-color 150ms ease, background-color 150ms ease',
        }}
      >
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader2 size={28} color="#4F46E5" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>Uploading {selectedFile?.name}…</p>
            <div style={{ width: '100%', maxWidth: 200, height: 4, backgroundColor: '#E2E8F0', borderRadius: 999 }}>
              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#4F46E5', borderRadius: 999, transition: 'width 300ms ease' }} />
            </div>
          </div>
        ) : selectedFile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
            <File size={20} color="#4F46E5" />
            <span style={{ fontSize: 14, color: '#0F172A', fontWeight: 500 }}>{selectedFile.name}</span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>({formatBytes(selectedFile.size)})</span>
            <button
              onClick={e => { e.stopPropagation(); setSelectedFile(null) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 2 }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Upload size={20} color="#4F46E5" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', margin: '0 0 4px 0' }}>
              Drop file here or <span style={{ color: '#4F46E5' }}>browse</span>
            </p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
              Max {maxSizeMB}MB {accept ? `· ${accept}` : ''}
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
