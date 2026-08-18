import { useState, useRef, useEffect } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import {
  Menu,
  X,
  Bell,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Settings,
  Search,
  ShieldAlert,
  ChevronDown,
  FileText,
  Store,
  Megaphone,
  Calendar,
  Users,
  MapPin,
  PhoneCall,
  Check
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '#/hooks/useAuth'
import { signOutFn, clearAuthCache } from '#/server/auth'
import { useRealtimeNotifications } from '#/hooks/useRealtimeNotifications'
import { useBarangayScope, type BarangayScope } from '#/hooks/useBarangayScope'
import { ThemeToggle } from '#/components/common/ThemeToggle'
import { GlobalSearchDialog } from '#/components/common/GlobalSearchDialog'

export function NavBar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  
  // Desktop Dropdown states
  const [servicesOpen, setServicesOpen] = useState(false)
  const [communityOpen, setCommunityOpen] = useState(false)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const servicesRef = useRef<HTMLDivElement>(null)
  const communityRef = useRef<HTMLDivElement>(null)
  const scopeRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { user, role, barangay, setUserState, refreshAuth } = useAuth()
  const { unreadCount, clearUnread } = useRealtimeNotifications(user?.id ?? null)
  const { scope, setScope } = useBarangayScope()

  // Close all open menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (servicesRef.current && !servicesRef.current.contains(target)) {
        setServicesOpen(false)
      }
      if (communityRef.current && !communityRef.current.contains(target)) {
        setCommunityOpen(false)
      }
      if (scopeRef.current && !scopeRef.current.contains(target)) {
        setScopeOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setServicesOpen(false)
        setCommunityOpen(false)
        setScopeOpen(false)
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

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

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U'

  const formatBarangay = (b: string | null) => {
    if (b === 'daine_1') return 'Daine 1'
    if (b === 'daine_2') return 'Daine 2'
    return 'Daine'
  }

  const scopeLabels: Record<BarangayScope, string> = {
    all: 'All Daine',
    daine1: 'Daine 1',
    daine2: 'Daine 2'
  }

  return (
    <nav className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 min-h-[44px] py-1">
              <img
                src="/logo.jpg"
                alt="BrgyConnect Logo"
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/30"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-base leading-tight tracking-tight">BrgyConnect</span>
                <span className="text-[10px] text-primary-foreground/75 leading-none">Barangay Daine</span>
              </div>
            </Link>
          </div>

          {/* Center: Streamlined Navigation Links */}
          <div className="hidden lg:flex items-center gap-1.5">
            
            {/* Services Dropdown */}
            <div className="relative" ref={servicesRef}>
              <button
                type="button"
                onClick={() => {
                  setServicesOpen((prev) => !prev)
                  setCommunityOpen(false)
                  setScopeOpen(false)
                }}
                className={`min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 hover:text-white ${
                  servicesOpen ? 'bg-white/15 text-white' : 'text-primary-foreground/90'
                }`}
              >
                Services
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>

              {servicesOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-card text-card-foreground border border-border rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                  <Link
                    to="/documents"
                    onClick={() => setServicesOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">Request Documents</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Clearances & Certificates</p>
                    </div>
                  </Link>

                  <Link
                    to="/complaints"
                    onClick={() => setServicesOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">Incident & Blotter Report</p>
                      <p className="text-xs text-muted-foreground mt-0.5">File & track disputes</p>
                    </div>
                  </Link>

                  <Link
                    to="/directory"
                    onClick={() => setServicesOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Store className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">Business Directory</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Local shops & services</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Community Dropdown */}
            <div className="relative" ref={communityRef}>
              <button
                type="button"
                onClick={() => {
                  setCommunityOpen((prev) => !prev)
                  setServicesOpen(false)
                  setScopeOpen(false)
                }}
                className={`min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10 hover:text-white ${
                  communityOpen ? 'bg-white/15 text-white' : 'text-primary-foreground/90'
                }`}
              >
                Community
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${communityOpen ? 'rotate-180' : ''}`} />
              </button>

              {communityOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-card text-card-foreground border border-border rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                  <Link
                    to="/announcements"
                    onClick={() => setCommunityOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">Announcements</p>
                      <p className="text-xs text-muted-foreground mt-0.5">News & official updates</p>
                    </div>
                  </Link>

                  <Link
                    to="/events"
                    onClick={() => setCommunityOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">Events Calendar</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Community activities</p>
                    </div>
                  </Link>

                  <Link
                    to="/officials"
                    onClick={() => setCommunityOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">Barangay Officials</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Daine 1 & Daine 2 Leaders</p>
                    </div>
                  </Link>

                  <Link
                    to="/map"
                    onClick={() => setCommunityOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group"
                  >
                    <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">Interactive GIS Map</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Landmarks & evacuation</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Emergency Direct Link */}
            <Link
              to="/emergency"
              className="min-h-[40px] flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-200 hover:text-white hover:bg-red-500/20 transition-colors [&.active]:bg-red-500/30 [&.active]:text-white font-semibold"
            >
              <PhoneCall className="h-3.5 w-3.5 text-red-300" />
              Emergency
            </Link>
          </div>

          {/* Right Controls: Compact Scope Filter + Quick Search + Actions */}
          <div className="flex items-center gap-2">
            
            {/* Compact Barangay Scope Switcher (For Guests and Admins) */}
            {(!user || role === 'admin' || role === 'moderator') ? (
              <div className="relative" ref={scopeRef}>
                <button
                  type="button"
                  onClick={() => {
                    setScopeOpen((prev) => !prev)
                    setServicesOpen(false)
                    setCommunityOpen(false)
                  }}
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors border border-white/15 cursor-pointer shadow-sm"
                  aria-label="Filter Barangay Scope"
                >
                  <MapPin className="h-3.5 w-3.5 text-yellow-300" />
                  <span>{scopeLabels[scope]}</span>
                  <ChevronDown className={`h-3 w-3 text-white/70 transition-transform duration-200 ${scopeOpen ? 'rotate-180' : ''}`} />
                </button>

                {scopeOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card text-card-foreground border border-border rounded-xl shadow-xl p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Select Barangay View
                    </p>
                    {(['all', 'daine1', 'daine2'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setScope(s)
                          setScopeOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                          scope === s
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                        }`}
                      >
                        <span>{s === 'all' ? 'All Daine' : s === 'daine1' ? 'Barangay Daine 1' : 'Barangay Daine 2'}</span>
                        {scope === s && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Resident Scope Badge */}
            {user && role === 'resident' && (
              <div className="hidden sm:flex items-center px-2.5 py-1 rounded-full bg-white/15 text-xs font-medium text-white border border-white/20 shadow-inner">
                Resident &bull; {formatBarangay(barangay)}
              </div>
            )}

            {/* Search (⌘K) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 min-h-[38px] px-2.5 py-1.5 rounded-lg text-sm text-primary-foreground/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Search (⌘K)"
            >
              <Search className="h-4 w-4" />
              <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-0.5 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            {/* Notifications (Logged In) */}
            {user && (
              <Link
                to="/notifications"
                onClick={() => clearUnread()}
                className="relative inline-flex items-center justify-center min-h-[38px] min-w-[38px] rounded-lg hover:bg-white/10 transition-colors"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Avatar Dropdown / Sign-In Button */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="User account menu"
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-2 py-1 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-white/30">
                    {userInitials}
                  </div>
                  <ChevronDown className={`h-3 w-3 text-primary-foreground/70 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
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
                          Resident Dashboard
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
            ) : (
              <Link
                to="/auth/sign-in"
                className="hidden sm:inline-flex items-center min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#0038A8] hover:bg-white/90 shadow-sm transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
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

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div id="mobile-menu" className="lg:hidden bg-primary border-t border-white/10 pb-5 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="px-4 pt-3 space-y-4">
            
            {/* Mobile Scope Selector */}
            {(!user || role === 'admin' || role === 'moderator') && (
              <div className="bg-white/10 p-2 rounded-xl">
                <p className="text-[10px] font-bold text-primary-foreground/75 uppercase tracking-wider mb-2 px-1">
                  Active Barangay Jurisdiction
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {(['all', 'daine1', 'daine2'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setScope(s)}
                      className={`py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        scope === s
                          ? 'bg-white text-primary font-bold shadow-sm'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      {s === 'all' ? 'All' : s === 'daine1' ? 'Daine 1' : 'Daine 2'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Group 1: Services */}
            <div>
              <p className="text-[10px] font-bold text-primary-foreground/75 uppercase tracking-wider mb-1 px-2">
                Services
              </p>
              <div className="space-y-0.5">
                <Link
                  to="/documents"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <FileText className="h-4 w-4 text-blue-200" />
                  Request Documents
                </Link>
                <Link
                  to="/complaints"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <ShieldAlert className="h-4 w-4 text-orange-200" />
                  Incident & Blotter Report
                </Link>
                <Link
                  to="/directory"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <Store className="h-4 w-4 text-emerald-200" />
                  Business Directory
                </Link>
              </div>
            </div>

            {/* Group 2: Community */}
            <div>
              <p className="text-[10px] font-bold text-primary-foreground/75 uppercase tracking-wider mb-1 px-2">
                Community
              </p>
              <div className="space-y-0.5">
                <Link
                  to="/announcements"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <Megaphone className="h-4 w-4 text-purple-200" />
                  Announcements
                </Link>
                <Link
                  to="/events"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <Calendar className="h-4 w-4 text-pink-200" />
                  Events Calendar
                </Link>
                <Link
                  to="/officials"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <Users className="h-4 w-4 text-blue-200" />
                  Barangay Officials
                </Link>
                <Link
                  to="/map"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-emerald-200" />
                  GIS Map
                </Link>
                <Link
                  to="/emergency"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-bold text-red-200 hover:bg-red-500/20 transition-colors"
                >
                  <PhoneCall className="h-4 w-4 text-red-300" />
                  Emergency Hotlines
                </Link>
              </div>
            </div>

            {/* Group 3: User Auth / Profile */}
            <div className="pt-2 border-t border-white/10 space-y-1">
              {user ? (
                <>
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm font-semibold bg-amber-400 text-amber-950 hover:bg-amber-300 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                    >
                      <UserIcon className="h-4 w-4" />
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/notifications"
                    onClick={() => { setIsOpen(false); clearUnread() }}
                    className="flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    <Bell className="h-4 w-4" />
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
                    className="flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      handleSignOut()
                    }}
                    className="w-full flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-white/10 text-red-200 hover:text-white transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm font-semibold bg-white text-[#0038A8] hover:bg-white/90 transition-colors shadow-sm"
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
