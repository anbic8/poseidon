'use client'

import { useRef, useState } from 'react'
import type { Media } from '@/lib/types'

interface MediaUploadProps {
  url: string
  accept?: string
  label?: string
  onSuccess: (media: Media) => void
}

export function MediaUpload({
  url,
  accept = 'image/*,video/*',
  label = 'Datei hochladen',
  onSuccess,
}: MediaUploadProps) {
  const inputRef                = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError]       = useState('')

  function upload(file: File) {
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      setProgress(null)
      if (xhr.status === 201) onSuccess(JSON.parse(xhr.responseText) as Media)
      else setError('Upload fehlgeschlagen')
    }
    xhr.onerror = () => { setProgress(null); setError('Netzwerkfehler') }
    xhr.open('POST', url)
    xhr.send(formData)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
          e.target.value = ''
        }}
      />
      {progress !== null ? (
        <div className="flex items-center gap-2 min-w-32">
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 dark:bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-gray-500 dark:text-slate-400 shrink-0">{progress}%</span>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="rounded-md border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-sm
            text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1.5">
          <span>📎</span>{label}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}
