import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VideoCard } from '@/components/video-card';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { searchUsers, searchVideos, type SearchUser } from '@/lib/search';
import type { VideoWithCreator } from '@/lib/video';

export default function SearchScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setVideos([]);
      setUsers([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const [videoRes, userRes] = await Promise.all([searchVideos(q), searchUsers(q)]);
      setVideos(videoRes.data);
      setUsers(userRes.data);
      setError(videoRes.error ?? userRes.error);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const hasQuery = query.trim().length > 0;
  const hasResults = videos.length > 0 || users.length > 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.header}>
          Search
        </ThemedText>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search videos and people"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          {loading && <ActivityIndicator style={styles.spinner} />}

          {!loading && error && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
              Search failed: {error}
            </ThemedText>
          )}

          {!loading && hasQuery && !hasResults && !error && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
              No results for "{query.trim()}".
            </ThemedText>
          )}

          {!loading && users.length > 0 && (
            <>
              <ThemedText type="smallBold" style={styles.sectionLabel}>
                People
              </ThemedText>
              <View style={styles.peopleList}>
                {users.map((user) => (
                  <Pressable
                    key={user.id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/user/${user.id}`)}
                    style={({ pressed }) => pressed && styles.pressed}>
                    <ThemedView type="backgroundElement" style={styles.personRow}>
                      {user.avatar_url ? (
                        <Image source={{ uri: user.avatar_url }} style={styles.personAvatar} contentFit="cover" />
                      ) : (
                        <ThemedView type="background" style={styles.personAvatar}>
                          <ThemedText type="smallBold">
                            {(user.username ?? 'V').charAt(0).toUpperCase()}
                          </ThemedText>
                        </ThemedView>
                      )}
                      <View style={styles.personInfo}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {user.username ?? 'VidTalk user'}
                        </ThemedText>
                        {user.bio ? (
                          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                            {user.bio}
                          </ThemedText>
                        ) : null}
                      </View>
                    </ThemedView>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {!loading && videos.length > 0 && (
            <>
              <ThemedText type="smallBold" style={styles.sectionLabel}>
                Videos
              </ThemedText>
              <View style={styles.videoList}>
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </View>
            </>
          )}

          {!hasQuery && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
              Search for videos by title or description, and people by username.
            </ThemedText>
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
    paddingBottom: BottomTabInset,
  },
  header: {
    textAlign: 'center',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  input: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  spinner: {
    marginVertical: Spacing.five,
  },
  message: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  sectionLabel: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  peopleList: {
    gap: Spacing.two,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  personInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  videoList: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
