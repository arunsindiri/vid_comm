import { supabase } from '@/lib/supabase';

export type CommentWithAuthor = {
  id: string;
  video_id: string;
  user_id: string;
  parent_id: string | null;
  body: string | null;
  created_at: string;
  updated_at: string;
  cloudinary_public_id: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  timestamp_seconds: number | null;
  author: { id: string; username: string | null; avatar_url: string | null } | null;
};

export type NewComment = {
  body?: string | null;
  parent_id?: string | null;
  cloudinary_public_id?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  timestamp_seconds?: number | null;
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
  input: NewComment,
): Promise<{ comment: CommentWithAuthor | null; error: string | null }> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      user_id: userId,
      video_id: videoId,
      parent_id: input.parent_id ?? null,
      body: input.body ?? null,
      cloudinary_public_id: input.cloudinary_public_id ?? null,
      video_url: input.video_url ?? null,
      thumbnail_url: input.thumbnail_url ?? null,
      duration_seconds: input.duration_seconds ?? null,
      timestamp_seconds: input.timestamp_seconds ?? null,
    })
    .select('*, author:profiles!comments_user_profile_fkey(id, username, avatar_url)')
    .single();

  return { comment: data ?? null, error: error?.message ?? null };
}

const LIST_PAGE_SIZE = 50;

export async function loadAllComments(
  videoId: string,
): Promise<{ data: CommentWithAuthor[]; error: string | null }> {
  const out: CommentWithAuthor[] = [];
  let page = 0;
  for (;;) {
    const { data, error, hasMore } = await listComments({ videoId, page, limit: LIST_PAGE_SIZE });
    if (error) {
      return { data: out, error };
    }
    out.push(...data);
    if (!hasMore || out.length >= 2000) break;
    page += 1;
  }
  return { data: out, error: null };
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
