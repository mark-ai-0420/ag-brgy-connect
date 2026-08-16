import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Input } from '#/components/ui/input'
import { toast } from 'sonner'
import { z } from 'zod'
import { format } from 'date-fns'
import { Users, Shield, User as UserIcon } from 'lucide-react'
import { useState } from 'react'

const ROLES = ['resident', 'business_owner', 'moderator', 'admin'] as const

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-amber-100 text-amber-800 border border-amber-300',
  moderator: 'bg-indigo-100 text-indigo-800 border border-indigo-300',
  business_owner: 'bg-blue-100 text-blue-800 border border-blue-300',
  resident: 'bg-slate-100 text-slate-700 border border-slate-300',
}

const getUsers = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()

  // Try relational embedding
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, address, created_at, user_roles(role)')
    .order('created_at', { ascending: false })

  type RoleJoin = { role: string }
  type ProfileWithRoles = {
    id: string
    full_name: string | null
    phone: string | null
    address: string | null
    created_at: string
    user_roles: RoleJoin | RoleJoin[] | null
  }

  if (!error && profiles) {
    return (profiles as unknown as ProfileWithRoles[]).map(p => {
      let role = 'resident'
      if (Array.isArray(p.user_roles) && p.user_roles.length > 0) {
        role = p.user_roles[0].role
      } else if (p.user_roles && typeof p.user_roles === 'object' && 'role' in p.user_roles) {
        role = (p.user_roles as RoleJoin).role
      }
      return {
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        address: p.address,
        created_at: p.created_at,
        role,
      }
    })
  }

  // Fallback to parallel fetch if relational embed fails
  const [{ data: profs }, { data: roles }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone, address, created_at').order('created_at', { ascending: false }),
    supabase.from('user_roles').select('user_id, role'),
  ])
  const roleMap = new Map((roles ?? []).map(r => [r.user_id, r.role]))
  return (profs ?? []).map(p => ({
    id: p.id,
    full_name: p.full_name,
    phone: p.phone,
    address: p.address,
    created_at: p.created_at,
    role: roleMap.get(p.id) ?? 'resident',
  }))
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

type UserRow = Awaited<ReturnType<typeof getUsers>>[number]

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

function AdminUsersRoute() {
  const users = Route.useLoaderData()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.address?.toLowerCase().includes(q)
    )
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
    acc[r] = users.filter(u => u.role === r).length
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View registered users and manage their roles.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{users.length} registered user{users.length !== 1 ? 's' : ''}</span>
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

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Search by name, phone, or address…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="min-h-[44px]"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-5">
          <CardTitle className="text-base font-semibold">All Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
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
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm">{search ? `No users matching "${search}".` : 'No users found.'}</p>
                    </TableCell>
                  </TableRow>
                ) : filtered.map(user => (
                  <TableRow key={user.id} className="hover:bg-muted/40">
                    <TableCell className="font-semibold text-sm">
                      {user.full_name ?? <span className="italic text-muted-foreground">No name set</span>}
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
