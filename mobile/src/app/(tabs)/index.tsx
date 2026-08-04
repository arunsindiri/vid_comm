import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VideoCard } from '@/components/video-card';
import { BottomTabInset, MaxContentWidth, Spacing, TopBarHeight } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { useUnreadNotifications } from '@/hooks/use-unread-notifications';
import { listVideos, type VideoWithCreator } from '@/lib/video';

const PAGE_SIZE = 10;

export default function HomeScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const viewerId = session?.user.id ?? null;
  const unread = useUnreadNotifications(viewerId);

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
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            VidTalk
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.push('/notifications')}
            style={({ pressed, hovered }) => [
              styles.bellButton,
              (pressed || hovered) && styles.pressed,
            ]}>
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
            {unread > 0 ? (
              <View style={styles.badge}>
                <ThemedText type="code" style={styles.badgeText}>
                  {unread > 99 ? '99+' : unread}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>
        </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: TopBarHeight,
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  headerTitle: {
    textAlign: 'center',
  },
  bellButton: {
    position: 'absolute',
    right: Spacing.four,
    padding: Spacing.one,
    cursor: 'pointer',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3c87f7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
  },
  pressed: {
    opacity: 0.7,
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
