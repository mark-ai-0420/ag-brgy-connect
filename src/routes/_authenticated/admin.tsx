import { useState } from 'react'
import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
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
} from 'lucide-react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '#/components/ui/sheet'

export const Route = createFileRoute('/_authenticated/admin')({
  beforeLoad: ({ context }) => {
    const role = (context as any).auth?.role
    if (role !== 'admin' && role !== 'moderator') {
      throw redirect({ to: '/' })
    }
  },
  component: AdminLayout,
})

const NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { to: '/admin/businesses', icon: Store, label: 'Businesses' },
  { to: '/admin/officials', icon: Users, label: 'Officials' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/events', icon: Calendar, label: 'Events' },
  { to: '/admin/documents', icon: FileText, label: 'Doc Requests' },
  { to: '/admin/emergency', icon: Phone, label: 'Emergency' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/complaints', icon: ShieldAlert, label: 'Complaints' },
] as const

const MOBILE_PRIMARY_TABS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { to: '/admin/documents', icon: FileText, label: 'Documents', exact: false },
  { to: '/admin/complaints', icon: ShieldAlert, label: 'Blotter', exact: false },
] as const

const SECONDARY_NAV_ITEMS = [
  { to: '/admin/businesses', icon: Store, label: 'Businesses' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/events', icon: Calendar, label: 'Events' },
  { to: '/admin/emergency', icon: Phone, label: 'Emergency' },
  { to: '/admin/users', icon: Users, label: 'Users & Roles' },
  { to: '/admin/officials', icon: Users, label: 'Barangay Officials' },
] as const

function AdminLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-1 min-h-screen">
      {/* Sidebar (Desktop) */}
      <aside className="w-60 bg-card border-r shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-base">Admin Panel</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Barangay Daine</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
            <Link
              key={to}
              to={to}
              preload="intent"
              activeOptions={{ exact: !!exact }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px] [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-semibold"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Link
            to="/"
            preload="intent"
            className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Mobile 4-Tab Bottom App Bar */}
      <div className="md:hidden w-full fixed bottom-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl flex items-center justify-around p-1.5">
        {MOBILE_PRIMARY_TABS.map(({ to, icon: Icon, label, exact }) => (
          <Link
            key={to}
            to={to}
            preload="intent"
            activeOptions={{ exact: !!exact }}
            className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 rounded-xl text-muted-foreground text-[11px] font-medium transition-colors hover:text-foreground [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-bold"
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-[72px] text-center leading-none">{label}</span>
          </Link>
        ))}

        {/* More Drawer Trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 rounded-xl text-muted-foreground text-[11px] font-medium transition-colors hover:text-foreground focus:outline-none"
            >
              <MoreHorizontal className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[72px] text-center leading-none">More...</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 pb-8">
            <SheetHeader className="p-0 pb-3 text-left">
              <SheetTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                More Admin Modules
              </SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2">
              {SECONDARY_NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                <SheetClose asChild key={to}>
                  <Link
                    to={to}
                    preload="intent"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl border bg-muted/40 hover:bg-muted text-sm font-medium text-foreground transition-colors [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:border-primary/40 min-h-[48px]"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{label}</span>
                  </Link>
                </SheetClose>
              ))}
            </div>
            <div className="pt-3 border-t mt-2">
              <SheetClose asChild>
                <Link
                  to="/"
                  preload="intent"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  Back to Public Site
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 p-4 md:p-6 md:pb-6 pb-24 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
