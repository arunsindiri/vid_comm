import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
};

const AVATAR_BUCKET = 'avatars';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, bio, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Failed to load profile:', error.message);
    return null;
  }

  return data;
}

export async function updateProfile(
  userId: string,
  updates: { username?: string | null; bio?: string | null; avatar_url?: string | null }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select();

  return { error: error?.message ?? null };
}

export async function uploadAvatar(
  userId: string,
  uri: string
): Promise<{ url: string | null; error: string | null }> {
  const res = await fetch(uri);
  const blob = await res.blob();

  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  const extension = mimeToExt[blob.type] || 'jpg';
  const path = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, blob, { upsert: true, contentType: blob.type });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
