import { createFileRoute, Link, Outlet, redirect } from '@tanstack/react-router'
import { getAuthSession } from '#/server/auth'
import { Store, Megaphone, Calendar, FileText, Phone, Users, LayoutDashboard, ShieldAlert } from 'lucide-react'

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
  { to: '/admin/businesses', icon: Store, label: 'Businesses' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/events', icon: Calendar, label: 'Events' },
  { to: '/admin/documents', icon: FileText, label: 'Doc Requests' },
  { to: '/admin/emergency', icon: Phone, label: 'Emergency' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/complaints', icon: ShieldAlert, label: 'Complaints' },
] as const

function AdminLayout() {
  return (
    <div className="flex flex-1 min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-card border-r shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-base">Admin Panel</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Barangay Daine</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              preload="intent"
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
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Mobile scrollable bottom nav */}
      <div className="md:hidden w-full fixed bottom-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl overflow-x-auto flex items-center gap-1 p-1.5 scrollbar-hide">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            preload="intent"
            className="flex-1 min-w-[72px] min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl text-muted-foreground text-[11px] font-medium transition-colors hover:text-foreground shrink-0 [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-bold"
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-[68px] text-center leading-none">{label}</span>
          </Link>
        ))}
      </div>

      <main className="flex-1 p-4 md:p-6 md:pb-6 pb-24 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
