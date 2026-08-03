import { supabase } from '@/lib/supabase';

export async function getLikeCount(videoId: string): Promise<number> {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);
  return error ? 0 : (count ?? 0);
}

export async function hasLiked(userId: string, videoId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();
  return !error && data != null;
}

export async function like(userId: string, videoId: string): Promise<string | null> {
  const { error } = await supabase.from('likes').insert({ user_id: userId, video_id: videoId });
  return error?.message ?? null;
}

export async function unlike(userId: string, videoId: string): Promise<string | null> {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId);
  return error?.message ?? null;
}
