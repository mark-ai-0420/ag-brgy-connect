import { useState, useEffect, useRef, type FormEvent } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  Search,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  MapPin,
  Phone,
  ShieldCheck,
  Copy,
  Check,
  QrCode,
  ArrowRight,
  Send,
  Stamp,
  FileCheck2,
  RefreshCw,
  HelpCircle,
  Sparkles,
  SearchCheck,
  WifiOff,
  History,
  Share2,
  Zap,
  CheckCircle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { z } from 'zod'

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Separator } from '#/components/ui/separator'
import { trackDocumentRequest, type DocumentTrackingResult, type TrackingStage } from '#/server/documents'
import { useNetworkStatus } from '#/hooks/useNetworkStatus'

export interface CachedTrackingRecord {
  code: string
  savedAt: string
  result: DocumentTrackingResult
}

const searchSchema = z.object({
  code: z.string().optional(),
})

export const Route = createFileRoute('/track')({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  head: () => ({
    meta: [
      {
        title: 'Document Tracking & Public Verification | Barangay Daine',
      },
      {
        name: 'description',
        content:
          'Track the live issuance status of your Barangay Clearance, Certificate of Indigency, Residency, or Business Clearance in Barangay Daine, Indang, Cavite.',
      },
      {
        property: 'og:title',
        content: 'Document Tracking & Public Verification | Barangay Daine',
      },
      {
        property: 'og:description',
        content:
          'Track the live issuance status of your Barangay Clearance, Certificate of Indigency, Residency, or Business Clearance in Barangay Daine, Indang, Cavite.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
  }),
  component: TrackDocumentRoute,
})

function formatDateTime(timestamp?: string | null) {
  if (!timestamp) return null
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp)
    return format(date, 'MMM d, yyyy • h:mm a')
  } catch {
    return timestamp
  }
}

function formatDate(timestamp?: string | null) {
  if (!timestamp) return null
  try {
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp)
    return format(date, 'MMMM d, yyyy')
  } catch {
    return timestamp
  }
}

function getStageIcon(step: number, state: TrackingStage['state']) {
  if (state === 'rejected') {
    return <AlertTriangle className="h-4 w-4" />
  }
  if (state === 'completed') {
    return <CheckCircle2 className="h-4 w-4" />
  }
  if (step === 1) return <Send className="h-4 w-4" />
  if (step === 2) return <Search className="h-4 w-4" />
  if (step === 3) return <Stamp className="h-4 w-4" />
  return <Building2 className="h-4 w-4" />
}

function getProgressInfo(status?: string) {
  const s = (status || '').toLowerCase()
  switch (s) {
    case 'submitted':
    case 'pending':
      return {
        percent: 25,
        percentLabel: '25%',
        statusLabel: 'Stage 1 of 4 — Request Submitted & Pending Intake',
        color: 'from-blue-600 via-blue-700 to-indigo-600',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800',
        estimator: 'Standard turnaround: 1–2 business days (Monday – Friday, 8:00 AM – 5:00 PM)',
      }
    case 'under_review':
    case 'in_review':
      return {
        percent: 50,
        percentLabel: '50%',
        statusLabel: 'Stage 2 of 4 — Secretary Review & Requirements Check',
        color: 'from-blue-600 via-indigo-600 to-violet-600',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800',
        estimator: 'Standard turnaround: 1–2 business days (In verification)',
      }
    case 'processing':
    case 'approved':
      return {
        percent: 75,
        percentLabel: '75%',
        statusLabel: 'Stage 3 of 4 — Captain Approval & Official Seal Generation',
        color: 'from-indigo-600 via-blue-600 to-teal-600',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800',
        estimator: 'Standard turnaround: 1–2 business days (Awaiting final executive sign-off)',
      }
    case 'ready_for_pickup':
    case 'ready':
      return {
        percent: 100,
        percentLabel: '100%',
        statusLabel: 'Stage 4 of 4 — Ready for Immediate Hall Pickup & Digital Verification',
        color: 'from-emerald-500 via-emerald-600 to-teal-600',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
        estimator: 'Document Certified & Ready for Hall Pickup or Digital Verification',
      }
    case 'completed':
    case 'issued':
      return {
        percent: 100,
        percentLabel: '100%',
        statusLabel: 'Stage 4 of 4 — Document Issued & Released',
        color: 'from-emerald-500 via-teal-600 to-emerald-600',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
        estimator: 'Official Document Released & Verified in Civic Registry',
      }
    case 'rejected':
    case 'cancelled':
      return {
        percent: 100,
        percentLabel: '100%',
        statusLabel: 'Requires Attention — Action Needed with Barangay Staff',
        color: 'from-red-500 via-rose-600 to-red-700',
        badgeColor: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800',
        estimator: 'Requires Attention: Please contact or visit your Barangay Hall Receiving Desk',
      }
    default:
      return {
        percent: 25,
        percentLabel: '25%',
        statusLabel: 'Stage 1 of 4 — Request Submitted & Pending Intake',
        color: 'from-blue-600 via-blue-700 to-indigo-600',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800',
        estimator: 'Standard turnaround: 1–2 business days (Monday – Friday, 8:00 AM – 5:00 PM)',
      }
  }
}

// Stage labels mapping for high contrast 4-stage stepper
const STAGE_LABELS: Record<number, string> = {
  1: 'Request Submitted',
  2: 'Secretary Review',
  3: 'Captain Approval',
  4: 'Ready for Pickup / Released',
}

function TrackDocumentRoute() {
  const searchParams = Route.useSearch()
  const navigate = useNavigate({ from: '/track' })
  const { isOffline } = useNetworkStatus()

  const [inputCode, setInputCode] = useState(searchParams.code || '')
  const [activeCode, setActiveCode] = useState(searchParams.code || '')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<DocumentTrackingResult | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isFromOfflineCache, setIsFromOfflineCache] = useState(false)
  const [cachedRecords, setCachedRecords] = useState<CachedTrackingRecord[]>([])
  const lastSearchedCodeRef = useRef<string>('')

  // Load cached tracking records on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cached_tracking_records')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setCachedRecords(parsed)
          }
        }
      } catch (e) {
        console.warn('Failed to load cached tracking records:', e)
      }
    }
  }, [])

  // Auto-track when URL parameter changes
  useEffect(() => {
    const code = (searchParams.code || '').trim().toUpperCase()
    if (code) {
      setInputCode(code)
      setActiveCode(code)
      if (code !== lastSearchedCodeRef.current || !result) {
        performTrack(code)
      }
    } else {
      setResult(null)
      setHasSearched(false)
      setIsFromOfflineCache(false)
      lastSearchedCodeRef.current = ''
    }
  }, [searchParams.code])

  function saveToOfflineCache(trimmedCode: string, trackingRes: DocumentTrackingResult) {
    if (!trackingRes.found || !trackingRes.request) return
    if (typeof window === 'undefined') return

    try {
      const existingRaw = localStorage.getItem('cached_tracking_records')
      const existingList: CachedTrackingRecord[] = existingRaw ? JSON.parse(existingRaw) : []

      const filtered = existingList.filter(
        (item) =>
          item.code.toUpperCase() !== trimmedCode.toUpperCase() &&
          item.result.request?.id !== trackingRes.request?.id &&
          item.result.request?.control_number !== trackingRes.request?.control_number
      )

      const updated: CachedTrackingRecord[] = [
        {
          code: trimmedCode,
          savedAt: new Date().toISOString(),
          result: trackingRes,
        },
        ...filtered,
      ].slice(0, 3)

      localStorage.setItem('cached_tracking_records', JSON.stringify(updated))
      setCachedRecords(updated)
    } catch (e) {
      console.warn('Failed to save tracking record to localStorage:', e)
    }
  }

  async function performTrack(codeToSearch: string) {
    const trimmed = codeToSearch.trim().toUpperCase()
    if (!trimmed) {
      toast.error('Please enter a Reference Code or Request ID', { id: 'track-status-toast' })
      return
    }

    lastSearchedCodeRef.current = trimmed
    setIsLoading(true)
    setHasSearched(true)

    // Check offline status
    const isCurrentlyOffline = (typeof navigator !== 'undefined' && !navigator.onLine) || isOffline

    if (isCurrentlyOffline) {
      const cachedMatch = cachedRecords.find(
        (c) =>
          c.code.toUpperCase() === trimmed ||
          c.result.request?.control_number.toUpperCase() === trimmed ||
          c.result.request?.id.toUpperCase() === trimmed
      )

      if (cachedMatch) {
        setResult(cachedMatch.result)
        setIsFromOfflineCache(true)
        setIsLoading(false)
        toast.info(`Viewing offline cached record for ${trimmed}`, { id: 'track-status-toast' })
        return
      } else {
        setIsFromOfflineCache(false)
        setResult({
          found: false,
          error: `Offline Mode: No cached tracking record found for "${trimmed}". Connect to internet to search live registry.`,
        })
        setIsLoading(false)
        return
      }
    }

    try {
      const res = await trackDocumentRequest({
        data: { referenceCode: trimmed },
      })
      setResult(res)
      setIsFromOfflineCache(false)

      if (!res.found) {
        toast.error(res.error || 'No document request found for that reference code.', {
          id: 'track-status-toast',
        })
      } else {
        saveToOfflineCache(trimmed, res)
        toast.success(`Found document request: ${res.request?.control_number}`, {
          id: 'track-status-toast',
        })
      }
    } catch (err) {
      console.error('Error tracking document:', err)

      // Fallback to offline cache on network error
      const cachedMatch = cachedRecords.find(
        (c) =>
          c.code.toUpperCase() === trimmed ||
          c.result.request?.control_number.toUpperCase() === trimmed ||
          c.result.request?.id.toUpperCase() === trimmed
      )

      if (cachedMatch) {
        setResult(cachedMatch.result)
        setIsFromOfflineCache(true)
        toast.info(`Network unavailable. Showing offline cached record for ${trimmed}.`, {
          id: 'track-status-toast',
        })
      } else {
        setIsFromOfflineCache(false)
        setResult({
          found: false,
          error: (err as Error).message || 'Failed to connect to barangay registry. Check your connection.',
        })
        toast.error('Unable to retrieve tracking details. Please check your network connection.', {
          id: 'track-status-toast',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = inputCode.trim().toUpperCase()
    if (!trimmed) {
      toast.error('Please enter a Reference Code or Request ID', { id: 'track-status-toast' })
      return
    }
    setActiveCode(trimmed)
    navigate({
      search: { code: trimmed },
      replace: true,
    })
  }

  function handleCopyControlNumber(text: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
    }
    setCopiedCode(true)
    toast.success('Control Number copied to clipboard!', { id: 'copy-code-toast' })
    setTimeout(() => setCopiedCode(false), 2000)
  }

  function handleShareTrackingLink() {
    const code = req?.control_number || result?.request?.control_number || activeCode
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/track?code=${encodeURIComponent(code)}`
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl)
      }
      setCopiedLink(true)
      toast.success('Tracking link copied to clipboard!', { id: 'share-link-toast' })
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const req = result?.request

  return (
    <div className="min-h-[100dvh] pb-16 bg-slate-50/60 dark:bg-background">
      {/* ── Hero Banner with Philippine Civic Horizon Gradient ─────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[#002675] via-[#0038A8] to-[#1E3A8A] text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
        {/* National Flag color accent top stripe */}
        <div
          className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#0038A8] via-[#FCD116] to-[#CE1126]"
          aria-hidden="true"
        />

        {/* Ambient subtle glow */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#FCD116]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#CE1126]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#FCD116] text-xs font-bold mb-4 backdrop-blur-md shadow-xs">
            <SearchCheck className="h-4 w-4" />
            <span>Public Document Registry &bull; Real-time Verification</span>
          </div>

          {/* Page Main Heading (h1) */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            Track Barangay Document Request
          </h1>

          <p className="text-white/85 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8 font-medium">
            Check the live issuance status of your Barangay Clearance, Certificate of Indigency, Residency, or Business Clearance in real-time. No login required.
          </p>

          {/* Search Box Card */}
          <form
            id="tracker-search-card"
            onSubmit={handleFormSubmit}
            className="bg-card text-card-foreground p-3 sm:p-4 rounded-2xl shadow-2xl border border-white/20 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 items-center"
          >
            <div className="relative w-full flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                id="tracking-reference-input"
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Enter Reference Code (e.g. BD1-8F3A29D1 or Request ID)"
                aria-label="Enter document tracking reference code"
                className="pl-11 pr-4 min-h-[48px] h-12 text-sm sm:text-base font-mono uppercase tracking-wider rounded-xl bg-background border-input shadow-inner focus-visible:ring-[#0038A8]"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <Button
              id="tracker-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto min-h-[48px] px-7 rounded-xl font-bold bg-[#0038A8] hover:bg-[#002b80] text-white shadow-md transition-transform active:scale-[0.98] shrink-0 cursor-pointer touch-target flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Track Status</span>
                </>
              )}
            </Button>
          </form>

          {/* Quick Sample Reference Badges (min 44px touch target) */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5 text-xs text-white/80">
            <span className="font-semibold text-white/90">Sample Codes:</span>
            {['BD1-8F3A29D1', 'BD2-4E90B17A', 'BD1-2026-0881'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setInputCode(sample)
                  setActiveCode(sample)
                  navigate({
                    search: { code: sample },
                    replace: true,
                  })
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-[#FCD116] font-mono border border-white/20 transition-all cursor-pointer text-xs font-bold inline-flex items-center justify-center active:scale-[0.97] touch-target shadow-xs"
                title={`Track sample code ${sample}`}
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Recent Offline Cached Records Quick Selector */}
          {cachedRecords.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/15 max-w-2xl mx-auto text-left">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-[#FCD116]" />
                  Recent Cached Searches ({cachedRecords.length}/3 saved offline)
                </span>
                <span className="text-[11px] text-white/70">Available without internet</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {cachedRecords.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setInputCode(item.code)
                      setActiveCode(item.code)
                      setResult(item.result)
                      setIsFromOfflineCache(true)
                      setHasSearched(true)
                      lastSearchedCodeRef.current = item.code
                      navigate({ search: { code: item.code }, replace: true })
                    }}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono text-white transition-all inline-flex items-center gap-2 cursor-pointer touch-target active:scale-[0.97] shadow-xs"
                    title={`View cached record: ${item.result.request?.document_title}`}
                  >
                    <WifiOff className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                    <span className="font-bold text-[#FCD116]">{item.result.request?.control_number || item.code}</span>
                    <span className="text-[11px] opacity-80 truncate max-w-[130px]">
                      {item.result.request?.document_title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Content Section ─────────────────────────────────────────────────── */}
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 pt-8">
        
        {/* Loading Skeleton */}
        {isLoading && (
          <Card className="border shadow-lg rounded-2xl overflow-hidden animate-pulse">
            <div className="h-2.5 bg-muted" />
            <CardHeader className="p-6">
              <div className="h-6 w-1/3 bg-muted rounded-md mb-2" />
              <div className="h-4 w-2/3 bg-muted rounded-md" />
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="h-24 bg-muted rounded-xl" />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded-xl" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* State 1: Found Document Status Card */}
        {!isLoading && req && (
          <section id="tracker-results-section" aria-label="Document Tracking Results" className="space-y-6 animate-in fade-in-50 duration-300">
            
            {/* Civic Status Card */}
            <Card className="border shadow-xl rounded-2xl overflow-hidden bg-card">
              {/* Flag accent stripe */}
              <div
                className="h-2 bg-gradient-to-r from-[#0038A8] via-[#FCD116] to-[#CE1126]"
                aria-hidden="true"
              />

              <CardHeader className="p-6 sm:p-8 bg-gradient-to-b from-muted/40 to-transparent border-b">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-3">
                    {/* Issuing Barangay & Action Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={`text-xs font-extrabold px-3 py-1 ${
                          req.barangay === 'daine_2'
                            ? 'bg-[#CE1126] hover:bg-[#b00f20] text-white'
                            : 'bg-[#0038A8] hover:bg-[#002d87] text-white'
                        }`}
                      >
                        <Building2 className="h-3.5 w-3.5 mr-1" />
                        {req.barangay_name}
                      </Badge>

                      {/* Interactive Quick Reference Code Copy Button (font-mono JetBrains Mono) */}
                      <button
                        type="button"
                        onClick={() => handleCopyControlNumber(req.control_number)}
                        className="min-h-[44px] inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-background hover:bg-muted/80 text-foreground font-mono text-xs font-bold transition-all shadow-xs cursor-pointer touch-target focus-visible:ring-2 focus-visible:ring-primary"
                        title="Click to copy Reference Code / Control Number"
                        aria-label={`Control Number: ${req.control_number}. Click to copy.`}
                      >
                        <span className="text-muted-foreground text-xs font-medium">Control #</span>
                        <span className="text-foreground">{req.control_number}</span>
                        {copiedCode ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-primary shrink-0" />
                        )}
                      </button>

                      {/* Offline Indicator Badge */}
                      {isFromOfflineCache && (
                        <Badge className="bg-amber-600 hover:bg-amber-600 text-white text-xs font-bold px-2.5 py-1 flex items-center gap-1.5 shadow-xs">
                          <WifiOff className="h-3.5 w-3.5" />
                          Offline Record
                        </Badge>
                      )}

                      {/* 1-Tap Share Direct Link Button (min 44px touch target) */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleShareTrackingLink}
                        className="min-h-[44px] px-4 gap-2 text-xs font-bold rounded-xl cursor-pointer touch-target border-border/80 bg-background hover:bg-muted shadow-xs transition-transform active:scale-[0.98]"
                        title="Copy direct tracking link to share"
                        aria-label="Share direct tracking link"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-700 dark:text-emerald-400">Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="h-3.5 w-3.5 text-primary" />
                            <span>Share Link</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Sequential Level 2 Heading (h2) for Document Title */}
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
                      <FileText className="h-7 w-7 text-primary shrink-0" />
                      <span>{req.document_title}</span>
                    </h2>

                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                      Requested on {formatDate(req.created_at)} &bull; Official Barangay Civic Registry Entry
                    </p>
                  </div>

                  {/* Status Pill Badge */}
                  <div className="shrink-0 flex sm:flex-col items-start sm:items-end gap-2">
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold border shadow-xs ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                          : req.status === 'in_review'
                            ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800'
                            : req.status === 'ready'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
                              : req.status === 'completed'
                                ? 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-800'
                                : 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800'
                      }`}
                    >
                      {req.status === 'ready' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 animate-pulse" />
                      ) : req.status === 'completed' ? (
                        <FileCheck2 className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                      ) : req.status === 'in_review' ? (
                        <Search className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                      ) : req.status === 'rejected' ? (
                        <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-400" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                      )}
                      <span>{req.status_label}</span>
                    </div>

                    <span className="text-[11px] text-muted-foreground hidden sm:block font-mono">
                      Updated: {formatDateTime(req.updated_at)}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 space-y-8">
                {/* ── 1. Dynamic Percentage Progress Bar & Turnaround Window Estimator ── */}
                {(() => {
                  const progress = getProgressInfo(req.status)
                  const isReady = req.status === 'ready' || req.status === 'ready_for_pickup'
                  const isCompleted = req.status === 'completed' || req.status === 'issued'
                  const isRejected = req.status === 'rejected' || req.status === 'cancelled'

                  return (
                    <div
                      id="tracker-progress-summary"
                      className="p-5 rounded-2xl bg-gradient-to-b from-muted/50 to-muted/20 border space-y-4 shadow-xs"
                    >
                      {/* Header with Progress text, Percentage pill, and Turnaround window */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-muted-foreground block">
                            Live Processing Progress
                          </span>
                          <p className="text-sm font-bold text-foreground">
                            {progress.statusLabel}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-xs font-black px-3 py-1 rounded-full ${progress.badgeColor}`}
                          >
                            {progress.percentLabel} Completed
                          </Badge>
                        </div>
                      </div>

                      {/* Accessible Progress Bar */}
                      <div
                        role="progressbar"
                        aria-valuenow={progress.percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Document request processing stage: ${progress.percent}%`}
                        className="w-full h-3 bg-muted rounded-full overflow-hidden p-0.5 border border-border/60"
                      >
                        <div
                          className={`h-full transition-all duration-700 ease-out rounded-full bg-gradient-to-r ${progress.color}`}
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>

                      {/* Turnaround Window Estimator Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                              isReady || isCompleted
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : isRejected
                                  ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {isReady || isCompleted ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : isRejected ? (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            ) : (
                              <Zap className="h-3.5 w-3.5 fill-current" />
                            )}
                          </span>
                          <span className="font-semibold text-foreground">
                            {isReady || isCompleted ? (
                              <span className="text-emerald-700 dark:text-emerald-400">
                                ⚡ Document Status: {progress.estimator}
                              </span>
                            ) : isRejected ? (
                              <span className="text-red-700 dark:text-red-400">
                                ⚠️ Notice: {progress.estimator}
                              </span>
                            ) : (
                              <span>
                                ⚡ Standard turnaround: 1–2 business days (Mon–Fri, 8:00 AM – 5:00 PM)
                              </span>
                            )}
                          </span>
                        </div>

                        <span className="text-[11px] text-muted-foreground font-mono">
                          Ref: {req.control_number}
                        </span>
                      </div>
                    </div>
                  )
                })()}

                {/* ── 2. 4-Stage Visual Lifecycle Stepper ─────────────────────────────── */}
                <div id="tracker-lifecycle-stepper" className="space-y-4">
                  <div className="flex items-center justify-between">
                    {/* Sequential Level 3 Heading (h3) */}
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Document Lifecycle & Verification Progress
                    </h3>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {req.timeline.filter((s) => s.state === 'completed').length} of {req.timeline.length} Stages Completed
                    </span>
                  </div>

                  {/* 4-Stage Stepper Grid with Animated Active Pulse */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                    {req.timeline.map((stage) => {
                      const isCompleted = stage.state === 'completed'
                      const isCurrent = stage.state === 'current'
                      const isRejected = stage.state === 'rejected'
                      const stageName = STAGE_LABELS[stage.step] || stage.label

                      return (
                        <div
                          key={stage.step}
                          className={`relative p-4 rounded-xl border transition-all ${
                            isCurrent
                              ? 'bg-primary/5 border-primary ring-2 ring-primary/30 shadow-md'
                              : isCompleted
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/60 shadow-xs'
                                : isRejected
                                  ? 'bg-red-50/60 dark:bg-red-950/20 border-red-300 dark:border-red-800/60'
                                  : 'bg-muted/30 border-border/70 opacity-80'
                          }`}
                        >
                          {/* Step Header with High-Contrast Node Bubble */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shadow-sm transition-all ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                                  : isCurrent
                                    ? 'bg-[#0038A8] text-white shadow-blue-500/40 ring-4 ring-[#0038A8]/30 animate-pulse'
                                    : isRejected
                                      ? 'bg-red-600 text-white shadow-red-500/30'
                                      : 'bg-muted text-muted-foreground border border-border'
                              }`}
                            >
                              {getStageIcon(stage.step, stage.state)}
                            </div>

                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                  : isCurrent
                                    ? 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-300 font-black'
                                    : isRejected
                                      ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300'
                                      : 'bg-muted text-muted-foreground border-border'
                              }`}
                            >
                              {isCompleted ? 'Done' : isCurrent ? 'Active Stage' : isRejected ? 'Attention' : 'Pending'}
                            </Badge>
                          </div>

                          {/* Stage Title */}
                          <h4 className="font-bold text-sm text-foreground leading-snug mb-1.5">
                            {stage.step}. {stageName}
                          </h4>

                          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                            {stage.description}
                          </p>

                          {stage.timestamp && (
                            <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium">
                              <Clock className="h-3 w-3 shrink-0 text-primary/70" />
                              <span className="truncate">{formatDateTime(stage.timestamp)}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* ── 3. Document Details Meta Section ─────────────────────────── */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Document Request Details & Metadata
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-muted/40 p-4 sm:p-5 rounded-xl border">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground block mb-1">
                        Document Requested
                      </span>
                      <span className="text-sm font-bold text-foreground">{req.document_title}</span>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-muted-foreground block mb-1">
                        Declared Purpose
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {req.purpose || 'General / Official Civic Transaction'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-muted-foreground block mb-1">
                        Request ID
                      </span>
                      <span className="text-xs font-mono text-muted-foreground truncate block" title={req.id}>
                        {req.id}
                      </span>
                    </div>

                    {req.notes && (
                      <div className="col-span-full pt-2 border-t border-border/40">
                        <span className="text-xs font-semibold text-muted-foreground block mb-1">
                          Barangay Remarks / Official Notes
                        </span>
                        <p className="text-xs text-foreground bg-background p-3 rounded-lg border">
                          {req.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 4. Digital Certificate Verification Action (When ready or completed) ── */}
                {(req.status === 'ready' || req.status === 'completed') && (
                  <div className="rounded-xl p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-300 dark:border-emerald-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md shrink-0">
                        <ShieldCheck className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200/70 text-emerald-950 dark:bg-emerald-900/70 dark:text-emerald-200 mb-1">
                          <QrCode className="h-3 w-3" /> QR Authenticated
                        </div>
                        <h3 className="font-bold text-base text-emerald-950 dark:text-emerald-100">
                          Digital Security Seal & Verification Available
                        </h3>
                        <p className="text-xs text-emerald-800/90 dark:text-emerald-300 max-w-xl">
                          This document contains an encrypted QR security hash for instant validation by government agencies, employers, and schools.
                        </p>
                      </div>
                    </div>

                    <Button
                      asChild
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold px-5 min-h-[44px] shrink-0 cursor-pointer touch-target"
                    >
                      <Link to="/verify/$requestId" params={{ requestId: req.control_number || req.id }}>
                        <QrCode className="h-4 w-4 mr-2" />
                        <span>Verify Digital Certificate</span>
                      </Link>
                    </Button>
                  </div>
                )}

                {/* ── 5. Operating Hours & Pickup Instructions Cards ───────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Hall Info Card */}
                  <Card className="border bg-card shadow-xs">
                    <CardHeader className="p-4 pb-2 bg-muted/20 border-b">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Issuing Barangay Operations Center
                      </h3>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-foreground">Hall Address</p>
                          <p>{req.hall_info.address}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-foreground">Receiving Desk Hours</p>
                          <p>{req.hall_info.hours}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-foreground">Hotline & Inquiries</p>
                          <a
                            href={`tel:${req.hall_info.contact}`}
                            className="min-h-[44px] inline-flex items-center text-primary hover:underline font-bold text-xs"
                          >
                            {req.hall_info.contact}
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pickup Instructions Card */}
                  <Card className="border bg-card shadow-xs">
                    <CardHeader className="p-4 pb-2 bg-muted/20 border-b">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4 text-emerald-600" />
                        Pickup Requirements & Guidelines
                      </h3>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          1
                        </span>
                        <span>
                          Bring at least <strong>one (1) original valid government-issued photo ID</strong> (e.g. PhilSys ID, Driver's License, Voter's Certificate).
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          2
                        </span>
                        <span>
                          Present your Reference Code <strong className="font-mono text-foreground">{req.control_number}</strong> at the reception desk.
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          3
                        </span>
                        <span>
                          If claiming through an authorized representative, provide an <strong>Authorization Letter</strong> and copies of IDs for both individuals.
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>

              <CardFooter className="p-4 sm:p-6 bg-muted/20 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Authenticated Barangay Public Tracking System &bull; Republic of the Philippines</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInputCode('')
                    setResult(null)
                    setHasSearched(false)
                    setIsFromOfflineCache(false)
                    navigate({ search: {}, replace: true })
                  }}
                  className="min-h-[44px] px-4 text-xs font-semibold cursor-pointer touch-target"
                >
                  Track Another Document
                </Button>
              </CardFooter>
            </Card>
          </section>
        )}

        {/* State 2: Not Found Guidance Card */}
        {!isLoading && hasSearched && result && !result.found && (
          <section aria-label="Document Not Found" className="animate-in fade-in-50 duration-200">
            <Card className="border shadow-lg rounded-2xl overflow-hidden bg-card">
              <div
                className="h-2 bg-gradient-to-r from-amber-500 to-red-500"
                aria-hidden="true"
              />
              <CardContent className="p-8 sm:p-10 text-center space-y-6 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
                  <AlertTriangle className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  {/* Sequential Level 2 Heading (h2) */}
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    Document Request Not Found
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.error || `We could not find any active document request matching "${activeCode}".`}
                  </p>
                </div>

                {/* Troubleshooting Tips */}
                <div className="bg-muted/50 p-4 rounded-xl border text-left text-xs text-muted-foreground space-y-2">
                  {/* Sequential Level 3 Heading (h3) */}
                  <h3 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                    <HelpCircle className="h-3.5 w-3.5 text-primary" />
                    Troubleshooting Tips:
                  </h3>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li>Double-check for any typos or missing hyphens in your Reference Code.</li>
                    <li>Ensure the prefix matches your issuing barangay (e.g. <strong>BD1-</strong> for Daine 1 or <strong>BD2-</strong> for Daine 2).</li>
                    <li>If you submitted the request within the last 5 minutes, please allow a moment for the database to sync.</li>
                    <li>You can also look up the full 36-character Request UUID from your email confirmation or resident dashboard.</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setInputCode('')
                      setResult(null)
                      setHasSearched(false)
                      setIsFromOfflineCache(false)
                      navigate({ search: {}, replace: true })
                    }}
                    className="min-h-[44px] px-5 font-semibold cursor-pointer touch-target"
                  >
                    Clear & Try Again
                  </Button>
                  <Button
                    asChild
                    className="bg-[#0038A8] hover:bg-[#002b80] text-white min-h-[44px] px-5 font-semibold cursor-pointer touch-target"
                  >
                    <Link to="/documents">
                      <FileText className="h-4 w-4 mr-2" />
                      Submit New Request
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* State 3: Clean Empty State (Before searching) */}
        {!isLoading && !hasSearched && (
          <section aria-label="Tracking Guide & Information" className="space-y-8 animate-in fade-in-50 duration-200">
            {/* Guide Section Heading (h2) */}
            <div className="text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground flex items-center justify-center sm:justify-start gap-2">
                <SearchCheck className="h-5 w-5 text-primary" />
                How Document Tracking Works
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Follow your document request every step of the way with live updates from our barangay registry.
              </p>
            </div>

            {/* Guide Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border shadow-xs hover:border-primary/40 transition-colors">
                <CardHeader className="p-5 pb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                    <SearchCheck className="h-5 w-5" />
                  </div>
                  {/* Sequential Level 3 Heading (h3) */}
                  <h3 className="text-base font-bold text-foreground">1. Locate Reference Code</h3>
                </CardHeader>
                <CardContent className="p-5 pt-0 text-xs text-muted-foreground leading-relaxed">
                  Find your tracking number on your digital request receipt, confirmation SMS, or under the "My Documents" section in your resident dashboard.
                </CardContent>
              </Card>

              <Card className="border shadow-xs hover:border-primary/40 transition-colors">
                <CardHeader className="p-5 pb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5" />
                  </div>
                  {/* Sequential Level 3 Heading (h3) */}
                  <h3 className="text-base font-bold text-foreground">2. Track Live Progress</h3>
                </CardHeader>
                <CardContent className="p-5 pt-0 text-xs text-muted-foreground leading-relaxed">
                  Follow the 4-stage lifecycle from initial clerk intake, secretary records review, Barangay Captain sign-off, to pickup readiness.
                </CardContent>
              </Card>

              <Card className="border shadow-xs hover:border-primary/40 transition-colors">
                <CardHeader className="p-5 pb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                    <Building2 className="h-5 w-5" />
                  </div>
                  {/* Sequential Level 3 Heading (h3) */}
                  <h3 className="text-base font-bold text-foreground">3. Claim or Verify</h3>
                </CardHeader>
                <CardContent className="p-5 pt-0 text-xs text-muted-foreground leading-relaxed">
                  Once marked "Ready for Pickup", visit your designated Barangay Hall with a valid ID, or verify your digital document QR code online.
                </CardContent>
              </Card>
            </div>

            {/* Public Services Info Banner */}
            <Card className="border shadow-sm rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center sm:text-left">
                  {/* Sequential Level 2 Heading (h2) */}
                  <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
                    <FileText className="h-5 w-5 text-[#FCD116]" />
                    Need to request a new barangay document?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                    Submit applications for Barangay Clearance, Certificate of Residency, Indigency, or Business Clearance directly online through our secure portal.
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-[#FCD116] hover:bg-[#ffe033] text-[#0038A8] font-black px-6 min-h-[44px] shadow-lg shrink-0 cursor-pointer touch-target"
                >
                  <Link to="/documents">
                    <span>Browse Document Catalog</span>
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          </section>
        )}

      </main>
    </div>
  )
}
