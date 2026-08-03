import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  addComment,
  deleteComment,
  listComments,
  updateComment,
  type CommentWithAuthor,
} from '@/lib/comment';
import { formatTimeAgo } from '@/lib/format';

const PAGE_SIZE = 20;

export function CommentsSection({ videoId, viewerId }: { videoId: string; viewerId: string | null }) {
  const theme = useTheme();

  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    let active = true;
    listComments({ videoId, page: 0, limit: PAGE_SIZE }).then((res) => {
      if (!active) return;
      setComments(res.data);
      setHasMore(res.hasMore);
      setError(res.error);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [videoId]);

  async function handlePost() {
    const trimmed = body.trim();
    if (!trimmed || !viewerId) return;
    setPosting(true);
    const { comment, error } = await addComment(viewerId, videoId, trimmed);
    setPosting(false);
    if (error) {
      Alert.alert('Could not post comment', error);
      return;
    }
    if (comment) {
      setComments((list) => [...list, comment]);
    }
    setBody('');
  }

  async function handleSaveEdit(commentId: string) {
    const trimmed = editBody.trim();
    if (!trimmed) return;
    setSaving(true);
    const { comment, error } = await updateComment(commentId, trimmed);
    setSaving(false);
    if (error) {
      Alert.alert('Could not save comment', error);
      return;
    }
    if (comment) {
      setComments((list) => list.map((c) => (c.id === comment.id ? comment : c)));
    }
    setEditingId(null);
  }

  async function handleDelete(commentId: string) {
    const error = await deleteComment(commentId);
    if (error) {
      Alert.alert('Could not delete comment', error);
      return;
    }
    setComments((list) => list.filter((c) => c.id !== commentId));
  }

  function startEdit(comment: CommentWithAuthor) {
    setEditingId(comment.id);
    setEditBody(comment.body);
  }

  const inputStyle = {
    backgroundColor: theme.backgroundElement,
    color: theme.text,
  };

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" style={styles.heading}>
        Comments
      </ThemedText>

      {viewerId ? (
        <View style={styles.composer}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Add a comment…"
            placeholderTextColor={theme.textSecondary}
            multiline
            maxLength={1000}
            style={[styles.input, inputStyle]}
          />
          <Pressable
            accessibilityRole="button"
            disabled={posting || body.trim().length === 0}
            onPress={handlePost}
            style={({ pressed }) => [
              styles.postButton,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
              (posting || body.trim().length === 0) && styles.disabled,
            ]}>
            <ThemedText type="smallBold">{posting ? 'Posting…' : 'Post'}</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : error ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
          {error}
        </ThemedText>
      ) : comments.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
          No comments yet.
        </ThemedText>
      ) : (
        comments.map((comment) => {
          const isMine = viewerId != null && comment.user_id === viewerId;
          const editing = editingId === comment.id;
          const authorName = comment.author?.username ?? 'VidTalk user';
          return (
            <View key={comment.id} style={styles.comment}>
              {comment.author?.avatar_url ? (
                <Image
                  source={{ uri: comment.author.avatar_url }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <ThemedView type="background" style={styles.avatar}>
                  <ThemedText type="smallBold">{authorName.charAt(0).toUpperCase()}</ThemedText>
                </ThemedView>
              )}

              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {authorName}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatTimeAgo(comment.created_at)}
                  </ThemedText>
                </View>

                {editing ? (
                  <>
                    <TextInput
                      value={editBody}
                      onChangeText={setEditBody}
                      placeholder="Edit your comment…"
                      placeholderTextColor={theme.textSecondary}
                      multiline
                      maxLength={1000}
                      style={[styles.input, inputStyle]}
                    />
                    <View style={styles.editActions}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={saving}
                        onPress={() => handleSaveEdit(comment.id)}
                        style={({ pressed }) => [pressed && styles.pressed, saving && styles.disabled]}>
                        <ThemedText type="smallBold">{saving ? 'Saving…' : 'Save'}</ThemedText>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setEditingId(null)}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText type="small" themeColor="textSecondary">
                          Cancel
                        </ThemedText>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <ThemedText type="small">{comment.body}</ThemedText>
                    {isMine ? (
                      <View style={styles.editActions}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => startEdit(comment)}
                          style={({ pressed }) => pressed && styles.pressed}>
                          <ThemedText type="small" themeColor="textSecondary">
                            Edit
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleDelete(comment.id)}
                          style={({ pressed }) => pressed && styles.pressed}>
                          <ThemedText type="small" themeColor="textSecondary">
                            Delete
                          </ThemedText>
                        </Pressable>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            </View>
          );
        })
      )}

      {hasMore ? (
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            const res = await listComments({ videoId, page: Math.ceil(comments.length / PAGE_SIZE) });
            if (!res.error) {
              setComments((list) => [...list, ...res.data]);
              setHasMore(res.hasMore);
            }
          }}
          style={({ pressed }) => [styles.loadMore, pressed && styles.pressed]}>
          <ThemedText type="small" themeColor="textSecondary">
            Load more comments
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.five,
    gap: Spacing.three,
  },
  heading: {
    marginBottom: Spacing.one,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    minHeight: 44,
  },
  postButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  spinner: {
    marginVertical: Spacing.four,
  },
  message: {
    textAlign: 'center',
    marginVertical: Spacing.three,
  },
  comment: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  commentBody: {
    flex: 1,
    gap: Spacing.one,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  loadMore: {
    alignSelf: 'center',
    padding: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
