import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useState, useMemo, useRef } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  ShieldAlert,
  Search,
  Filter,
  User,
  Gavel,
  Scale,
  Calendar,
  Clock,
  MapPin,
  Printer,
  Copy,
  Check,
  Send,
  RefreshCw,
  EyeOff,
  UserCheck,
  Building2,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Layers,
  BookOpen,
  PlusCircle,
  FileCheck2,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Label } from '#/components/ui/label'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { ScrollArea } from '#/components/ui/scroll-area'

const STATUSES = ['pending', 'investigating', 'scheduled_hearing', 'resolved', 'dismissed'] as const
type ComplaintStatus = (typeof STATUSES)[number]

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
type ComplaintPriority = (typeof PRIORITIES)[number]

const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; badge: string; dot: string; icon: typeof Clock }
> = {
  pending: {
    label: 'Pending Summon',
    badge:
      'bg-amber-100 text-amber-950 border-amber-400 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700 font-bold',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  investigating: {
    label: 'Under Investigation',
    badge:
      'bg-blue-100 text-blue-950 border-blue-400 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-700 font-bold',
    dot: 'bg-blue-500',
    icon: Search,
  },
  scheduled_hearing: {
    label: 'Mediation Scheduled',
    badge:
      'bg-purple-100 text-purple-950 border-purple-400 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-700 font-bold',
    dot: 'bg-purple-600',
    icon: Gavel,
  },
  resolved: {
    label: 'Settled',
    badge:
      'bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-700 font-bold',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  dismissed: {
    label: 'Escalated to Court',
    badge:
      'bg-rose-100 text-rose-950 border-rose-400 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-700 font-bold',
    dot: 'bg-rose-500',
    icon: Scale,
  },
}

const PRIORITY_CONFIG: Record<ComplaintPriority, { label: string; badge: string }> = {
  low: {
    label: 'Low',
    badge:
      'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
  },
  medium: {
    label: 'Medium',
    badge:
      'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800',
  },
  high: {
    label: 'High',
    badge:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
  },
  urgent: {
    label: 'Urgent',
    badge:
      'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800 animate-pulse font-bold',
  },
}

const getAdminComplaints = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase
    .from('user_roles')
    .select('barangay')
    .eq('user_id', user.id)
    .single()
  const adminScope = profile?.barangay || 'daine_1'

  let query = supabase
    .from('complaints')
    .select('id, complainant_id, is_anonymous, title, category, description, location, incident_date, status, priority, photo_url, admin_notes, barangay, created_at, updated_at, profiles(full_name, phone, address, email)')
    .order('created_at', { ascending: false })

  if (adminScope !== 'both') {
    query = query.eq('barangay', adminScope)
  }

  const { data, error } = await query
  if (error) {
    let fallbackQuery = supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })
    if (adminScope !== 'both') fallbackQuery = fallbackQuery.eq('barangay', adminScope)
    const [{ data: cmps }, { data: profs }] = await Promise.all([
      fallbackQuery,
      supabase.from('profiles').select('id, full_name, phone, address, email'),
    ])
    const profMap = new Map((profs ?? []).map((p) => [p.id, p]))
    const mapped = (cmps ?? []).map((c) => ({
      ...c,
      profiles: profMap.get(c.complainant_id) ?? null,
    }))
    return { complaints: mapped, adminScope }
  }
  return { complaints: data, adminScope }
})

const updateComplaintStatus = createServerFn({ method: 'POST' })
  .validator((data: unknown) =>
    z
      .object({
        id: z.string(),
        status: z.enum(['pending', 'investigating', 'scheduled_hearing', 'resolved', 'dismissed']),
        priority: z.enum(['low', 'medium', 'high', 'urgent']),
        admin_notes: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from('complaints')
      .update({
        status: data.status,
        priority: data.priority,
        admin_notes: data.admin_notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)

    if (error) throw error
    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/complaints')({
  component: AdminComplaintsRoute,
  loader: async () => {
    return await getAdminComplaints()
  },
})

type ComplaintItem = Awaited<ReturnType<typeof getAdminComplaints>>['complaints'][number]

function CopyDocketCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success(`Docket No. copied: ${code}`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Click to copy docket reference"
      className="group inline-flex items-center gap-1 px-2 py-1 rounded bg-muted/80 hover:bg-muted text-foreground font-mono text-xs font-bold border border-border transition-colors cursor-pointer select-all"
    >
      <span>{code}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground shrink-0 opacity-60 group-hover:opacity-100" />
      )}
    </button>
  )
}

function HighContrastStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as ComplaintStatus] || {
    label: status.replace(/_/g, ' '),
    badge: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-slate-400',
    icon: Clock,
  }
  const Icon = cfg.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap shadow-2xs ${cfg.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${cfg.dot} animate-pulse shrink-0`} />
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  )
}

function PriorityBadgeDisplay({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority as ComplaintPriority] || {
    label: priority,
    badge: 'bg-muted text-muted-foreground border-border',
  }
  return (
    <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 ${cfg.badge}`}>
      {cfg.label}
    </Badge>
  )
}

function JurisdictionBadge({ barangay }: { barangay?: string }) {
  if (barangay === 'daine_2') {
    return (
      <Badge
        variant="outline"
        className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
      >
        Daine 2
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="text-[11px] font-bold text-blue-700 bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
    >
      Daine 1
    </Badge>
  )
}

// -------------------------------------------------------------
// SUMMONS NOTICE MODAL (KP Form 9 / Patawag Generator)
// -------------------------------------------------------------
interface SummonsModalProps {
  complaint: ComplaintItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SummonsModal({ complaint, open, onOpenChange }: SummonsModalProps) {
  const [respondentName, setRespondentName] = useState('Respondent / Concerned Party')
  const [hearingDate, setHearingDate] = useState(
    format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  )
  const [hearingTime, setHearingTime] = useState('09:30 AM')
  const [venue, setVenue] = useState('Barangay Hall Lupon Session Room')
  const [presiding, setPresiding] = useState('Hon. Punong Barangay / Lupon Chairman')

  if (!complaint) return null

  const docketNumber = `BLOTTER-${complaint.barangay === 'daine_2' ? 'D2' : 'D1'}-${complaint.id.slice(0, 8).toUpperCase()}`
  const complainantName = complaint.is_anonymous
    ? 'Verified Citizen (Anonymous / Confidential Record)'
    : complaint.profiles?.full_name || 'Complainant'

  const barangayTitle =
    complaint.barangay === 'daine_2' ? 'BARANGAY DAINE 2' : 'BARANGAY DAINE 1'

  const formattedHearingDate = hearingDate
    ? format(new Date(hearingDate), 'EEEE, MMMM d, yyyy')
    : 'Upcoming Scheduled Date'

  const handlePrintSummons = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to print the Summons Notice.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KP Form 9 - Summons (${docketNumber})</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm; }
          body { font-family: 'Times New Roman', Times, serif; color: #0f172a; line-height: 1.6; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .header h4 { margin: 2px 0; text-transform: uppercase; font-size: 13px; font-weight: normal; letter-spacing: 1px; }
          .header h2 { margin: 6px 0 2px; font-size: 20px; font-weight: bold; text-transform: uppercase; }
          .header h3 { margin: 2px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; }
          .docket-box { margin-bottom: 20px; font-family: monospace; font-size: 13px; border: 1px solid #94a3b8; padding: 8px 12px; background: #f8fafc; display: flex; justify-content: space-between; }
          .title { text-align: center; margin: 25px 0 20px; font-size: 22px; font-weight: bold; text-transform: uppercase; text-decoration: underline; letter-spacing: 2px; }
          .parties { margin: 20px 0; font-size: 14px; line-height: 1.8; }
          .parties strong { font-size: 15px; }
          .body-text { text-align: justify; text-indent: 40px; margin: 15px 0; font-size: 15px; line-height: 1.8; }
          .warning { margin: 25px 0; padding: 12px 16px; border: 2px dashed #b91c1c; background: #fef2f2; font-size: 13px; text-align: justify; }
          .signatures { margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sig-box { width: 45%; text-align: center; }
          .sig-line { border-top: 1.5px solid #0f172a; margin-top: 50px; padding-top: 5px; font-weight: bold; text-transform: uppercase; font-size: 14px; }
          .sig-role { font-size: 12px; color: #475569; }
          .footer-dry-seal { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 11px; color: #64748b; text-align: center; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <h4>Republic of the Philippines</h4>
          <h4>Province of Cavite • Municipality of Indang</h4>
          <h2>${barangayTitle}</h2>
          <h3>OFFICE OF THE LUPONG TAGAPAMAYAPA</h3>
        </div>

        <div class="docket-box">
          <div><strong>KP CASE DOCKET NO.:</strong> ${docketNumber}</div>
          <div><strong>NATURE:</strong> ${complaint.category.toUpperCase()}</div>
        </div>

        <div class="parties">
          <div><strong>COMPLAINANT:</strong> ${complainantName}</div>
          <div style="margin-left: 30px; font-style: italic; font-size: 12px;">— AGAINST —</div>
          <div><strong>RESPONDENT:</strong> ${respondentName}</div>
        </div>

        <div class="title">SUMMONS (PATAWAG)</div>

        <p class="body-text">
          <strong>TO:</strong> <span style="text-decoration: underline; font-weight: bold;">${respondentName}</span>
        </p>

        <p class="body-text">
          You are hereby strictly summoned and required to appear in person before the <strong>${presiding}</strong> at the <strong>${venue}</strong>, ${barangayTitle}, Municipality of Indang, Cavite on:
        </p>

        <div style="text-align: center; margin: 20px auto; padding: 12px 20px; border: 1.5px solid #0f172a; width: 80%; background: #f8fafc;">
          <div style="font-size: 17px; font-weight: bold; text-transform: uppercase;">${formattedHearingDate}</div>
          <div style="font-size: 15px; font-weight: bold; color: #1e3a8a;">EXACT TIME: ${hearingTime}</div>
          <div style="font-size: 13px; color: #334155; margin-top: 4px;">Venue: ${venue}</div>
        </div>

        <p class="body-text">
          This conciliation and mediation session is called to settle amicably the formal complaint filed regarding: <em>"${complaint.title}"</em>.
        </p>

        <div class="warning">
          <strong>LEGAL WARNING:</strong> Pursuant to Section 415 and Section 515 of Republic Act No. 7160 (The Local Government Code of 1991), willful failure or refusal to appear in response to this summons shall be considered indirect contempt of court and may bar you from filing any counterclaim or court defense arising from this complaint. Lawyers are strictly prohibited from appearing during Katarungang Pambarangay conciliation proceedings.
        </div>

        <p class="body-text">
          Issued this ${format(new Date(), 'do')} day of ${format(new Date(), 'MMMM, yyyy')} at ${barangayTitle}, Indang, Cavite, Philippines.
        </p>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-line">MR. ARNOLD P. CRUZ</div>
            <div class="sig-role">Lupon Secretary</div>
          </div>
          <div class="sig-box">
            <div class="sig-line">HON. PUNONG BARANGAY</div>
            <div class="sig-role">Lupon Chairman / Presiding Mediator</div>
          </div>
        </div>

        <div class="footer-dry-seal">
          Official Katarungang Pambarangay Form 9 • Not valid without the official embossed Barangay Dry Seal
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 500)
  }

  const copySummonsText = () => {
    const text = `REPUBLIC OF THE PHILIPPINES
Province of Cavite • Municipality of Indang
${barangayTitle}
OFFICE OF THE LUPONG TAGAPAMAYAPA

KP CASE DOCKET: ${docketNumber}
COMPLAINANT: ${complainantName}
RESPONDENT: ${respondentName}

SUMMONS (PATAWAG)
To: ${respondentName}

You are hereby summoned to appear before the ${presiding} at the ${venue} on ${formattedHearingDate} at ${hearingTime} for the mediation and conciliation of "${complaint.title}".

Under Republic Act No. 7160, failure to appear may result in legal sanctions for indirect contempt.`

    navigator.clipboard.writeText(text)
    toast.success('Summons notice text copied to clipboard!')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              <Gavel className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">
                KP Form 9: Official Summons Notice (Patawag)
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">
                {docketNumber} • Katarungang Pambarangay (R.A. 7160)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Customization Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs">
            <div>
              <Label className="text-xs font-bold mb-1 block">Respondent Name</Label>
              <Input
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder="Enter Respondent / Opposing Party..."
                className="min-h-[40px] text-xs bg-background"
              />
            </div>

            <div>
              <Label className="text-xs font-bold mb-1 block">Hearing Date</Label>
              <Input
                type="date"
                value={hearingDate}
                onChange={(e) => setHearingDate(e.target.value)}
                className="min-h-[40px] text-xs bg-background"
              />
            </div>

            <div>
              <Label className="text-xs font-bold mb-1 block">Hearing Time</Label>
              <Select value={hearingTime} onValueChange={setHearingTime}>
                <SelectTrigger className="min-h-[40px] text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:30 AM">08:30 AM (Morning Session 1)</SelectItem>
                  <SelectItem value="09:30 AM">09:30 AM (Morning Session 2)</SelectItem>
                  <SelectItem value="10:30 AM">10:30 AM (Morning Session 3)</SelectItem>
                  <SelectItem value="01:30 PM">01:30 PM (Afternoon Session 1)</SelectItem>
                  <SelectItem value="02:30 PM">02:30 PM (Afternoon Session 2)</SelectItem>
                  <SelectItem value="03:30 PM">03:30 PM (Afternoon Session 3)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold mb-1 block">Venue</Label>
              <Select value={venue} onValueChange={setVenue}>
                <SelectTrigger className="min-h-[40px] text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Barangay Hall Lupon Session Room">
                    Barangay Hall Lupon Session Room
                  </SelectItem>
                  <SelectItem value="Barangay Multi-Purpose Hall">
                    Barangay Multi-Purpose Hall
                  </SelectItem>
                  <SelectItem value="Office of the Punong Barangay">
                    Office of the Punong Barangay
                  </SelectItem>
                  <SelectItem value="Peace & Order Committee Room">
                    Peace & Order Committee Room
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summons Document Preview Box */}
          <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-card p-5 space-y-4 font-serif text-xs text-foreground shadow-inner">
            <div className="text-center border-b border-border/80 pb-3 space-y-0.5">
              <p className="uppercase text-[10px] tracking-widest text-muted-foreground font-sans font-bold">
                Republic of the Philippines • Province of Cavite • Municipality of Indang
              </p>
              <p className="font-sans font-black text-sm uppercase text-purple-950 dark:text-purple-300">
                {barangayTitle}
              </p>
              <p className="text-[10px] font-sans font-bold tracking-wider text-muted-foreground uppercase">
                OFFICE OF THE LUPONG TAGAPAMAYAPA
              </p>
            </div>

            <div className="flex justify-between font-mono text-[11px] bg-muted/50 p-2 rounded border">
              <span>CASE: {docketNumber}</span>
              <span className="font-bold">{complaint.category}</span>
            </div>

            <div className="space-y-1">
              <p>
                <strong>Complainant:</strong> {complainantName}
              </p>
              <p>
                <strong>Respondent:</strong>{' '}
                <span className="font-bold text-foreground">{respondentName}</span>
              </p>
            </div>

            <div className="text-center font-sans font-black text-sm uppercase tracking-widest text-primary border-y py-1">
              SUMMONS (PATAWAG)
            </div>

            <p className="leading-relaxed text-justify">
              You are hereby strictly summoned to appear in person before the <strong>{presiding}</strong> at the{' '}
              <strong>{venue}</strong> on{' '}
              <span className="font-bold text-primary">{formattedHearingDate}</span> at{' '}
              <span className="font-bold text-primary">{hearingTime}</span> for the mediation and conciliation of
              the complaint: <em>"{complaint.title}"</em>.
            </p>

            <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-900 dark:text-rose-200">
              <strong>Warning:</strong> Failure or refusal to appear shall be dealt with under Sec. 515 of RA 7160
              (indirect contempt of court).
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 sm:pt-0">
          <Button
            variant="outline"
            type="button"
            onClick={copySummonsText}
            className="min-h-[44px] px-4 font-semibold text-xs gap-1.5 touch-target cursor-pointer"
          >
            <Copy className="h-4 w-4" />
            Copy Text
          </Button>

          <Button
            type="button"
            onClick={handlePrintSummons}
            className="min-h-[44px] px-6 font-bold text-xs gap-2 bg-purple-700 hover:bg-purple-800 text-white btn-tactile touch-target cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Print Official Summons (KP-9)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// -------------------------------------------------------------
// MEDIATION HEARING SCHEDULER MODAL
// -------------------------------------------------------------
interface HearingSchedulerModalProps {
  complaint: ComplaintItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function HearingSchedulerModal({
  complaint,
  open,
  onOpenChange,
  onSuccess,
}: HearingSchedulerModalProps) {
  const [hearingRound, setHearingRound] = useState('1st Mediation Hearing (Punong Barangay)')
  const [hearingDate, setHearingDate] = useState(
    format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  )
  const [hearingTime, setHearingTime] = useState('09:30 AM')
  const [venue, setVenue] = useState('Barangay Hall Lupon Session Room')
  const [presiding, setPresiding] = useState('Punong Barangay & Lupon Tagapamayapa')
  const [instructions, setInstructions] = useState(
    'Both parties must bring valid IDs and pertinent evidence. Lawyers are not permitted pursuant to Sec. 415 RA 7160.'
  )
  const [loading, setLoading] = useState(false)

  if (!complaint) return null

  const handleSchedule = async () => {
    setLoading(true)
    try {
      const scheduleEntry = `[${format(new Date(), 'yyyy-MM-dd HH:mm')}] HEARING SCHEDULED: ${hearingRound} on ${format(new Date(hearingDate), 'MMM d, yyyy')} at ${hearingTime} | Venue: ${venue} | Presiding: ${presiding}. Remarks: ${instructions}`

      const updatedNotes = complaint.admin_notes
        ? `${scheduleEntry}\n\n${complaint.admin_notes}`
        : scheduleEntry

      await updateComplaintStatus({
        data: {
          id: complaint.id,
          status: 'scheduled_hearing',
          priority: complaint.priority as ComplaintPriority,
          admin_notes: updatedNotes,
        },
      })

      toast.success(
        `Mediation hearing scheduled for ${format(new Date(hearingDate), 'MMM d, yyyy')} at ${hearingTime}`
      )
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to schedule mediation hearing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              <Calendar className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">Schedule Mediation Hearing</DialogTitle>
              <DialogDescription className="font-mono text-xs">
                BLOTTER-{complaint.barangay === 'daine_2' ? 'D2' : 'D1'}-{complaint.id.slice(0, 8).toUpperCase()} • {complaint.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div>
            <Label className="text-xs font-bold mb-1.5 block">Hearing Round / Stage</Label>
            <Select value={hearingRound} onValueChange={setHearingRound}>
              <SelectTrigger className="min-h-[44px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st Mediation Hearing (Punong Barangay)">
                  1st Mediation Hearing (Punong Barangay)
                </SelectItem>
                <SelectItem value="2nd Hearing (Pangkat Tagapagkasundo)">
                  2nd Hearing (Pangkat Tagapagkasundo Conciliation)
                </SelectItem>
                <SelectItem value="3rd Hearing (Final Conciliation)">
                  3rd Hearing (Final Conciliation Session)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold mb-1.5 block">Hearing Date</Label>
              <Input
                type="date"
                value={hearingDate}
                onChange={(e) => setHearingDate(e.target.value)}
                className="min-h-[44px] text-sm bg-background"
              />
            </div>
            <div>
              <Label className="text-xs font-bold mb-1.5 block">Time Slot</Label>
              <Select value={hearingTime} onValueChange={setHearingTime}>
                <SelectTrigger className="min-h-[44px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:30 AM">08:30 AM</SelectItem>
                  <SelectItem value="09:30 AM">09:30 AM</SelectItem>
                  <SelectItem value="10:30 AM">10:30 AM</SelectItem>
                  <SelectItem value="01:30 PM">01:30 PM</SelectItem>
                  <SelectItem value="02:30 PM">02:30 PM</SelectItem>
                  <SelectItem value="03:30 PM">03:30 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold mb-1.5 block">Venue / Session Room</Label>
            <Select value={venue} onValueChange={setVenue}>
              <SelectTrigger className="min-h-[44px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Barangay Hall Lupon Session Room">
                  Barangay Hall Lupon Session Room (Room 1)
                </SelectItem>
                <SelectItem value="Barangay Multi-Purpose Hall">
                  Barangay Multi-Purpose Hall
                </SelectItem>
                <SelectItem value="Office of the Punong Barangay">
                  Office of the Punong Barangay
                </SelectItem>
                <SelectItem value="Peace & Order Committee Office">
                  Peace & Order Committee Office
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-bold mb-1.5 block">Presiding Lupon Officer</Label>
            <Input
              value={presiding}
              onChange={(e) => setPresiding(e.target.value)}
              className="min-h-[44px] text-sm bg-background"
            />
          </div>

          <div>
            <Label className="text-xs font-bold mb-1.5 block">Instructions & Notes</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[80px] text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 sm:pt-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] px-4 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={loading}
            className="min-h-[44px] px-6 font-bold bg-purple-700 hover:bg-purple-800 text-white btn-tactile cursor-pointer"
          >
            {loading ? 'Scheduling...' : 'Confirm Schedule & Set Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// -------------------------------------------------------------
// LUPON TAGAPAMAYAPA CASE NOTES & SETTLEMENT LOGGER MODAL
// -------------------------------------------------------------
interface CaseNotesLoggerModalProps {
  complaint: ComplaintItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function CaseNotesLoggerModal({
  complaint,
  open,
  onOpenChange,
  onSuccess,
}: CaseNotesLoggerModalProps) {
  const [newLogEntry, setNewLogEntry] = useState('')
  const [logType, setLogType] = useState('minutes')
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('investigating')
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority>('medium')
  const [loading, setLoading] = useState(false)

  // Init state
  const handleOpenInit = (nextOpen: boolean) => {
    if (nextOpen && complaint) {
      setSelectedStatus(complaint.status as ComplaintStatus)
      setSelectedPriority(complaint.priority as ComplaintPriority)
      setNewLogEntry('')
    }
    onOpenChange(nextOpen)
  }

  if (!complaint) return null

  const handleAddLogAndSave = async (autoStatus?: ComplaintStatus) => {
    setLoading(true)
    try {
      const targetStatus = autoStatus || selectedStatus
      let formattedHeader = ''

      if (logType === 'minutes') {
        formattedHeader = `[${format(new Date(), 'yyyy-MM-dd HH:mm')}] LUPON SESSION MINUTES:`
      } else if (logType === 'kasunduan') {
        formattedHeader = `[${format(new Date(), 'yyyy-MM-dd HH:mm')}] AMICABLE SETTLEMENT (KASUNDUAN) REACHED:`
      } else if (logType === 'cfa') {
        formattedHeader = `[${format(new Date(), 'yyyy-MM-dd HH:mm')}] CERTIFICATE TO FILE ACTION (CFA) ISSUED (Mediation Exhausted):`
      } else {
        formattedHeader = `[${format(new Date(), 'yyyy-MM-dd HH:mm')}] CASE NOTE:`
      }

      let updatedNotes = complaint.admin_notes || ''
      if (newLogEntry.trim()) {
        const fullEntry = `${formattedHeader}\n${newLogEntry.trim()}`
        updatedNotes = updatedNotes ? `${fullEntry}\n\n${updatedNotes}` : fullEntry
      }

      await updateComplaintStatus({
        data: {
          id: complaint.id,
          status: targetStatus,
          priority: selectedPriority,
          admin_notes: updatedNotes,
        },
      })

      toast.success('Lupon case notes and status updated successfully!')
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update case notes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenInit}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">
                Lupon Tagapamayapa Case Notes & Minutes Logger
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">
                BLOTTER-{complaint.barangay === 'daine_2' ? 'D2' : 'D1'}-{complaint.id.slice(0, 8).toUpperCase()} • {complaint.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Quick Action Preset Templates */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Log Type Preset
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'minutes', label: 'Session Minutes', icon: MessageSquare },
                { id: 'kasunduan', label: 'Kasunduan / Settled', icon: CheckCircle2 },
                { id: 'cfa', label: 'Issue CFA (Court)', icon: Scale },
                { id: 'general', label: 'General Note', icon: FileText },
              ].map((p) => {
                const Icon = p.icon
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setLogType(p.id)
                      if (p.id === 'kasunduan') {
                        setSelectedStatus('resolved')
                        setNewLogEntry(
                          'Both parties signed an Amicable Settlement (Kasunduan). The terms state that [Party 1] and [Party 2] agree to comply by [Date]. Case resolved under Katarungang Pambarangay.'
                        )
                      } else if (p.id === 'cfa') {
                        setSelectedStatus('dismissed')
                        setNewLogEntry(
                          'Conciliation failed after 3 scheduled sessions. Certificate to File Action (CFA) issued to Complainant for filing with the Municipal Trial Court.'
                        )
                      }
                    }}
                    className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1 min-h-[44px] transition-all cursor-pointer ${
                      logType === p.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background hover:bg-muted text-foreground border-border'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{p.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* New Entry Textarea */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              New Minutes / Blotter Log Entry
            </Label>
            <Textarea
              value={newLogEntry}
              onChange={(e) => setNewLogEntry(e.target.value)}
              placeholder="Record hearing proceedings, attendee statements, settlement terms, or mediator remarks..."
              className="min-h-[120px] text-sm resize-none"
            />
          </div>

          {/* Status & Priority Controls */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border">
            <div>
              <Label className="text-xs font-bold mb-1.5 block">Case Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(val) => setSelectedStatus(val as ComplaintStatus)}
              >
                <SelectTrigger className="min-h-[44px] text-xs font-semibold bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="min-h-[40px] text-xs font-medium">
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold mb-1.5 block">Priority Level</Label>
              <Select
                value={selectedPriority}
                onValueChange={(val) => setSelectedPriority(val as ComplaintPriority)}
              >
                <SelectTrigger className="min-h-[44px] text-xs font-semibold bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="min-h-[40px] text-xs font-medium capitalize">
                      {p} Priority
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Existing Case Log History */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Existing Blotter Log History
            </Label>
            <ScrollArea className="h-40 rounded-xl border bg-muted/40 p-3">
              {complaint.admin_notes ? (
                <p className="text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                  {complaint.admin_notes}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic py-6 text-center">
                  No historical case notes recorded yet.
                </p>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 sm:pt-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="min-h-[44px] px-4 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleAddLogAndSave()}
            disabled={loading}
            className="min-h-[44px] px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground btn-tactile cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save Log Entry & Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// -------------------------------------------------------------
// MAIN ADMIN COMPLAINTS ROUTE COMPONENT
// -------------------------------------------------------------
function AdminComplaintsRoute() {
  const { complaints, adminScope } = Route.useLoaderData()
  const router = useRouter()

  // Filter state
  const [activeTab, setActiveTab] = useState<string>('all')
  const [barangayFilter, setBarangayFilter] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Modals state
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null)
  const [summonsModalOpen, setSummonsModalOpen] = useState(false)
  const [schedulerModalOpen, setSchedulerModalOpen] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)

  // Fast 1-click status update
  const [isUpdatingFast, setIsUpdatingFast] = useState<string | null>(null)

  async function handleFastStatusUpdate(complaint: ComplaintItem, newStatus: ComplaintStatus) {
    setIsUpdatingFast(complaint.id)
    try {
      let defaultRemark = complaint.admin_notes || ''
      if (newStatus === 'scheduled_hearing' && !defaultRemark.includes('HEARING SCHEDULED')) {
        defaultRemark = `[${format(new Date(), 'yyyy-MM-dd HH:mm')}] Status moved to Mediation Scheduled. Summons notice issued.\n\n${defaultRemark}`
      } else if (newStatus === 'resolved' && !defaultRemark.includes('SETTLED')) {
        defaultRemark = `[${format(new Date(), 'yyyy-MM-dd HH:mm')}] Amicable Settlement (Kasunduan) logged. Case marked Settled.\n\n${defaultRemark}`
      }

      await updateComplaintStatus({
        data: {
          id: complaint.id,
          status: newStatus,
          priority: complaint.priority as ComplaintPriority,
          admin_notes: defaultRemark,
        },
      })

      toast.success(
        `Case BLOTTER-${complaint.barangay === 'daine_2' ? 'D2' : 'D1'}-${complaint.id.slice(0, 8).toUpperCase()} updated to "${STATUS_CONFIG[newStatus].label}"`
      )
      router.invalidate()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update complaint')
    } finally {
      setIsUpdatingFast(null)
    }
  }

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    const q = search.trim().toLowerCase()
    return complaints.filter((c: any) => {
      // Status filter
      if (activeTab !== 'all' && c.status !== activeTab) return false
      // Barangay jurisdiction filter
      if (adminScope === 'both' && barangayFilter !== 'all' && c.barangay !== barangayFilter) {
        return false
      }
      // Priority filter
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false

      // Search query (docket, title, complainant, category, location, description)
      if (q) {
        const docketNo = `blotter-${c.barangay === 'daine_2' ? 'd2' : 'd1'}-${c.id.slice(0, 8)}`.toLowerCase()
        const matchesDocket = docketNo.includes(q)
        const matchesTitle = c.title?.toLowerCase().includes(q)
        const matchesComplainant = c.profiles?.full_name?.toLowerCase().includes(q)
        const matchesCategory = c.category?.toLowerCase().includes(q)
        const matchesLocation = c.location?.toLowerCase().includes(q)
        const matchesDesc = c.description?.toLowerCase().includes(q)

        if (
          !matchesDocket &&
          !matchesTitle &&
          !matchesComplainant &&
          !matchesCategory &&
          !matchesLocation &&
          !matchesDesc
        ) {
          return false
        }
      }
      return true
    })
  }, [complaints, activeTab, barangayFilter, priorityFilter, search, adminScope])

  // Counts summary
  const counts = useMemo(() => {
    const base = complaints.filter((c: any) => {
      if (adminScope === 'both' && barangayFilter !== 'all' && c.barangay !== barangayFilter) {
        return false
      }
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false
      return true
    })
    const map: Record<string, number> = { all: base.length }
    STATUSES.forEach((s) => {
      map[s] = base.filter((c: any) => c.status === s).length
    })
    return map
  }, [complaints, barangayFilter, priorityFilter, adminScope])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                Blotter Case & Dispute Schedule Manager
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Katarungang Pambarangay dispute resolution docket, Summons (Patawag) notice generation, and Lupon hearing schedule management.
          </p>
        </div>

        {/* Scope & Refresh */}
        <div className="flex items-center gap-3 shrink-0">
          {adminScope !== 'both' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs font-semibold">
              <span className="text-muted-foreground">Jurisdiction:</span>
              <JurisdictionBadge barangay={adminScope} />
            </div>
          ) : (
            <Badge variant="secondary" className="text-xs px-3 py-1.5 gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Dual-Barangay Blotter Scope
            </Badge>
          )}

          <Button
            variant="outline"
            onClick={() => router.invalidate()}
            className="min-h-[44px] px-3.5 font-semibold text-xs gap-1.5 cursor-pointer touch-target"
            title="Refresh Blotter"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Case Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-border shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Blotter
            </span>
            <p className="text-2xl font-black text-foreground">{counts.all ?? 0}</p>
            <span className="text-[11px] text-muted-foreground">All logged dockets</span>
          </CardContent>
        </Card>

        <Card className="border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              Pending Summon
            </span>
            <p className="text-2xl font-black text-amber-950 dark:text-amber-200">{counts.pending ?? 0}</p>
            <span className="text-[11px] text-amber-800/80 dark:text-amber-400">Needs Patawag</span>
          </CardContent>
        </Card>

        <Card className="border-blue-300 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
              Investigating
            </span>
            <p className="text-2xl font-black text-blue-950 dark:text-blue-200">{counts.investigating ?? 0}</p>
            <span className="text-[11px] text-blue-800/80 dark:text-blue-400">Tanod / Lupon check</span>
          </CardContent>
        </Card>

        <Card className="border-purple-300 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
              Hearings Set
            </span>
            <p className="text-2xl font-black text-purple-950 dark:text-purple-200">
              {counts.scheduled_hearing ?? 0}
            </p>
            <span className="text-[11px] text-purple-800/80 dark:text-purple-400">Scheduled sessions</span>
          </CardContent>
        </Card>

        <Card className="border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
              Settled (Kasunduan)
            </span>
            <p className="text-2xl font-black text-emerald-950 dark:text-emerald-200">{counts.resolved ?? 0}</p>
            <span className="text-[11px] text-emerald-800/80 dark:text-emerald-400">Amicable settlement</span>
          </CardContent>
        </Card>

        <Card className="border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-300">
              Escalated / CFA
            </span>
            <p className="text-2xl font-black text-rose-950 dark:text-rose-200">{counts.dismissed ?? 0}</p>
            <span className="text-[11px] text-rose-800/80 dark:text-rose-400">Court referral</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Toolbar */}
      <Card className="border-border shadow-2xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Docket (e.g. BLOTTER-D1-...), title, complainant, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 min-h-[44px] text-sm bg-background"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Jurisdiction & Priority controls */}
            <div className="flex flex-wrap items-center gap-3">
              {adminScope === 'both' && (
                <div className="flex bg-muted p-1 rounded-xl border shrink-0">
                  {[
                    { id: 'all', label: 'All Jurisdictions' },
                    { id: 'daine_1', label: 'Daine 1' },
                    { id: 'daine_2', label: 'Daine 2' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBarangayFilter(b.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
                        barangayFilter === b.id
                          ? 'bg-background shadow-xs text-foreground font-extrabold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Priority Select */}
              <div className="w-full sm:w-48">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="min-h-[44px] text-xs font-semibold">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="min-h-[40px] text-xs font-medium">
                      All Priorities
                    </SelectItem>
                    <SelectItem value="urgent" className="min-h-[40px] text-xs font-medium text-red-600">
                      Urgent Priority
                    </SelectItem>
                    <SelectItem value="high" className="min-h-[40px] text-xs font-medium text-amber-600">
                      High Priority
                    </SelectItem>
                    <SelectItem value="medium" className="min-h-[40px] text-xs font-medium text-blue-600">
                      Medium Priority
                    </SelectItem>
                    <SelectItem value="low" className="min-h-[40px] text-xs font-medium text-slate-600">
                      Low Priority
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Status Tabs Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-border/60">
            <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mr-1 shrink-0">
              <Filter className="h-3.5 w-3.5" />
              Stage:
            </span>
            {['all', ...STATUSES].map((s) => {
              const count = counts[s] ?? 0
              const isSelected = activeTab === s
              let label = s === 'all' ? 'All Blotter Cases' : STATUS_CONFIG[s as ComplaintStatus].label

              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveTab(s)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Blotter Cases Table */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/20 border-b px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-foreground">Blotter Docket Registry</CardTitle>
              <Badge variant="outline" className="text-xs font-bold">
                {filteredComplaints.length} {filteredComplaints.length === 1 ? 'case' : 'cases'} listed
              </Badge>
            </div>

            {search && (
              <span className="text-xs text-muted-foreground">
                Query: <span className="font-semibold text-foreground">"{search}"</span>
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[150px] font-bold text-xs">Docket Reference</TableHead>
                  <TableHead className="font-bold text-xs">Incident & Category</TableHead>
                  <TableHead className="font-bold text-xs">Complainant</TableHead>
                  <TableHead className="font-bold text-xs">Date & Location</TableHead>
                  <TableHead className="font-bold text-xs">Priority</TableHead>
                  <TableHead className="font-bold text-xs">Status Badge</TableHead>
                  <TableHead className="text-right font-bold text-xs pr-6">Lupon Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground/60">
                        <Scale className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">No blotter cases found</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Try adjusting your search query, status stage, or jurisdiction filter.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComplaints.map((complaint: any) => {
                    const docketNo = `BLOTTER-${complaint.barangay === 'daine_2' ? 'D2' : 'D1'}-${complaint.id.slice(0, 8).toUpperCase()}`
                    const isBusy = isUpdatingFast === complaint.id

                    return (
                      <TableRow
                        key={complaint.id}
                        className="hover:bg-muted/40 transition-colors group border-b border-border/60"
                      >
                        {/* Case Docket Reference */}
                        <TableCell className="align-top py-3.5">
                          <div className="space-y-1">
                            <CopyDocketCode code={docketNo} />
                            <JurisdictionBadge barangay={complaint.barangay} />
                          </div>
                        </TableCell>

                        {/* Title & Category */}
                        <TableCell className="align-top py-3.5 max-w-[240px]">
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-foreground leading-snug">
                              {complaint.title}
                            </p>
                            <Badge
                              variant="secondary"
                              className="text-[11px] font-semibold py-0.5 px-2 text-muted-foreground"
                            >
                              {complaint.category}
                            </Badge>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {complaint.description}
                            </p>
                          </div>
                        </TableCell>

                        {/* Complainant */}
                        <TableCell className="align-top py-3.5">
                          <div className="space-y-1">
                            {complaint.is_anonymous ? (
                              <Badge className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 gap-1 text-[11px] py-0.5">
                                <EyeOff className="h-3 w-3" /> Anonymous
                              </Badge>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                  <UserCheck className="h-3.5 w-3.5 text-primary" />
                                  {complaint.profiles?.full_name || 'Verified Citizen'}
                                </span>
                                {complaint.profiles?.phone && (
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {complaint.profiles.phone}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Incident Date & Location */}
                        <TableCell className="align-top py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 font-semibold text-foreground">
                              <Calendar className="h-3.5 w-3.5 text-primary/70" />
                              <span>
                                {complaint.incident_date
                                  ? format(new Date(complaint.incident_date), 'MMM d, yyyy')
                                  : format(new Date(complaint.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground max-w-[150px] truncate" title={complaint.location || 'No declared location'}>
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span>{complaint.location || 'No declared location'}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Priority Badge */}
                        <TableCell className="align-top py-3.5">
                          <PriorityBadgeDisplay priority={complaint.priority} />
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell className="align-top py-3.5">
                          <HighContrastStatusBadge status={complaint.status} />
                        </TableCell>

                        {/* Lupon Actions (Min 44px touch targets) */}
                        <TableCell className="align-top py-3.5 text-right pr-6">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {/* Generate Summons Notice (Patawag) */}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setSelectedComplaint(complaint)
                                setSummonsModalOpen(true)
                              }}
                              className="min-h-[44px] px-3 font-bold text-xs gap-1.5 text-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 shadow-2xs cursor-pointer touch-target"
                              title="Generate Official Summons (KP-9)"
                            >
                              <Gavel className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                              <span>Summons</span>
                            </Button>

                            {/* Schedule Mediation Hearing */}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setSelectedComplaint(complaint)
                                setSchedulerModalOpen(true)
                              }}
                              className="min-h-[44px] px-3 font-semibold text-xs gap-1.5 text-foreground hover:bg-muted cursor-pointer touch-target"
                              title="Schedule Lupon Mediation Hearing"
                            >
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="hidden sm:inline">Schedule</span>
                            </Button>

                            {/* Lupon Notes & History Logger */}
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setSelectedComplaint(complaint)
                                setNotesModalOpen(true)
                              }}
                              className="min-h-[44px] px-3 font-bold text-xs gap-1.5 cursor-pointer touch-target"
                              title="Log Lupon Session Notes & Kasunduan"
                            >
                              <BookOpen className="h-4 w-4 text-primary" />
                              <span>Notes</span>
                            </Button>

                            {/* Quick Status Dropdown Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  disabled={isBusy}
                                  className="min-h-[44px] min-w-[44px] p-2 hover:bg-muted cursor-pointer touch-target"
                                >
                                  {isBusy ? (
                                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 opacity-70" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end" className="w-56 p-1">
                                <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold px-2 py-1.5">
                                  1-Click Status Update
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => handleFastStatusUpdate(complaint, 'pending')}
                                  className="min-h-[40px] cursor-pointer gap-2 font-semibold text-xs"
                                >
                                  <Clock className="h-4 w-4 text-amber-600" />
                                  <span>Pending Summon</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleFastStatusUpdate(complaint, 'investigating')}
                                  className="min-h-[40px] cursor-pointer gap-2 font-semibold text-xs"
                                >
                                  <Search className="h-4 w-4 text-blue-600" />
                                  <span>Under Investigation</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleFastStatusUpdate(complaint, 'scheduled_hearing')}
                                  className="min-h-[40px] cursor-pointer gap-2 font-semibold text-xs text-purple-700 dark:text-purple-400"
                                >
                                  <Gavel className="h-4 w-4 text-purple-600" />
                                  <span>Mediation Scheduled</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleFastStatusUpdate(complaint, 'resolved')}
                                  className="min-h-[40px] cursor-pointer gap-2 font-semibold text-xs text-emerald-700 dark:text-emerald-400"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  <span>Settled (Kasunduan)</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleFastStatusUpdate(complaint, 'dismissed')}
                                  className="min-h-[40px] cursor-pointer gap-2 font-semibold text-xs text-rose-700 dark:text-rose-400"
                                >
                                  <Scale className="h-4 w-4 text-rose-600" />
                                  <span>Escalated to Court / CFA</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* KP Form 9 Summons Modal */}
      <SummonsModal
        complaint={selectedComplaint}
        open={summonsModalOpen}
        onOpenChange={setSummonsModalOpen}
      />

      {/* Mediation Hearing Scheduler Modal */}
      <HearingSchedulerModal
        complaint={selectedComplaint}
        open={schedulerModalOpen}
        onOpenChange={setSchedulerModalOpen}
        onSuccess={() => router.invalidate()}
      />

      {/* Lupon Tagapamayapa Case Notes Logger Modal */}
      <CaseNotesLoggerModal
        complaint={selectedComplaint}
        open={notesModalOpen}
        onOpenChange={setNotesModalOpen}
        onSuccess={() => router.invalidate()}
      />
    </div>
  )
}
