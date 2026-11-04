'use client'

import { useState, useCallback } from 'react'

type Props = {
  caseId: string
  onUploaded: (url: string, name: string) => void
}

export default function DropZone({ caseId, onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<{ name: string; url: string }[]>([])

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('caseId', caseId)

    const res = await fetch('/api/portal/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (res.ok) {
      setUploaded(prev => [...prev, { name: file.name, url: data.url }])
      onUploaded(data.url, file.name)
    }
    setUploading(false)
  }, [caseId, onUploaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach(uploadFile)
  }, [uploadFile])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(uploadFile)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragging ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
        }`}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input id="fileInput" type="file" multiple className="hidden" onChange={handleFileInput} />
        {uploading ? (
          <p className="text-gray-500 text-sm">מעלה...</p>
        ) : (
          <>
            <p className="text-2xl mb-2">📎</p>
            <p className="text-gray-500 text-sm">גרור קבצים לכאן או לחץ לבחירה</p>
            <p className="text-gray-400 text-xs mt-1">PDF, Word, תמונות</p>
          </>
        )}
      </div>

      {uploaded.length > 0 && (
        <div className="space-y-2">
          {uploaded.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <span className="text-green-600">✓</span>
              <a href={f.url} target="_blank" rel="noreferrer" className="text-sm text-green-700 hover:underline truncate">
                {f.name}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
