import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Printer, FileCheck, X } from 'lucide-react'
import { format } from 'date-fns'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useEffect, useRef, useState, useCallback } from 'react'

const getOfficialsForPrint = createServerFn({ method: 'GET' })
  .validator((data: { barangay?: string }) => data)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const query = supabase
      .from('barangay_officials')
      .select('name, position')
      .in('position', ['Punong Barangay', 'Barangay Secretary'])
    
    if (data.barangay) {
      query.eq('barangay', data.barangay)
    }

    const { data: officials } = await query
    return officials ?? []
  })

export interface DocumentRequest {
  id: string
  document_type: string
  purpose?: string
  resident_name: string
  created_at: string
  status: string
  notes?: string
  barangay?: string
}

export interface CertificatePrintModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: DocumentRequest | null
}

const DOCUMENT_TITLES: Record<string, string> = {
  barangay_clearance: 'BARANGAY CLEARANCE',
  certificate_of_indigency: 'CERTIFICATE OF INDIGENCY',
  certificate_of_residency: 'CERTIFICATE OF RESIDENCY',
  business_permit: 'BARANGAY BUSINESS PERMIT / CLEARANCE',
  other: 'BARANGAY CERTIFICATION',
}

/* Base design width for A4 proportion (794px × 1123px at 96 DPI) */
const CERT_DESIGN_WIDTH = 794
const CERT_DESIGN_HEIGHT = 1123

export function CertificatePrintModal({ open, onOpenChange, request }: CertificatePrintModalProps) {
  const [officials, setOfficials] = useState<{ name: string; position: string }[]>([])
  const [previewZoom, setPreviewZoom] = useState(0.62)
  const containerRef = useRef<HTMLDivElement>(null)
  const certRef = useRef<HTMLDivElement>(null)

  /* ── Fetch officials when modal opens ─────────────────────────── */
  useEffect(() => {
    if (open) {
      getOfficialsForPrint({ data: { barangay: request?.barangay } }).then(setOfficials).catch(console.error)
    }
  }, [open, request?.barangay])

  /* ── Auto-zoom: scale certificate to fit preview container ───── */
  const recalcZoom = useCallback(() => {
    const container = containerRef.current
    const cert = certRef.current
    if (!container || !cert) return

    const containerH = container.clientHeight - 32
    const containerW = container.clientWidth - 32

    if (containerH <= 0 || containerW <= 0) return

    const scale = Math.min(containerW / CERT_DESIGN_WIDTH, containerH / CERT_DESIGN_HEIGHT, 1)
    setPreviewZoom(Math.max(scale * 0.98, 0.3))
  }, [])

  useEffect(() => {
    if (!open) {
      setPreviewZoom(0.62)
      return
    }

    const t = setTimeout(recalcZoom, 150)
    window.addEventListener('resize', recalcZoom)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', recalcZoom)
    }
  }, [open, officials, recalcZoom])

  if (!request) return null

  const secretaryName =
    officials.find(o => o.position === 'Barangay Secretary')?.name || '[ Secretary Name ]'
  const captainName =
    officials.find(o => o.position === 'Punong Barangay')?.name || '[ Punong Barangay Name ]'

  const barangayLabel = request.barangay === 'daine_1' ? 'BARANGAY DAINE 1' : request.barangay === 'daine_2' ? 'BARANGAY DAINE 2' : 'BARANGAY DAINE'
  const prefix = request.barangay === 'daine_1' ? 'BD1-' : request.barangay === 'daine_2' ? 'BD2-' : 'BD-'

  const docTitle = DOCUMENT_TITLES[request.document_type] || 'BARANGAY CERTIFICATION'
  const controlNo = `${prefix}${request.id.slice(0, 8).toUpperCase()}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
    'https://ag-brgy-connect.vercel.app/verify/' + request.id,
  )}`

  const dateObj = request.created_at ? new Date(request.created_at) : new Date()
  const dateFormatted = format(dateObj, "do 'day of' MMMM, yyyy")

  /* ── Print via hidden iframe — fills full A4 on 1 single page ── */
  const handlePrint = () => {
    const cert = certRef.current
    if (!cert) return

    document.getElementById('cert-print-iframe')?.remove()

    const iframe = document.createElement('iframe')
    iframe.id = 'cert-print-iframe'
    iframe.style.cssText =
      'position:fixed;width:0;height:0;border:none;top:-9999px;left:-9999px;opacity:0;pointer-events:none;'
    document.body.appendChild(iframe)

    const iDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iDoc) return

    const headContent = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style'),
    )
      .map(el => el.outerHTML)
      .join('\n')

    const clone = cert.cloneNode(true) as HTMLElement
    clone.removeAttribute('style')

    iDoc.open()
    iDoc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
${headContent}
<style>
  @page {
    size: A4 portrait;
    margin: 6mm 10mm;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    height: 100%;
  }
  #printable-certificate-sheet {
    box-sizing: border-box !important;
    width: 100% !important;
    height: calc(297mm - 16mm) !important;
    max-height: calc(297mm - 16mm) !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin: 0 auto !important;
    padding: 8mm 12mm !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }
</style>
</head>
<body>${clone.outerHTML}</body>
</html>`)
    iDoc.close()

    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => document.getElementById('cert-print-iframe')?.remove(), 4000)
    }, 700)
  }

  /* ── Certificate body text per document type ─────────────────── */
  const getBodyContent = () => {
    switch (request.document_type) {
      case 'barangay_clearance':
        return (
          <>
            <p className="text-justify indent-10 leading-relaxed">
              This is to certify that{' '}
              <span className="font-bold underline uppercase">{request.resident_name}</span>, of
              legal age, is a bona fide resident of Barangay Daine, Indang, Cavite.
            </p>
            <p className="text-justify indent-10 leading-relaxed">
              Based on the official records of this office, the above-named individual is known to be
              a person of good moral character, a law-abiding citizen in the community, and has <span className="font-bold">NO DEROGATORY RECORD</span> on file.
            </p>
          </>
        )
      case 'certificate_of_indigency':
        return (
          <>
            <p className="text-justify indent-10 leading-relaxed">
              This is to certify that{' '}
              <span className="font-bold underline uppercase">{request.resident_name}</span>, of
              legal age, is a bona fide resident of Barangay Daine, Indang, Cavite.
            </p>
            <p className="text-justify indent-10 leading-relaxed">
              This further certifies that the aforementioned resident belongs to a low-income /
              indigent family in this barangay and is hereby eligible for financial, medical,
              educational, or legal assistance.
            </p>
          </>
        )
      case 'certificate_of_residency':
        return (
          <>
            <p className="text-justify indent-10 leading-relaxed">
              This is to certify that{' '}
              <span className="font-bold underline uppercase">{request.resident_name}</span>, of
              legal age, is a bona fide resident of Barangay Daine, Indang, Cavite, residing at the
              specified address within our territorial jurisdiction.
            </p>
            <p className="text-justify indent-10 leading-relaxed">
              This certification confirms that the subject individual has been continuously residing
              in this barangay and maintains good standing as a community member.
            </p>
          </>
        )
      case 'business_permit':
        return (
          <>
            <p className="text-justify indent-10 leading-relaxed">
              This is to certify that Barangay Business Clearance & Clearance Permit is hereby
              granted to{' '}
              <span className="font-bold underline uppercase">{request.resident_name}</span> for
              operating a business establishment within the territorial jurisdiction of Barangay
              Daine, Indang, Cavite.
            </p>
            <p className="text-justify indent-10 leading-relaxed">
              The owner/proprietor has complied with the local barangay rules, safety standard
              assessments, and municipal ordinances pertinent to commercial operations in this
              community.
            </p>
          </>
        )
      default:
        return (
          <p className="text-justify indent-10 leading-relaxed">
            This is to certify that{' '}
            <span className="font-bold underline uppercase">{request.resident_name}</span>, of legal
            age, is a bona fide resident of Barangay Daine, Indang, Cavite, Philippines.
          </p>
        )
    }
  }

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl sm:max-w-6xl w-[96vw] h-[94vh] flex flex-col p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* ── Header bar with cleanly separated close button ──────── */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b shrink-0 bg-background">
          <DialogHeader className="p-0">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FileCheck className="h-5 w-5 text-primary" />
              Official Barangay Document Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="gap-2 font-semibold min-h-[38px]">
              <Printer className="h-4 w-4" />
              Print Certificate / Save PDF
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted ml-1"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* ── Preview area — certificate is zoomed to fit full A4 ───── */}
        <div
          ref={containerRef}
          className="flex-1 min-h-0 overflow-auto bg-slate-100/90 p-4 flex items-center justify-center"
        >
          <div
            ref={certRef}
            id="printable-certificate-sheet"
            className="bg-white text-slate-900 shadow-2xl border-4 border-double border-amber-800/80 p-8 sm:p-10 font-serif relative shrink-0 flex flex-col justify-between"
            style={{
              width: `${CERT_DESIGN_WIDTH}px`,
              minHeight: `${CERT_DESIGN_HEIGHT}px`,
              height: `${CERT_DESIGN_HEIGHT}px`,
              zoom: previewZoom,
              boxSizing: 'border-box',
            }}
          >
            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
              <img src="/logo.jpg" alt="Watermark" className="w-[380px] h-[380px] object-contain grayscale" />
            </div>

            {/* Top Section: Header & Title */}
            <div className="relative z-10">
              {/* Document Header */}
              <header className="flex items-center justify-between border-b-2 border-amber-900/60 pb-4 mb-4 text-center">
                {/* Left Logo */}
                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  <img
                    src="/logo.jpg"
                    alt="Barangay Logo"
                    className="w-18 h-18 object-contain rounded-full shadow-sm border border-amber-700/30"
                  />
                </div>

                {/* Center Text */}
                <div className="flex-1 px-4 space-y-0.5">
                  <p className="text-[11px] uppercase tracking-widest text-slate-600 font-sans font-semibold">
                    Republic of the Philippines
                  </p>
                  <p className="text-xs uppercase tracking-wider text-slate-700 font-sans font-bold">
                    Province of Cavite • Municipality of Indang
                  </p>
                  <h1 className="text-2xl font-black tracking-wider text-amber-900 uppercase font-sans pt-0.5">
                    {barangayLabel}
                  </h1>
                  <p className="text-xs font-bold tracking-widest text-slate-800 uppercase font-sans border-t border-amber-800/20 pt-0.5 mt-0.5">
                    OFFICE OF THE PUNONG BARANGAY
                  </p>
                </div>

                {/* Right — Official Seal */}
                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-18 h-18 text-amber-800" viewBox="0 0 100 100" fill="currentColor">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
                    <polygon points="50,15 61,35 84,38 67,54 71,77 50,66 29,77 33,54 16,38 39,35" fill="currentColor" opacity="0.85" />
                    <text x="50" y="90" fontSize="8" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif" fill="currentColor">
                      OFFICIAL SEAL
                    </text>
                  </svg>
                </div>
              </header>

              {/* Document Title */}
              <div className="text-center my-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wider font-sans underline decoration-amber-800 decoration-2 underline-offset-8">
                  {docTitle}
                </h2>
              </div>
            </div>

            {/* Middle Section: Salutation & Body Content */}
            <div className="space-y-6 text-base sm:text-lg text-slate-800 leading-relaxed relative z-10 my-auto py-4">
              <p className="font-bold text-slate-900 font-sans text-lg">TO WHOM IT MAY CONCERN:</p>

              {getBodyContent()}

              {request.purpose && (
                <p className="text-justify indent-10 leading-relaxed">
                  Issued upon the verbal/written request of the interested party for the purpose of:{' '}
                  <span className="font-semibold italic text-slate-900">{request.purpose}</span>.
                </p>
              )}

              <p className="text-justify indent-10 leading-relaxed pt-2">
                Given this <span className="font-bold text-slate-900">{dateFormatted}</span> at
                Barangay Daine, Indang, Cavite, Philippines.
              </p>
            </div>

            {/* Bottom Section: Signatures & Official Verification Footer */}
            <div className="relative z-10 pt-4">
              {/* Signatures */}
              <div className="grid grid-cols-2 gap-10 pb-6 font-sans text-sm">
                {/* Left — Barangay Secretary */}
                <div className="space-y-1 text-left">
                  <p className="text-xs text-slate-500 font-medium">Prepared by:</p>
                  <div className="h-10 flex items-end">
                    <span className="font-serif italic text-slate-400 text-xs text-transparent select-none">
                      [ Signature ]
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 border-t border-slate-400 pt-1.5 inline-block min-w-[200px] uppercase tracking-wide">
                    {secretaryName}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">Barangay Secretary</p>
                </div>

                {/* Right — Barangay Captain */}
                <div className="space-y-1 text-right">
                  <p className="text-xs text-slate-500 font-medium">Approved by:</p>
                  <div className="h-12 flex items-end justify-end">
                    <span className="font-serif italic text-slate-400 text-xs text-transparent select-none">
                      [ Signature ]
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 border-t border-slate-400 pt-1.5 inline-block min-w-[200px] uppercase tracking-wide">
                    {captainName}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">Barangay Captain</p>
                </div>
              </div>

              {/* Footer — Control No. & QR */}
              <footer className="border-t-2 border-amber-900/40 pt-3 flex items-center justify-between text-xs text-slate-600 font-sans">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-800 tracking-wide">{barangayLabel} OFFICIAL CERTIFICATE</p>
                  <p className="font-mono text-slate-700">
                    Control No.: <span className="font-bold text-amber-900">{controlNo}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 italic">Not valid without official barangay dry seal.</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded border border-amber-900/20 shadow-xs">
                  <img
                    src={qrUrl}
                    alt={`QR Code ${controlNo}`}
                    className="w-14 h-14 border border-slate-200 rounded p-0.5"
                  />
                  <div className="text-[10px] space-y-0.5 text-slate-500 hidden sm:block text-left">
                    <p className="font-bold text-slate-700 uppercase">Scan to Verify</p>
                    <p>Digital Validation</p>
                    <p className="font-mono text-[9px] text-slate-400">ag-brgy-connect</p>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
