'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FileState {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

interface DropZoneProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: Record<string, string[]>
  multiple?: boolean
  label?: string
}

export function DropZone({
  onUpload,
  accept,
  multiple = true,
  label = 'Glissez-déposez des fichiers ici, ou cliquez pour sélectionner',
}: DropZoneProps) {
  const [fileStates, setFileStates] = useState<FileState[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newStates: FileState[] = acceptedFiles.map((file) => ({
        file,
        status: 'uploading',
        progress: 0,
      }))
      setFileStates((prev) => [...prev, ...newStates])
      setIsUploading(true)
      try {
        await onUpload(acceptedFiles)
        setFileStates((prev) =>
          prev.map((fs) =>
            acceptedFiles.includes(fs.file)
              ? { ...fs, status: 'success', progress: 100 }
              : fs,
          ),
        )
      } catch (err) {
        setFileStates((prev) =>
          prev.map((fs) =>
            acceptedFiles.includes(fs.file)
              ? {
                  ...fs,
                  status: 'error',
                  error: err instanceof Error ? err.message : 'Erreur upload',
                }
              : fs,
          ),
        )
      } finally {
        setIsUploading(false)
      }
    },
    [onUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  })

  const removeFile = (index: number) => {
    setFileStates((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary/5',
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mb-3 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-600">{label}</p>
        <p className="mt-1 text-xs text-gray-400">
          {multiple ? 'Plusieurs fichiers acceptés' : 'Un seul fichier'}
        </p>
      </div>

      {fileStates.length > 0 && (
        <ul className="space-y-2">
          {fileStates.map((fs, index) => (
            <li
              key={index}
              className="flex items-center gap-3 rounded-lg border bg-white p-3"
            >
              <File className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="flex-1 truncate text-sm text-gray-700">
                {fs.file.name}
              </span>
              <span className="text-xs text-gray-400">
                {(fs.file.size / 1024).toFixed(0)} Ko
              </span>
              {fs.status === 'uploading' && (
                <span className="text-xs text-blue-500">Envoi...</span>
              )}
              {fs.status === 'success' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {fs.status === 'error' && (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {fs.error}
                </span>
              )}
              {fs.status !== 'uploading' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isUploading && (
        <p className="text-sm text-gray-500">Téléversement en cours...</p>
      )}
    </div>
  )
}
