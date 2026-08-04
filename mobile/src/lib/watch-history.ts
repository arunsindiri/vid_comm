import { supabase } from '@/lib/supabase';
import type { VideoWithCreator } from '@/lib/video';

export type HistoryEntry = {
  video_id: string;
  last_position_seconds: number;
  duration_seconds: number | null;
  updated_at: string;
  video: VideoWithCreator | null;
};

function withLikes(entry: any): HistoryEntry {
  const video = entry?.video;
  return {
    video_id: entry.video_id,
    last_position_seconds: entry.last_position_seconds ?? 0,
    duration_seconds: entry.duration_seconds ?? null,
    updated_at: entry.updated_at,
    video: video
      ? {
          ...video,
          likes_count: (video.likes?.[0]?.count ?? 0) as number,
          likes: undefined,
        }
      : null,
  };
}

export async function recordProgress(
  userId: string,
  videoId: string,
  positionSeconds: number,
  durationSeconds: number | null,
): Promise<string | null> {
  const { error } = await supabase.from('watch_history').upsert(
    {
      user_id: userId,
      video_id: videoId,
      last_position_seconds: positionSeconds,
      duration_seconds: durationSeconds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,video_id' },
  );
  return error?.message ?? null;
}

export async function getResumePosition(userId: string, videoId: string): Promise<number> {
  const { data, error } = await supabase
    .from('watch_history')
    .select('last_position_seconds')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();

  if (error || !data) return 0;
  return data.last_position_seconds ?? 0;
}

export async function listWatchHistory(
  userId: string,
  limit = 12,
): Promise<{ data: HistoryEntry[]; error: string | null }> {
  const { data, error } = await supabase
    .from('watch_history')
    .select(
      `video_id, last_position_seconds, duration_seconds, updated_at, ` +
        `video:videos!watch_history_video_id_fkey(*, ` +
        `creator:profiles!videos_user_profile_fkey(id, username, avatar_url), ` +
        `likes(count))`,
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: (data ?? []).map(withLikes), error: null };
}
