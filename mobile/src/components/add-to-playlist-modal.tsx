import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  addVideoToPlaylist,
  createPlaylist,
  getContainingPlaylistIds,
  listPlaylists,
  removeVideoFromPlaylist,
  type Playlist,
} from '@/lib/playlist';

export function AddToPlaylistModal({
  visible,
  viewerId,
  videoId,
  onClose,
}: {
  visible: boolean;
  viewerId: string | null;
  videoId: string | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [containing, setContaining] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !viewerId || !videoId) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      const res = await listPlaylists(viewerId);
      if (!active) return;
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setPlaylists(res.data);
      const ids = await getContainingPlaylistIds(videoId);
      if (!active) return;
      setContaining(new Set(ids));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [visible, viewerId, videoId]);

  async function handleCreate() {
    const name = newName.trim();
    if (!viewerId || !videoId || !name) return;
    setBusyId('__new__');
    setError(null);
    const res = await createPlaylist(viewerId, name);
    if (res.error) {
      setError(res.error);
      setBusyId(null);
      return;
    }
    const created = res.data!;
    setPlaylists((prev) => [created, ...prev]);
    const err = await addVideoToPlaylist(created.id, videoId);
    if (err) {
      setError(err);
      setBusyId(null);
      return;
    }
    setContaining((prev) => new Set(prev).add(created.id));
    setNewName('');
    setBusyId(null);
  }

  async function handleToggle(playlistId: string) {
    if (!videoId) return;
    const isIn = containing.has(playlistId);
    setBusyId(playlistId);
    setError(null);
    const err = isIn
      ? await removeVideoFromPlaylist(playlistId, videoId)
      : await addVideoToPlaylist(playlistId, videoId);
    if (err) {
      setError(err);
      setBusyId(null);
      return;
    }
    setContaining((prev) => {
      const next = new Set(prev);
      if (isIn) next.delete(playlistId);
      else next.add(playlistId);
      return next;
    });
    setBusyId(null);
  }

  const inputStyle = {
    backgroundColor: theme.backgroundElement,
    color: theme.text,
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable accessibilityRole="button" style={styles.backdropTouchable} onPress={onClose} />
        <ThemedView type="backgroundElement" style={styles.sheet}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Save to playlist</ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
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
              disabled={busyId !== null || !newName.trim()}
              onPress={handleCreate}
              style={({ pressed }) => [
                styles.createButton,
                { backgroundColor: '#3c87f7' },
                pressed && styles.pressed,
                (busyId !== null || !newName.trim()) && styles.disabled,
              ]}>
              <Ionicons name="add" size={20} color="#ffffff" />
            </Pressable>
          </View>

          {error ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          {loading ? (
            <ActivityIndicator style={styles.spinner} />
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {playlists.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                  No playlists yet. Create one above.
                </ThemedText>
              ) : (
                playlists.map((playlist) => {
                  const isIn = containing.has(playlist.id);
                  const busy = busyId === playlist.id;
                  return (
                    <Pressable
                      key={playlist.id}
                      accessibilityRole="button"
                      disabled={busyId !== null}
                      onPress={() => handleToggle(playlist.id)}
                      style={({ pressed }) => [
                        styles.row,
                        pressed && styles.pressed,
                        busy && styles.disabled,
                      ]}>
                      <View style={styles.rowBody}>
                        <ThemedText type="default" numberOfLines={1}>
                          {playlist.name}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {playlist.video_count} {playlist.video_count === 1 ? 'video' : 'videos'}
                        </ThemedText>
                      </View>
                      {busy ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <Ionicons
                          name={isIn ? 'checkmark-circle' : 'checkmark-circle-outline'}
                          size={22}
                          color={isIn ? '#3c87f7' : theme.textSecondary}
                        />
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
    maxHeight: '70%',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: Spacing.one,
    cursor: 'pointer',
  },
  createRow: {
    flexDirection: 'row',
    gap: Spacing.two,
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
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
  spinner: {
    paddingVertical: Spacing.five,
  },
  error: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
