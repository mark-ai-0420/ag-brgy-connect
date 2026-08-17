import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getAuthSession } from '#/server/auth'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { StatusBadge } from '#/components/common/StatusBadge'
import { Card, CardContent } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { format } from 'date-fns'
import { 
  ArrowLeft, MapPin, Calendar, Clock, 
  MessageSquare, EyeOff, Image as ImageIcon, 
  CheckCircle 
} from 'lucide-react'

const getComplaintDetail = createServerFn({ method: 'GET' })
  .validator((data: string) => data)
  .handler(async ({ data: complaintId }) => {
    const { user } = await getAuthSession()
    if (!user) {
      throw new Error('Unauthorized')
    }
    
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', complaintId)
      .eq('complainant_id', user.id)
      .single()

    if (error || !data) {
      return null
    }

    return data
  })

export const Route = createFileRoute('/_authenticated/complaints/$complaintId')({
  component: ComplaintDetailPage,
  loader: async ({ params }) => {
    const complaint = await getComplaintDetail({ data: params.complaintId })
    if (!complaint) {
      throw notFound()
    }
    return complaint
  },
})

function ComplaintDetailPage() {
  const complaint = Route.useLoaderData()

  const timelineStages = ['pending', 'investigating', 'hearing', 'resolved', 'dismissed']
  const currentStageIndex = timelineStages.indexOf(complaint.status.toLowerCase())
  const isFinalStage = complaint.status.toLowerCase() === 'resolved' || complaint.status.toLowerCase() === 'dismissed'

  const activeStages = isFinalStage 
    ? timelineStages.filter(s => s === 'pending' || s === 'investigating' || s === 'hearing' || s === complaint.status.toLowerCase())
    : ['pending', 'investigating', 'hearing', 'resolved']

  return (
    <div className="container mx-auto p-4 flex justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <Button variant="ghost" asChild className="gap-2 pl-0 hover:bg-transparent hover:underline text-muted-foreground">
          <Link to="/complaints">
            <ArrowLeft className="h-4 w-4" />
            Back to Complaints
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">{complaint.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge variant="outline" className="capitalize text-sm py-1">
              {complaint.category}
            </Badge>
            <StatusBadge status={complaint.status} domain="complaint" />
            {complaint.priority && (
              <Badge variant="secondary" className="capitalize text-sm py-1">
                {complaint.priority} Priority
              </Badge>
            )}
            {complaint.is_anonymous && (
              <Badge variant="secondary" className="gap-1 bg-muted text-sm py-1">
                <EyeOff className="h-3 w-3" /> Anonymous
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-3">Description</h3>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {complaint.description}
                </p>
              </CardContent>
            </Card>

            {complaint.photo_url && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 font-semibold text-lg mb-3">
                    <ImageIcon className="h-5 w-5" /> Attached Photo
                  </div>
                  <a href={complaint.photo_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border">
                    <img 
                      src={complaint.photo_url} 
                      alt="Complaint attachment" 
                      className="w-full h-auto object-cover max-h-[400px] hover:scale-[1.02] transition-transform" 
                    />
                  </a>
                </CardContent>
              </Card>
            )}

            {complaint.admin_notes && (
              <Card className="bg-muted/50 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 font-semibold text-lg mb-3 text-foreground">
                    <MessageSquare className="h-5 w-5 text-primary" /> Admin Notes
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {complaint.admin_notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Details</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Date Filed</p>
                      <p className="text-muted-foreground">{format(new Date(complaint.created_at), 'PPP')}</p>
                    </div>
                  </div>

                  {complaint.incident_date && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Incident Date</p>
                        <p className="text-muted-foreground">{format(new Date(complaint.incident_date), 'PPP')}</p>
                      </div>
                    </div>
                  )}

                  {complaint.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-muted-foreground">{complaint.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg border-b pb-2 mb-4">Status Timeline</h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {activeStages.map((stage) => {
                    const stageIndex = timelineStages.indexOf(stage)
                    const isCompleted = currentStageIndex > stageIndex
                    const isCurrent = complaint.status.toLowerCase() === stage
                    const isFuture = !isCompleted && !isCurrent

                    return (
                      <div key={stage} className="relative flex items-center gap-3">
                        <div className={`
                          relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 
                          ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : ''}
                          ${isCurrent ? 'bg-background border-primary text-primary' : ''}
                          ${isFuture ? 'bg-background border-muted text-muted-foreground' : ''}
                        `}>
                          {isCompleted ? <CheckCircle className="h-3 w-3" /> : <div className={`h-1.5 w-1.5 rounded-full ${isCurrent ? 'bg-primary' : 'bg-transparent'}`} />}
                        </div>
                        <div className={`text-sm font-medium capitalize ${isFuture ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {stage}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
