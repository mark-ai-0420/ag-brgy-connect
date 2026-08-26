import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  ShieldCheck,
  Download,
  ExternalLink,
  User,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Camera,
  Loader2,
  WifiOff,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '#/lib/utils'
import { uploadAvatarPhoto } from '#/lib/upload'
import { supabase } from '#/lib/supabase'
import { updateResidentAvatar } from '#/server/profile'

export interface ResidentProfile {
  id: string
  full_name?: string | null
  barangay?: string | null
  purok?: string | null
  avatar_url?: string | null
  phone?: string | null
  address?: string | null
  created_at?: string | null
  email?: string | null
}

export interface DigitalResidentIDProps {
  profile?: ResidentProfile | null
  className?: string
  onPhotoUpdated?: (newUrl: string) => void
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
  } else {
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
}

export function DigitalResidentID({
  profile,
  className = '',
  onPhotoUpdated,
}: DigitalResidentIDProps) {
  const router = useRouter()
  const [side, setSide] = useState<'front' | 'back'>('front')
  const [isDownloading, setIsDownloading] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeProfile, setActiveProfile] = useState<ResidentProfile | null>(() => {
    if (profile && profile.id) return profile
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cached_resident_id_profile')
        if (cached) return JSON.parse(cached)
      } catch (e) {
        console.warn('Failed to parse cached resident ID profile:', e)
      }
    }
    return null
  })
  const [isOfflineCopy, setIsOfflineCopy] = useState<boolean>(() => {
    if (!profile && typeof window !== 'undefined') {
      const cached = localStorage.getItem('cached_resident_id_profile')
      return Boolean(cached)
    }
    return false
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || activeProfile?.avatar_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Synchronize profile prop and cache to localStorage
  useEffect(() => {
    if (profile && profile.id) {
      setActiveProfile(profile)
      setIsOfflineCopy(false)
      setAvatarUrl(profile.avatar_url || null)
      try {
        localStorage.setItem('cached_resident_id_profile', JSON.stringify(profile))
      } catch (err) {
        console.warn('Failed to save resident profile to localStorage:', err)
      }
    } else {
      // If profile prop is absent (e.g. offline fallback), attempt retrieval from cache
      try {
        const cached = localStorage.getItem('cached_resident_id_profile')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed && parsed.id) {
            setActiveProfile(parsed)
            setIsOfflineCopy(true)
            setAvatarUrl(parsed.avatar_url || null)
          }
        }
      } catch (err) {
        console.warn('Failed to load cached resident ID profile:', err)
      }
    }
  }, [profile])

  if (!activeProfile) {
    return (
      <div className={`p-8 rounded-3xl border border-border/80 bg-card text-center space-y-4 shadow-sm ${className}`}>
        <div className="p-3.5 rounded-2xl bg-primary/10 text-primary w-14 h-14 flex items-center justify-center mx-auto shadow-inner">
          <User className="h-7 w-7" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="font-bold text-base text-foreground">Digital Resident ID Offline Cache</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Walang naka-save na offline resident ID. Mag-log in habang may koneksyon sa internet upang awtomatikong mai-save ang iyong digital ID para sa offline use.
          </p>
        </div>
        <Button asChild size="sm" className="min-h-[38px] px-5 font-bold rounded-xl bg-primary">
          <Link to="/login">Mag-log In</Link>
        </Button>
      </div>
    )
  }

  const effectiveProfile = activeProfile
  const isDaine2 = effectiveProfile.barangay === 'daine_2'
  const barangayTitle = isDaine2 ? 'BARANGAY DAINE 2' : 'BARANGAY DAINE 1'
  const barangaySub = isDaine2 ? 'Daine 2, Indang, Cavite' : 'Daine 1, Indang, Cavite'
  const prefix = isDaine2 ? 'BD2-RES-' : 'BD1-RES-'
  const controlNumber = `${prefix}${effectiveProfile.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
  const residentName = effectiveProfile.full_name || 'Bona Fide Resident'
  const purokName = effectiveProfile.purok || 'Purok Centro'

  const issueDateObj = effectiveProfile.created_at ? new Date(effectiveProfile.created_at) : new Date()
  const issuedDateFormatted = format(issueDateObj, 'MMM dd, yyyy')

  // Verification URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ag-brgy-connect.vercel.app'
  const verifyUrl = `${origin}/verify/resident/${effectiveProfile.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&format=png&data=${encodeURIComponent(verifyUrl)}`

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(controlNumber)
      setCopied(true)
      toast.success('Resident Control Number copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleTriggerUpload = () => {
    if (isOfflineCopy) {
      toast.info('Photo upload is disabled in offline copy mode.')
      return
    }
    if (isUploadingPhoto) return
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ''

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo size exceeds 5MB limit.')
      return
    }

    setIsUploadingPhoto(true)
    const toastId = toast.loading('Uploading Resident 2x2 Photo...')

    try {
      const publicUrl = await uploadAvatarPhoto(file, effectiveProfile.id)
      if (!publicUrl) {
        throw new Error('Failed to upload photo to storage. Please try again.')
      }

      try {
        await updateResidentAvatar({ data: { avatarUrl: publicUrl, profileId: effectiveProfile.id } })
      } catch (serverErr) {
        console.warn('Server function update failed, trying client SDK:', serverErr)
        const { error: clientErr } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', effectiveProfile.id)
        if (clientErr) throw clientErr
      }

      const updatedProfile = { ...effectiveProfile, avatar_url: publicUrl }
      setActiveProfile(updatedProfile)
      setAvatarUrl(publicUrl)
      localStorage.setItem('cached_resident_id_profile', JSON.stringify(updatedProfile))

      if (onPhotoUpdated) {
        onPhotoUpdated(publicUrl)
      }

      router.invalidate()
      toast.success('Resident ID Photo updated!', { id: toastId })
    } catch (err: any) {
      console.error('Error updating resident photo:', err)
      toast.error(err?.message || 'Failed to update Resident ID photo', { id: toastId })
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // High-Resolution Canvas PNG Generation
  const handleDownloadPNG = async () => {
    setIsDownloading(true)
    const toastId = toast.loading('Rendering high-resolution Digital ID...')

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas 2D context not available')

      const width = 1000
      const height = 630
      canvas.width = width
      canvas.height = height

      // Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height)
      bgGrad.addColorStop(0, '#0F172A')
      bgGrad.addColorStop(0.5, '#1E293B')
      bgGrad.addColorStop(1, '#0A192F')
      ctx.fillStyle = bgGrad
      ctx.beginPath()
      drawRoundedRectPath(ctx, 0, 0, width, height, 32)
      ctx.fill()

      // Border
      ctx.lineWidth = 4
      ctx.strokeStyle = '#38BDF8'
      ctx.stroke()

      // Flag Stripe
      const stripeH = 8
      ctx.fillStyle = '#0038A8'
      ctx.fillRect(32, 28, (width - 64) * 0.45, stripeH)
      ctx.fillStyle = '#FCD116'
      ctx.fillRect(32 + (width - 64) * 0.45, 28, (width - 64) * 0.1, stripeH)
      ctx.fillStyle = '#CE1126'
      ctx.fillRect(32 + (width - 64) * 0.55, 28, (width - 64) * 0.45, stripeH)

      // Header Box Background
      const headerGrad = ctx.createLinearGradient(0, 44, width, 140)
      headerGrad.addColorStop(0, '#002B80')
      headerGrad.addColorStop(1, '#001D59')
      ctx.fillStyle = headerGrad
      ctx.beginPath()
      drawRoundedRectPath(ctx, 32, 44, width - 64, 110, 16)
      ctx.fill()

      // Header Logo
      const logoX = 54
      const logoY = 64
      const logoSize = 70
      try {
        const logoImg = new Image()
        logoImg.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          logoImg.onload = () => resolve(true)
          logoImg.onerror = reject
          logoImg.src = '/logo.jpg'
          setTimeout(() => resolve(false), 2000)
        })
        ctx.save()
        ctx.beginPath()
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
        ctx.restore()
        ctx.lineWidth = 3
        ctx.strokeStyle = '#FCD116'
        ctx.beginPath()
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
        ctx.stroke()
      } catch {
        // Fallback gracefully
      }

      // Header Texts
      ctx.textAlign = 'center'
      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 13px system-ui, sans-serif'
      ctx.letterSpacing = '2px'
      ctx.fillText(
        'REPUBLIC OF THE PHILIPPINES • PROVINCE OF CAVITE • MUNICIPALITY OF INDANG',
        width / 2 + 20,
        72
      )

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 26px system-ui, sans-serif'
      ctx.letterSpacing = '1.5px'
      ctx.fillText(barangayTitle, width / 2 + 20, 106)

      ctx.fillStyle = '#38BDF8'
      ctx.font = 'bold 13px system-ui, sans-serif'
      ctx.letterSpacing = '1px'
      ctx.fillText('OFFICIAL DIGITAL RESIDENT IDENTIFICATION CARD', width / 2 + 20, 134)

      // Photo Box
      const photoX = 64
      const photoY = 180
      const photoW = 200
      const photoH = 250

      ctx.fillStyle = '#1E293B'
      ctx.beginPath()
      drawRoundedRectPath(ctx, photoX, photoY, photoW, photoH, 16)
      ctx.fill()

      let photoLoaded = false
      const currentPhotoUrl = avatarUrl || effectiveProfile.avatar_url

      if (currentPhotoUrl) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise((resolve, reject) => {
            img.onload = () => resolve(true)
            img.onerror = reject
            img.src = currentPhotoUrl
            setTimeout(() => reject(new Error('Image timeout')), 6000)
          })

          ctx.save()
          ctx.beginPath()
          drawRoundedRectPath(ctx, photoX, photoY, photoW, photoH, 16)
          ctx.clip()

          const imgAspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height)
          const boxAspect = photoW / photoH
          let sx = 0,
            sy = 0,
            sw = img.naturalWidth || img.width,
            sh = img.naturalHeight || img.height

          if (imgAspect > boxAspect) {
            sw = (img.naturalHeight || img.height) * boxAspect
            sx = ((img.naturalWidth || img.width) - sw) / 2
          } else {
            sh = (img.naturalWidth || img.width) / boxAspect
            sy = ((img.naturalHeight || img.height) - sh) / 2
          }

          ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH)
          ctx.restore()
          photoLoaded = true
        } catch (e) {
          console.warn('Could not draw avatar on canvas:', e)
          photoLoaded = false
        }
      }

      if (!photoLoaded) {
        ctx.save()
        ctx.beginPath()
        drawRoundedRectPath(ctx, photoX, photoY, photoW, photoH, 16)
        ctx.clip()

        const placeholderGrad = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoH)
        placeholderGrad.addColorStop(0, '#1E293B')
        placeholderGrad.addColorStop(1, '#0F172A')
        ctx.fillStyle = placeholderGrad
        ctx.fillRect(photoX, photoY, photoW, photoH)

        ctx.fillStyle = '#475569'
        ctx.beginPath()
        ctx.arc(photoX + photoW / 2, photoY + 95, 45, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(photoX + photoW / 2, photoY + 230, 75, Math.PI, 0)
        ctx.fill()

        ctx.fillStyle = '#94A3B8'
        ctx.font = 'bold 11px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('CITIZEN PHOTO', photoX + photoW / 2, photoY + 160)

        ctx.restore()
      }

      ctx.lineWidth = 3
      ctx.strokeStyle = '#FCD116'
      ctx.beginPath()
      drawRoundedRectPath(ctx, photoX, photoY, photoW, photoH, 16)
      ctx.stroke()

      // Photo tag
      ctx.fillStyle = '#0F172A'
      ctx.beginPath()
      drawRoundedRectPath(ctx, photoX + 15, photoY + photoH - 30, photoW - 30, 24, 6)
      ctx.fill()
      ctx.fillStyle = isOfflineCopy ? '#F59E0B' : '#38BDF8'
      ctx.font = 'bold 10px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(isOfflineCopy ? 'OFFLINE COPY' : 'VERIFIED RESIDENT', photoX + photoW / 2, photoY + photoH - 14)

      // Resident Details
      ctx.textAlign = 'left'

      // Full Name
      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.fillText('RESIDENT NAME / PANGALAN', 300, 205)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 24px system-ui, sans-serif'
      ctx.fillText(residentName.toUpperCase(), 300, 235)

      // Control Number
      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.fillText('RESIDENT CONTROL NUMBER', 300, 280)

      ctx.fillStyle = '#FCD116'
      ctx.font = 'bold 18px monospace, sans-serif'
      ctx.fillText(controlNumber, 300, 305)

      // Purok & Address
      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.fillText('PUROK / SITIO & JURISDICTION', 300, 350)

      ctx.fillStyle = '#E2E8F0'
      ctx.font = 'bold 16px system-ui, sans-serif'
      ctx.fillText(`${purokName}, ${barangaySub}`, 300, 375)

      // Issued Date & Status
      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.fillText('DATE ISSUED', 300, 420)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 15px system-ui, sans-serif'
      ctx.fillText(issuedDateFormatted, 300, 442)

      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.fillText('STATUS', 470, 420)
      ctx.fillStyle = isOfflineCopy ? '#F59E0B' : '#10B981'
      ctx.font = 'bold 15px system-ui, sans-serif'
      ctx.fillText(isOfflineCopy ? 'OFFLINE CACHED' : 'ACTIVE RESIDENT', 470, 442)

      // QR Code Box
      const qrX = width - 260
      const qrY = 180
      const qrSize = 190

      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      drawRoundedRectPath(ctx, qrX, qrY, qrSize, qrSize, 16)
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#38BDF8'
      ctx.stroke()

      try {
        const qrImg = new Image()
        qrImg.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          qrImg.onload = () => resolve(true)
          qrImg.onerror = reject
          qrImg.src = qrUrl
          setTimeout(() => reject(new Error('QR code timeout')), 5000)
        })
        ctx.drawImage(qrImg, qrX + 10, qrY + 10, qrSize - 20, qrSize - 20)
      } catch {
        ctx.fillStyle = '#0F172A'
        ctx.font = 'bold 12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('SCAN TO VERIFY', qrX + qrSize / 2, qrY + qrSize / 2)
      }

      // QR label
      ctx.fillStyle = '#94A3B8'
      ctx.font = 'bold 11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('SCAN TO VERIFY AUTHENTICITY', qrX + qrSize / 2, qrY + qrSize + 25)

      // Footer
      ctx.fillStyle = '#0F172A'
      ctx.beginPath()
      drawRoundedRectPath(ctx, 32, height - 90, width - 64, 60, 12)
      ctx.fill()
      ctx.lineWidth = 1
      ctx.strokeStyle = '#334155'
      ctx.stroke()

      ctx.textAlign = 'left'
      ctx.fillStyle = '#64748B'
      ctx.font = 'italic 11px system-ui, sans-serif'
      ctx.fillText(
        'This virtual ID is an official digital credential issued by BrgyConnect. Not transferable.',
        50,
        height - 60
      )
      ctx.fillText(`Registry Link: ${verifyUrl}`, 50, height - 44)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#FCD116'
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.fillText('HON. PUNONG BARANGAY', width - 50, height - 60)
      ctx.fillStyle = '#94A3B8'
      ctx.font = '10px system-ui, sans-serif'
      ctx.fillText('Executive Officer', width - 50, height - 44)

      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `Resident_ID_${residentName.replace(/\s+/g, '_')}_${controlNumber}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast.success('Digital Resident ID downloaded as PNG!', { id: toastId })
    } catch (err) {
      console.error('Failed to export ID card PNG:', err)
      toast.error('Could not download image. Please try again.', { id: toastId })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploadingPhoto || isOfflineCopy}
      />

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-2xl border shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">Official Digital Resident ID</h3>
              {isOfflineCopy && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> Offline Copy
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Certified Digital Credential • {barangayTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSide(side === 'front' ? 'back' : 'front')}
            className="min-h-[38px] text-xs font-semibold gap-1.5 cursor-pointer rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {side === 'front' ? 'View Back / QR' : 'View Front'}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            className="min-h-[38px] text-xs font-bold gap-1.5 bg-[#0038A8] hover:bg-[#002675] text-white shadow-sm cursor-pointer rounded-xl"
          >
            <Download className="h-3.5 w-3.5" />
            {isDownloading ? 'Exporting...' : 'Download ID Card (PNG)'}
          </Button>
        </div>
      </div>

      {/* ID Card Display Frame */}
      <div className="relative mx-auto max-w-xl perspective-1000">
        {side === 'front' ? (
          /* FRONT OF CARD */
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0A192F] text-white shadow-2xl transition-all duration-300">
            {/* Top Philippine Flag Tricolor Ribbon */}
            <div className="h-2 w-full flex">
              <div className="w-[45%] bg-[#0038A8]" />
              <div className="w-[10%] bg-[#FCD116]" />
              <div className="w-[45%] bg-[#CE1126]" />
            </div>

            {/* Holographic Subtle Background Rings */}
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full border-[16px] border-sky-500/10 blur-[1px]" />
            <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full border-[10px] border-amber-500/10 blur-[1px]" />

            <div className="p-5 sm:p-6 space-y-5">
              {/* Header Box */}
              <div className="rounded-2xl bg-gradient-to-r from-[#0038A8]/90 via-[#002675]/95 to-[#1E3A8A]/90 p-3.5 border border-sky-400/30 text-center shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
                <div className="flex items-center justify-between gap-2">
                  <img
                    src="/logo.jpg"
                    alt="Barangay Logo"
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-amber-400/80 shadow-md shrink-0 bg-white"
                  />
                  <div className="min-w-0 flex-1 px-1">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-200">
                      Republic of the Philippines • Cavite
                    </p>
                    <h2 className="text-base sm:text-lg font-black tracking-wider text-white uppercase truncate">
                      {barangayTitle}
                    </h2>
                    <p className="text-[10px] font-semibold tracking-wider text-sky-200 uppercase">
                      Municipality of Indang
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-full bg-amber-400/20 ring-2 ring-amber-400/60 flex items-center justify-center text-amber-300 shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Photo Section with Camera Overlay & Upload Trigger */}
                <div className="relative shrink-0 flex flex-col items-center group/photo">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={handleTriggerUpload}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleTriggerUpload()
                      }
                    }}
                    className={cn(
                      'h-32 w-28 sm:h-36 sm:w-30 rounded-2xl bg-slate-800 border-2 border-amber-400/80 overflow-hidden shadow-lg flex items-center justify-center relative cursor-pointer transition-all duration-200 hover:border-amber-300 hover:shadow-amber-500/20 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-amber-400',
                      (isUploadingPhoto || isOfflineCopy) && 'opacity-80'
                    )}
                    title={isOfflineCopy ? 'Offline Copy Mode' : 'Click to change or upload 2x2 Photo'}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={residentName}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover/photo:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                        <User className="h-12 w-12 text-slate-500 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Photo</span>
                      </div>
                    )}

                    {/* Camera Hover / Focus Overlay (active when online) */}
                    {!isOfflineCopy && (
                      <div
                        className={cn(
                          'absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center transition-all duration-200',
                          isUploadingPhoto
                            ? 'opacity-100'
                            : 'opacity-0 group-hover/photo:opacity-100 group-focus/photo:opacity-100'
                        )}
                      >
                        {isUploadingPhoto ? (
                          <div className="flex flex-col items-center gap-1 text-white">
                            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
                            <span className="text-[9px] font-bold tracking-wider uppercase text-amber-300">
                              Uploading...
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-white">
                            <div className="p-1.5 rounded-full bg-amber-400 text-slate-950 shadow-md">
                              <Camera className="h-4 w-4" />
                            </div>
                            <span className="text-[9px] font-black tracking-wider uppercase text-amber-300 leading-tight">
                              {avatarUrl ? 'Change Photo' : 'Upload 2x2'}
                            </span>
                            <span className="text-[7px] text-slate-300 font-medium">JPEG, PNG, WebP</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isOfflineCopy ? (
                    <Badge className="mt-1.5 bg-amber-600 hover:bg-amber-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-amber-400/40 shadow-xs">
                      <WifiOff className="h-2.5 w-2.5 mr-1 inline" /> Offline Copy
                    </Badge>
                  ) : (
                    <Badge className="mt-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-emerald-400/40 shadow-xs">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-1 inline" /> Verified
                    </Badge>
                  )}

                  {/* Direct Change/Upload Photo button under avatar when online */}
                  {!isOfflineCopy && (
                    <button
                      type="button"
                      onClick={handleTriggerUpload}
                      disabled={isUploadingPhoto}
                      className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer hover:underline"
                    >
                      <Camera className="h-3 w-3" />
                      {avatarUrl ? 'Change Photo' : 'Upload 2x2 Photo'}
                    </button>
                  )}
                </div>

                {/* Resident Details */}
                <div className="flex-1 min-w-0 space-y-3 text-center sm:text-left">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Resident Full Name</p>
                    <p className="text-lg sm:text-xl font-black text-white uppercase tracking-tight truncate">
                      {residentName}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-left bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Control Number</p>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="text-xs font-mono font-bold text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Click to copy"
                      >
                        {controlNumber}
                        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 opacity-60" />}
                      </button>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Jurisdiction</p>
                      <p className="text-xs font-bold text-sky-200 truncate">{purokName}</p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Issued</p>
                      <p className="text-xs font-medium text-slate-200">{issuedDateFormatted}</p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Status</p>
                      <p className={`text-xs font-bold ${isOfflineCopy ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isOfflineCopy ? 'Offline Cached' : 'Active Resident'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Security Footer */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-sky-400" />
                  <span>Official Virtual Resident ID Card</span>
                </div>
                <div className="font-mono text-slate-300">VALID 2026 - 2027</div>
              </div>
            </div>
          </div>
        ) : (
          /* BACK OF CARD */
          <div className="relative overflow-hidden rounded-3xl border-2 border-sky-500/40 bg-gradient-to-br from-slate-950 via-[#0A192F] to-slate-900 text-white shadow-2xl transition-all duration-300">
            {/* Top Stripe */}
            <div className="h-2 w-full flex">
              <div className="w-[45%] bg-[#0038A8]" />
              <div className="w-[10%] bg-[#FCD116]" />
              <div className="w-[45%] bg-[#CE1126]" />
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Digital Security QR</h3>
                  <p className="text-[10px] text-slate-400">Scan for instant authentic barangay verification</p>
                </div>
                <Badge variant="outline" className="border-sky-400/40 text-sky-300 text-[10px] font-mono">
                  {controlNumber}
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 py-2">
                {/* QR Code Container */}
                <div className="bg-white p-2.5 rounded-2xl shadow-xl ring-2 ring-sky-400/40 shrink-0">
                  <img
                    src={qrUrl}
                    alt={`QR Code ${controlNumber}`}
                    className="h-32 w-32 object-contain"
                  />
                </div>

                {/* Instructions & Meta */}
                <div className="space-y-2.5 text-xs text-slate-300 text-center sm:text-left min-w-0">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
                      Official Resident Registry
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Scanning this QR code directs any verifying official or bank officer to the secure BrgyConnect live authentication portal.
                    </p>
                  </div>

                  <div className="pt-1">
                    <Link
                      to="/verify/resident/$residentId"
                      params={{ residentId: effectiveProfile.id }}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors underline underline-offset-2"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Public Verification Registry
                    </Link>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-[10px] text-slate-400 leading-relaxed space-y-1">
                <p className="font-semibold text-slate-300">
                  NOTICE: This digital identification certifies bona fide residency in {barangaySub}.
                </p>
                <p>
                  If found, please surrender to the Barangay Hall or scan QR code to notify the owner.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
