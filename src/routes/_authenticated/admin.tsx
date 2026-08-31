import { useState } from 'react'
import { createFileRoute, Link, Outlet, redirect, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard,
  FileText,
  ShieldAlert,
  MoreHorizontal,
  Store,
  Megaphone,
  Calendar,
  Phone,
  Users,
  ArrowLeft,
  Building2,
  Shield,
  Layers,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  FileCheck,
  History,
  Activity,
  UserCheck,
  Radio,
  SlidersHorizontal,
} from 'lucide-react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '#/components/ui/sheet'
import { Badge } from '#/components/ui/badge'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { useAuth } from '#/hooks/useAuth'

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: ({ context }) => {
    const role = (context as any).auth?.role
    if (role !== 'admin' && role !== 'moderator') {
      throw redirect({ to: '/' })
    }
  },
  component: AdminLayout,
})

// Primary mobile bottom nav items (4-Tab Bar)
const MOBILE_PRIMARY_TABS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true, tag: 'Deck' },
  { to: '/admin/documents', icon: FileText, label: 'Documents', exact: false, tag: 'Triage' },
  { to: '/admin/complaints', icon: ShieldAlert, label: 'Blotter', exact: false, tag: 'Cases' },
] as const

// Desktop Sidebar grouped navigation
const NAV_GROUPS = [
  {
    group: 'Operations & Triage',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Executive Overview', exact: true, badge: 'Deck' },
      { to: '/admin/documents', icon: FileText, label: 'Document Requests', exact: false, badge: 'Live' },
      { to: '/admin/complaints', icon: ShieldAlert, label: 'Incident Blotter', exact: false, badge: 'Cases' },
    ],
  },
  {
    group: 'Civic Services & MSME',
    items: [
      { to: '/admin/businesses', icon: Store, label: 'MSME Businesses', exact: false },
      { to: '/admin/announcements', icon: Megaphone, label: 'Civic Advisories', exact: false },
      { to: '/admin/events', icon: Calendar, label: 'Community Events', exact: false },
    ],
  },
  {
    group: 'Governance & Security',
    items: [
      { to: '/admin/officials', icon: Users, label: 'Barangay Officials', exact: false },
      { to: '/admin/emergency', icon: Phone, label: 'Emergency Dispatch', exact: false },
      { to: '/admin/users', icon: Shield, label: 'Users & Permissions', exact: false },
    ],
  },
] as const

// Slide-over drawer items for More... tab
const MORE_DRAWER_ITEMS = [
  {
    to: '/admin/businesses',
    icon: Store,
    title: 'MSME Businesses',
    description: 'Review registrations, permit status & business directory',
    badge: 'MSME',
  },
  {
    to: '/admin/users',
    icon: Shield,
    title: 'Users & Permissions',
    description: 'Resident accounts, staff roles & admin privileges',
    badge: 'Access',
  },
  {
    to: '/admin/officials',
    icon: Users,
    title: 'Barangay Officials',
    description: 'Council members, committees & public directory',
    badge: 'Council',
  },
  {
    to: '/admin/announcements',
    icon: Megaphone,
    title: 'Civic Advisories',
    description: 'Publish broadcasts, alerts & emergency updates',
    badge: 'News',
  },
  {
    to: '/admin/events',
    icon: Calendar,
    title: 'Community Events',
    description: 'Barangay assemblies, medical missions & scheduling',
    badge: 'Calendar',
  },
  {
    to: '/admin/emergency',
    icon: Phone,
    title: 'Emergency Contacts',
    description: 'Hotline numbers, responders & dispatch contacts',
    badge: '911',
  },
  {
    to: '/admin/users',
    icon: History,
    title: 'Audit & Access Log',
    description: 'Administrative actions, security sessions & logs',
    badge: 'Logs',
  },
] as const

function AdminLayout() {
  const [open, setOpen] = useState(false)
  const { user, role, barangay, admin_scope } = useAuth()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  // Scope state (Daine 1 vs Daine 2 vs All)
  const initialScope = admin_scope === 'daine_2' ? 'daine_2' : admin_scope === 'daine_1' ? 'daine_1' : 'all'
  const [selectedScope, setSelectedScope] = useState<'daine_1' | 'daine_2' | 'all'>(initialScope as any)

  const userName = (user?.user_metadata as any)?.full_name || user?.email?.split('@')[0] || 'Staff Officer'
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SO'

  const roleLabel = role === 'admin' ? 'Administrator' : role === 'moderator' ? 'Moderator' : 'Staff'

  // Check if current route is active
  const isTabActive = (to: string, exact?: boolean) => {
    if (exact) {
      return currentPath === to || currentPath === `${to}/`
    }
    return currentPath.startsWith(to)
  }

  return (
    <div className="flex flex-1 min-h-screen bg-background">
      {/* ── Desktop Sidebar Navigation (>= 1024px) ──────────────────────────────────── */}
      <aside className="w-64 xl:w-72 bg-card border-r border-border shrink-0 hidden lg:flex flex-col shadow-sm select-none">
        {/* Civic Horizon Accent Header */}
        <div className="relative border-b border-border/80 p-4 bg-card/60 backdrop-blur-xs">
          {/* Flag Tricolor Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <div className="w-[45%] bg-[#0038A8]" />
            <div className="w-[10%] bg-[#FCD116]" />
            <div className="w-[45%] bg-[#CE1126]" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0038A8] to-[#1a52c8] flex items-center justify-center text-white shadow-md shadow-blue-600/20 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-sm tracking-tight text-foreground truncate">
                  Civic Horizon
                </h2>
                <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 bg-primary/10 text-primary border-primary/25 uppercase">
                  Admin
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate font-medium">
                Barangay Operations Portal
              </p>
            </div>
          </div>
        </div>

        {/* ── Scope Selector (Daine 1 vs Daine 2 vs All) ────────────────────────── */}
        <div className="p-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3 text-primary" />
              Jurisdiction Scope
            </span>
            <span className="text-[10px] font-medium text-primary px-1.5 py-0.2 bg-primary/10 rounded-sm">
              {selectedScope === 'all' ? 'Consolidated' : selectedScope === 'daine_1' ? 'Daine 1' : 'Daine 2'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-muted/70 p-1 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setSelectedScope('all')}
              className={`min-h-[34px] text-xs font-semibold rounded-lg transition-all flex items-center justify-center px-1.5 cursor-pointer ${
                selectedScope === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedScope('daine_1')}
              className={`min-h-[34px] text-xs font-semibold rounded-lg transition-all flex items-center justify-center px-1.5 cursor-pointer ${
                selectedScope === 'daine_1'
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
              }`}
            >
              Daine 1
            </button>
            <button
              type="button"
              onClick={() => setSelectedScope('daine_2')}
              className={`min-h-[34px] text-xs font-semibold rounded-lg transition-all flex items-center justify-center px-1.5 cursor-pointer ${
                selectedScope === 'daine_2'
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
              }`}
            >
              Daine 2
            </button>
          </div>
        </div>

        {/* ── Grouped Navigation Links with High-Contrast Active States ────────── */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto" aria-label="Admin Navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1">
                {group.group}
              </div>
              {group.items.map(({ to, icon: Icon, label, exact, badge }) => (
                <Link
                  key={to}
                  to={to}
                  preload="intent"
                  activeOptions={{ exact: !!exact }}
                  className="group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/70 [&.active]:bg-primary [&.active]:text-primary-foreground [&.active]:font-bold [&.active]:shadow-sm [&.active]:shadow-primary/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span className="truncate">{label}</span>
                  </div>
                  {badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground group-[.active]:bg-primary-foreground/20 group-[.active]:text-primary-foreground">
                      {badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Staff User Profile Card ────────────────────────────────────────── */}
        <div className="p-3 border-t border-border/80 bg-muted/20 space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-card border border-border/70 shadow-xs">
            <Avatar className="h-9 w-9 border border-primary/20 shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-foreground truncate">{userName}</p>
                <Badge
                  variant={role === 'admin' ? 'default' : 'secondary'}
                  className={`text-[9px] font-bold px-1.5 py-0 shrink-0 uppercase ${
                    role === 'admin'
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white border-none'
                  }`}
                >
                  {roleLabel}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5 font-medium">
                <MapPin className="h-3 w-3 text-primary shrink-0" />
                {barangay === 'daine_2' ? 'Brgy Daine 2' : 'Brgy Daine 1'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <Link
              to="/dashboard"
              preload="intent"
              className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors min-h-[44px] border border-border/50 text-center"
              title="Citizen Dashboard"
            >
              <UserCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate">My Portal</span>
            </Link>
            <Link
              to="/"
              preload="intent"
              className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors min-h-[44px] border border-border/50 text-center"
              title="Back to Public Site"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Site Home</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Fixed 4-Tab Bottom App Bar on Mobile (< 1024px / lg:hidden) ─────────── */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden w-full fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl px-2 py-1.5 flex items-center justify-around"
      >
        {MOBILE_PRIMARY_TABS.map(({ to, icon: Icon, label, exact }) => {
          const active = isTabActive(to, exact)
          return (
            <Link
              key={to}
              to={to}
              preload="intent"
              activeOptions={{ exact: !!exact }}
              className="flex-1 min-h-[50px] flex flex-col items-center justify-center gap-1 py-1 rounded-xl text-muted-foreground text-[11px] font-semibold transition-all relative hover:text-foreground touch-target [&.active]:text-primary [&.active]:font-extrabold"
            >
              <div className="relative flex items-center justify-center">
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    active ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                </div>
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card animate-pulse" />
                )}
              </div>
              <span className="truncate max-w-[76px] text-center leading-none tracking-tight">
                {label}
              </span>
            </Link>
          )
        })}

        {/* 4th Tab: Radix Sheet Trigger for More... */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex-1 min-h-[50px] flex flex-col items-center justify-center gap-1 py-1 rounded-xl text-muted-foreground text-[11px] font-semibold transition-all hover:text-foreground focus:outline-none touch-target cursor-pointer"
            >
              <div className="p-1 rounded-lg text-muted-foreground">
                <MoreHorizontal className="h-5 w-5 shrink-0" />
              </div>
              <span className="truncate max-w-[76px] text-center leading-none tracking-tight">
                More...
              </span>
            </button>
          </SheetTrigger>

          {/* Radix Sheet / Slide-Over Drawer */}
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[88vh] overflow-y-auto p-4 pb-8 sm:max-w-xl sm:mx-auto border-t-2 border-primary/20">
            {/* Sheet Tricolor Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 flex rounded-t-3xl overflow-hidden">
              <div className="w-[45%] bg-[#0038A8]" />
              <div className="w-[10%] bg-[#FCD116]" />
              <div className="w-[45%] bg-[#CE1126]" />
            </div>

            <SheetHeader className="p-0 pt-2 pb-2 text-left space-y-1">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
                  <Building2 className="h-5 w-5 text-primary" />
                  Civic Horizon Modules
                </SheetTitle>
                <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/25">
                  {roleLabel}
                </Badge>
              </div>
              <SheetDescription className="text-xs text-muted-foreground">
                Access governance modules, registry records, and emergency services.
              </SheetDescription>
            </SheetHeader>

            {/* Scope quick toggle inside drawer */}
            <div className="my-2 p-2.5 rounded-xl bg-muted/40 border border-border/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  Active Scope:
                </span>
                <span className="text-primary font-bold">
                  {selectedScope === 'all' ? 'All Barangays' : selectedScope === 'daine_1' ? 'Barangay Daine 1' : 'Barangay Daine 2'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedScope('all')}
                  className={`min-h-[38px] text-xs font-semibold rounded-lg transition-all flex items-center justify-center px-2 cursor-pointer ${
                    selectedScope === 'all'
                      ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  All Scope
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedScope('daine_1')}
                  className={`min-h-[38px] text-xs font-semibold rounded-lg transition-all flex items-center justify-center px-2 cursor-pointer ${
                    selectedScope === 'daine_1'
                      ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  Daine 1
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedScope('daine_2')}
                  className={`min-h-[38px] text-xs font-semibold rounded-lg transition-all flex items-center justify-center px-2 cursor-pointer ${
                    selectedScope === 'daine_2'
                      ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  Daine 2
                </button>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-1">
              {MORE_DRAWER_ITEMS.map(({ to, icon: Icon, title, description, badge }) => (
                <SheetClose asChild key={title}>
                  <Link
                    to={to}
                    preload="intent"
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-2xl border border-border/80 bg-card hover:bg-muted/60 text-foreground transition-all [&.active]:border-primary [&.active]:bg-primary/10 min-h-[56px] shadow-xs group cursor-pointer"
                  >
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-foreground truncate group-[.active]:text-primary">
                          {title}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-muted text-muted-foreground shrink-0">
                          {badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {description}
                      </p>
                    </div>
                  </Link>
                </SheetClose>
              ))}
            </div>

            {/* Quick Exit Links */}
            <div className="pt-3 border-t border-border/80 mt-2 grid grid-cols-2 gap-2">
              <SheetClose asChild>
                <Link
                  to="/dashboard"
                  preload="intent"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border/80 bg-card text-xs font-bold text-foreground hover:bg-muted transition-colors min-h-[44px]"
                >
                  <UserCheck className="h-4 w-4 text-primary shrink-0" />
                  Resident Dashboard
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  to="/"
                  preload="intent"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border/80 bg-card text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  Public Site
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </nav>

      {/* ── Main Content Outlet ──────────────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
