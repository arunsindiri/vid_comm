import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VideoCard } from '@/components/video-card';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { listVideos, type VideoWithCreator } from '@/lib/video';

const PAGE_SIZE = 10;

export default function HomeScreen() {
  const [videos, setVideos] = useState<VideoWithCreator[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const fetchPage = useCallback(async (targetPage: number, replace: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (replace) setLoading(true);
    const res = await listVideos({ page: targetPage, limit: PAGE_SIZE });
    loadingRef.current = false;

    if (res.error) {
      setError(res.error);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);
    setVideos((prev) => (replace ? res.data : [...prev, ...res.data]));
    setHasMore(res.hasMore);
    setPage(targetPage);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPage(0, true);
    }, [fetchPage])
  );

  function handleEndReached() {
    if (hasMore && !loadingRef.current) {
      fetchPage(page + 1, false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchPage(0, true);
  }

  if (error && videos.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
            Could not load videos: {error}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.header}>
          VidTalk
        </ThemedText>

        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VideoCard video={item} />}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.spinner} />
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
                No videos yet. Be the first to upload one!
              </ThemedText>
            )
          }
          ListFooterComponent={
            hasMore && videos.length > 0 ? (
              <ActivityIndicator style={styles.spinner} />
            ) : null
          }
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
    paddingBottom: BottomTabInset,
  },
  header: {
    textAlign: 'center',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  separator: {
    height: Spacing.three,
  },
  spinner: {
    marginVertical: Spacing.five,
  },
  message: {
    textAlign: 'center',
    marginTop: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
});
