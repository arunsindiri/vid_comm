import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatDuration } from '@/lib/format';
import { getVideoThumbnailUrl } from '@/lib/video';
import { listWatchHistory, type HistoryEntry } from '@/lib/watch-history';

const IN_PROGRESS_MIN = 3;
const FINISHED_MARGIN = 10;

export function ContinueWatching({ viewerId }: { viewerId: string | null }) {
  const [items, setItems] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!viewerId) {
        setItems([]);
        return;
      }
      let active = true;
      listWatchHistory(viewerId, 12).then((res) => {
        if (active && !res.error) {
          setItems(res.data.filter((item) => item.last_position_seconds >= IN_PROGRESS_MIN));
        }
      });
      return () => {
        active = false;
      };
    }, [viewerId]),
  );

  if (!viewerId || items.length === 0) return null;

  const inProgress = items.filter(
    (item) => item.duration_seconds == null || item.last_position_seconds < item.duration_seconds - FINISHED_MARGIN,
  );
  const shown = inProgress.length > 0 ? inProgress : items;
  const title = inProgress.length > 0 ? 'Continue watching' : 'Recently watched';

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {shown.map((item) => (
          <ContinueCard key={item.video_id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

function ContinueCard({ item }: { item: HistoryEntry }) {
  const video = item.video;
  if (!video) return null;

  const thumbnail = video.thumbnail_url ?? getVideoThumbnailUrl(video);
  const duration = item.duration_seconds ?? video.duration_seconds;
  const finished = duration != null && item.last_position_seconds >= duration - FINISHED_MARGIN;
  const progress = duration != null && duration > 0 ? Math.min(1, item.last_position_seconds / duration) : 0;
  const remaining = finished || duration == null ? null : Math.max(0, duration - item.last_position_seconds);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/video/${video.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.inner}>
        <View style={styles.thumbWrap}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumb} contentFit="cover" />
          ) : (
            <ThemedView type="background" style={styles.thumb} />
          )}
          {remaining != null ? (
            <View style={styles.badge}>
              <ThemedText type="code" style={styles.badgeText}>
                {formatDuration(remaining)}
              </ThemedText>
            </View>
          ) : finished ? (
            <View style={[styles.badge, styles.watchedBadge]}>
              <ThemedText type="code" style={styles.badgeText}>
                Watched
              </ThemedText>
            </View>
          ) : null}
          {!finished && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          )}
        </View>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.cardTitle}>
          {video.title ?? 'Untitled video'}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  title: {
    paddingHorizontal: Spacing.four,
  },
  row: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  card: {
    width: 180,
  },
  inner: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'transparent',
  },
  badge: {
    position: 'absolute',
    right: Spacing.two,
    bottom: Spacing.three,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
  },
  watchedBadge: {
    backgroundColor: '#3c87f7',
  },
  badgeText: {
    color: '#ffffff',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3c87f7',
  },
  cardTitle: {
    padding: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
  },
});
