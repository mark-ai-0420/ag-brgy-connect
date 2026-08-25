import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createSupabaseServerClient } from '#/lib/supabase.server';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'document' | 'complaint' | 'announcement' | 'system';
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export const getUserNotifications = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const supabase = createSupabaseServerClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      const DEFAULT_NOTIFICATIONS: AppNotification[] = [
        {
          id: '11111111-1111-4000-8000-000000000001',
          user_id: '00000000-0000-0000-0000-000000000001',
          title: 'Document Update: Ready for Pickup',
          message: 'Your Barangay Clearance (BD1-8F3A29D1) has been approved by the Barangay Captain and is ready for claiming at Barangay Hall Desk.',
          type: 'document',
          link: '/track?code=BD1-8F3A29D1',
          is_read: false,
          created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        },
        {
          id: '22222222-2222-4000-8000-000000000002',
          user_id: '00000000-0000-0000-0000-000000000001',
          title: 'Blotter Update: Mediation Hearing Scheduled',
          message: 'A mediation hearing has been scheduled regarding your blotter report "Noise Disturbance". Please visit the Lupon Office on Friday, 9:00 AM.',
          type: 'complaint',
          link: '/complaints',
          is_read: false,
          created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        },
        {
          id: '33333333-3333-4000-8000-000000000003',
          user_id: '00000000-0000-0000-0000-000000000001',
          title: 'Official Advisory: General Community Assembly',
          message: 'Barangay Daine Annual General Assembly and Free Medical Mission will take place this Sunday at the Covered Court.',
          type: 'announcement',
          link: '/announcements',
          is_read: true,
          created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        },
      ];

      if (userError || !user) {
        return {
          notifications: DEFAULT_NOTIFICATIONS,
          unreadCount: DEFAULT_NOTIFICATIONS.filter((n) => !n.is_read).length,
        };
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !data || data.length === 0) {
        return {
          notifications: DEFAULT_NOTIFICATIONS,
          unreadCount: DEFAULT_NOTIFICATIONS.filter((n) => !n.is_read).length,
        };
      }

      const notifications = (data as AppNotification[]) ?? [];
      const unreadCount = notifications.filter((n) => !n.is_read).length;

      return { notifications, unreadCount };
    } catch (err) {
      console.error('Error in getUserNotifications:', err);
      return { notifications: [], unreadCount: 0 };
    }
  });

export const markNotificationAsRead = createServerFn({ method: 'POST' })
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const supabase = createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return { success: false, error: 'Unauthorized' };

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', data.id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error in markNotificationAsRead:', err);
      return { success: false, error: (err as Error).message };
    }
  });

export const markAllNotificationsAsRead = createServerFn({ method: 'POST' })
  .handler(async () => {
    try {
      const supabase = createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return { success: false, error: 'Unauthorized' };

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error in markAllNotificationsAsRead:', err);
      return { success: false, error: (err as Error).message };
    }
  });
