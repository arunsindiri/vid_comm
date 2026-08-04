import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CommentsSection } from '@/components/comments-section';
import { AddToPlaylistModal } from '@/components/add-to-playlist-modal';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { follow, isFollowing, unfollow } from '@/lib/follow';
import { formatTimeAgo } from '@/lib/format';
import { getLikeCount, hasLiked, like, unlike } from '@/lib/like';
import { getVideo, getVideoThumbnailUrl, type VideoWithCreator } from '@/lib/video';
import { getResumePosition, recordProgress } from '@/lib/watch-history';

export default function VideoScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [video, setVideo] = useState<VideoWithCreator | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 1;
  });
  const statusEvent = useEvent(player, 'statusChange', { status: player.status });
  const status = statusEvent?.status;
  const playerError = statusEvent?.error;
  const timeEvent = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });
  const currentTime = timeEvent?.currentTime ?? 0;

  const viewerId = session?.user.id ?? null;
  const creatorId = video?.creator?.id ?? null;

  const [resumePos, setResumePos] = useState<number | null>(null);
  const didResumeRef = useRef(false);
  const lastSavedRef = useRef<{ position: number; at: number }>({ position: 0, at: 0 });
  const currentTimeRef = useRef(0);
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    if (!viewerId || !id) {
      setResumePos(0);
      return;
    }
    let active = true;
    getResumePosition(viewerId, id).then((pos) => {
      if (active) setResumePos(pos);
    });
    return () => {
      active = false;
    };
  }, [viewerId, id]);

  useEffect(() => {
    if (status !== 'readyToPlay' || resumePos === null || didResumeRef.current) return;
    const duration = player.duration;
    const shouldResume = resumePos >= 3 && (duration <= 0 || resumePos < duration - 10);
    if (shouldResume) {
      player.currentTime = resumePos;
    }
    didResumeRef.current = true;
  }, [status, resumePos, player]);

  useEffect(() => {
    if (!viewerId || !id || currentTime <= 0) return;
    const last = lastSavedRef.current;
    if (currentTime - last.position >= 5 || Date.now() - last.at >= 15000) {
      lastSavedRef.current = { position: currentTime, at: Date.now() };
      const duration = player.duration > 0 ? Math.round(player.duration) : null;
      recordProgress(viewerId, id, currentTime, duration);
    }
  }, [currentTime, viewerId, id, player]);

  useEffect(() => {
    return () => {
      if (viewerId && id && currentTimeRef.current > 0) {
        recordProgress(viewerId, id, currentTimeRef.current, null);
      }
    };
  }, [viewerId, id]);

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
      setLikeCount(res.video.likes_count ?? 0);
      player.replace(res.video.video_url);
    });
    return () => {
      active = false;
    };
  }, [id, player]);

  useEffect(() => {
    if (!viewerId || !id) return;
    let active = true;
    hasLiked(viewerId, id).then((value) => {
      if (active) setLiked(value);
    });
    return () => {
      active = false;
    };
  }, [viewerId, id]);

  useEffect(() => {
    if (!viewerId || !creatorId || viewerId === creatorId) return;
    let active = true;
    isFollowing(viewerId, creatorId).then((value) => {
      if (active) setFollowing(value);
    });
    return () => {
      active = false;
    };
  }, [viewerId, creatorId]);

  async function handleToggleFollow() {
    if (!viewerId || !creatorId) return;
    setFollowBusy(true);
    if (following) {
      const err = await unfollow(viewerId, creatorId);
      if (err) Alert.alert('Could not unfollow', err);
      else setFollowing(false);
    } else {
      const err = await follow(viewerId, creatorId);
      if (err) Alert.alert('Could not follow', err);
      else setFollowing(true);
    }
    setFollowBusy(false);
  }

  async function handleToggleLike() {
    if (!viewerId || !id) return;
    setLikeBusy(true);
    if (liked) {
      const err = await unlike(viewerId, id);
      if (err) Alert.alert('Could not unlike', err);
      else {
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      }
    } else {
      const err = await like(viewerId, id);
      if (err) Alert.alert('Could not like', err);
      else {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    }
    setLikeBusy(false);
  }

  const thumbnail = video ? getVideoThumbnailUrl(video) : null;
  const creatorName = video?.creator?.username ?? 'VidTalk user';
  const showFollow = Boolean(viewerId && creatorId && viewerId !== creatorId);

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
              <View style={styles.creatorRow}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.creatorMeta}>
                  {video ? `${creatorName} · ${formatTimeAgo(video.created_at)}` : ' '}
                </ThemedText>
                {video ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Save to playlist"
                    onPress={() => setSaveOpen(true)}
                    style={({ pressed }) => [
                      styles.iconButton,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="bookmark-outline" size={20} color={theme.text} />
                  </Pressable>
                ) : null}
                {video ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={likeBusy}
                    onPress={handleToggleLike}
                    style={({ pressed }) => [
                      styles.likeButton,
                      { backgroundColor: theme.backgroundElement },
                      liked && styles.likedButton,
                      pressed && styles.pressed,
                      likeBusy && styles.disabled,
                    ]}>
                    <ThemedText type="smallBold" style={liked ? styles.likedLabel : undefined}>
                      {liked ? 'Liked' : 'Like'}
                    </ThemedText>
                    <ThemedText type="small" style={liked ? styles.likedLabel : undefined}>
                      {likeCount}
                    </ThemedText>
                  </Pressable>
                ) : null}
                {showFollow && video ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={followBusy}
                    onPress={handleToggleFollow}
                    style={({ pressed }) => [
                      styles.followButton,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                      followBusy && styles.disabled,
                    ]}>
                    <ThemedText type="smallBold" style={following ? styles.unfollowLabel : undefined}>
                      {following ? 'Unfollow' : 'Follow'}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
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
              {video ? (
                <CommentsSection videoId={video.id} viewerId={viewerId} player={player} />
              ) : null}
            </>
          )}
        </ScrollView>
        <AddToPlaylistModal
          visible={saveOpen}
          viewerId={viewerId}
          videoId={id}
          onClose={() => setSaveOpen(false)}
        />
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
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  creatorMeta: {
    flex: 1,
  },
  followButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
  },
  likedButton: {
    backgroundColor: '#3c87f7',
  },
  likedLabel: {
    color: '#ffffff',
  },
  unfollowLabel: {
    color: '#3c87f7',
  },
  disabled: {
    opacity: 0.5,
  },
  message: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
  pressed: {
    opacity: 0.7,
  },
});
