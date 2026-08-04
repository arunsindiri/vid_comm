import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import {
  listNotifications,
  markAllRead,
  markRead,
  subscribeNotifications,
  type AppNotification,
} from '@/lib/notification';
import { formatTimeAgo } from '@/lib/format';

const PAGE_SIZE = 20;

function messageFor(notification: AppNotification): string {
  const name = notification.actor?.username ?? 'Someone';
  switch (notification.type) {
    case 'like':
      return `${name} liked your video`;
    case 'follow':
      return `${name} followed you`;
    case 'comment':
      return `${name} commented on your video`;
    case 'reply':
      return `${name} replied to your comment`;
    case 'mention':
      return `${name} mentioned you`;
    default:
      return 'New activity';
  }
}

export default function NotificationsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (!userId) return;
      if (replace) setLoading(true);
      const res = await listNotifications({ userId, page: targetPage, limit: PAGE_SIZE });
      if (res.error) {
        setError(res.error);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setError(null);
      setNotifications((prev) => (replace ? res.data : [...prev, ...res.data]));
      setHasMore(res.hasMore);
      setPage(targetPage);
      setLoading(false);
      setRefreshing(false);
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await fetchPage(0, true);
        if (!userId) return;
        const error = await markAllRead(userId);
        if (error) return;
        setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      })();
    }, [fetchPage, userId]),
  );

  useEffect(() => {
    if (!userId) return;
    return subscribeNotifications(userId, (notification) => {
      setNotifications((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)]);
    });
  }, [userId]);

  async function handleMarkAllRead() {
    if (!userId) return;
    const error = await markAllRead(userId);
    if (error) return;
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
  }

  async function handleOpen(notification: AppNotification) {
    if (!notification.read) {
      setNotifications((list) => list.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
      markRead(notification.id);
    }
    if (notification.type === 'follow' && notification.actor_id) {
      router.push(`/user/${notification.actor_id}`);
    } else if (notification.video_id) {
      router.push(`/video/${notification.video_id}`);
    }
  }

  if (error && notifications.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
            Could not load notifications: {error}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

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
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Notifications
          </ThemedText>
          {notifications.some((n) => !n.read) ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleMarkAllRead}
              style={({ pressed }) => [styles.markAll, pressed && styles.pressed]}>
              <ThemedText type="small" themeColor="textSecondary">
                Mark all read
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const unread = !item.read;
            const name = item.actor?.username ?? 'Someone';
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => handleOpen(item)}
                style={({ pressed }) => [pressed && styles.pressed]}>
                <ThemedView type="backgroundElement" style={[styles.row, unread && styles.unreadRow]}>
                  {item.actor?.avatar_url ? (
                    <Image
                      source={{ uri: item.actor.avatar_url }}
                      style={styles.avatar}
                      contentFit="cover"
                    />
                  ) : (
                    <ThemedView type="background" style={styles.avatar}>
                      <ThemedText type="smallBold">{name.charAt(0).toUpperCase()}</ThemedText>
                    </ThemedView>
                  )}
                  <View style={styles.rowBody}>
                    <ThemedText type="small" style={unread ? styles.unreadText : undefined}>
                      {messageFor(item)}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatTimeAgo(item.created_at)}
                    </ThemedText>
                  </View>
                  {unread ? <View style={styles.unreadDot} /> : null}
                </ThemedView>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={() => {
            if (hasMore) fetchPage(page + 1, false);
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPage(0, true);
              }}
            />
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.spinner} />
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
                No notifications yet.
              </ThemedText>
            )
          }
          ListFooterComponent={
            hasMore && notifications.length > 0 ? <ActivityIndicator style={styles.spinner} /> : null
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  backButton: {
    padding: Spacing.two,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  markAll: {
    padding: Spacing.two,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  unreadRow: {
    opacity: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  unreadText: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3c87f7',
  },
  separator: {
    height: Spacing.two,
  },
  spinner: {
    marginVertical: Spacing.five,
  },
  message: {
    textAlign: 'center',
    marginTop: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
});
