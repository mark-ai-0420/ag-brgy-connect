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
      const next = searchParams.get('next') || '/dashboard'
      navigate({ to: next as any })
    }

    handleAuth()
  }, [navigate])

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Authenticating...</h2>
        <p className="text-muted-foreground">Please wait while we verify your account.</p>
      </div>
    </div>
  )
}
