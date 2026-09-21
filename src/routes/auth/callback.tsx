import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { supabase } from '#/lib/supabase'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
})

function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuth = async () => {
      const { error } = await supabase.auth.getSession()
      if (error) {
        console.error('Auth error:', error.message)
        navigate({ to: '/auth/sign-in' })
        return
      }
      const searchParams = new URLSearchParams(window.location.search)
      const rawNext = searchParams.get('next') || '/dashboard'
      // Validate that next is a relative path starting with / and not // or protocol
      const safeNext = (rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.includes('\\'))
        ? rawNext
        : '/dashboard'
      navigate({ to: safeNext as any })
    }

    handleAuth()
  }, [navigate])

  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Authenticating...</h2>
        <p className="text-muted-foreground">Please wait while we verify your account.</p>
      </div>
    </main>
  )
}
