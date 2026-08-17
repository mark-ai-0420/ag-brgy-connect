import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getAuthSession } from '#/server/auth'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { PageHeader } from '#/components/common/PageHeader'
import { StatusBadge } from '#/components/common/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { ShieldAlert, PlusCircle, MapPin, Calendar, EyeOff, Clock, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

const getMyComplaints = createServerFn({ method: 'GET' }).handler(async () => {
  const { user } = await getAuthSession()
  if (!user) {
    throw new Error('Unauthorized')
  }
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('complaints')
    .select('id, title, category, description, status, priority, location, incident_date, is_anonymous, photo_url, admin_notes, created_at')
    .eq('complainant_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }
  
  return data || []
})

export const Route = createFileRoute('/_authenticated/complaints/')({
  component: ComplaintsIndexPage,
  loader: () => getMyComplaints(),
})

function ComplaintsIndexPage() {
  const complaints = Route.useLoaderData()
  const [filter, setFilter] = useState('All')

  const filteredComplaints = complaints.filter(
    (c) => filter === 'All' || c.status.toLowerCase() === filter.toLowerCase()
  )

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="My Incident Reports" 
          description="Track and manage the complaints you have filed."
        />
        <Button asChild className="shrink-0 gap-2">
          <Link to="/complaints/new">
            <PlusCircle className="h-4 w-4" />
            File New Report
          </Link>
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="flex flex-wrap h-auto w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Pending">Pending</TabsTrigger>
          <TabsTrigger value="Investigating">Investigating</TabsTrigger>
          <TabsTrigger value="Hearing">Hearing</TabsTrigger>
          <TabsTrigger value="Resolved">Resolved</TabsTrigger>
          <TabsTrigger value="Dismissed">Dismissed</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredComplaints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-lg">
          <ShieldAlert className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground">No complaints found</h3>
          <p className="mt-1 text-sm">
            {filter === 'All' 
              ? "You haven't filed any incident reports yet." 
              : `You don't have any complaints with '${filter}' status.`}
          </p>
          {filter === 'All' && (
            <Button asChild variant="outline" className="mt-4 gap-2">
              <Link to="/complaints/new">
                <PlusCircle className="h-4 w-4" />
                File a Report
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredComplaints.map((complaint) => (
            <Card key={complaint.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <CardTitle className="text-xl">
                      <Link to="/complaints/$complaintId" params={{ complaintId: complaint.id.toString() }} className="hover:underline">
                        {complaint.title}
                      </Link>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">{complaint.category}</Badge>
                      {complaint.is_anonymous && (
                        <Badge variant="secondary" className="gap-1 bg-muted">
                          <EyeOff className="h-3 w-3" /> Anonymous
                        </Badge>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={complaint.status} domain="complaint" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {complaint.description}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Filed: {format(new Date(complaint.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    {complaint.incident_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>Incident: {format(new Date(complaint.incident_date), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {complaint.location && (
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{complaint.location}</span>
                      </div>
                    )}
                  </div>

                  {complaint.admin_notes && (
                    <div className="bg-muted/50 rounded-md p-3 text-sm mt-4 border">
                      <div className="flex items-center gap-1.5 font-medium mb-1 text-foreground">
                        <MessageSquare className="h-3.5 w-3.5" /> Staff Note
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{complaint.admin_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
