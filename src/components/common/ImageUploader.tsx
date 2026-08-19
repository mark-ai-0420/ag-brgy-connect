import { useState, useCallback } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { UploadCloud, X, Loader2, Image as ImageIcon, ExternalLink, RefreshCw } from 'lucide-react'
import { supabase } from '#/lib/supabase'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { toast } from 'sonner'

export type ImageBucket = 'announcement-photos' | 'event-photos' | 'business-photos'

export interface ImageUploaderProps {
  bucket: ImageBucket
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  helperText?: string
  className?: string
  aspectRatio?: 'video' | 'square' | 'wide'
  disabled?: boolean
}

export function ImageUploader({
  bucket,
  value,
  onChange,
  label = 'Upload Image',
  helperText = 'JPEG, PNG, or WebP up to 5MB',
  className,
  aspectRatio = 'video',
  disabled = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        setUploading(true)
        setUploadProgress(10)

        // Generate clean unique filename
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `${Date.now()}_${cleanName}`

        setUploadProgress(40)

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          })

        if (uploadError) {
          console.error('Supabase storage upload error:', uploadError)
          toast.error(`Upload failed: ${uploadError.message}`)
          return
        }

        setUploadProgress(85)

        // Retrieve public URL
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)

        if (!data?.publicUrl) {
          toast.error('Failed to generate public URL for uploaded image')
          return
        }

        setUploadProgress(100)
        onChange(data.publicUrl)
        toast.success('Image uploaded successfully!')
      } catch (err: any) {
        console.error('Unexpected error during upload:', err)
        toast.error(err?.message || 'An error occurred during file upload')
      } finally {
        setUploading(false)
        setUploadProgress(null)
      }
    },
    [bucket, onChange]
  )

  const onDropAccepted = useCallback(
    (files: File[]) => {
      if (files.length > 0) {
        handleUpload(files[0])
      }
    },
    [handleUpload]
  )

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const error = rejections[0]?.errors[0]
    if (error?.code === 'file-too-large') {
      toast.error('File exceeds the 5MB size limit.')
    } else if (error?.code === 'file-invalid-type') {
      toast.error('Invalid file format. Please choose a JPEG, PNG, or WebP image.')
    } else {
      toast.error(error?.message || 'File upload rejected.')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDropAccepted,
    onDropRejected,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: disabled || uploading,
    noClick: !!value, // Only allow click on dropzone if no image is currently uploaded
  })

  const aspectRatioClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
  }[aspectRatio]

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div className={cn('space-y-2 w-full', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground tracking-wide">
            {label}
          </label>
          {value && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ImageIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              Image Attached
            </span>
          )}
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          'relative w-full rounded-xl border-2 transition-all duration-200 overflow-hidden flex flex-col items-center justify-center min-h-[160px]',
          aspectRatioClass,
          value ? 'border-border bg-muted/20' : 'border-dashed cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5 ring-2 ring-primary/20 scale-[0.99]'
            : 'border-border/80 hover:border-primary/50 hover:bg-muted/40',
          (disabled || uploading) && 'opacity-70 cursor-not-allowed pointer-events-none'
        )}
      >
        <input {...getInputProps()} />

        {/* Uploading State */}
        {uploading ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/90 backdrop-blur-sm p-4 text-center animate-in fade-in">
            <div className="relative flex items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
            </div>
            <div className="space-y-1 max-w-[240px]">
              <p className="text-sm font-semibold text-foreground">Uploading Image...</p>
              <p className="text-xs text-muted-foreground">Uploading to secure storage</p>
            </div>
            {uploadProgress !== null && (
              <div className="w-48 bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : value ? (
          /* Preview State */
          <div className="relative w-full h-full group">
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-cover select-none"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5 shadow-md min-h-[38px] text-xs font-semibold"
                onClick={(e) => {
                  e.stopPropagation()
                  open()
                }}
                disabled={disabled}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Replace
              </Button>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center rounded-md bg-secondary/80 text-secondary-foreground hover:bg-secondary h-9 px-3 text-xs font-semibold shadow-md min-h-[38px]"
                title="View original image"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                View
              </a>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-1.5 shadow-md min-h-[38px] text-xs font-semibold"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          /* Idle Dropzone State */
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-2 select-none">
            <div
              className={cn(
                'p-3.5 rounded-full border shadow-sm transition-transform duration-200',
                isDragActive ? 'bg-primary/20 scale-110 text-primary' : 'bg-background text-muted-foreground'
              )}
            >
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {isDragActive ? 'Drop image here' : 'Choose an image or drag & drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-medium hover:underline">Click to browse</span> from your device
              </p>
            </div>
            {helperText && (
              <p className="text-[11px] text-muted-foreground/80 pt-1">
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
