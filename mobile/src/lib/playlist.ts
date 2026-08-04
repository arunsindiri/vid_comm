import { supabase } from '@/lib/supabase';
import type { VideoWithCreator } from '@/lib/video';

export type Playlist = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  video_count: number;
};

export type PlaylistVideo = {
  video_id: string;
  added_at: string;
  video: VideoWithCreator | null;
};

export type PlaylistDetail = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  videos: PlaylistVideo[];
};

function withLikes(video: any): VideoWithCreator | null {
  if (!video) return null;
  return {
    ...video,
    likes_count: (video.likes?.[0]?.count ?? 0) as number,
    likes: undefined,
  };
}

export async function listPlaylists(
  userId: string,
): Promise<{ data: Playlist[]; error: string | null }> {
  const { data, error } = await supabase
    .from('playlists')
    .select('id, user_id, name, created_at, videos:playlist_videos(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }
  return {
    data: (data ?? []).map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      created_at: p.created_at,
      video_count: p.videos?.[0]?.count ?? 0,
    })),
    error: null,
  };
}

export async function getPlaylist(
  id: string,
): Promise<{ data: PlaylistDetail | null; error: string | null }> {
  const result = (await supabase
    .from('playlists')
    .select(
      `id, user_id, name, created_at, ` +
        `videos:playlist_videos(video_id, added_at, ` +
        `video:videos(*, creator:profiles!videos_user_profile_fkey(id, username, avatar_url), ` +
        `likes(count)))`,
    )
    .eq('id', id)
    .order('added_at', { ascending: true, foreignTable: 'playlist_videos' })
    .maybeSingle()) as { data: any; error: { message: string } | null };

  const { data, error } = result;
  if (error) {
    return { data: null, error: error.message };
  }
  if (!data) {
    return { data: null, error: null };
  }
  return {
    data: {
      id: data.id,
      user_id: data.user_id,
      name: data.name,
      created_at: data.created_at,
      videos: (data.videos ?? []).map((v: any) => ({
        video_id: v.video_id,
        added_at: v.added_at,
        video: withLikes(v.video),
      })),
    },
    error: null,
  };
}

export async function createPlaylist(
  userId: string,
  name: string,
): Promise<{ data: Playlist | null; error: string | null }> {
  const { data, error } = await supabase
    .from('playlists')
    .insert({ user_id: userId, name })
    .select('id, user_id, name, created_at')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }
  return { data: { ...data, video_count: 0 }, error: null };
}

export async function renamePlaylist(
  id: string,
  name: string,
): Promise<string | null> {
  const { error } = await supabase.from('playlists').update({ name }).eq('id', id);
  return error?.message ?? null;
}

export async function deletePlaylist(id: string): Promise<string | null> {
  const { error } = await supabase.from('playlists').delete().eq('id', id);
  return error?.message ?? null;
}

export async function addVideoToPlaylist(
  playlistId: string,
  videoId: string,
): Promise<string | null> {
  const { error } = await supabase
    .from('playlist_videos')
    .upsert(
      { playlist_id: playlistId, video_id: videoId },
      { onConflict: 'playlist_id,video_id' },
    );
  return error?.message ?? null;
}

export async function removeVideoFromPlaylist(
  playlistId: string,
  videoId: string,
): Promise<string | null> {
  const { error } = await supabase
    .from('playlist_videos')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('video_id', videoId);
  return error?.message ?? null;
}

export async function getContainingPlaylistIds(videoId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('playlist_videos')
    .select('playlist_id')
    .eq('video_id', videoId);

  if (error || !data) return [];
  return data.map((row) => row.playlist_id);
}
