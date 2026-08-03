import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getVideoThumbnailUrl, type VideoWithCreator } from '@/lib/video';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTimeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString();
}

export function VideoCard({ video }: { video: VideoWithCreator }) {
  const theme = useTheme();
  const thumbnail = video.thumbnail_url ?? getVideoThumbnailUrl(video);
  const creatorName = video.creator?.username ?? 'VidTalk user';
  const creatorAvatar = video.creator?.avatar_url ?? null;

  return (
    <Pressable
      accessibilityRole="button"
      disabled
      style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.thumbnailContainer}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} contentFit="cover" />
          ) : (
            <ThemedView type="background" style={styles.thumbnail}>
              <ThemedText type="small" themeColor="textSecondary">
                Video
              </ThemedText>
            </ThemedView>
          )}
          {video.duration_seconds != null && (
            <View style={styles.durationBadge}>
              <ThemedText type="code" style={styles.durationText}>
                {formatDuration(video.duration_seconds)}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.infoRow}>
          {creatorAvatar ? (
            <Image source={{ uri: creatorAvatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <ThemedView type="background" style={styles.avatar}>
              <ThemedText type="smallBold">{creatorName.charAt(0).toUpperCase()}</ThemedText>
            </ThemedView>
          )}

          <View style={styles.info}>
            <ThemedText type="smallBold" numberOfLines={2}>
              {video.title ?? 'Untitled video'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {creatorName} · {formatTimeAgo(video.created_at)}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    right: Spacing.two,
    bottom: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
  },
  durationText: {
    color: '#ffffff',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  info: {
    flex: 1,
    gap: Spacing.one,
  },
});
