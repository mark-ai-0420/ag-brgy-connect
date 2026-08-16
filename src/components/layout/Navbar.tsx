import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Menu, X, Bell, LayoutDashboard, LogOut, User as UserIcon, Settings, Search } from 'lucide-react'
import { toast } from 'sonner'
import { createServerFn } from '@tanstack/react-start'

import { useAuth } from '#/hooks/useAuth'
import { clearAuthCache } from '#/server/auth'
import { useRealtimeNotifications } from '#/hooks/useRealtimeNotifications'
import { ThemeToggle } from '#/components/common/ThemeToggle'
import { GlobalSearchDialog } from '#/components/common/GlobalSearchDialog'
import { createSupabaseServerClient } from '#/lib/supabase.server'

// Server function — clears the session cookie server-side
const signOutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut()
  return { success: true }
})

export function NavBar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user, role } = useAuth()
  const { unreadCount, clearUnread } = useRealtimeNotifications(user?.id ?? null)

  const links = [
    { to: '/directory', label: 'Directory' },
    { to: '/announcements', label: 'Announcements' },
    { to: '/events', label: 'Events' },
    { to: '/documents', label: 'Documents' },
    { to: '/officials', label: 'Officials' },
    { to: '/map', label: 'GIS Map' },
    { to: '/emergency', label: 'Emergency' },
  ] as const

  async function handleSignOut() {
    try {
      clearAuthCache()
      await signOutFn()
      toast.success('Signed out successfully')
      router.navigate({ to: '/' })
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const isAdmin = role === 'admin' || (role as string) === 'moderator'

  return (
    <nav className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 min-h-[44px] py-1">
            <img src="/logo.jpg" alt="BrgyConnect Logo" className="h-9 w-9 rounded-full object-cover ring-2 ring-white/30" />
            <div className="flex flex-col">
              <span className="font-extrabold text-base leading-tight tracking-tight">BrgyConnect</span>
              <span className="text-[10px] text-primary-foreground/75 leading-none">Barangay Daine</span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="min-h-[44px] flex items-center px-3.5 py-2 rounded-lg text-sm font-medium text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/10 transition-colors [&.active]:bg-white/15 [&.active]:text-primary-foreground [&.active]:font-semibold"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* User action + mobile toggle */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg text-sm text-primary-foreground/80 hover:text-white hover:bg-white/10 transition-colors mr-1"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden lg:inline-block">Search...</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </button>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg text-sm bg-amber-400 text-amber-950 hover:bg-amber-300 transition-colors font-semibold shadow-sm"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Admin Panel
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium bg-white/15 hover:bg-white/25 transition-colors"
                  >
                    <UserIcon className="h-4 w-4" />
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/notifications"
                  onClick={() => clearUnread()}
                  className="relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-white/10 transition-colors"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/settings/profile"
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-white/10 transition-colors"
                  title="Profile Settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>
                <ThemeToggle />
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 text-primary-foreground/80 hover:text-white transition-colors min-h-[44px]"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth/sign-in"
                className="hidden sm:inline-flex items-center min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold bg-white text-[#0038A8] hover:bg-white/90 shadow-sm transition-colors"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg hover:bg-white/10 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div id="mobile-menu" className="md:hidden bg-primary border-t border-white/10 pb-4 shadow-xl">
          <div className="px-4 pt-3 space-y-1">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-lg text-base font-medium hover:bg-white/10 transition-colors [&.active]:bg-white/15 [&.active]:font-bold"
              >
                {label}
              </Link>
            ))}
            <div className="pt-3 border-t border-white/10 mt-3 space-y-2">
              {user ? (
                <>
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-lg text-base font-semibold bg-amber-400 text-amber-950 hover:bg-amber-300 transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Admin Panel
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-lg text-base font-medium hover:bg-white/10 transition-colors"
                    >
                      <UserIcon className="h-5 w-5" />
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/notifications"
                    onClick={() => { setIsOpen(false); clearUnread() }}
                    className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-lg text-base font-medium hover:bg-white/10 transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white px-1.5">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/settings/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-lg text-base font-medium hover:bg-white/10 transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    My Profile
                  </Link>
                  <div className="flex px-3.5 py-1">
                    <ThemeToggle />
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      handleSignOut()
                    }}
                    className="w-full flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-lg text-base font-medium hover:bg-white/10 text-red-200 hover:text-white transition-colors text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center min-h-[44px] px-3.5 py-2.5 rounded-lg text-base font-semibold bg-white text-[#0038A8] hover:bg-white/90 transition-colors shadow-sm"
                >
                  Sign In to BrgyConnect
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </nav>
  )
}
