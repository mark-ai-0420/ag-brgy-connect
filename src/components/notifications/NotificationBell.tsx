import { useState, useEffect, type MouseEvent } from 'react'
import { Bell, CheckCheck, FileText, ShieldAlert, Megaphone, Info, ExternalLink } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { ScrollArea } from '#/components/ui/scroll-area'
import { supabase } from '#/lib/supabase'
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type AppNotification,
} from '#/server/notifications'

interface NotificationBellProps {
  userId?: string
  className?: string
}

export function NotificationBell({ userId, className = '' }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')
  const navigate = useNavigate()

  // Fetch initial notifications
  const loadNotifications = async () => {
    try {
      const res = await getUserNotifications()
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification
          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)])
          setUnreadCount((prev) => prev + 1)

          // Play subtle browser chime or toast notification
          toast.info(newNotif.title, {
            description: newNotif.message,
            duration: 5000,
            action: newNotif.link
              ? {
                  label: 'View',
                  onClick: () => {
                    if (newNotif.link) {
                      navigate({ to: newNotif.link })
                    }
                  },
                }
              : undefined,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, navigate])

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      markNotificationAsRead({ data: { id: notif.id } }).catch(console.error)
    }

    setIsOpen(false)
    if (notif.link) {
      navigate({ to: notif.link })
    }
  }

  const handleMarkAllRead = async (e: MouseEvent) => {
    e.stopPropagation()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    try {
      await markAllNotificationsAsRead()
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4 text-blue-500 shrink-0" />
      case 'complaint':
        return <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-emerald-500 shrink-0" />
      default:
        return <Info className="h-4 w-4 text-primary shrink-0" />
    }
  }

  const displayedNotifications =
    activeFilter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="View notifications"
          className={`relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg hover:bg-white/10 text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#CE1126] text-[10px] font-bold text-white shadow-sm ring-2 ring-primary">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 md:w-96 p-0 shadow-xl border-border bg-popover text-popover-foreground rounded-xl"
      >
        <div className="p-4 pb-2 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[11px] px-1.5 py-0 font-semibold bg-primary/10 text-primary">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 flex items-center gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Switcher */}
        <div className="px-3 py-1.5 border-b bg-muted/30 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
              activeFilter === 'all'
                ? 'bg-background shadow-xs text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
              activeFilter === 'unread'
                ? 'bg-background shadow-xs text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* List of Notifications */}
        <ScrollArea className="max-h-[360px] divide-y divide-border/40">
          {displayedNotifications.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-muted/60 mx-auto flex items-center justify-center mb-2 text-muted-foreground">
                <Bell className="h-5 w-5 opacity-60" />
              </div>
              <p className="text-xs font-medium text-foreground">No notifications yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {activeFilter === 'unread'
                  ? "You've read all your recent notifications."
                  : 'You will receive alerts here when certificate requests or blotter reports update.'}
              </p>
            </div>
          ) : (
            displayedNotifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-3.5 cursor-pointer flex items-start gap-3 rounded-none focus:bg-accent/50 ${
                  !notif.is_read ? 'bg-primary/5 dark:bg-primary/10' : ''
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-md bg-background border shadow-2xs">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p
                      className={`text-xs leading-tight truncate ${
                        !notif.is_read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'
                      }`}
                    >
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground/80">
                    <span>
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>
                    {notif.link && (
                      <span className="flex items-center gap-0.5 text-primary hover:underline">
                        View <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
