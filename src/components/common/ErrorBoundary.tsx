import { useRouter } from '@tanstack/react-router'
import { Card, CardContent } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { AlertTriangle, Search, Loader2 } from 'lucide-react'

export function DefaultErrorComponent({ error }: { error: any }) {
  const router = useRouter()
  
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-sm border border-border/80">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-destructive/10 dark:bg-destructive/20 p-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground break-all">
              {error instanceof Error ? error.message : 'An unexpected error occurred.'}
            </p>
          </div>
          <div className="flex gap-3 w-full pt-2">
            <Button variant="outline" className="flex-1 min-h-[44px] h-11 font-bold" onClick={() => router.invalidate()}>
              Try Again
            </Button>
            <Button className="flex-1 min-h-[44px] h-11 font-bold" onClick={() => router.navigate({ to: '/' })}>
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
      <Card className="w-full max-w-md shadow-sm border-t-4 border-t-primary border-border/80">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Page Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The page you are looking for doesn't exist or has been moved.
            </p>
          </div>
          <Button className="w-full mt-2 min-h-[44px] h-11 font-bold" onClick={() => router.navigate({ to: '/' })}>
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
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Loading...</p>
    </div>
  )
}
