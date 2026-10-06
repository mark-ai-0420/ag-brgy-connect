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
  Check,
  SearchCheck,
  Building2,
  Locate,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '#/hooks/useAuth'
import { useTenant } from '#/lib/tenant/TenantContext'
import { findNearestBarangay, getCurrentDeviceLocation } from '#/lib/tenant/geoMatch'
import { signOutFn, clearAuthCache } from '#/server/auth'
import { useRealtimeNotifications } from '#/hooks/useRealtimeNotifications'
import { useBarangayScope, type BarangayScope } from '#/hooks/useBarangayScope'
import { ThemeToggle } from '#/components/common/ThemeToggle'
import { GlobalSearchDialog } from '#/components/common/GlobalSearchDialog'
import { NotificationBell } from '#/components/notifications/NotificationBell'

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
  const { barangays, activeBarangay, setTenantSlug } = useTenant()

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

  const [isLocating, setIsLocating] = useState(false)

  async function handleLocateMe() {
    setIsLocating(true)
    try {
      const coords = await getCurrentDeviceLocation()
      const match = findNearestBarangay(coords.lat, coords.lng, barangays)
      if (match) {
        await setTenantSlug(match.barangay.slug)
        setScope(
          match.barangay.slug === 'daine-1'
            ? 'daine1'
            : match.barangay.slug === 'daine-2'
              ? 'daine2'
              : match.barangay.slug
        )
        setScopeOpen(false)
        setIsOpen(false)
        toast.success(
          `Detected location! Switched to ${match.barangay.name} (~${match.distanceFormatted} away)`
        )
      } else {
        toast.info('No registered barangay found within proximity.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Unable to detect location. Please select manually.')
    } finally {
      setIsLocating(false)
    }
  }

  const isAdmin = role === 'admin' || (role as string) === 'moderator' || (role as string) === 'super_admin'
  const isSuperAdmin = (role as string) === 'super_admin'

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U'

  const formatBarangay = (b: string | null) => {
    if (!b) return activeBarangay.short_name
    const found = barangays.find((item) => item.id === b || item.slug === b)
    if (found) return found.short_name
    if (b === 'daine_1') return 'Daine 1'
    if (b === 'daine_2') return 'Daine 2'
    return b
  }

  const currentScopeLabel = scope === 'all'
    ? 'All Barangays'
    : (barangays.find((item) => item.slug === scope || item.id === scope)?.short_name ||
       (scope === 'daine1' ? 'Daine 1' : scope === 'daine2' ? 'Daine 2' : activeBarangay.short_name))

  return (
    <nav aria-label="Main Navigation" className="bg-[#0C2B64] dark:bg-[#07142E] text-white shadow-md sticky top-0 z-50 border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 min-h-[44px] py-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 group">
              <img
                src="/logo.jpg"
                alt="BrgyConnect Logo"
                width="36"
                height="36"
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/40 shadow-sm group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-base leading-tight tracking-tight text-white">BrgyConnect</span>
                <span className="text-xs text-white/80 font-medium leading-none tracking-wide">Barangay Daine &bull; Indang, Cavite</span>
              </div>
            </Link>
          </div>

          {/* Center: Streamlined Navigation Links */}
          <div className="hidden lg:flex items-center gap-2">
            
            {/* Services / Staff Desk Dropdown */}
            <div className="relative" ref={servicesRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={servicesOpen}
                onClick={() => {
                  setServicesOpen((prev) => !prev)
                  setCommunityOpen(false)
                  setScopeOpen(false)
                }}
                className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10 cursor-pointer active:scale-[0.98] ${
                  servicesOpen ? 'bg-white/15 text-white border-white/15' : 'text-white'
                }`}
              >
                {isAdmin ? 'Staff Desk' : 'Services'}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>

              {servicesOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-card text-card-foreground border border-border rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                  {isAdmin ? (
                    <>
                      <Link
                        to="/admin/documents"
                        onClick={() => setServicesOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
                      >
                        <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">Document Issuance & Approvals</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Certificates, clearances & permits</p>
                        </div>
                      </Link>

                      <Link
                        to="/admin/complaints"
                        onClick={() => setServicesOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
                      >
                        <div className="p-2 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">Blotter & Incident Triage</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Disputes, mediation & reports</p>
                        </div>
                      </Link>

                      <Link
                        to="/admin/businesses"
                        onClick={() => setServicesOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
                      >
                        <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">Business Directory Triage</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Merchant listings & permits</p>
                        </div>
                      </Link>

                      <Link
                        to="/admin/users"
                        onClick={() => setServicesOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
                      >
                        <div className="p-2 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">User Directory & Roles</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Resident accounts & permissions</p>
                        </div>
                      </Link>

                      {isSuperAdmin && (
                        <Link
                          to="/admin/barangays"
                          onClick={() => setServicesOpen(false)}
                          className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
                        >
                          <div className="p-2 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-tight">Barangay Registry</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Pluggable multi-tenant manager</p>
                          </div>
                        </Link>
                      )}
                    </>
                  ) : (
                    <>
                      <Link
                        to="/documents"
                        onClick={() => setServicesOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
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
                        to="/track"
                        onClick={() => setServicesOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
                      >
                        <div className="p-2 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                          <SearchCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">Track Document</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Public status checker</p>
                        </div>
                      </Link>

                      <Link
                        to="/complaints"
                        onClick={() => setServicesOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
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
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
                      >
                        <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">Business Directory</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Local shops & services</p>
                        </div>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Community Dropdown */}
            <div className="relative" ref={communityRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={communityOpen}
                onClick={() => {
                  setCommunityOpen((prev) => !prev)
                  setServicesOpen(false)
                  setScopeOpen(false)
                }}
                className={`min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10 cursor-pointer active:scale-[0.98] ${
                  communityOpen ? 'bg-white/15 text-white border-white/15' : 'text-white'
                }`}
              >
                Community
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${communityOpen ? 'rotate-180' : ''}`} />
              </button>

              {communityOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-card text-card-foreground border border-border rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                  <Link
                    to="/announcements"
                    onClick={() => setCommunityOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
                  >
                    <div className="p-2 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                      <Megaphone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold leading-tight">Announcements & News</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Barangay bulletins & alerts</p>
                    </div>
                  </Link>

                  <Link
                    to="/events"
                    onClick={() => setCommunityOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
                  >
                    <div className="p-2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
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
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
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
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors group min-h-[44px]"
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
              className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#B91C1C] hover:bg-[#991B1B] active:bg-[#7F1D1D] transition-all shadow-sm btn-tactile cursor-pointer"
            >
              <PhoneCall className="h-4 w-4 text-white" />
              Emergency
            </Link>
          </div>

          {/* Right Controls: Compact Scope Filter + Quick Search + Actions */}
          <div className="flex items-center gap-2">
            
            {/* Compact Barangay Scope Switcher (For Guests, Admins, Super Admins) */}
            {(!user || isAdmin) ? (
              <div className="relative hidden sm:block" ref={scopeRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={scopeOpen}
                  onClick={() => {
                    setScopeOpen((prev) => !prev)
                    setServicesOpen(false)
                    setCommunityOpen(false)
                  }}
                  className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-xs font-semibold text-white transition-all border border-white/20 cursor-pointer shadow-xs btn-tactile backdrop-blur-md"
                  aria-label={`${currentScopeLabel} - Select Barangay View`}
                >
                  <MapPin className="h-3.5 w-3.5 text-[#FCD116]" />
                  <span>{currentScopeLabel}</span>
                  <ChevronDown className={`h-3 w-3 text-white/80 transition-transform duration-200 ${scopeOpen ? 'rotate-180' : ''}`} />
                </button>

                {scopeOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-card text-card-foreground border border-border rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                    <div className="p-1 mb-1 border-b border-border">
                      <button
                        type="button"
                        onClick={handleLocateMe}
                        disabled={isLocating}
                        className="w-full flex items-center gap-2 min-h-[40px] px-2.5 py-1.5 text-xs rounded-lg font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer disabled:opacity-50"
                        title="Use device GPS to detect closest barangay"
                      >
                        {isLocating ? (
                          <Loader2 className="h-4 w-4 animate-spin text-sky-600 dark:text-sky-400 shrink-0" />
                        ) : (
                          <Locate className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                        )}
                        <div className="text-left">
                          <span className="block leading-tight font-bold">Locate Me (GPS)</span>
                          <span className="block text-xs text-muted-foreground font-normal">Detect nearest barangay</span>
                        </div>
                      </button>
                    </div>

                    <p className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Select Barangay Jurisdiction
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setScope('all')
                        setScopeOpen(false)
                      }}
                      className={`w-full flex items-center justify-between min-h-[44px] px-3 py-2 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                        scope === 'all'
                          ? 'bg-primary/10 text-primary font-bold shadow-xs'
                          : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                      }`}
                    >
                      <span>All Barangays</span>
                      {scope === 'all' && <Check className="h-4 w-4 text-primary font-bold" />}
                    </button>
                    {barangays.map((b) => {
                      const isSelected = scope !== 'all' && (activeBarangay.id === b.id || scope === b.slug || (scope === 'daine1' && b.slug === 'daine-1') || (scope === 'daine2' && b.slug === 'daine-2'))
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setTenantSlug(b.slug)
                            setScope(b.slug === 'daine-1' ? 'daine1' : b.slug === 'daine-2' ? 'daine2' : b.slug)
                            setScopeOpen(false)
                          }}
                          className={`w-full flex items-center justify-between min-h-[44px] px-3 py-2 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 text-primary font-bold shadow-xs'
                              : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                          }`}
                        >
                          <div className="text-left">
                            <span className="block font-medium">{b.name}</span>
                            <span className="block text-xs text-muted-foreground">{b.code_prefix} &bull; {b.municipality}</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary font-bold ml-2 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {/* Resident Scope Badge */}
            {user && role === 'resident' && (
              <div className="hidden sm:flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl bg-white/10 text-xs font-medium text-white border border-white/20 shadow-inner backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Resident &bull; {formatBarangay(barangay)}</span>
              </div>
            )}

            {/* Search (⌘K) - Accessible via mobile drawer & desktop header */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/20 shadow-sm transition-all btn-tactile backdrop-blur-md cursor-pointer"
              aria-label="Search portal (Command K)"
              title="Search (⌘K)"
            >
              <Search className="h-4 w-4 text-white/90" />
              <kbd className="hidden sm:inline-flex pointer-events-none h-5 select-none items-center gap-0.5 rounded-md border border-white/30 bg-white/15 px-1.5 font-mono text-[11px] font-bold text-white shadow-xs">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            {/* Notifications Popover Drawer */}
            <NotificationBell userId={user?.id} />

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
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-2 py-1 rounded-xl hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/40 shadow-xs">
                    {userInitials}
                  </div>
                  <ChevronDown className={`h-3 w-3 text-white/80 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-card text-card-foreground border border-border rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                    <div className="px-3.5 py-2.5 border-b border-border/50">
                      <p className="text-sm font-semibold truncate text-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{role || 'Resident'}</p>
                    </div>

                    <div className="py-1">
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors font-medium min-h-[44px]"
                        >
                          <LayoutDashboard className="h-4 w-4 text-amber-500" />
                          Admin Console
                        </Link>
                      ) : (
                        <Link
                          to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors font-medium min-h-[44px]"
                        >
                          <UserIcon className="h-4 w-4 text-primary" />
                          Resident Dashboard
                        </Link>
                      )}

                      <Link
                        to="/settings/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px]"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Profile Settings
                      </Link>

                      {!isAdmin && (
                        <Link
                          to="/complaints"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors min-h-[44px]"
                        >
                          <ShieldAlert className="h-4 w-4 text-orange-500" />
                          My Incident Reports
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-border/50 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left font-medium cursor-pointer min-h-[44px]"
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
                className="hidden sm:inline-flex items-center min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#0C2B64] hover:bg-white/90 active:bg-white/80 shadow-md transition-all btn-tactile cursor-pointer"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl hover:bg-white/10 active:bg-white/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div id="mobile-menu" className="lg:hidden bg-[#0C2B64] dark:bg-[#07142E] border-t border-white/15 pb-6 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="px-4 pt-3 space-y-4">
            
            {/* Mobile Scope Selector */}
            {(!user || isAdmin) && (
              <div className="glass-dock p-3 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/20 space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-extrabold text-white tracking-wider flex items-center gap-1.5 uppercase">
                    <MapPin className="h-3.5 w-3.5 text-[#FCD116]" />
                    Barangay Jurisdiction
                  </p>
                  <span className="text-[11px] text-white/80 font-bold">{currentScopeLabel}</span>
                </div>

                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  className="w-full flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 text-xs font-bold rounded-xl bg-sky-500/25 hover:bg-sky-500/35 active:bg-sky-500/40 text-white border border-sky-400/30 transition-all btn-tactile cursor-pointer disabled:opacity-50"
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white shrink-0" />
                  ) : (
                    <Locate className="h-4 w-4 text-white shrink-0" />
                  )}
                  <span>{isLocating ? 'Detecting via GPS...' : 'Locate Me (Detect Nearest Barangay)'}</span>
                </button>

                <div className="flex flex-wrap gap-1.5 p-1 bg-black/25 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setScope('all')}
                    className={`min-h-[44px] flex-1 min-w-[85px] flex items-center justify-center px-2 py-2 text-xs font-bold rounded-lg transition-all btn-tactile cursor-pointer ${
                      scope === 'all'
                        ? 'bg-white text-[#0C2B64] shadow-sm'
                        : 'text-white/85 hover:text-white hover:bg-white/10 active:bg-white/15'
                    }`}
                  >
                    All Barangays
                  </button>
                  {barangays.map((b) => {
                    const isSelected = scope !== 'all' && (activeBarangay.id === b.id || scope === b.slug || (scope === 'daine1' && b.slug === 'daine-1') || (scope === 'daine2' && b.slug === 'daine-2'))
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setTenantSlug(b.slug)
                          setScope(b.slug === 'daine-1' ? 'daine1' : b.slug === 'daine-2' ? 'daine2' : b.slug)
                        }}
                        className={`min-h-[44px] flex-1 min-w-[85px] flex items-center justify-center px-2 py-2 text-xs font-bold rounded-lg transition-all btn-tactile cursor-pointer ${
                          isSelected
                            ? 'bg-white text-[#0C2B64] shadow-sm'
                            : 'text-white/85 hover:text-white hover:bg-white/10 active:bg-white/15'
                        }`}
                      >
                        {b.short_name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Group 1: Navigation / Services / Admin Quick Links */}
            {isAdmin ? (
              <div>
                <p className="text-[11px] font-bold text-white/75 uppercase tracking-wider mb-1.5 px-2">
                  Staff Desk & Administration
                </p>
                <div className="space-y-1">
                  {isSuperAdmin && (
                    <Link
                      to="/admin/barangays"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                    >
                      <Building2 className="h-4 w-4 text-emerald-200" />
                      Barangay Registry
                    </Link>
                  )}
                  <Link
                    to="/admin/documents"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <FileText className="h-4 w-4 text-blue-200" />
                    Document Issuance & Approvals
                  </Link>
                  <Link
                    to="/admin/complaints"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <ShieldAlert className="h-4 w-4 text-orange-200" />
                    Blotter & Incident Triage
                  </Link>
                  <Link
                    to="/admin/businesses"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <Store className="h-4 w-4 text-emerald-200" />
                    Business Directory Triage
                  </Link>
                  <Link
                    to="/admin/users"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <Users className="h-4 w-4 text-sky-200" />
                    User Directory & Roles
                  </Link>
                  <Link
                    to="/admin/officials"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <Users className="h-4 w-4 text-blue-200" />
                    Barangay Officials
                  </Link>
                  <Link
                    to="/admin/announcements"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <Megaphone className="h-4 w-4 text-sky-200" />
                    Announcements Manager
                  </Link>
                  <Link
                    to="/admin/events"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <Calendar className="h-4 w-4 text-amber-200" />
                    Events Manager
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[11px] font-bold text-white/75 uppercase tracking-wider mb-1.5 px-2">
                  Services
                </p>
                <div className="space-y-1">
                  <Link
                    to="/documents"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <FileText className="h-4 w-4 text-blue-200" />
                    Request Documents
                  </Link>
                  <Link
                    to="/track"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <SearchCheck className="h-4 w-4 text-cyan-200" />
                    Track Document Status
                  </Link>
                  <Link
                    to="/complaints"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <ShieldAlert className="h-4 w-4 text-orange-200" />
                    Incident & Blotter Report
                  </Link>
                  <Link
                    to="/directory"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <Store className="h-4 w-4 text-emerald-200" />
                    Business Directory
                  </Link>
                </div>
              </div>
            )}

            {/* Group 2: Community */}
            <div>
              <p className="text-[11px] font-bold text-white/75 uppercase tracking-wider mb-1.5 px-2">
                Community & Information
              </p>
              <div className="space-y-1">
                <Link
                  to="/announcements"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                >
                  <Megaphone className="h-4 w-4 text-sky-200" />
                  Announcements
                </Link>
                <Link
                  to="/events"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                >
                  <Calendar className="h-4 w-4 text-amber-200" />
                  Events Calendar
                </Link>
                <Link
                  to="/officials"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                >
                  <Users className="h-4 w-4 text-blue-200" />
                  Barangay Officials
                </Link>
                <Link
                  to="/map"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                >
                  <MapPin className="h-4 w-4 text-emerald-200" />
                  GIS Map & Evacuation
                </Link>
                <Link
                  to="/emergency"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-bold text-white bg-[#B91C1C] hover:bg-[#991B1B] active:bg-[#7F1D1D] transition-colors"
                >
                  <PhoneCall className="h-4 w-4 text-white" />
                  Emergency Hotlines
                </Link>
              </div>
            </div>

            {/* Group 3: User Auth / Profile */}
            <div className="pt-3 border-t border-white/15 space-y-1.5">
              {user ? (
                <>
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-bold bg-[#FCD116] text-[#0C2B64] hover:bg-[#ebd500] active:bg-[#d9c400] transition-colors btn-tactile"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Admin Console
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                    >
                      <UserIcon className="h-4 w-4 text-white" />
                      Resident Dashboard
                    </Link>
                  )}
                  <Link
                    to="/notifications"
                    onClick={() => { setIsOpen(false); clearUnread() }}
                    className="flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <Bell className="h-4 w-4 text-white" />
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
                    className="flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-white/10 active:bg-white/15 transition-colors text-white"
                  >
                    <Settings className="h-4 w-4 text-white" />
                    My Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      handleSignOut()
                    }}
                    className="w-full flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold hover:bg-red-500/20 active:bg-red-500/30 text-red-200 hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth/sign-in"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-[#0C2B64] hover:bg-white/95 active:bg-white/90 transition-all shadow-md btn-tactile cursor-pointer"
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
