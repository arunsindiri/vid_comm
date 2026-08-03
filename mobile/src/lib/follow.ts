import { supabase } from '@/lib/supabase';

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) {
    console.warn('Failed to check follow state:', error.message);
    return false;
  }
  return data != null;
}

export async function follow(followerId: string, followingId: string): Promise<string | null> {
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
  return error?.message ?? null;
}

export async function unfollow(followerId: string, followingId: string): Promise<string | null> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  return error?.message ?? null;
}

export async function getFollowCounts(profileId: string): Promise<{
  followers: number;
  following: number;
  error: string | null;
}> {
  const { count: followers, error: fErr } = await supabase
    .from('follows')
    .select('following_id', { count: 'exact', head: true })
    .eq('following_id', profileId);

  const { count: following, error: gErr } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('follower_id', profileId);

  if (fErr || gErr) {
    return { followers: 0, following: 0, error: (fErr ?? gErr)?.message ?? null };
  }
  return { followers: followers ?? 0, following: following ?? 0, error: null };
}
