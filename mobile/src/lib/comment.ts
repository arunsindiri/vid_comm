import { supabase } from '@/lib/supabase';

export type CommentWithAuthor = {
  id: string;
  video_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author: { id: string; username: string | null; avatar_url: string | null } | null;
};

export async function listComments(options: {
  videoId: string;
  page?: number;
  limit?: number;
}): Promise<{ data: CommentWithAuthor[]; error: string | null; hasMore: boolean }> {
  const limit = options.limit ?? 20;
  const from = (options.page ?? 0) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!comments_user_profile_fkey(id, username, avatar_url)')
    .eq('video_id', options.videoId)
    .order('created_at', { ascending: true })
    .range(from, to);

  if (error) {
    return { data: [], error: error.message, hasMore: false };
  }

  return { data: data ?? [], error: null, hasMore: (data ?? []).length === limit };
}

export async function addComment(
  userId: string,
  videoId: string,
  body: string,
): Promise<{ comment: CommentWithAuthor | null; error: string | null }> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: userId, video_id: videoId, body })
    .select('*, author:profiles!comments_user_profile_fkey(id, username, avatar_url)')
    .single();

  return { comment: data ?? null, error: error?.message ?? null };
}

export async function updateComment(
  commentId: string,
  body: string,
): Promise<{ comment: CommentWithAuthor | null; error: string | null }> {
  const { data, error } = await supabase
    .from('comments')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .select('*, author:profiles!comments_user_profile_fkey(id, username, avatar_url)')
    .single();

  return { comment: data ?? null, error: error?.message ?? null };
}

export async function deleteComment(commentId: string): Promise<string | null> {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  return error?.message ?? null;
}
