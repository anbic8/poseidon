'use client'

import { useState } from 'react'
import type { Media } from '@/lib/types'

interface PhotoGalleryProps {
  photos: Media[]
  onDelete: (id: string) => void
}

export function PhotoGallery({ photos, onDelete }: PhotoGalleryProps) {
  const [lightbox, setLightbox] = useState<Media | null>(null)

  if (photos.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/media/file/${photo.filename}`}
              alt={photo.originalName}
              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLightbox(photo)}
              loading="lazy"
            />
            <button
              onClick={() => onDelete(photo.id)}
              className="absolute top-1 right-1 rounded-full bg-black/60 text-white
                w-6 h-6 text-xs flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              title="Löschen"
            >×</button>
          </div>
        ))}
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/media/file/${lightbox.filename}`}
            alt={lightbox.originalName}
            className="max-w-full max-h-full object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="absolute top-4 right-4 text-white/80 text-3xl hover:text-white"
            onClick={() => setLightbox(null)}>×</button>
          <p className="absolute bottom-4 text-white/50 text-sm">{lightbox.originalName}</p>
        </div>
      )}
    </>
  )
}
