import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  Printer,
  FileCheck,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  QrCode,
  ShieldCheck,
  Award,
  Sparkles,
  Download,
} from 'lucide-react'
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
  business_permit: 'BARANGAY BUSINESS CLEARANCE & PERMIT',
  barangay_id: 'BARANGAY RESIDENT CERTIFICATION (ID)',
  other: 'BARANGAY OFFICIAL CERTIFICATION',
}

/* Base design dimensions for standard A4 proportion (794px × 1123px at 96 DPI) */
const CERT_DESIGN_WIDTH = 794
const CERT_DESIGN_HEIGHT = 1123

export function CertificatePrintModal({ open, onOpenChange, request }: CertificatePrintModalProps) {
  const [officials, setOfficials] = useState<{ name: string; position: string }[]>([])
  const [previewZoom, setPreviewZoom] = useState(0.65)
  const containerRef = useRef<HTMLDivElement>(null)
  const certRef = useRef<HTMLDivElement>(null)

  /* Fetch officials when modal opens */
  useEffect(() => {
    if (open) {
      getOfficialsForPrint({ data: { barangay: request?.barangay } })
        .then(setOfficials)
        .catch(console.error)
    }
  }, [open, request?.barangay])

  /* Auto-zoom: scale certificate smoothly to fit preview container */
  const recalcZoom = useCallback(() => {
    const container = containerRef.current
    const cert = certRef.current
    if (!container || !cert) return

    const containerH = container.clientHeight - 40
    const containerW = container.clientWidth - 40

    if (containerH <= 0 || containerW <= 0) return

    const scale = Math.min(containerW / CERT_DESIGN_WIDTH, containerH / CERT_DESIGN_HEIGHT, 1)
    setPreviewZoom(Math.max(scale * 0.98, 0.35))
  }, [])

  useEffect(() => {
    if (!open) {
      setPreviewZoom(0.65)
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
    officials.find((o) => o.position === 'Barangay Secretary')?.name || 'HON. BARANGAY SECRETARY'
  const captainName =
    officials.find((o) => o.position === 'Punong Barangay')?.name || 'HON. PUNONG BARANGAY'

  const barangayTitle =
    request.barangay === 'daine_1'
      ? 'BARANGAY DAINE 1'
      : request.barangay === 'daine_2'
        ? 'BARANGAY DAINE 2'
        : 'BARANGAY DAINE'

  const prefix = request.barangay === 'daine_1' ? 'BD1-' : request.barangay === 'daine_2' ? 'BD2-' : 'BD-'
  const docTitle = DOCUMENT_TITLES[request.document_type] || 'BARANGAY CERTIFICATION'
  const controlNo = `${prefix}${request.id.slice(0, 8).toUpperCase()}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    'https://ag-brgy-connect.vercel.app/verify/' + request.id,
  )}`

  const dateObj = request.created_at ? new Date(request.created_at) : new Date()
  const dayFormatted = format(dateObj, 'do')
  const monthYearFormatted = format(dateObj, 'MMMM, yyyy')
  const fullDateFormatted = `${dayFormatted} day of ${monthYearFormatted}`

  /* Print via hidden iframe — high-fidelity single A4 sheet */
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

    const headContent = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n')

    const clone = cert.cloneNode(true) as HTMLElement
    clone.removeAttribute('style')

    iDoc.open()
    iDoc.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${docTitle} - ${request.resident_name}</title>
${headContent}
<style>
  @page {
    size: A4 portrait;
    margin: 6mm 10mm;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-sizing: border-box !important;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    width: 100% !important;
    height: 100% !important;
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
    padding: 10mm 14mm !important;
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

  /* Dynamic Certificate Body Paragraphs */
  const renderBodyContent = () => {
    switch (request.document_type) {
      case 'barangay_clearance':
        return (
          <>
            <p className="text-justify indent-12 leading-relaxed">
              This is to certify that{' '}
              <span className="font-bold underline uppercase tracking-wide text-slate-950">
                {request.resident_name}
              </span>
              , of legal age, Filipino, is a bona fide resident of {barangayTitle}, Municipality of Indang, Province of Cavite, Philippines.
            </p>
            <p className="text-justify indent-12 leading-relaxed">
              Based on the official citizen records and character verification of this office, the aforementioned individual is known to be a person of good moral character, a law-abiding citizen in the community, and has{' '}
              <span className="font-extrabold uppercase tracking-wide text-slate-950">NO DEROGATORY RECORD</span> on file as of the date of issuance.
            </p>
          </>
        )
      case 'certificate_of_indigency':
        return (
          <>
            <p className="text-justify indent-12 leading-relaxed">
              This is to certify that{' '}
              <span className="font-bold underline uppercase tracking-wide text-slate-950">
                {request.resident_name}
              </span>
              , of legal age, is a bona fide resident of {barangayTitle}, Municipality of Indang, Province of Cavite.
            </p>
            <p className="text-justify indent-12 leading-relaxed">
              This further certifies that the subject individual and their immediate household belong to the low-income / indigent sector of this community, and is hereby eligible for social welfare, medical, hospitalization, educational scholarship, or public legal assistance.
            </p>
          </>
        )
      case 'certificate_of_residency':
        return (
          <>
            <p className="text-justify indent-12 leading-relaxed">
              This is to certify that{' '}
              <span className="font-bold underline uppercase tracking-wide text-slate-950">
                {request.resident_name}
              </span>
              , of legal age, is a bona fide resident of {barangayTitle}, Municipality of Indang, Province of Cavite, currently residing at their declared address within our territorial jurisdiction.
            </p>
            <p className="text-justify indent-12 leading-relaxed">
              This certification confirms that the subject citizen has been continuously residing in this barangay and maintains an active and reputable standing in the community registry.
            </p>
          </>
        )
      case 'business_permit':
        return (
          <>
            <p className="text-justify indent-12 leading-relaxed">
              This is to certify that Barangay Commercial Clearance &amp; Business Permit is hereby granted to{' '}
              <span className="font-bold underline uppercase tracking-wide text-slate-950">
                {request.resident_name}
              </span>{' '}
              for the legitimate operation and commercial conduct of business within the territorial jurisdiction of {barangayTitle}, Indang, Cavite.
            </p>
            <p className="text-justify indent-12 leading-relaxed">
              The owner/proprietor has complied with the required barangay safety inspections, community zoning standards, and municipal ordinances pertinent to commercial establishments in this locality.
            </p>
          </>
        )
      default:
        return (
          <>
            <p className="text-justify indent-12 leading-relaxed">
              This is to certify that{' '}
              <span className="font-bold underline uppercase tracking-wide text-slate-950">
                {request.resident_name}
              </span>
              , of legal age, Filipino, is a bona fide resident in good standing of {barangayTitle}, Municipality of Indang, Province of Cavite, Philippines.
            </p>
            <p className="text-justify indent-12 leading-relaxed">
              This official certification is issued upon the formal request of the aforementioned person for all legal intents and purposes it may serve.
            </p>
          </>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl sm:max-w-6xl w-[96vw] h-[94vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border shadow-2xl"
        showCloseButton={false}
      >
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-border bg-card shrink-0">
          <DialogHeader className="p-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  Official Barangay Document Preview
                  <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono uppercase bg-primary/5 text-primary border-primary/20">
                    {controlNo}
                  </Badge>
                </DialogTitle>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Republic of the Philippines Standard Letterhead • High-Fidelity A4 Print Layout
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden md:flex items-center bg-muted/60 rounded-xl p-0.5 border border-border mr-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setPreviewZoom((z) => Math.max(z - 0.1, 0.35))}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-mono px-2 text-muted-foreground select-none">
                {Math.round(previewZoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setPreviewZoom((z) => Math.min(z + 0.1, 1.2))}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-xs"
                onClick={recalcZoom}
                title="Fit to Window"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Print Button */}
            <Button
              onClick={handlePrint}
              className="gap-2 font-bold min-h-[40px] px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm btn-tactile cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted ml-1 cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Certificate Preview Container */}
        <div
          ref={containerRef}
          className="flex-1 min-h-0 overflow-auto bg-slate-900/90 dark:bg-slate-950 p-6 flex items-center justify-center"
        >
          <div
            ref={certRef}
            id="printable-certificate-sheet"
            className="bg-white text-slate-900 shadow-2xl border-[6px] border-double border-amber-900/80 p-8 sm:p-10 font-serif relative shrink-0 flex flex-col justify-between"
            style={{
              width: `${CERT_DESIGN_WIDTH}px`,
              minHeight: `${CERT_DESIGN_HEIGHT}px`,
              height: `${CERT_DESIGN_HEIGHT}px`,
              zoom: previewZoom,
              boxSizing: 'border-box',
            }}
          >
            {/* Watermark Logo in Background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none">
              <img
                src="/logo.jpg"
                alt="Official Watermark"
                className="w-[420px] h-[420px] object-contain grayscale"
              />
            </div>

            {/* TOP SECTION: Republic of the Philippines Letterhead */}
            <div className="relative z-10">
              <header className="flex items-center justify-between border-b-2 border-amber-900/70 pb-4 mb-5 text-center">
                {/* Left Municipal / Barangay Seal (preserving /logo.jpg) */}
                <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                  <img
                    src="/logo.jpg"
                    alt="Barangay Logo"
                    className="w-20 h-20 object-contain rounded-full shadow-sm border-2 border-amber-900/40 p-0.5 bg-white"
                  />
                </div>

                {/* Center Official Letterhead Text */}
                <div className="flex-1 px-4 space-y-0.5">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-slate-600 font-sans font-bold">
                    Republic of the Philippines
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-700 font-sans font-semibold">
                    Province of Cavite • Municipality of Indang
                  </p>
                  <h1 className="text-2xl font-black tracking-wider text-amber-950 uppercase font-sans pt-1">
                    {barangayTitle}
                  </h1>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <div className="h-[1px] w-12 bg-amber-900/40" />
                    <p className="text-[11px] font-black tracking-[0.2em] text-amber-900 uppercase font-sans">
                      OFFICE OF THE PUNONG BARANGAY
                    </p>
                    <div className="h-[1px] w-12 bg-amber-900/40" />
                  </div>
                </div>

                {/* Right Official Municipal Dry Seal Crest */}
                <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-amber-900/60 flex flex-col items-center justify-center p-1 text-amber-900 bg-amber-50/40 shadow-xs">
                    <svg className="w-10 h-10 text-amber-800" viewBox="0 0 100 100" fill="currentColor">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" />
                      <circle cx="50" cy="50" r="39" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
                      <polygon points="50,16 60,36 82,39 66,55 70,77 50,66 30,77 34,55 18,39 40,36" fill="currentColor" opacity="0.9" />
                      <circle cx="50" cy="48" r="8" fill="white" />
                      <circle cx="50" cy="48" r="4" fill="currentColor" />
                    </svg>
                    <span className="text-[7px] font-sans font-black tracking-wider uppercase text-amber-950 mt-0.5">
                      SEAL OF INDANG
                    </span>
                  </div>
                </div>
              </header>

              {/* Document Title with Classical Civic Accents */}
              <div className="text-center my-6">
                <div className="inline-block relative">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-[0.12em] font-sans uppercase px-6 pb-2">
                    {docTitle}
                  </h2>
                  <div className="h-[3px] bg-amber-900 w-3/4 mx-auto rounded-full" />
                  <div className="h-[1px] bg-amber-700/50 w-full mx-auto mt-1" />
                </div>
              </div>
            </div>

            {/* MIDDLE SECTION: Salutation & Official Certification Body */}
            <div className="space-y-6 text-base sm:text-[17px] text-slate-900 leading-[1.8] relative z-10 my-auto py-2">
              <p className="font-black text-slate-950 font-sans text-base tracking-wider uppercase">
                TO WHOM IT MAY CONCERN:
              </p>

              {renderBodyContent()}

              {request.purpose && (
                <p className="text-justify indent-12 leading-relaxed">
                  Issued upon the official request of the interested party for the specific purpose of:{' '}
                  <span className="font-bold italic text-slate-950 uppercase">{request.purpose}</span>.
                </p>
              )}

              <p className="text-justify indent-12 leading-relaxed pt-2">
                Given and signed this <span className="font-bold text-slate-950">{fullDateFormatted}</span> at the Office of the Punong Barangay, {barangayTitle}, Indang, Cavite, Philippines.
              </p>
            </div>

            {/* BOTTOM SECTION: Signatories, Dry Seal Area & Verifiable QR Footer */}
            <div className="relative z-10 pt-4">
              {/* Signatures Grid */}
              <div className="grid grid-cols-2 gap-12 pb-6 font-sans text-sm">
                {/* Left — Barangay Secretary */}
                <div className="space-y-1 text-left">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Prepared &amp; Certified by:
                  </p>
                  <div className="h-12 flex items-end">
                    <span className="font-serif italic text-slate-400 text-xs select-none opacity-0">
                      [ Signature ]
                    </span>
                  </div>
                  <p className="font-bold text-slate-950 border-t-2 border-slate-900 pt-1.5 inline-block min-w-[220px] uppercase tracking-wide text-sm">
                    {secretaryName}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">Barangay Secretary</p>
                </div>

                {/* Right — Punong Barangay */}
                <div className="space-y-1 text-right">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Approved &amp; Issued by:
                  </p>
                  <div className="h-12 flex items-end justify-end">
                    <span className="font-serif italic text-slate-400 text-xs select-none opacity-0">
                      [ Signature ]
                    </span>
                  </div>
                  <p className="font-bold text-slate-950 border-t-2 border-slate-900 pt-1.5 inline-block min-w-[220px] uppercase tracking-wide text-sm">
                    {captainName}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">Punong Barangay</p>
                </div>
              </div>

              {/* Dry Seal Badge & Verifiable QR Footer */}
              <footer className="border-t-2 border-amber-900/60 pt-3 flex items-center justify-between text-xs text-slate-700 font-sans">
                {/* Left: Dry Seal Badge & Security Info */}
                <div className="flex items-center gap-3">
                  {/* Embossed Dry Seal Area */}
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-800/80 bg-amber-50/50 flex flex-col items-center justify-center p-1 text-center text-amber-950 shrink-0 shadow-inner">
                    <Award className="h-4 w-4 text-amber-800 mb-0.5" />
                    <span className="text-[7px] font-black uppercase tracking-tighter leading-none">
                      OFFICIAL DRY SEAL
                    </span>
                    <span className="text-[6px] text-amber-800 font-semibold leading-tight">
                      BARANGAY DAINE
                    </span>
                  </div>

                  <div className="space-y-0.5 text-left">
                    <p className="font-bold text-slate-900 tracking-wide text-[11px]">
                      {barangayTitle} OFFICIAL CERTIFICATE
                    </p>
                    <p className="font-mono text-slate-800 text-[11px]">
                      Control No.: <span className="font-bold text-amber-950">{controlNo}</span>
                    </p>
                    <p className="text-[9px] text-slate-500 italic">
                      * Not valid without official embossed barangay dry seal.
                    </p>
                  </div>
                </div>

                {/* Right: Verifiable QR Code Stamp */}
                <div className="flex items-center gap-2.5 bg-white p-1.5 rounded-lg border border-amber-900/30 shadow-xs">
                  <img
                    src={qrUrl}
                    alt={`QR Code ${controlNo}`}
                    className="w-14 h-14 border border-slate-200 rounded p-0.5 shrink-0"
                  />
                  <div className="text-[9px] space-y-0.5 text-slate-600 hidden sm:block text-left">
                    <p className="font-black text-slate-900 uppercase flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      Scan to Verify
                    </p>
                    <p className="text-slate-500">Civic Registry Authenticated</p>
                    <p className="font-mono text-[8px] text-slate-400">ag-brgy-connect</p>
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
