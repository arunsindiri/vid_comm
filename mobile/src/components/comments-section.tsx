import type { VideoPlayer } from 'expo-video';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

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
import { formatDuration, formatTimeAgo } from '@/lib/format';
import { getCloudinaryThumbnailUrl } from '@/lib/video';
import { uploadVideoToCloudinary } from '@/lib/video';

const PAGE_SIZE = 20;

type StagedVideo = {
  uri: string;
  fileName: string | null;
  file: Blob | File | null;
  duration: number | null;
};

function VideoCommentPlayer({ url }: { url: string }) {
  const player = useVideoPlayer(null);
  useEffect(() => {
    if (url) player.replace(url);
  }, [url, player]);

  return (
    <VideoView
      style={styles.commentVideo}
      player={player}
      contentFit="contain"
      nativeControls
      fullscreenOptions={{ enable: true }}
    />
  );
}

export function CommentsSection({
  videoId,
  viewerId,
  player,
}: {
  videoId: string;
  viewerId: string | null;
  player?: VideoPlayer | null;
}) {
  const theme = useTheme();

  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [stagedVideo, setStagedVideo] = useState<StagedVideo | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);

  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);

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

  useEffect(() => {
    return () => {
      if (stagedVideo?.uri.startsWith('blob:')) {
        URL.revokeObjectURL(stagedVideo.uri);
      }
    };
  }, [stagedVideo]);

  function clearStagedVideo() {
    if (stagedVideo?.uri.startsWith('blob:')) {
      URL.revokeObjectURL(stagedVideo.uri);
    }
    setStagedVideo(null);
    setTimestamp(null);
  }

  function stageVideo(asset: ImagePicker.ImagePickerAsset) {
    setStagedVideo({
      uri: asset.uri,
      fileName: asset.fileName ?? null,
      file: asset.file ?? null,
      duration: asset.duration ?? null,
    });
    setTimestamp(null);
  }

  async function handlePickVideo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow access to your photo library to add a video comment.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    stageVideo(result.assets[0]);
  }

  async function handleRecordVideo() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to record a video comment.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    stageVideo(result.assets[0]);
  }

  function handleAddVideo() {
    if (Platform.OS === 'web') {
      handlePickVideo();
      return;
    }
    Alert.alert('Video comment', 'How would you like to add your video?', [
      { text: 'Record a video', onPress: () => handleRecordVideo() },
      { text: 'Choose from library', onPress: () => handlePickVideo() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleAttachTimestamp() {
    if (!player) return;
    const t = player.currentTime;
    if (!Number.isFinite(t) || t <= 0) {
      Alert.alert('Play the video first', 'Play the video and pause where your reply refers to.');
      return;
    }
    setTimestamp(Math.floor(t));
  }

  async function handlePost() {
    const trimmedBody = body.trim();
    if (!viewerId) return;
    if (!trimmedBody && !stagedVideo) return;

    setPosting(true);
    try {
      let videoFields = {};
      if (stagedVideo) {
        const uploaded = await uploadVideoToCloudinary(stagedVideo);
        if (uploaded.error) {
          Alert.alert('Upload failed', uploaded.error);
          return;
        }
        videoFields = {
          cloudinary_public_id: uploaded.publicId,
          video_url: uploaded.url ?? '',
          thumbnail_url: getCloudinaryThumbnailUrl(uploaded.publicId),
          duration_seconds: stagedVideo.duration ? Math.round(stagedVideo.duration) : null,
          timestamp_seconds: timestamp,
        };
      }

      const { comment, error } = await addComment(viewerId, videoId, {
        body: trimmedBody || null,
        ...videoFields,
      });

      if (error) {
        Alert.alert('Could not post comment', error);
        return;
      }
      if (comment) {
        setComments((list) => [...list, comment]);
      }
      setBody('');
      clearStagedVideo();
    } finally {
      setPosting(false);
    }
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
    setEditBody(comment.body ?? '');
  }

  const inputStyle = {
    backgroundColor: theme.backgroundElement,
    color: theme.text,
  };

  const canPost = posting || (body.trim().length === 0 && !stagedVideo);

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
            placeholder={stagedVideo ? 'Add a caption (optional)…' : 'Add a comment…'}
            placeholderTextColor={theme.textSecondary}
            multiline
            maxLength={1000}
            style={[styles.input, inputStyle]}
          />
          <Pressable
            accessibilityRole="button"
            disabled={canPost}
            onPress={handlePost}
            style={({ pressed }) => [
              styles.postButton,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
              canPost && styles.disabled,
            ]}>
            <ThemedText type="smallBold">{posting ? 'Posting…' : 'Post'}</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {stagedVideo ? (
        <View style={styles.stagedCard}>
          <Image source={{ uri: stagedVideo.uri }} style={styles.stagedThumb} contentFit="cover" />
          <View style={styles.stagedInfo}>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {stagedVideo.fileName ?? 'Video reply'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {stagedVideo.duration != null ? formatDuration(stagedVideo.duration) : ''}
            </ThemedText>
            <View style={styles.stagedActions}>
              <Pressable
                accessibilityRole="button"
                onPress={handleAttachTimestamp}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText type="small" themeColor="textSecondary">
                  {timestamp != null ? `Reply at ${formatDuration(timestamp)}` : 'Attach timestamp'}
                </ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={clearStagedVideo}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText type="small" themeColor="textSecondary">
                  Remove
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      ) : viewerId ? (
        <Pressable
          accessibilityRole="button"
          disabled={posting}
          onPress={handleAddVideo}
          style={({ pressed }) => [pressed && styles.pressed, posting && styles.disabled]}>
          <ThemedText type="small" themeColor="textSecondary">
            {Platform.OS === 'web' ? 'Add a video comment' : 'Add a video comment (record or pick)'}
          </ThemedText>
        </Pressable>
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
          const expanded = expandedVideoId === comment.id;
          const authorName = comment.author?.username ?? 'VidTalk user';
          const commentThumb =
            comment.thumbnail_url ?? getCloudinaryThumbnailUrl(comment.cloudinary_public_id);
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

                {comment.video_url ? (
                  expanded ? (
                    <VideoCommentPlayer url={comment.video_url} />
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setExpandedVideoId(comment.id)}
                      style={({ pressed }) => pressed && styles.pressed}>
                      <View style={styles.commentThumbWrap}>
                        {commentThumb ? (
                          <Image
                            source={{ uri: commentThumb }}
                            style={styles.commentThumb}
                            contentFit="cover"
                          />
                        ) : (
                          <ThemedView type="background" style={styles.commentThumb}>
                            <ThemedText type="small" themeColor="textSecondary">
                              Video
                            </ThemedText>
                          </ThemedView>
                        )}
                        {comment.duration_seconds != null && (
                          <View style={styles.durationBadge}>
                            <ThemedText type="code" style={styles.durationText}>
                              {formatDuration(comment.duration_seconds)}
                            </ThemedText>
                          </View>
                        )}
                        <View style={styles.playHint}>
                          <ThemedText type="code" style={styles.durationText}>
                            Tap to play
                          </ThemedText>
                        </View>
                      </View>
                    </Pressable>
                  )
                ) : null}

                {comment.timestamp_seconds != null && player ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      if (player) player.currentTime = comment.timestamp_seconds ?? 0;
                    }}
                    style={({ pressed }) => [styles.timestampChip, pressed && styles.pressed]}>
                    <ThemedText type="code" style={styles.timestampText}>
                      Jump to {formatDuration(comment.timestamp_seconds)}
                    </ThemedText>
                  </Pressable>
                ) : null}

                {comment.body ? (
                  <ThemedText type="small">{comment.body}</ThemedText>
                ) : null}

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
                ) : isMine ? (
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
  stagedCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  stagedThumb: {
    width: 96,
    height: 54,
    borderRadius: Spacing.two,
    backgroundColor: 'transparent',
  },
  stagedInfo: {
    flex: 1,
    gap: Spacing.one,
  },
  stagedActions: {
    flexDirection: 'row',
    gap: Spacing.three,
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
  commentThumbWrap: {
    position: 'relative',
    width: 240,
    maxWidth: '100%',
  },
  commentThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Spacing.two,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentVideo: {
    width: 240,
    maxWidth: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Spacing.two,
  },
  durationBadge: {
    position: 'absolute',
    right: Spacing.two,
    bottom: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
  },
  playHint: {
    position: 'absolute',
    left: Spacing.two,
    bottom: Spacing.two,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
  },
  durationText: {
    color: '#ffffff',
  },
  timestampChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(60,135,247,0.15)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    marginTop: Spacing.one,
  },
  timestampText: {
    color: '#3c87f7',
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
