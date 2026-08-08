import { Dialog, DialogContent, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Printer, Download, FileCheck } from 'lucide-react'
import { format } from 'date-fns'

export interface DocumentRequest {
  id: string
  document_type: string
  purpose?: string
  resident_name: string
  created_at: string
  status: string
  notes?: string
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

export function CertificatePrintModal({ open, onOpenChange, request }: CertificatePrintModalProps) {
  if (!request) return null

  const handlePrint = () => {
    window.print()
  }

  const docTitle = DOCUMENT_TITLES[request.document_type] || 'BARANGAY CERTIFICATION'
  const controlNo = `BD-${request.id.slice(0, 8).toUpperCase()}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://ag-brgy-connect.vercel.app/verify/' + request.id)}`

  const dateObj = request.created_at ? new Date(request.created_at) : new Date()
  const dateFormatted = format(dateObj, "do 'day of' MMMM, yyyy")

  const getBodyContent = () => {
    switch (request.document_type) {
      case 'barangay_clearance':
        return (
          <>
            <p className="text-justify indent-8 leading-relaxed">
              This is to certify that <span className="font-bold underline uppercase">{request.resident_name}</span>, of legal age, is a bona fide resident of Barangay Daine, Indang, Cavite.
            </p>
            <p className="text-justify indent-8 leading-relaxed mt-4">
              Based on the official records of this office, the above-named individual is known to be a person of good moral character, a law-abiding citizen in the community, and has NO DEROGATORY RECORD on file.
            </p>
          </>
        )
      case 'certificate_of_indigency':
        return (
          <>
            <p className="text-justify indent-8 leading-relaxed">
              This is to certify that <span className="font-bold underline uppercase">{request.resident_name}</span>, of legal age, is a bona fide resident of Barangay Daine, Indang, Cavite.
            </p>
            <p className="text-justify indent-8 leading-relaxed mt-4">
              This further certifies that the aforementioned resident belongs to a low-income / indigent family in this barangay and is hereby eligible for financial, medical, educational, or legal assistance.
            </p>
          </>
        )
      case 'certificate_of_residency':
        return (
          <>
            <p className="text-justify indent-8 leading-relaxed">
              This is to certify that <span className="font-bold underline uppercase">{request.resident_name}</span>, of legal age, is a bona fide resident of Barangay Daine, Indang, Cavite, residing at the specified address within our territorial jurisdiction.
            </p>
            <p className="text-justify indent-8 leading-relaxed mt-4">
              This certification confirms that the subject individual has been continuously residing in this barangay and maintains good standing as a community member.
            </p>
          </>
        )
      case 'business_permit':
        return (
          <>
            <p className="text-justify indent-8 leading-relaxed">
              This is to certify that Barangay Business Clearance & Clearance Permit is hereby granted to <span className="font-bold underline uppercase">{request.resident_name}</span> for operating a business establishment within the territorial jurisdiction of Barangay Daine, Indang, Cavite.
            </p>
            <p className="text-justify indent-8 leading-relaxed mt-4">
              The owner/proprietor has complied with the local barangay rules, safety standard assessments, and municipal ordinances pertinent to commercial operations in this community.
            </p>
          </>
        )
      default:
        return (
          <p className="text-justify indent-8 leading-relaxed">
            This is to certify that <span className="font-bold underline uppercase">{request.resident_name}</span>, of legal age, is a bona fide resident of Barangay Daine, Indang, Cavite, Philippines.
          </p>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 print:p-0 print:max-w-none print:shadow-none print:border-none print:overflow-visible">
        {/* Screen Header Controls */}
        <div className="print-hide flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b mb-4">
          <DialogHeader className="p-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FileCheck className="h-5 w-5 text-primary" />
              Official Barangay Document Preview
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="gap-2 font-semibold min-h-[40px]">
              <Printer className="h-4 w-4" />
              Print Certificate / Save PDF
            </Button>
          </div>
        </div>

        {/* Printable Document Sheet Container */}
        <div className="bg-slate-100 p-2 sm:p-4 rounded-lg print:p-0 print:bg-transparent">
          <div
            id="printable-certificate-sheet"
            className="mx-auto bg-white text-slate-900 shadow-lg print:shadow-none border-4 border-double border-amber-800/80 p-8 sm:p-12 max-w-[800px] font-serif relative print:w-full print:max-w-none print:m-0 print:border-4"
          >
            {/* Background Watermark Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
              <img src="/logo.jpg" alt="Watermark" className="w-96 h-96 object-contain grayscale" />
            </div>

            {/* Document Header */}
            <header className="flex items-center justify-between border-b-2 border-amber-900/60 pb-6 mb-8 text-center relative z-10">
              {/* Left Logo */}
              <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                <img
                  src="/logo.jpg"
                  alt="Barangay Logo"
                  className="w-20 h-20 object-contain rounded-full shadow-sm border border-amber-700/30"
                />
              </div>

              {/* Center Text Header */}
              <div className="flex-1 px-4 space-y-1">
                <p className="text-xs uppercase tracking-widest text-slate-600 font-sans font-medium">Republic of the Philippines</p>
                <p className="text-xs uppercase tracking-wider text-slate-700 font-sans font-semibold">Province of Cavite</p>
                <p className="text-xs uppercase tracking-wider text-slate-700 font-sans font-semibold">Municipality of Indang</p>
                <h1 className="text-2xl font-black tracking-wider text-amber-900 uppercase font-sans mt-1">BARANGAY DAINE</h1>
                <p className="text-xs font-bold tracking-widest text-slate-800 uppercase font-sans border-t border-amber-800/20 pt-1 mt-1">
                  OFFICE OF THE PUNONG BARANGAY
                </p>
              </div>

              {/* Right Coat of Arms / Official Seal */}
              <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 text-amber-800" viewBox="0 0 100 100" fill="currentColor">
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
            <div className="text-center my-8 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-wider font-sans underline decoration-amber-800 decoration-2 underline-offset-8">
                {docTitle}
              </h2>
            </div>

            {/* Salutation & Body */}
            <div className="space-y-6 text-base sm:text-lg text-slate-800 leading-relaxed relative z-10 my-8">
              <p className="font-bold text-slate-900 font-sans text-lg">TO WHOM IT MAY CONCERN:</p>

              {getBodyContent()}

              {request.purpose && (
                <p className="text-justify indent-8 leading-relaxed">
                  Issued upon the verbal/written request of the interested party for the purpose of:{' '}
                  <span className="font-semibold italic text-slate-900">{request.purpose}</span>.
                </p>
              )}

              <p className="text-justify indent-8 leading-relaxed pt-2">
                Given this <span className="font-bold text-slate-900">{dateFormatted}</span> at Barangay Daine, Indang, Cavite, Philippines.
              </p>
            </div>

            {/* Signatures Section */}
            <div className="grid grid-cols-2 gap-8 pt-16 pb-8 relative z-10 font-sans text-sm">
              {/* Left Signature - Barangay Secretary */}
              <div className="space-y-1 text-left">
                <p className="text-xs text-slate-500 font-medium">Prepared by:</p>
                <div className="h-12 flex items-end">
                  <span className="font-serif italic text-slate-400 text-xs">[ Signature ]</span>
                </div>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[180px] uppercase">
                  HON. SECRETARY
                </p>
                <p className="text-xs text-slate-600 font-medium">Barangay Secretary</p>
              </div>

              {/* Right Signature - Barangay Captain */}
              <div className="space-y-1 text-right">
                <p className="text-xs text-slate-500 font-medium">Approved by:</p>
                <div className="h-12 flex items-end justify-end">
                  <span className="font-serif italic text-slate-400 text-xs">[ Signature ]</span>
                </div>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[180px] uppercase">
                  HON. PUNONG BARANGAY
                </p>
                <p className="text-xs text-slate-600 font-medium">Barangay Captain</p>
              </div>
            </div>

            {/* Footer Verification & QR Code */}
            <footer className="border-t border-amber-900/30 pt-4 mt-8 flex items-center justify-between text-xs text-slate-600 font-sans relative z-10">
              <div className="space-y-1">
                <p className="font-semibold text-slate-800">BARANGAY DAINE OFFICIAL CERTIFICATE</p>
                <p className="font-mono text-slate-700">Control No.: <span className="font-bold text-amber-900">{controlNo}</span></p>
                <p className="text-[10px] text-slate-500">Not valid without official dry seal.</p>
              </div>

              {/* QR Code */}
              <div className="flex items-center gap-2">
                <img
                  src={qrUrl}
                  alt={`QR Code ${controlNo}`}
                  className="w-16 h-16 border border-slate-300 rounded p-0.5 bg-white"
                />
              </div>
            </footer>
          </div>
        </div>

        {/* Global Print Stylesheet */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-certificate-sheet, #printable-certificate-sheet * {
              visibility: visible !important;
            }
            #printable-certificate-sheet {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 40px !important;
              background: white !important;
              color: black !important;
              box-shadow: none !important;
              border: 4px double #78350f !important;
              z-index: 999999 !important;
            }
            .print-hide {
              display: none !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
