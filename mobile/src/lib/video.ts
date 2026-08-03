import { supabase } from '@/lib/supabase';

export type Video = {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  cloudinary_public_id: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  created_at: string;
};

export type VideoWithCreator = Video & {
  creator: { username: string | null; avatar_url: string | null } | null;
};

export function getVideoThumbnailUrl(video: Video): string | null {
  if (!video.cloudinary_public_id) return null;
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return null;
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_0.5/w_640/h_360/c_fill/${video.cloudinary_public_id}.jpg`;
}

export async function getVideo(id: string): Promise<{
  video: VideoWithCreator | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('videos')
    .select('*, creator:profiles!videos_user_profile_fkey(username, avatar_url)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { video: null, error: error.message };
  }
  return { video: data ?? null, error: null };
}

export async function listVideos(options: {
  page?: number;
  limit?: number;
}): Promise<{ data: VideoWithCreator[]; error: string | null; hasMore: boolean }> {
  const limit = options.limit ?? 10;
  const from = (options.page ?? 0) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from('videos')
    .select('*, creator:profiles!videos_user_profile_fkey(username, avatar_url)')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { data: [], error: error.message, hasMore: false };
  }

  return { data: data ?? [], error: null, hasMore: (data ?? []).length === limit };
}

export type UploadTarget = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  file?: Blob | File | null;
};

export async function uploadVideoToCloudinary(input: UploadTarget): Promise<{
  publicId: string | null;
  url: string | null;
  error: string | null;
}> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return { publicId: null, url: null, error: 'Cloudinary is not configured.' };
  }

  try {
    const form = new FormData();

    if (input.file) {
      form.append('file', input.file);
    } else {
      const res = await fetch(input.uri);
      const blob = await res.blob();
      form.append('file', blob);
    }
    form.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json();

    if (!res.ok) {
      const message = data?.error?.message ?? `Upload failed (HTTP ${res.status}).`;
      return { publicId: null, url: null, error: message };
    }

    return { publicId: data.public_id ?? null, url: data.secure_url ?? null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.';
    return { publicId: null, url: null, error: message };
  }
}

export async function saveVideo(input: {
  userId: string;
  title?: string;
  description?: string;
  videoUrl: string;
  cloudinaryPublicId?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
}): Promise<{ video: Video | null; error: string | null }> {
  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: input.userId,
      title: input.title ?? null,
      description: input.description ?? null,
      cloudinary_public_id: input.cloudinaryPublicId ?? null,
      video_url: input.videoUrl,
      thumbnail_url: input.thumbnailUrl ?? null,
      duration_seconds: input.durationSeconds ?? null,
    })
    .select()
    .single();

  return { video: data ?? null, error: error?.message ?? null };
}
