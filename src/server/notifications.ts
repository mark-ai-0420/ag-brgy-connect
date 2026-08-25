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

      if (userError || !user) {
        return {
          notifications: [],
          unreadCount: 0,
        };
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error || !data) {
        return {
          notifications: [],
          unreadCount: 0,
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
