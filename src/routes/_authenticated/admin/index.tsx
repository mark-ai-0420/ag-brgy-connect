import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'







export const getAdminStats = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  
  const [businesses, pendingBusinesses, announcements, events, docRequests, pendingDocRequests, complaints, pendingComplaints] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('announcements').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('document_requests').select('*', { count: 'exact', head: true }),
    supabase.from('document_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('complaints').select('*', { count: 'exact', head: true }),
    supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  
  return {
    totalBusinesses: businesses.count ?? 0,
    pendingBusinesses: pendingBusinesses.count ?? 0,
    totalAnnouncements: announcements.count ?? 0,
    totalEvents: events.count ?? 0,
    totalDocRequests: docRequests.count ?? 0,
    pendingDocRequests: pendingDocRequests.count ?? 0,
    totalComplaints: complaints.count ?? 0,
    pendingComplaints: pendingComplaints.count ?? 0,
  }
})

const getDocRequestsByStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const statuses = ['pending', 'in_review', 'ready', 'completed', 'rejected']
  const results = await Promise.all(
    statuses.map(async (status) => {
      const { count } = await supabase
        .from('document_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', status)
      return { status, count: count ?? 0 }
    })
  )
  return results
})

const getRecentActivity = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('document_requests')
    .select('id, document_type, status, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(10)
    
  if (error) throw error
  return data
})

export const Route = createFileRoute('/_authenticated/admin/')({
  loader: async () => {
    const [stats, docRequestsByStatus, recentActivity] = await Promise.all([
      getAdminStats(),
      getDocRequestsByStatus(),
      getRecentActivity(),
    ])
    return { stats, docRequestsByStatus, recentActivity }
  },
})
