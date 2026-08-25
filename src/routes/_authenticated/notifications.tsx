import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Bell,
  CheckCheck,
  FileText,
  ShieldAlert,
  Megaphone,
  Info,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent } from '#/components/ui/card'
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type AppNotification,
} from '#/server/notifications'

export const Route = createFileRoute('/_authenticated/notifications')({
  loader: () => getUserNotifications(),
  component: NotificationsPage,
})

export function NotificationsPage() {
  const initialData = Route.useLoaderData()
  const [notifications, setNotifications] = useState<AppNotification[]>(
    initialData?.notifications ?? []
  )
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const router = useRouter()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    try {
      await markNotificationAsRead({ data: { id } })
      router.invalidate()
    } catch {
      toast.error('Failed to update notification')
    }
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      await markAllNotificationsAsRead()
      toast.success('All notifications marked as read')
      router.invalidate()
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'complaint':
        return <ShieldAlert className="h-5 w-5 text-amber-500" />
      case 'announcement':
        return <Megaphone className="h-5 w-5 text-purple-500" />
      default:
        return <Info className="h-5 w-5 text-primary" />
    }
  }

  const displayedNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Notification Center
            </h1>
            <p className="text-sm text-muted-foreground">
              Stay informed with real-time alerts on your requests, blotter cases, and community updates.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 h-9 self-start sm:self-auto cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2" id="notification-filter-tabs">
        <Button
          id="notif-tab-all"
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="rounded-full text-xs font-semibold px-4 cursor-pointer"
        >
          All Notifications ({notifications.length})
        </Button>
        <Button
          id="notif-tab-unread"
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
          className="rounded-full text-xs font-semibold px-4 cursor-pointer"
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notification List */}
      {displayedNotifications.length === 0 ? (
        <Card className="py-16 text-center shadow-xs border-dashed">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
              <CheckCircle2 className="h-7 w-7 text-emerald-500 opacity-80" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {filter === 'unread'
                ? "You've read all your recent notifications."
                : 'When you submit document requests or incident reports, updates will appear here in real time.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3" id="notification-cards-list">
          {displayedNotifications.map((notif) => (
            <Card
              key={notif.id}
              className={`transition-all duration-200 border ${
                !notif.is_read
                  ? 'border-primary/40 bg-primary/5 dark:bg-primary/10 shadow-xs'
                  : 'hover:border-border/80 bg-card'
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-background border shadow-2xs shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm leading-snug ${
                          !notif.is_read
                            ? 'font-bold text-foreground'
                            : 'font-medium text-muted-foreground'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 bg-primary text-primary-foreground font-semibold"
                        >
                          New
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0" title={format(new Date(notif.created_at), 'PPP p')}>
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="text-sm text-foreground/85 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="pt-2 flex items-center justify-between gap-3 text-xs">
                    {notif.link ? (
                      <Link
                        to={notif.link}
                        onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold"
                      >
                        View Details <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <span />
                    )}

                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkRead(notif.id)}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 cursor-pointer"
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
