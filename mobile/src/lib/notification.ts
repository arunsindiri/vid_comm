import { supabase } from '@/lib/supabase';

export type NotificationType = 'like' | 'follow' | 'comment' | 'reply' | 'mention';

export type AppNotification = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  video_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
  actor: { id: string; username: string | null; avatar_url: string | null } | null;
};

export async function listNotifications(options: {
  userId: string;
  page?: number;
  limit?: number;
}): Promise<{ data: AppNotification[]; error: string | null; hasMore: boolean }> {
  const limit = options.limit ?? 20;
  const from = (options.page ?? 0) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles(id, username, avatar_url)')
    .eq('recipient_id', options.userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { data: [], error: error.message, hasMore: false };
  }

  return { data: data ?? [], error: null, hasMore: (data ?? []).length === limit };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('read', false);
  return error ? 0 : (count ?? 0);
}

export async function markAllRead(userId: string): Promise<string | null> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('recipient_id', userId)
    .eq('read', false);
  return error?.message ?? null;
}

export async function markRead(notificationId: string): Promise<string | null> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  return error?.message ?? null;
}

export function subscribeNotifications(
  userId: string,
  onNew: (notification: AppNotification) => void,
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}:${Math.random().toString(36).slice(2, 10)}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        onNew(payload.new as AppNotification);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
