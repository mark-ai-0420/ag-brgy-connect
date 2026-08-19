import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { toast } from 'sonner'
import { z } from 'zod'
import { format } from 'date-fns'
import { Users, Shield, User as UserIcon, MapPin, Building2 } from 'lucide-react'
import { useState } from 'react'

const ROLES = ['resident', 'business_owner', 'moderator', 'admin'] as const

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  moderator: 'bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  business_owner: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  resident: 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
}

const getUsers = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const { user, role, admin_scope } = await getAuthSession()
  if (!user || (role !== 'admin' && role !== 'moderator')) {
    throw new Error('Unauthorized')
  }

  const adminScope = admin_scope ?? 'both'

  // Query profiles with scoping
  let query = supabase
    .from('profiles')
    .select('id, full_name, phone, address, barangay, created_at, user_roles(role)')
    .order('created_at', { ascending: false })

  if (adminScope !== 'both') {
    query = query.eq('barangay', adminScope)
  }

  const { data: profiles, error } = await query

  type RoleJoin = { role: string }
  type ProfileWithRoles = {
    id: string
    full_name: string | null
    phone: string | null
    address: string | null
    barangay: string | null
    created_at: string
    user_roles: RoleJoin | RoleJoin[] | null
  }

  if (!error && profiles) {
    const formatted = (profiles as unknown as ProfileWithRoles[]).map(p => {
      let userRole = 'resident'
      if (Array.isArray(p.user_roles) && p.user_roles.length > 0) {
        userRole = p.user_roles[0].role
      } else if (p.user_roles && typeof p.user_roles === 'object' && 'role' in p.user_roles) {
        userRole = (p.user_roles as RoleJoin).role
      }
      return {
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        address: p.address,
        barangay: p.barangay ?? 'daine_1',
        created_at: p.created_at,
        role: userRole,
      }
    })
    return { users: formatted, adminScope }
  }

  // Fallback to parallel fetch if relational embed fails
  let fallbackQuery = supabase
    .from('profiles')
    .select('id, full_name, phone, address, barangay, created_at')
    .order('created_at', { ascending: false })

  if (adminScope !== 'both') {
    fallbackQuery = fallbackQuery.eq('barangay', adminScope)
  }

  const [{ data: profs }, { data: roles }] = await Promise.all([
    fallbackQuery,
    supabase.from('user_roles').select('user_id, role'),
  ])
  const roleMap = new Map((roles ?? []).map(r => [r.user_id, r.role]))
  const formatted = (profs ?? []).map(p => ({
    id: p.id,
    full_name: p.full_name,
    phone: p.phone,
    address: p.address,
    barangay: p.barangay ?? 'daine_1',
    created_at: p.created_at,
    role: roleMap.get(p.id) ?? 'resident',
  }))

  return { users: formatted, adminScope }
})

const setUserRole = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ user_id: z.string(), role: z.enum(['admin', 'moderator', 'business_owner', 'resident']) }).parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: data.user_id, role: data.role }, { onConflict: 'user_id' })
    if (error) throw new Error(error.message)
    return { success: true }
  })

export const Route = createFileRoute('/_authenticated/admin/users')({
  component: AdminUsersRoute,
  loader: () => getUsers(),
})

type UserRow = Awaited<ReturnType<typeof getUsers>>['users'][number]

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${ROLE_COLORS[role] ?? ROLE_COLORS.resident}`}>
      {role === 'admin' || role === 'moderator'
        ? <Shield className="h-3 w-3" />
        : <UserIcon className="h-3 w-3" />}
      {role.replace(/_/g, ' ')}
    </span>
  )
}

function BarangayBadge({ barangay }: { barangay: string }) {
  if (barangay === 'daine_2') {
    return (
      <Badge variant="outline" className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
        Daine 2
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-[11px] font-semibold text-blue-700 bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
      Daine 1
    </Badge>
  )
}

function AdminUsersRoute() {
  const { users, adminScope } = Route.useLoaderData()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [barangayFilter, setBarangayFilter] = useState<'all' | 'daine_1' | 'daine_2'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchesSearch =
      u.full_name?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.address?.toLowerCase().includes(q)

    const matchesBarangay =
      barangayFilter === 'all' ? true : u.barangay === barangayFilter

    return matchesSearch && matchesBarangay
  })

  async function handleRoleChange(userId: string, role: string) {
    setUpdatingId(userId)
    try {
      await setUserRole({ data: { user_id: userId, role } })
      toast.success('Role updated successfully')
      router.invalidate()
    } catch {
      toast.error('Failed to update role')
    } finally {
      setUpdatingId(null)
    }
  }

  const roleCounts = ROLES.reduce<Record<string, number>>((acc, r) => {
    acc[r] = filtered.filter(u => u.role === r).length
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {adminScope === 'both' 
              ? 'View and manage registered residents and staff across all barangay units.'
              : `View and manage registered residents for Barangay ${adminScope === 'daine_1' ? 'Daine 1' : 'Daine 2'}.`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border rounded-lg px-3 py-1.5">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{filtered.length}</span>
          <span>resident{filtered.length !== 1 ? 's' : ''} listed</span>
        </div>
      </div>

      {/* Role summary chips */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map(r => (
          <div key={r} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize border ${ROLE_COLORS[r]}`}>
            {r.replace(/_/g, ' ')}
            <span className="bg-background/60 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              {roleCounts[r] ?? 0}
            </span>
          </div>
        ))}
      </div>

      {/* Search and Unit Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:max-w-sm">
          <Input
            placeholder="Search by name, phone, or address…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        {adminScope === 'both' && (
          <div className="flex bg-muted p-1 rounded-lg shrink-0 border">
            {(['all', 'daine_1', 'daine_2'] as const).map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setBarangayFilter(b)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  barangayFilter === b
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {b === 'all' ? 'All Units' : b === 'daine_1' ? 'Barangay Daine 1' : 'Barangay Daine 2'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-5">
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Resident & Staff Accounts</span>
            {adminScope !== 'both' && (
              <BarangayBadge barangay={adminScope} />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm">{search ? `No users matching "${search}".` : 'No users found in this jurisdiction.'}</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.map(user => (
                  <TableRow key={user.id} className="hover:bg-muted/40">
                    <TableCell className="font-semibold text-sm">
                      {user.full_name ?? <span className="italic text-muted-foreground">No name set</span>}
                    </TableCell>
                    <TableCell>
                      <BarangayBadge barangay={user.barangay} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.phone
                        ? <a href={`tel:${user.phone}`} className="hover:underline text-primary">{user.phone}</a>
                        : <span className="italic">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                      {user.address ?? <span className="italic">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={role => handleRoleChange(user.id, role)}
                        disabled={updatingId === user.id}
                      >
                        <SelectTrigger className="w-40 min-h-[40px] text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(r => (
                            <SelectItem key={r} value={r} className="min-h-[40px] capitalize">
                              {r.replace(/_/g, ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

