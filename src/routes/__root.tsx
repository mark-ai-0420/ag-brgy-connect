import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  Outlet,
  Link,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useState, useEffect } from 'react'
import { Menu, X, Bell } from 'lucide-react'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'
import { Toaster } from '#/components/ui/sonner'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

import { AuthProvider } from '#/hooks/useAuth'
import { clearAuthCache } from '#/server/auth'
import { useRealtimeNotifications } from '#/hooks/useRealtimeNotifications'

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'BrgyConnect | Barangay Daine, Indang, Cavite',
      },
      {
        name: 'description',
        content:
          "BrgyConnect — Official digital portal of Barangay Daine, Indang, Cavite for community services, document requests, announcements, and local business directory.",
      },
      {
        property: 'og:title',
        content: 'BrgyConnect | Barangay Daine, Indang, Cavite',
      },
      {
        property: 'og:description',
        content:
          "BrgyConnect — Official digital portal of Barangay Daine, Indang, Cavite for community services, document requests, announcements, and local business directory.",
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/logo.jpg',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
})

import { useAuth } from '#/hooks/useAuth'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { toast } from 'sonner'
import { LayoutDashboard, LogOut, User as UserIcon, Settings } from 'lucide-react'

// Server function — clears the session cookie server-side
const signOutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut()
  return { success: true }
})

function NavBar() {
  const [isOpen, setIsOpen] = useState(false)
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
      window.location.href = '/'
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
                {isAdmin ? (
                  <Link
                    to={"/admin/businesses" as any}
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
                  to={"/notifications" as any}
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
                  to={"/settings/profile" as any}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-white/10 transition-colors"
                  title="Profile Settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>
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
        <div className="md:hidden bg-primary border-t border-white/10 pb-4 shadow-xl">
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
                      to={"/admin/businesses" as any}
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
                    to={"/notifications" as any}
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
                    to={"/settings/profile" as any}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-lg text-base font-medium hover:bg-white/10 transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    My Profile
                  </Link>
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
    </nav>
  )
}

function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground py-8 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="BrgyConnect Logo" className="h-8 w-8 rounded-full object-cover grayscale opacity-70" />
          <span className="font-semibold text-sm">© {new Date().getFullYear()} Barangay Daine, Indang, Cavite. All rights reserved.</span>
        </div>
        <div className="flex gap-6 text-sm">
          <Link to={"/privacy" as any} className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to={"/terms" as any} className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  )
}

function RootComponent() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed silently
      })
    }
  }, [])

  return (
    <AuthProvider>
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </AuthProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <HeadContent />
      </head>
      <body className="h-full flex flex-col antialiased">
        {children}
        
        <Toaster richColors position="top-right" />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
