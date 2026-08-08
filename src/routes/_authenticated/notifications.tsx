import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { format } from 'date-fns'
import { Bell } from 'lucide-react'
import { Badge } from '#/components/ui/badge'

const getNotificationsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { user } = await getAuthSession()
    
    if (!user) {
      throw new Error('Not authenticated')
    }

    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('document_requests')
      .select('*')
      .eq('requester_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      throw error
    }

    return data
  })

export const Route = createFileRoute('/_authenticated/notifications')({
  component: NotificationsPage,
  loader: () => getNotificationsFn(),
})

const DOC_TYPE_LABELS: Record<string, string> = {
  barangay_clearance: 'Barangay Clearance',
  barangay_id: 'Barangay ID',
  certificate_of_residency: 'Certificate of Residency',
  certificate_of_indigency: 'Certificate of Indigency',
  business_permit: 'Business Permit',
  other: 'Document',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  in_review: 'outline',
  ready: 'default',
  completed: 'default',
  rejected: 'destructive',
}

function NotificationsPage() {
  const notifications = Route.useLoaderData()

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="w-8 h-8 text-blue-800" />
        <h1 className="text-3xl font-bold">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-4 border rounded-lg shadow-sm bg-card"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">
                    {DOC_TYPE_LABELS[notification.document_type] || 'Document Request'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(notification.updated_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANTS[notification.status] || 'secondary'} className="capitalize">
                  {notification.status.replace('_', ' ')}
                </Badge>
              </div>
              
              {notification.notes && (
                <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                  <span className="font-medium">Admin Note:</span> {notification.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
