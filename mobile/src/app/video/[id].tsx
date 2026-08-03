import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { getVideo, getVideoThumbnailUrl, type VideoWithCreator } from '@/lib/video';

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

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [video, setVideo] = useState<VideoWithCreator | null>(null);
  const [error, setError] = useState<string | null>(null);

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
  });
  const statusEvent = useEvent(player, 'statusChange', { status: player.status });
  const status = statusEvent?.status;
  const playerError = statusEvent?.error;

  useEffect(() => {
    if (!id) return;
    let active = true;
    getVideo(id).then((res) => {
      if (!active) return;
      if (res.error) {
        setError(res.error);
        return;
      }
      if (!res.video) {
        setError('Video not found.');
        return;
      }
      setVideo(res.video);
      player.replace(res.video.video_url);
    });
    return () => {
      active = false;
    };
  }, [id, player]);

  const thumbnail = video ? getVideoThumbnailUrl(video) : null;
  const creatorName = video?.creator?.username ?? 'VidTalk user';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <ThemedText type="smallBold">← Back</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.playerContainer}>
            <VideoView
              style={styles.video}
              player={player}
              contentFit="contain"
              nativeControls
              fullscreenOptions={{ enable: true }}
            />
            {thumbnail && status === 'loading' && (
              <Image source={{ uri: thumbnail }} style={styles.video} contentFit="cover" />
            )}
            {status === 'loading' && (
              <ActivityIndicator style={styles.loadingSpinner} size="large" />
            )}
            {status === 'error' && (
              <ThemedView style={styles.playerError}>
                <ThemedText type="small" themeColor="textSecondary">
                  Could not play this video.
                </ThemedText>
              </ThemedView>
            )}
          </View>

          {error ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
              {error}
            </ThemedText>
          ) : (
            <>
              <ThemedText type="subtitle" style={styles.title}>
                {video?.title ?? 'Loading…'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {video ? `${creatorName} · ${formatTimeAgo(video.created_at)}` : ' '}
              </ThemedText>
              {video?.description ? (
                <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
                  {video.description}
                </ThemedText>
              ) : null}
              {playerError?.message ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
                  {playerError.message}
                </ThemedText>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: Spacing.two,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingSpinner: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  playerError: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: Spacing.four,
    marginBottom: Spacing.one,
  },
  description: {
    marginTop: Spacing.three,
  },
  message: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
  pressed: {
    opacity: 0.7,
  },
});
