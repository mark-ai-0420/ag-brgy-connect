import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { useState } from 'react'
import { PageHeader } from '#/components/common/PageHeader'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '#/components/ui/dialog'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import {
  Users,
  Shield,
  ShieldCheck,
  User as UserIcon,
  MapPin,
  Building2,
  Phone,
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Store,
  Eye,
  SlidersHorizontal,
  UserCheck,
  UserX,
  ExternalLink,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { format } from 'date-fns'

const ROLES = ['resident', 'business_owner', 'moderator', 'admin'] as const
type AppRole = (typeof ROLES)[number]

const ROLE_CONFIG: Record<
  AppRole,
  { label: string; icon: any; color: string; bg: string; border: string; desc: string }
> = {
  admin: {
    label: 'System Admin',
    icon: ShieldCheck,
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-800',
    desc: 'Full administrative access across all barangay modules, approvals, and system settings.',
  },
  moderator: {
    label: 'Barangay Official',
    icon: Shield,
    color: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800',
    desc: 'Authorized to review document requests, complaints, announcements, and events in jurisdiction.',
  },
  business_owner: {
    label: 'MSME Merchant',
    icon: Store,
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    desc: 'Registered local business merchant with MSME directory privileges.',
  },
  resident: {
    label: 'Resident',
    icon: UserIcon,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    desc: 'Standard registered resident account with civic portal access.',
  },
}

const getUsers = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { user, role, admin_scope } = await getAuthSession()
  if (!user || (role !== 'admin' && role !== 'moderator')) {
    throw new Error('Unauthorized')
  }

  const adminScope = admin_scope ?? 'both'

  let query = supabase
    .from('profiles')
    .select('id, full_name, phone, address, purok, email, avatar_url, barangay, created_at, updated_at, user_roles(role, barangay)')
    .order('created_at', { ascending: false })

  if (adminScope !== 'both') {
    query = query.eq('barangay', adminScope)
  }

  const { data: profiles, error } = await query

  type RoleJoin = { role: string; barangay?: string }
  type ProfileWithRoles = {
    id: string
    full_name: string | null
    phone: string | null
    address: string | null
    purok: string | null
    email: string | null
    avatar_url: string | null
    barangay: string | null
    created_at: string
    updated_at?: string
    user_roles: RoleJoin | RoleJoin[] | null
  }

  if (!error && profiles) {
    const formatted = (profiles as unknown as ProfileWithRoles[]).map((p) => {
      let userRole: AppRole = 'resident'
      let roleScope: string = p.barangay ?? 'both'

      if (Array.isArray(p.user_roles) && p.user_roles.length > 0) {
        userRole = (p.user_roles[0].role as AppRole) || 'resident'
        roleScope = p.user_roles[0].barangay ?? p.barangay ?? 'both'
      } else if (p.user_roles && typeof p.user_roles === 'object' && 'role' in p.user_roles) {
        userRole = ((p.user_roles as RoleJoin).role as AppRole) || 'resident'
        roleScope = (p.user_roles as RoleJoin).barangay ?? p.barangay ?? 'both'
      }

      // Verification check: complete resident profile has name, phone, address/purok
      const isVerified = Boolean(p.full_name && p.phone && (p.purok || p.address))

      return {
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        address: p.address,
        purok: p.purok,
        email: p.email,
        avatar_url: p.avatar_url,
        barangay: p.barangay ?? 'daine_1',
        created_at: p.created_at,
        role: userRole,
        role_scope: roleScope,
        is_verified: isVerified,
      }
    })
    return { users: formatted, adminScope }
  }

  // Fallback query
  let fallbackQuery = supabase
    .from('profiles')
    .select('id, full_name, phone, address, purok, email, avatar_url, barangay, created_at')
    .order('created_at', { ascending: false })

  if (adminScope !== 'both') {
    fallbackQuery = fallbackQuery.eq('barangay', adminScope)
  }

  const [{ data: profs }, { data: roles }] = await Promise.all([
    fallbackQuery,
    supabase.from('user_roles').select('user_id, role, barangay'),
  ])

  const roleMap = new Map((roles ?? []).map((r) => [r.user_id, { role: r.role as AppRole, scope: r.barangay }]))

  const formatted = (profs ?? []).map((p) => {
    const roleInfo = roleMap.get(p.id)
    const userRole = roleInfo?.role ?? 'resident'
    const roleScope = roleInfo?.scope ?? p.barangay ?? 'both'
    const isVerified = Boolean(p.full_name && p.phone && (p.purok || p.address))

    return {
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      address: p.address,
      purok: p.purok,
      email: p.email,
      avatar_url: p.avatar_url,
      barangay: p.barangay ?? 'daine_1',
      created_at: p.created_at,
      role: userRole,
      role_scope: roleScope,
      is_verified: isVerified,
    }
  })

  return { users: formatted, adminScope }
})

const updateUserRoleAndScope = createServerFn({ method: 'POST' })
  .validator(
    (data: unknown) =>
      z
        .object({
          user_id: z.string(),
          role: z.enum(['admin', 'moderator', 'business_owner', 'resident']),
          barangay: z.enum(['daine_1', 'daine_2']).optional(),
          role_scope: z.enum(['daine_1', 'daine_2', 'both']).optional(),
        })
        .parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()

    // 1. Update user_roles table
    const rolePayload: any = { user_id: data.user_id, role: data.role }
    if (data.role_scope) {
      rolePayload.barangay = data.role_scope
    }
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert(rolePayload, { onConflict: 'user_id' })

    if (roleError) throw new Error(roleError.message)

    // 2. Update profile barangay if specified
    if (data.barangay) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ barangay: data.barangay, updated_at: new Date().toISOString() })
        .eq('id', data.user_id)

      if (profileError) {
        console.error('Failed to update profile barangay:', profileError)
      }
    }

    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: AdminUsersRoute,
  loader: () => getUsers(),
})

type UserItem = Awaited<ReturnType<typeof getUsers>>['users'][number]

function AdminUsersRoute() {
  const { users, adminScope } = Route.useLoaderData()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [barangayFilter, setBarangayFilter] = useState<'all' | 'daine_1' | 'daine_2'>('all')
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all')

  // Selected User for Role / Jurisdiction Assignment Modal
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [selectedRole, setSelectedRole] = useState<AppRole>('resident')
  const [selectedBarangay, setSelectedBarangay] = useState<'daine_1' | 'daine_2'>('daine_1')
  const [selectedRoleScope, setSelectedRoleScope] = useState<'daine_1' | 'daine_2' | 'both'>('both')
  const [isSavingUser, setIsSavingUser] = useState(false)

  // Direct In-row quick change tracking
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Filtering
  const filtered = users.filter((u) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      u.full_name?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.address?.toLowerCase().includes(q) ||
      u.purok?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)

    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter
    const matchesBarangay = barangayFilter === 'all' ? true : u.barangay === barangayFilter
    const matchesVerification =
      verificationFilter === 'all'
        ? true
        : verificationFilter === 'verified'
          ? u.is_verified
          : !u.is_verified

    return matchesSearch && matchesRole && matchesBarangay && matchesVerification
  })

  // Quick in-row role update
  async function handleQuickRoleChange(userId: string, newRole: AppRole) {
    setUpdatingId(userId)
    try {
      await updateUserRoleAndScope({
        data: {
          user_id: userId,
          role: newRole,
        },
      })
      toast.success('Role updated successfully')
      router.invalidate()
    } catch {
      toast.error('Failed to update role')
    } finally {
      setUpdatingId(null)
    }
  }

  // Open full role / jurisdiction assignment modal
  function openUserModal(user: UserItem) {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setSelectedBarangay(user.barangay as 'daine_1' | 'daine_2')
    setSelectedRoleScope((user.role_scope as any) || 'both')
  }

  // Save Modal Assignment
  async function handleSaveUserAssignment() {
    if (!selectedUser) return
    setIsSavingUser(true)
    try {
      await updateUserRoleAndScope({
        data: {
          user_id: selectedUser.id,
          role: selectedRole,
          barangay: selectedBarangay,
          role_scope: selectedRoleScope,
        },
      })
      toast.success(`Updated settings for ${selectedUser.full_name || 'user'}`)
      setSelectedUser(null)
      router.invalidate()
    } catch {
      toast.error('Failed to update user assignments')
    } finally {
      setIsSavingUser(false)
    }
  }

  // Stats
  const totalUsers = users.length
  const verifiedCount = users.filter((u) => u.is_verified).length
  const staffCount = users.filter((u) => u.role === 'admin' || u.role === 'moderator').length
  const msmeCount = users.filter((u) => u.role === 'business_owner').length

  return (
    <div className="space-y-6">
      {/* Civic Horizon Header */}
      <PageHeader
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Users className="h-3.5 w-3.5" />
            Barangay Population & Civic Access Directory
          </span>
        }
        title="Resident & Staff User Directory"
        description="Manage civic account credentials, assign administrative and barangay official roles, configure dual-jurisdiction scopes, and review verified resident profiles."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-card border rounded-lg px-3 py-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <strong className="text-foreground">{filtered.length}</strong> accounts shown
            </span>
          </div>
        }
      />

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Registered</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{totalUsers}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Verified Residents</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{verifiedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">LGU Staff / Admins</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{staffCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-purple-50/20 dark:bg-purple-950/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">MSME Merchants</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5">{msmeCount}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Store className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Summary Pills / Filter Bar */}
      <Card className="p-4 space-y-3 shadow-sm">
        {/* Role Quick Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b pb-3">
          {[
            { key: 'all', label: 'All Roles', count: users.length },
            { key: 'resident', label: 'Residents', count: users.filter((u) => u.role === 'resident').length },
            { key: 'business_owner', label: 'MSME Owners', count: msmeCount },
            { key: 'moderator', label: 'Officials / Staff', count: users.filter((u) => u.role === 'moderator').length },
            { key: 'admin', label: 'Administrators', count: users.filter((u) => u.role === 'admin').length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRoleFilter(tab.key)}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                roleFilter === tab.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  roleFilter === tab.key
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-background text-muted-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Scope & Verification Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by full name, phone number, address, purok, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 min-h-[44px] text-sm"
            />
          </div>

          <div className="sm:col-span-3">
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="min-h-[44px] text-sm">
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="min-h-[40px]">All Verification</SelectItem>
                <SelectItem value="verified" className="min-h-[40px]">Verified Residents Only</SelectItem>
                <SelectItem value="unverified" className="min-h-[40px]">Unverified / Basic Accounts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {adminScope === 'both' && (
            <div className="sm:col-span-3">
              <Select value={barangayFilter} onValueChange={(val: any) => setBarangayFilter(val)}>
                <SelectTrigger className="min-h-[44px] text-sm">
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="min-h-[40px]">All Barangay Units</SelectItem>
                  <SelectItem value="daine_1" className="min-h-[40px]">Barangay Daine 1</SelectItem>
                  <SelectItem value="daine_2" className="min-h-[40px]">Barangay Daine 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Main Directory Table */}
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="py-4 px-5 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Resident & Staff Accounts ({filtered.length})
            </CardTitle>
            {roleFilter !== 'all' && (
              <Badge variant="outline" className="capitalize text-xs font-semibold">
                Role: {roleFilter.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[260px]">Resident Profile</TableHead>
                  <TableHead>Barangay & Purok</TableHead>
                  <TableHead>Contact & Address</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead className="text-right w-[200px]">Role & Jurisdiction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="font-semibold text-foreground">No accounts match your criteria.</p>
                      <p className="text-xs text-muted-foreground mt-1">Try refining search parameters or filters.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((user) => {
                    const isDaine2 = user.barangay === 'daine_2'
                    const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.resident
                    const RoleIcon = roleConfig.icon

                    return (
                      <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                        {/* Profile Info */}
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                              {user.full_name ? user.full_name.slice(0, 2) : 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-sm truncate max-w-[180px]">
                                {user.full_name || <span className="italic text-muted-foreground font-normal">No name registered</span>}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                                {user.email || `ID: ${user.id.slice(0, 8)}...`}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Barangay & Purok */}
                        <TableCell className="py-3.5">
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isDaine2
                                  ? 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                                  : 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                              }`}
                            >
                              <Building2 className="h-3 w-3" />
                              {isDaine2 ? 'Daine 2' : 'Daine 1'}
                            </span>
                            {user.purok && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {user.purok}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* Contact & Address */}
                        <TableCell className="py-3.5">
                          <div className="space-y-1">
                            {user.phone ? (
                              <a
                                href={`tel:${user.phone}`}
                                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                              >
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No phone registered</span>
                            )}
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={user.address || ''}>
                              {user.address || 'No street address'}
                            </p>
                          </div>
                        </TableCell>

                        {/* Verification Status */}
                        <TableCell className="py-3.5">
                          {user.is_verified ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Verified Resident
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                              Basic Account
                            </span>
                          )}
                        </TableCell>

                        {/* Current Role */}
                        <TableCell className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleConfig.bg} ${roleConfig.color} ${roleConfig.border}`}
                          >
                            <RoleIcon className="h-3.5 w-3.5" />
                            {roleConfig.label}
                          </span>
                        </TableCell>

                        {/* Quick Role Select & Assignment Modal Button */}
                        <TableCell className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* In-row quick dropdown */}
                            <Select
                              value={user.role}
                              onValueChange={(val: any) => handleQuickRoleChange(user.id, val)}
                              disabled={updatingId === user.id}
                            >
                              <SelectTrigger className="w-32 min-h-[44px] text-xs font-medium">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map((r) => (
                                  <SelectItem key={r} value={r} className="min-h-[40px] text-xs capitalize">
                                    {ROLE_CONFIG[r].label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Full assignment / dossier button */}
                            <Button
                              variant="outline"
                              size="icon"
                              className="min-h-[44px] min-w-[44px] text-foreground hover:bg-muted"
                              onClick={() => openUserModal(user)}
                              title="Assign role & jurisdiction permissions"
                            >
                              <SlidersHorizontal className="h-4 w-4" />
                            </Button>
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

      {/* Role Assignment & Barangay Jurisdiction Modal */}
      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Role & Jurisdiction Assignment
            </DialogTitle>
            <DialogDescription>
              Assign app access roles, administrative privileges, and geographic jurisdiction for this citizen.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-5 pt-2">
              {/* User Overview Box */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base uppercase">
                  {selectedUser.full_name ? selectedUser.full_name.slice(0, 2) : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground text-sm">{selectedUser.full_name || 'No Name'}</p>
                  <p className="text-xs text-muted-foreground">
                    Phone: {selectedUser.phone || 'N/A'} • Purok: {selectedUser.purok || 'N/A'}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">UID: {selectedUser.id}</p>
                </div>
              </div>

              {/* Role Selection Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">Select Access Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ROLES.map((r) => {
                    const cfg = ROLE_CONFIG[r]
                    const Icon = cfg.icon
                    const isSelected = selectedRole === r

                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className={`min-h-[56px] text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border bg-card hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
                            <Icon className="h-4 w-4" />
                            {cfg.label}
                          </span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{cfg.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Jurisdiction Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                {/* Resident Profile Barangay */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Resident Registered Barangay</label>
                  <Select value={selectedBarangay} onValueChange={(val: any) => setSelectedBarangay(val)}>
                    <SelectTrigger className="min-h-[44px] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daine_1" className="min-h-[40px]">Barangay Daine 1</SelectItem>
                      <SelectItem value="daine_2" className="min-h-[40px]">Barangay Daine 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Staff / Admin Scope */}
                {(selectedRole === 'admin' || selectedRole === 'moderator') && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Staff Jurisdiction Scope</label>
                    <Select value={selectedRoleScope} onValueChange={(val: any) => setSelectedRoleScope(val)}>
                      <SelectTrigger className="min-h-[44px] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both" className="min-h-[40px]">Both Units (All Daine)</SelectItem>
                        <SelectItem value="daine_1" className="min-h-[40px]">Daine 1 Only</SelectItem>
                        <SelectItem value="daine_2" className="min-h-[40px]">Daine 2 Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border flex items-start gap-2.5 text-xs text-muted-foreground">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>
                  Elevating a user to <strong>Admin</strong> or <strong>Official</strong> permits them to manage community documents, complaints, and directory data according to their assigned jurisdiction.
                </p>
              </div>

              <DialogFooter className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px] px-4 font-medium"
                  onClick={() => setSelectedUser(null)}
                  disabled={isSavingUser}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="min-h-[44px] px-5 font-semibold"
                  onClick={handleSaveUserAssignment}
                  disabled={isSavingUser}
                >
                  {isSavingUser ? 'Saving...' : 'Save Role & Jurisdiction'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
