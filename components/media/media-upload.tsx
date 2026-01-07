'use client'

import { useState, useRef, useCallback } from 'react'
import { useMedia } from '@/contexts/media-context'
import { Upload, X, Image, Video, File, Music, AlertCircle } from 'lucide-react'

interface MediaUploadProps {
  onUploadComplete?: (media: any) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // em bytes
  className?: string
}

export function MediaUpload({ 
  onUploadComplete, 
  accept = '*/*', 
  multiple = false, 
  maxSize = 10 * 1024 * 1024, // 10MB
  className = '' 
}: MediaUploadProps) {
  const { uploadFile, uploadProgress, isLoading, error } = useMedia()
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []

    // Validar arquivos
    fileArray.forEach(file => {
      if (file.size > maxSize) {
        errors.push(`${file.name}: Arquivo muito grande (máximo ${formatFileSize(maxSize)})`)
        return
      }
      
      if (accept !== '*/*' && !file.type.match(accept.replace(/\*/g, '.*'))) {
        errors.push(`${file.name}: Tipo de arquivo não permitido`)
        return
      }
      
      validFiles.push(file)
    })

    setUploadErrors(errors)
    setUploadedFiles(validFiles)

    if (validFiles.length === 0) return

    // Fazer upload dos arquivos
    try {
      for (const file of validFiles) {
        const uploadedMedia = await uploadFile(file)
        onUploadComplete?.(uploadedMedia)
      }
      
      // Limpar arquivos após upload bem-sucedido
      setUploadedFiles([])
      setUploadErrors([])
    } catch (err) {
      console.error('Erro no upload:', err)
    }
  }, [uploadFile, maxSize, accept, onUploadComplete])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-6 h-6" />
    if (file.type.startsWith('video/')) return <Video className="w-6 h-6" />
    if (file.type.startsWith('audio/')) return <Music className="w-6 h-6" />
    return <File className="w-6 h-6" />
  }

  return (
    <div className={`cms-media-upload ${className}`}>
      {/* Upload Area */}
      <div
        className={`cms-upload-area ${dragActive ? 'cms-upload-area-drag' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
        style={{
          border: '2px dashed',
          borderColor: dragActive ? 'var(--primary)' : 'var(--gray-300)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          backgroundColor: dragActive ? 'var(--primary-light)' : 'var(--white)',
          position: 'relative'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '3rem', 
            height: '3rem', 
            backgroundColor: dragActive ? 'var(--primary)' : 'var(--gray-100)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: dragActive ? 'var(--white)' : 'var(--gray-600)',
            transition: 'all 0.2s'
          }}>
            <Upload style={{ width: '1.5rem', height: '1.5rem' }} />
          </div>
          
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              {dragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
              {accept === '*/*' 
                ? 'Todos os tipos de arquivo são aceitos'
                : `Tipos aceitos: ${accept}`
              } • Máximo {formatFileSize(maxSize)}
            </p>
          </div>
        </div>

        {/* Upload Progress */}
        {isLoading && uploadProgress > 0 && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            left: '1rem',
            backgroundColor: 'var(--white)',
            borderRadius: 'var(--radius)',
            padding: '0.75rem',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ 
                width: '1rem', 
                height: '1rem', 
                border: '2px solid var(--primary)', 
                borderTop: '2px solid transparent', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite' 
              }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                Fazendo upload...
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '0.25rem',
              backgroundColor: 'var(--gray-200)',
              borderRadius: '0.125rem',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: 'var(--primary)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
              {uploadProgress}% concluído
            </div>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius)',
          color: 'var(--danger)',
          fontSize: '0.875rem',
          marginTop: '1rem'
        }}>
          <AlertCircle style={{ width: '1rem', height: '1rem' }} />
          {error}
        </div>
      )}

      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--danger)', marginBottom: '0.5rem' }}>
            Erros no upload:
          </h4>
          {uploadErrors.map((error, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius)',
              color: 'var(--danger)',
              fontSize: '0.875rem',
              marginBottom: '0.25rem'
            }}>
              <AlertCircle style={{ width: '0.875rem', height: '0.875rem' }} />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            Arquivos selecionados:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {uploadedFiles.map((file, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: 'var(--gray-50)',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius)'
              }}>
                <div style={{ color: 'var(--gray-600)' }}>
                  {getFileIcon(file)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '1.5rem',
                    height: '1.5rem',
                    border: 'none',
                    backgroundColor: 'transparent',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: 'var(--gray-400)',
                    transition: 'all 0.2s'
                  }}
                >
                  <X style={{ width: '0.875rem', height: '0.875rem' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

