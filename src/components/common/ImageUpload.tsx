import { useState, useRef, type ChangeEvent } from 'react'
import { UploadCloud, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '#/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (file: File | null) => void
  onRemove: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  label?: string
  helperText?: string
}

export function ImageUpload({ 
  value, 
  onChange, 
  onRemove, 
  disabled, 
  loading,
  className,
  label = "Upload Image",
  helperText = "PNG, JPG, GIF up to 5MB"
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || loading) return
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        onChange(file)
      }
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onChange(e.target.files[0])
    }
  }

  const handleClick = () => {
    if (!disabled && !loading) {
      inputRef.current?.click()
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div 
        className={cn(
          "relative flex flex-col items-center justify-center w-full min-h-[200px] rounded-xl border-2 border-dashed transition-all",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/50 hover:bg-muted",
          (disabled || loading) && "opacity-50 cursor-not-allowed",
          value ? "p-2" : "p-6"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={value ? undefined : handleClick}
      >
        <input 
          ref={inputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleChange}
          disabled={disabled || loading}
        />
        
        {loading ? (
          <div className="flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-medium">Uploading...</span>
          </div>
        ) : value ? (
          <div className="relative w-full h-full min-h-[180px] rounded-lg overflow-hidden group">
            <img src={value} alt="Uploaded" className="w-full h-full object-cover rounded-lg" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                disabled={disabled}
                className="bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/90 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center cursor-pointer">
            <div className="p-4 bg-background rounded-full shadow-sm border mb-4">
              <UploadCloud className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {label}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-semibold hover:underline">Click to browse</span> or drag and drop
            </p>
            {helperText && (
              <p className="text-[11px] text-muted-foreground/75 mt-4">
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
