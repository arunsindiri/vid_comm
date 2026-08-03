import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VideoCard } from '@/components/video-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { follow, getFollowCounts, isFollowing, unfollow } from '@/lib/follow';
import { getProfile, type Profile } from '@/lib/profile';
import { listVideos, type VideoWithCreator } from '@/lib/video';

export default function UserScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const viewerId = session?.user.id ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSelf = Boolean(viewerId && viewerId === id);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      const [profileRes, videoRes, countRes] = await Promise.all([
        getProfile(id),
        listVideos({ page: 0, limit: 20, userId: id }),
        getFollowCounts(id),
      ]);
      if (!active) return;

      if (!profileRes) {
        setError('User not found.');
      } else {
        setProfile(profileRes);
        setVideos(videoRes.data);
        if (!countRes.error) {
          setFollowers(countRes.followers);
        }
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!viewerId || !id || viewerId === id) return;
    let active = true;
    isFollowing(viewerId, id).then((value) => {
      if (active) setFollowing(value);
    });
    return () => {
      active = false;
    };
  }, [viewerId, id]);

  async function handleToggleFollow() {
    if (!viewerId || !id) return;
    setFollowBusy(true);
    if (following) {
      const err = await unfollow(viewerId, id);
      if (err) Alert.alert('Could not unfollow', err);
      else {
        setFollowing(false);
        setFollowers((c) => Math.max(0, c - 1));
      }
    } else {
      const err = await follow(viewerId, id);
      if (err) Alert.alert('Could not follow', err);
      else {
        setFollowing(true);
        setFollowers((c) => c + 1);
      }
    }
    setFollowBusy(false);
  }

  const username = profile?.username ?? 'VidTalk user';

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
          {loading ? (
            <ActivityIndicator style={styles.spinner} />
          ) : error ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
              {error}
            </ThemedText>
          ) : (
            <>
              <View style={styles.profileTop}>
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <ThemedView type="backgroundElement" style={styles.avatar}>
                    <ThemedText type="subtitle">{username.charAt(0).toUpperCase()}</ThemedText>
                  </ThemedView>
                )}

                <ThemedText type="subtitle" style={styles.username}>
                  {username}
                </ThemedText>

                <View style={styles.countsRow}>
                  <View style={styles.countItem}>
                    <ThemedText type="smallBold">{followers}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Followers
                    </ThemedText>
                  </View>
                  <View style={styles.countItem}>
                    <ThemedText type="smallBold">{following}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Following
                    </ThemedText>
                  </View>
                </View>

                {profile?.bio ? (
                  <ThemedText type="default" themeColor="textSecondary" style={styles.bio}>
                    {profile.bio}
                  </ThemedText>
                ) : null}

                {!isSelf && viewerId ? (
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

              <ThemedText type="smallBold" style={styles.sectionLabel}>
                Videos
              </ThemedText>
              {videos.length > 0 ? (
                <View style={styles.videoList}>
                  {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </View>
              ) : (
                <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
                  No videos yet.
                </ThemedText>
              )}
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
  spinner: {
    marginVertical: Spacing.six,
  },
  profileTop: {
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  username: {
    textAlign: 'center',
  },
  countsRow: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  countItem: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  bio: {
    textAlign: 'center',
    maxWidth: 420,
  },
  followButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
  unfollowLabel: {
    color: '#3c87f7',
  },
  sectionLabel: {
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  videoList: {
    gap: Spacing.three,
  },
  message: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
