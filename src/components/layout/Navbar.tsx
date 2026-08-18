import { useState, useRef, useEffect } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { Menu, X, Bell, LayoutDashboard, LogOut, User as UserIcon, Settings, Search, ShieldAlert, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '#/hooks/useAuth'
import { signOutFn, clearAuthCache } from '#/server/auth'
import { useRealtimeNotifications } from '#/hooks/useRealtimeNotifications'
import { useBarangayScope } from '#/hooks/useBarangayScope'
import { ThemeToggle } from '#/components/common/ThemeToggle'
import { GlobalSearchDialog } from '#/components/common/GlobalSearchDialog'

export function NavBar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { user, role, barangay, setUserState, refreshAuth } = useAuth()
  const { unreadCount, clearUnread } = useRealtimeNotifications(user?.id ?? null)
  const { scope, setScope } = useBarangayScope()

  const links = [
    { to: '/directory', label: 'Directory' },
    { to: '/announcements', label: 'Announcements' },
    { to: '/events', label: 'Events' },
    { to: '/documents', label: 'Documents' },
    { to: '/complaints', label: 'Incident Report' },
    { to: '/officials', label: 'Officials' },
    { to: '/map', label: 'GIS Map' },
    { to: '/emergency', label: 'Emergency' },
  ] as const

  // Close user menu on outside click or Escape
  useEffect(() => {
    if (!userMenuOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false)
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }, 10)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [userMenuOpen])

  async function handleSignOut() {
    try {
      setUserMenuOpen(false)
      clearAuthCache()
      setUserState(null, null)
      await signOutFn()
      await refreshAuth()
      await router.invalidate()
      toast.success('Signed out successfully')
      router.navigate({ to: '/' })
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const isAdmin = role === 'admin' || (role as string) === 'moderator'

  // Generate user initials for avatar
  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U'

  const formatBarangay = (b: string | null) => {
    if (b === 'daine_1') return 'Daine 1'
    if (b === 'daine_2') return 'Daine 2'
    return 'Daine'
  }

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
          <div className="hidden lg:flex items-center gap-0.5">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="min-h-[44px] flex items-center px-3 py-2 rounded-lg text-sm font-medium text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/10 transition-colors [&.active]:bg-white/15 [&.active]:text-primary-foreground [&.active]:font-semibold"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* User actions + mobile toggle */}
          <div className="flex items-center gap-2">
            {!user || role === 'admin' || role === 'moderator' ? (
              <div className="hidden md:flex items-center bg-white/10 p-1 rounded-lg mr-2">
                {(['all', 'daine1', 'daine2'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      scope === s
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-primary-foreground/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {s === 'all' ? 'All Daine' : s === 'daine1' ? 'Daine 1' : 'Daine 2'}
                  </button>
                ))}
              </div>
            ) : null}

            {user && role === 'resident' && (
              <div className="hidden md:flex items-center px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium text-white border border-white/20 mr-2 shadow-inner">
                Resident &bull; {formatBarangay(barangay)}
              </div>
            )}

            {user ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg text-sm text-primary-foreground/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </button>

                {/* Notifications */}
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

                <ThemeToggle />

                {/* User Avatar Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-label="User account menu"
                    className="inline-flex items-center gap-2 min-h-[44px] px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-white/30">
                      {userInitials}
                    </div>
                    <ChevronDown className={`h-3.5 w-3.5 text-primary-foreground/70 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-card text-card-foreground border border-border rounded-xl shadow-xl py-1 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                      <div className="px-3.5 py-2.5 border-b border-border/50">
                        <p className="text-sm font-semibold truncate text-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{role || 'Resident'}</p>
                      </div>

                      <div className="py-1">
                        {isAdmin ? (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
                          >
                            <LayoutDashboard className="h-4 w-4 text-amber-500" />
                            Admin Panel
                          </Link>
                        ) : (
                          <Link
                            to="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
                          >
                            <UserIcon className="h-4 w-4 text-primary" />
                            Dashboard
                          </Link>
                        )}

                        <Link
                          to="/settings/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <Settings className="h-4 w-4 text-muted-foreground" />
                          Profile Settings
                        </Link>

                        <Link
                          to="/complaints"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <ShieldAlert className="h-4 w-4 text-orange-500" />
                          My Incident Reports
                        </Link>
                      </div>

                      <div className="border-t border-border/50 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left font-medium cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg hover:bg-white/10 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div id="mobile-menu" className="lg:hidden bg-primary border-t border-white/10 pb-4 shadow-xl">
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
