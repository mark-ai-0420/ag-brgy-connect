import { ReactNode } from 'react'
import { CheckCircle, Clock, XCircle, AlertCircle, Shield, FileText, User as UserIcon, HelpCircle, Archive, Search, MapPin, Eye } from 'lucide-react'
import { cn } from '#/lib/utils'

export type StatusDomain = 'document' | 'business' | 'complaint' | 'role'

export type DocumentStatus = 'pending' | 'in_review' | 'ready' | 'completed' | 'rejected'
export type BusinessStatus = 'pending' | 'approved' | 'rejected' | 'archived'
export type ComplaintStatus = 'pending' | 'investigating' | 'scheduled_hearing' | 'resolved' | 'dismissed'
export type RoleStatus = 'admin' | 'moderator' | 'business_owner' | 'resident'

type AllStatuses = DocumentStatus | BusinessStatus | ComplaintStatus | RoleStatus

interface StatusBadgeProps {
  domain: StatusDomain
  status: AllStatuses
  className?: string
  icon?: boolean
}

const statusConfig: Record<StatusDomain, Partial<Record<AllStatuses, { label: string; icon: any; className: string }>>> = {
  document: {
    pending: { label: 'Pending', icon: Clock, className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
    in_review: { label: 'In Review', icon: Search, className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
    ready: { label: 'Ready for Pickup', icon: FileText, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
    completed: { label: 'Completed', icon: CheckCircle, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300' },
    rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' },
  },
  business: {
    pending: { label: 'Pending Review', icon: Clock, className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
    approved: { label: 'Approved', icon: CheckCircle, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
    rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' },
    archived: { label: 'Archived', icon: Archive, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300' },
  },
  complaint: {
    pending: { label: 'Pending', icon: Clock, className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' },
    investigating: { label: 'Investigating', icon: Search, className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
    scheduled_hearing: { label: 'Scheduled Hearing', icon: MapPin, className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' },
    resolved: { label: 'Resolved', icon: CheckCircle, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
    dismissed: { label: 'Dismissed', icon: XCircle, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300' },
  },
  role: {
    admin: { label: 'Admin', icon: Shield, className: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' },
    moderator: { label: 'Moderator', icon: Eye, className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
    business_owner: { label: 'Business Owner', icon: MapPin, className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' },
    resident: { label: 'Resident', icon: UserIcon, className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
  },
}

export function StatusBadge({ domain, status, className, icon = true }: StatusBadgeProps) {
  const config = statusConfig[domain]?.[status] || {
    label: String(status).replace(/_/g, ' '),
    icon: HelpCircle,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300',
  }
  
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider',
        config.className,
        className
      )}
    >
      {icon && <Icon className="w-3.5 h-3.5" />}
      {config.label}
    </span>
  )
}
