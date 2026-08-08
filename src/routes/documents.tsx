import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { FileText, CheckCircle2, AlertCircle, Clock, Banknote } from 'lucide-react'

export const Route = createFileRoute('/documents')({
  component: DocumentsRoute,
})

const DOCUMENTS = [
  {
    title: 'Barangay Clearance',
    description:
      'Required for employment, business permits, and other legal purposes.',
    requirements: [
      'Valid ID (original and photocopy)',
      'Community Tax Certificate (Cedula)',
      'Recent 2x2 ID picture',
    ],
    processingTime: '1–2 Working Days',
    fee: '₱50.00',
    feeColor: 'text-[#CE1126]',
  },
  {
    title: 'Certificate of Indigency',
    description:
      'Usually required for medical assistance, scholarships, and free legal services.',
    requirements: [
      'Valid ID',
      'Proof of income or sworn statement of no income',
    ],
    processingTime: 'Same Day',
    fee: 'Free',
    feeColor: 'text-emerald-600',
  },
  {
    title: 'Certificate of Residency',
    description:
      'Proof that an individual is a bona fide resident of the barangay.',
    requirements: ['Valid ID with address', 'Utility bill or lease contract'],
    processingTime: 'Same Day',
    fee: '₱30.00',
    feeColor: 'text-[#CE1126]',
  },
  {
    title: 'Business Clearance',
    description:
      "Requirement for acquiring or renewing a Mayor's Permit for businesses.",
    requirements: [
      'DTI/SEC Registration',
      'Contract of Lease or Proof of Ownership',
      'Previous Barangay Business Clearance (for renewal)',
    ],
    processingTime: '2–3 Working Days',
    fee: 'Varies',
    feeColor: 'text-amber-600',
  },
]

function DocumentsRoute() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-5xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/10 p-3 rounded-full shrink-0">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Requests</h1>
          <p className="text-muted-foreground mt-1">
            Information on how to request barangay documents and certificates.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground">
              Online Request Available
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Submit your document request online and track its status in real-time.
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0 min-h-[44px] px-5 font-semibold">
          <Link to="/documents/request" params={{}}>
            Submit Request Online
          </Link>
        </Button>
      </div>

      {/* Document cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DOCUMENTS.map((doc, idx) => (
          <Card key={idx} className="flex flex-col card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{doc.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {doc.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              {/* Requirements */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Requirements
                </h4>
                <ul className="space-y-1.5">
                  {doc.requirements.map((req, rIdx) => (
                    <li
                      key={rIdx}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Processing time + fee */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Processing
                    </span>
                  </div>
                  <span className="text-sm font-semibold">{doc.processingTime}</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Fee
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${doc.feeColor}`}>{doc.fee}</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-4 border-t">
              <Button className="w-full min-h-[44px] font-semibold" asChild>
                <Link to="/documents/request" params={{}}>Request Online</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
