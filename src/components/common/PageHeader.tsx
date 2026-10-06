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
    <div className={cn('relative overflow-hidden rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-xs', className)}>
      
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          {badge && (
            <div className="inline-flex items-center">
              {badge}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
