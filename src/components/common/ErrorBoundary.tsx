import { useRouter } from '@tanstack/react-router'
import { Card, CardContent } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { AlertTriangle, Search, Loader2 } from 'lucide-react'

export function DefaultErrorComponent({ error }: { error: any }) {
  const router = useRouter()
  
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
            <p className="text-sm text-slate-500 break-all">
              {error instanceof Error ? error.message : 'An unexpected error occurred.'}
            </p>
          </div>
          <div className="flex gap-3 w-full pt-2">
            <Button variant="outline" className="flex-1" onClick={() => router.invalidate()}>
              Try Again
            </Button>
            <Button className="flex-1" onClick={() => router.navigate({ to: '/' })}>
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DefaultNotFoundComponent() {
  const router = useRouter()
  
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-sm border-t-4 border-t-[#0038A8]">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-blue-50 p-4">
            <Search className="h-8 w-8 text-[#0038A8]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Page Not Found</h2>
            <p className="text-sm text-slate-500">
              The page you are looking for doesn't exist or has been moved.
            </p>
          </div>
          <Button className="w-full mt-2 bg-[#0038A8] hover:bg-[#002675]" onClick={() => router.navigate({ to: '/' })}>
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function DefaultPendingComponent() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-[#0038A8]" />
      <p className="text-sm font-medium text-slate-500">Loading...</p>
    </div>
  )
}
