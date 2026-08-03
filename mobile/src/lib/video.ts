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
