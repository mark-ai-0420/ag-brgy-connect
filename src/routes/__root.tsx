import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  Outlet,
  Link,
  useRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useState, useEffect } from 'react'
import { Menu, X, Bell } from 'lucide-react'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'
import { Toaster } from '#/components/ui/sonner'
import { ThemeToggle } from '#/components/common/ThemeToggle'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

import { AuthProvider } from '#/hooks/useAuth'
import { clearAuthCache } from '#/server/auth'
import { useRealtimeNotifications } from '#/hooks/useRealtimeNotifications'
import { BarangayScopeProvider } from '#/hooks/useBarangayScope'

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
        name: 'theme-color',
        content: '#0038A8',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'BrgyConnect',
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
        rel: 'apple-touch-icon',
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

import { NavBar } from '#/components/layout/Navbar'
import { Footer } from '#/components/layout/Footer'
import { EmergencySpeedDial } from '#/components/emergency/EmergencySpeedDial'
import { KaDaineChatbot } from '#/components/chat/KaDaineChatbot'
import { SessionTimeoutModal } from '#/components/auth/SessionTimeoutModal'
import { OfflineIndicator } from '#/components/common/OfflineIndicator'
import { PWAInstallBanner } from '#/components/common/PWAInstallBanner'

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
      <BarangayScopeProvider>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground">Skip to main content</a>
        <OfflineIndicator />
        <NavBar />
        <main id="main-content" className="flex-1 pb-28 md:pb-0">
          <Outlet />
        </main>
        <Footer />
        <PWAInstallBanner />
        <EmergencySpeedDial />
        <KaDaineChatbot />
        <SessionTimeoutModal />
      </BarangayScopeProvider>
    </AuthProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="h-full flex flex-col antialiased">
        {children}
        
        <Toaster richColors position="top-right" />
        <TanStackDevtools
          config={{
            position: 'top-left',
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
