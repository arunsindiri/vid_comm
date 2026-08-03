import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration, formatTimeAgo } from '@/lib/format';
import { getVideoThumbnailUrl, type VideoWithCreator } from '@/lib/video';

export function VideoCard({ video }: { video: VideoWithCreator }) {
  const theme = useTheme();
  const thumbnail = video.thumbnail_url ?? getVideoThumbnailUrl(video);
  const creatorName = video.creator?.username ?? 'VidTalk user';
  const creatorAvatar = video.creator?.avatar_url ?? null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/video/${video.id}`)}
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
            {video.likes_count != null && (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {video.likes_count} {video.likes_count === 1 ? 'like' : 'likes'}
              </ThemedText>
            )}
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
