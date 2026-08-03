import { supabase } from '@/lib/supabase';
import { type VideoWithCreator } from '@/lib/video';

export type SearchUser = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
};

function sanitize(query: string) {
  return query.replace(/[%_]/g, '');
}

export async function searchVideos(
  query: string,
  limit = 20
): Promise<{ data: VideoWithCreator[]; error: string | null }> {
  const q = sanitize(query.trim());
  if (!q) return { data: [], error: null };

  const { data, error } = await supabase
    .from('videos')
    .select('*, creator:profiles!videos_user_profile_fkey(id, username, avatar_url)')
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: data ?? [], error: null };
}

export async function searchUsers(
  query: string,
  limit = 20
): Promise<{ data: SearchUser[]; error: string | null }> {
  const q = sanitize(query.trim());
  if (!q) return { data: [], error: null };

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, bio, avatar_url')
    .ilike('username', `%${q}%`)
    .order('username')
    .limit(limit);

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: data ?? [], error: null };
}
