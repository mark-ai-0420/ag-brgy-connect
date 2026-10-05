import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession, assertAdminScope, assertAdmin } from '#/server/auth'

export const getAdminStats = createServerFn({ method: 'GET' }).handler(async () => {
  const { user, role, admin_scope } = await getAuthSession()
  if (!user) throw new Error('Unauthorized')
  assertAdmin(role)
  const adminScope = assertAdminScope(admin_scope)
  const supabase = createSupabaseServerClient()

  let businessesQuery = supabase.from('businesses').select('*', { count: 'exact', head: true })
  let pendingBusinessesQuery = supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  let announcementsQuery = supabase.from('announcements').select('*', { count: 'exact', head: true })
  let eventsQuery = supabase.from('events').select('*', { count: 'exact', head: true })
  let docRequestsQuery = supabase.from('document_requests').select('*', { count: 'exact', head: true })
  let pendingDocRequestsQuery = supabase.from('document_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
  let complaintsQuery = supabase.from('complaints').select('*', { count: 'exact', head: true })
  let pendingComplaintsQuery = supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'pending')

  if (adminScope !== 'both') {
    businessesQuery = businessesQuery.eq('barangay', adminScope)
    pendingBusinessesQuery = pendingBusinessesQuery.eq('barangay', adminScope)
    announcementsQuery = announcementsQuery.in('scope', [adminScope, 'both'])
    eventsQuery = eventsQuery.in('scope', [adminScope, 'both'])
    docRequestsQuery = docRequestsQuery.eq('barangay', adminScope)
    pendingDocRequestsQuery = pendingDocRequestsQuery.eq('barangay', adminScope)
    complaintsQuery = complaintsQuery.eq('barangay', adminScope)
    pendingComplaintsQuery = pendingComplaintsQuery.eq('barangay', adminScope)
  }
  
  const [businesses, pendingBusinesses, announcements, events, docRequests, pendingDocRequests, complaints, pendingComplaints] = await Promise.all([
    businessesQuery,
    pendingBusinessesQuery,
    announcementsQuery,
    eventsQuery,
    docRequestsQuery,
    pendingDocRequestsQuery,
    complaintsQuery,
    pendingComplaintsQuery,
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
    adminScope,
  }
})

const getDocRequestsByStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const { user, role, admin_scope } = await getAuthSession()
  if (!user) throw new Error('Unauthorized')
  assertAdmin(role)
  const adminScope = assertAdminScope(admin_scope)

  const supabase = createSupabaseServerClient()
  const statuses = ['pending', 'in_review', 'ready', 'completed', 'rejected']
  const results = await Promise.all(
    statuses.map(async (status) => {
      let q = supabase
        .from('document_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', status)
      if (adminScope !== 'both') {
        q = q.eq('barangay', adminScope)
      }
      const { count } = await q
      return { status, count: count ?? 0 }
    })
  )
  return results
})

const getRecentActivity = createServerFn({ method: 'GET' }).handler(async () => {
  const { user, role, admin_scope } = await getAuthSession()
  if (!user) throw new Error('Unauthorized')
  assertAdmin(role)
  const adminScope = assertAdminScope(admin_scope)

  const supabase = createSupabaseServerClient()
  let query = supabase
    .from('document_requests')
    .select('id, document_type, status, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(10)

  if (adminScope !== 'both') {
    query = query.eq('barangay', adminScope)
  }
    
  const { data, error } = await query
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
