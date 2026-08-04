import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { formatTimeAgo } from '@/lib/format';
import { createPlaylist, deletePlaylist, listPlaylists, type Playlist } from '@/lib/playlist';

export default function PlaylistsScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(
    async (replace = true) => {
      if (!userId) return;
      const res = await listPlaylists(userId);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setError(null);
      if (replace) setPlaylists(res.data);
      setLoading(false);
      setRefreshing(false);
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleCreate() {
    const name = newName.trim();
    if (!userId || !name) return;
    setCreating(true);
    const res = await createPlaylist(userId, name);
    setCreating(false);
    if (res.error) {
      Alert.alert('Could not create playlist', res.error);
      return;
    }
    setNewName('');
    setPlaylists((prev) => [res.data!, ...prev]);
  }

  async function handleDelete(playlist: Playlist) {
    Alert.alert('Delete playlist', `Delete "${playlist.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const err = await deletePlaylist(playlist.id);
          if (err) {
            Alert.alert('Could not delete playlist', err);
            return;
          }
          setPlaylists((prev) => prev.filter((p) => p.id !== playlist.id));
        },
      },
    ]);
  }

  const inputStyle = {
    backgroundColor: theme.backgroundElement,
    color: theme.text,
  };

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
            Playlists
          </ThemedText>
        </View>

        <View style={styles.createRow}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="New playlist name"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, inputStyle]}
            onSubmitEditing={handleCreate}
            returnKeyType="done"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create playlist"
            disabled={creating || !newName.trim()}
            onPress={handleCreate}
            style={({ pressed }) => [
              styles.createButton,
              { backgroundColor: '#3c87f7' },
              pressed && styles.pressed,
              (creating || !newName.trim()) && styles.disabled,
            ]}>
            {creating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="add" size={20} color="#ffffff" />
            )}
          </Pressable>
        </View>

        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/playlist/${item.id}`)}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <ThemedView type="backgroundElement" style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons name="albums-outline" size={20} color="#3c87f7" />
                </View>
                <View style={styles.rowBody}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {item.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.video_count} {item.video_count === 1 ? 'video' : 'videos'} ·{' '}
                    {formatTimeAgo(item.created_at)}
                  </ThemedText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => handleDelete(item)}
                  style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
                  <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
                </Pressable>
              </ThemedView>
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.spinner} />
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
                No playlists yet. Create one above or tap the bookmark icon on any video.
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
  },
  backButton: {
    padding: Spacing.two,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  createRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  input: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
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
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(60,135,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  deleteButton: {
    padding: Spacing.one,
    cursor: 'pointer',
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
  disabled: {
    opacity: 0.5,
  },
});
