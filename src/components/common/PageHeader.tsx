import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

interface PageHeaderProps {
  badge?: ReactNode
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ badge, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8 sm:p-10', className)}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[length:32px_32px]" />
      <div className="absolute h-full w-full inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          {badge && (
            <div className="inline-flex items-center">
              {badge}
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
