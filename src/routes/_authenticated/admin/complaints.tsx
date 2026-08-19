import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { z } from 'zod'
import { ShieldAlert, Search, Filter, MoreHorizontal, User } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { ScrollArea } from '#/components/ui/scroll-area'

const getAdminComplaints = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('user_roles').select('barangay').eq('user_id', user.id).single()
  const adminScope = profile?.barangay || 'daine_1'

  let query = supabase
    .from('complaints')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
  
  if (adminScope !== 'both') {
    query = query.eq('barangay', adminScope)
  }

  const { data, error } = await query
  if (error) throw error
  return { complaints: data, adminScope }
})

const updateComplaintStatus = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string(), status: z.enum(['pending', 'investigating', 'scheduled_hearing', 'resolved', 'dismissed']), priority: z.string(), admin_notes: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from('complaints')
      .update({
        status: data.status,
        priority: data.priority,
        admin_notes: data.admin_notes,
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

const STATUS_BADGE_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-800 border-slate-200',
  investigating: 'bg-blue-100 text-blue-800 border-blue-200',
  scheduled_hearing: 'bg-amber-100 text-amber-800 border-amber-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  dismissed: 'bg-red-100 text-red-800 border-red-200',
}

const PRIORITY_BADGE_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-800 border-slate-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
}

function AdminComplaintsRoute() {
  const { complaints, adminScope } = Route.useLoaderData()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [barangayFilter, setBarangayFilter] = useState('all')
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Update form state
  const [updateStatus, setUpdateStatus] = useState('')
  const [updatePriority, setUpdatePriority] = useState('')
  const [updateNotes, setUpdateNotes] = useState('')

  const openUpdateModal = (complaint: any) => {
    setSelectedComplaint(complaint)
    setUpdateStatus(complaint.status)
    setUpdatePriority(complaint.priority)
    setUpdateNotes(complaint.admin_notes || '')
    setIsUpdateModalOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedComplaint) return
    setIsUpdating(true)
    
    try {
      await updateComplaintStatus({
        data: {
          id: selectedComplaint.id,
          status: updateStatus,
          priority: updatePriority,
          admin_notes: updateNotes,
        }
      })
      toast.success('Complaint updated successfully')
      setIsUpdateModalOpen(false)
      router.invalidate()
    } catch (error) {
      console.error(error)
      toast.error('Failed to update complaint')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatText = (text: string) => {
    return text.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const filteredComplaints = complaints.filter((c: any) => {
    if (activeTab !== 'all' && c.status !== activeTab) return false;
    if (adminScope === 'both' && barangayFilter !== 'all' && c.barangay !== barangayFilter) return false;
    return true;
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-600" />
            Complaints & Incident Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and respond to community complaints and incidents.
          </p>
        </div>
      </div>

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 pt-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <TabsList className="grid w-full lg:w-auto grid-cols-3 lg:grid-cols-6 h-auto">
              <TabsTrigger value="all" className="py-2">All</TabsTrigger>
              <TabsTrigger value="pending" className="py-2">Pending</TabsTrigger>
              <TabsTrigger value="investigating" className="py-2">Investigating</TabsTrigger>
              <TabsTrigger value="scheduled_hearing" className="py-2">Hearing</TabsTrigger>
              <TabsTrigger value="resolved" className="py-2">Resolved</TabsTrigger>
              <TabsTrigger value="dismissed" className="py-2">Dismissed</TabsTrigger>
            </TabsList>
            
            {adminScope === 'both' && (
              <div className="flex bg-muted p-1 rounded-lg shrink-0 w-full sm:w-auto overflow-x-auto">
                {['all', 'daine_1', 'daine_2'].map(b => (
                  <button
                    key={b}
                    onClick={() => setBarangayFilter(b)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      barangayFilter === b
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {b === 'all' ? 'All Jurisdictions' : b === 'daine_1' ? 'Daine 1' : 'Daine 2'}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Details</TableHead>
                  <TableHead>Complainant</TableHead>
                  <TableHead>Date & Location</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No complaints found for this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComplaints.map((complaint: any) => (
                    <TableRow key={complaint.id}>
                      <TableCell>
                        <div className="font-medium">{complaint.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {formatText(complaint.category)}
                          {adminScope === 'both' && complaint.barangay && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-md bg-muted text-[10px] uppercase font-semibold">
                              {complaint.barangay === 'daine_1' ? 'Daine 1' : 'Daine 2'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {complaint.is_anonymous ? 'Anonymous Resident' : (complaint.profiles?.full_name || 'Unknown')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {complaint.incident_date ? format(new Date(complaint.incident_date), 'MMM d, yyyy') : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {complaint.location || 'No location'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={PRIORITY_BADGE_COLORS[complaint.priority] || ''}>
                          {formatText(complaint.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_BADGE_COLORS[complaint.status] || ''}>
                          {formatText(complaint.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openUpdateModal(complaint)}
                        >
                          Update Status & Response
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Tabs>
      </Card>

      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review & Update Complaint</DialogTitle>
            <DialogDescription>
              {selectedComplaint && `"${selectedComplaint.title}" — ${formatText(selectedComplaint.category)}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Description Section */}
            {selectedComplaint?.description && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Incident Description</Label>
                <ScrollArea className="max-h-[160px] w-full rounded-lg border bg-muted/40 p-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selectedComplaint.description}</p>
                </ScrollArea>
              </div>
            )}

            {/* Photo Evidence */}
            {selectedComplaint?.photo_url && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Photo Evidence</Label>
                <a href={selectedComplaint.photo_url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={selectedComplaint.photo_url}
                    alt="Complaint evidence"
                    className="w-full max-h-[200px] object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Click to view full size</p>
                </a>
              </div>
            )}

            <div className="border-t pt-4 mt-1" />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="scheduled_hearing">Scheduled Hearing</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <div className="col-span-3">
                <Select value={updatePriority} onValueChange={setUpdatePriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                Admin Notes
              </Label>
              <div className="col-span-3 space-y-2">
                <Textarea 
                  id="notes" 
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Internal notes, actions taken, or response to complainant..."
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">
                  These notes may be visible to the complainant if they check their submission status.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)} className="min-h-[44px]">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating} className="min-h-[44px]">
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
