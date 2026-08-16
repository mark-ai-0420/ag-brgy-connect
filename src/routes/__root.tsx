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
import { NavBar } from '#/components/layout/Navbar'
import { Footer } from '#/components/layout/Footer'
import { EmergencySpeedDial } from '#/components/emergency/EmergencySpeedDial'
import { KaDaineChatbot } from '#/components/chat/KaDaineChatbot'

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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground">Skip to main content</a>
      <NavBar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <EmergencySpeedDial />
      <KaDaineChatbot />
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
