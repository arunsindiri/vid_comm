import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VideoCard } from '@/components/video-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
  deletePlaylist,
  getPlaylist,
  removeVideoFromPlaylist,
  type PlaylistVideo,
} from '@/lib/playlist';

export default function PlaylistDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [name, setName] = useState<string>('');
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await getPlaylist(id);
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    if (!res.data) {
      setError('Playlist not found.');
      setLoading(false);
      return;
    }
    setName(res.data.name);
    setVideos(res.data.videos);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRemove(video: PlaylistVideo) {
    if (!id) return;
    setBusyId(video.video_id);
    const err = await removeVideoFromPlaylist(id, video.video_id);
    setBusyId(null);
    if (err) {
      Alert.alert('Could not remove video', err);
      return;
    }
    setVideos((prev) => prev.filter((v) => v.video_id !== video.video_id));
  }

  async function handleDelete() {
    if (!id) return;
    Alert.alert('Delete playlist', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const err = await deletePlaylist(id);
          if (err) {
            Alert.alert('Could not delete playlist', err);
            return;
          }
          router.back();
        },
      },
    ]);
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
          <ThemedText type="subtitle" numberOfLines={1} style={styles.headerTitle}>
            {name || 'Playlist'}
          </ThemedText>
          {userId && !error ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={10}
              onPress={handleDelete}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
              <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={videos}
          keyExtractor={(item) => item.video_id}
          renderItem={({ item }) =>
            item.video ? (
              <VideoCard
                video={item.video}
                action={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Remove from playlist"
                    disabled={busyId !== null}
                    onPress={() => handleRemove(item)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.pressed,
                      busyId !== null && styles.disabled,
                    ]}>
                    {busyId === item.video_id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="close" size={18} color="#ffffff" />
                    )}
                  </Pressable>
                }
              />
            ) : null
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.spinner} />
            ) : error ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
                {error}
              </ThemedText>
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
                This playlist is empty. Tap the bookmark icon on any video to add it.
              </ThemedText>
            )
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
    gap: Spacing.two,
  },
  backButton: {
    padding: Spacing.two,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    padding: Spacing.two,
    cursor: 'pointer',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
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
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
