import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
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
  loadAllComments,
  updateComment,
  type CommentWithAuthor,
} from '@/lib/comment';
import { formatDuration, formatTimeAgo } from '@/lib/format';
import { getCloudinaryThumbnailUrl, uploadVideoToCloudinary } from '@/lib/video';

const MAX_DEPTH = 4;

type StagedVideo = {
  uri: string;
  fileName: string | null;
  file: Blob | File | null;
  duration: number | null;
};

type CommentNode = CommentWithAuthor & { children: CommentNode[] };

function buildTree(flat: CommentWithAuthor[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  for (const c of flat) {
    nodes.set(c.id, { ...c, children: [] });
  }
  const roots: CommentNode[] = [];
  for (const c of flat) {
    const node = nodes.get(c.id)!;
    if (c.parent_id && nodes.has(c.parent_id)) {
      nodes.get(c.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const byCreated = (a: CommentNode, b: CommentNode) => a.created_at.localeCompare(b.created_at);
  roots.sort(byCreated);
  for (const node of nodes.values()) {
    node.children.sort(byCreated);
  }
  return roots;
}

function removeSubtree(list: CommentWithAuthor[], rootId: string): CommentWithAuthor[] {
  const removed = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of list) {
      if (c.parent_id && removed.has(c.parent_id) && !removed.has(c.id)) {
        removed.add(c.id);
        changed = true;
      }
    }
  }
  return list.filter((c) => !removed.has(c.id));
}

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

function CommentComposer({
  videoId,
  viewerId,
  player,
  parentId,
  placeholder,
  onPosted,
}: {
  videoId: string;
  viewerId: string;
  player?: VideoPlayer | null;
  parentId?: string | null;
  placeholder?: string;
  onPosted: (comment: CommentWithAuthor) => void;
}) {
  const theme = useTheme();

  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [stagedVideo, setStagedVideo] = useState<StagedVideo | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);

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
        parent_id: parentId ?? null,
        ...videoFields,
      });

      if (error) {
        Alert.alert('Could not post comment', error);
        return;
      }
      if (comment) {
        onPosted(comment);
        setBody('');
        clearStagedVideo();
      }
    } finally {
      setPosting(false);
    }
  }

  const inputStyle = {
    backgroundColor: theme.backgroundElement,
    color: theme.text,
  };
  const canPost = posting || (body.trim().length === 0 && !stagedVideo);

  return (
    <View style={styles.composerBlock}>
      <View style={styles.composer}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder={stagedVideo ? 'Add a caption (optional)…' : placeholder ?? 'Add a comment…'}
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
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={posting}
          onPress={handleAddVideo}
          style={({ pressed }) => [pressed && styles.pressed, posting && styles.disabled]}>
          <ThemedText type="small" themeColor="textSecondary">
            {Platform.OS === 'web' ? 'Add a video comment' : 'Add a video comment (record or pick)'}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

function CommentRow({
  node,
  depth,
  viewerId,
  player,
  expandedId,
  onExpand,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
}: {
  node: CommentNode;
  depth: number;
  viewerId: string | null;
  player?: VideoPlayer | null;
  expandedId: string | null;
  onExpand: (id: string | null) => void;
  onCommentAdded: (comment: CommentWithAuthor) => void;
  onCommentUpdated: (comment: CommentWithAuthor) => void;
  onCommentDeleted: (id: string) => void;
}) {
  const theme = useTheme();

  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);

  const isMine = viewerId != null && node.user_id === viewerId;
  const authorName = node.author?.username ?? 'VidTalk user';
  const commentThumb = node.thumbnail_url ?? getCloudinaryThumbnailUrl(node.cloudinary_public_id);
  const expanded = expandedId === node.id;

  async function handleSaveEdit() {
    const trimmed = editBody.trim();
    if (!trimmed) return;
    setSaving(true);
    const { comment, error } = await updateComment(node.id, trimmed);
    setSaving(false);
    if (error) {
      Alert.alert('Could not save comment', error);
      return;
    }
    if (comment) {
      onCommentUpdated(comment);
      setEditing(false);
    }
  }

  async function handleDelete() {
    const error = await deleteComment(node.id);
    if (error) {
      Alert.alert('Could not delete comment', error);
      return;
    }
    onCommentDeleted(node.id);
  }

  const inputStyle = {
    backgroundColor: theme.backgroundElement,
    color: theme.text,
  };

  return (
    <View style={styles.comment}>
      {node.author?.avatar_url ? (
        <Image source={{ uri: node.author.avatar_url }} style={styles.avatar} contentFit="cover" />
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
            {formatTimeAgo(node.created_at)}
          </ThemedText>
        </View>

        {node.video_url ? (
          expanded ? (
            <VideoCommentPlayer url={node.video_url} />
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => onExpand(node.id)}
              style={({ pressed }) => pressed && styles.pressed}>
              <View style={styles.commentThumbWrap}>
                {commentThumb ? (
                  <Image source={{ uri: commentThumb }} style={styles.commentThumb} contentFit="cover" />
                ) : (
                  <ThemedView type="background" style={styles.commentThumb}>
                    <ThemedText type="small" themeColor="textSecondary">
                      Video
                    </ThemedText>
                  </ThemedView>
                )}
                {node.duration_seconds != null && (
                  <View style={styles.durationBadge}>
                    <ThemedText type="code" style={styles.durationText}>
                      {formatDuration(node.duration_seconds)}
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

        {node.timestamp_seconds != null && player ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (player) player.currentTime = node.timestamp_seconds ?? 0;
            }}
            style={({ pressed }) => [styles.timestampChip, pressed && styles.pressed]}>
            <ThemedText type="code" style={styles.timestampText}>
              Jump to {formatDuration(node.timestamp_seconds)}
            </ThemedText>
          </Pressable>
        ) : null}

        {node.body ? <ThemedText type="small">{node.body}</ThemedText> : null}

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
            <View style={styles.commentActions}>
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={handleSaveEdit}
                style={({ pressed }) => [pressed && styles.pressed, saving && styles.disabled]}>
                <ThemedText type="smallBold">{saving ? 'Saving…' : 'Save'}</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditing(false)}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText type="small" themeColor="textSecondary">
                  Cancel
                </ThemedText>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.commentActions}>
            {viewerId ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setReplying((v) => !v)}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText type="small" themeColor="textSecondary">
                  Reply
                </ThemedText>
              </Pressable>
            ) : null}
            {isMine ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setEditing(true);
                    setEditBody(node.body ?? '');
                  }}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Edit
                  </ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleDelete}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Delete
                  </ThemedText>
                </Pressable>
              </>
            ) : null}
          </View>
        )}

        {replying && viewerId ? (
          <CommentComposer
            videoId={node.video_id}
            viewerId={viewerId}
            player={player}
            parentId={node.id}
            placeholder={`Reply to ${authorName}…`}
            onPosted={(comment) => {
              onCommentAdded(comment);
              setReplying(false);
            }}
          />
        ) : null}

        {node.children.length > 0 && depth < MAX_DEPTH ? (
          <View style={styles.replies}>
            {node.children.map((child) => (
              <CommentRow
                key={child.id}
                node={child}
                depth={depth + 1}
                viewerId={viewerId}
                player={player}
                expandedId={expandedId}
                onExpand={onExpand}
                onCommentAdded={onCommentAdded}
                onCommentUpdated={onCommentUpdated}
                onCommentDeleted={onCommentDeleted}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
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
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(comments), [comments]);

  useEffect(() => {
    if (!videoId) return;
    let active = true;
    setLoading(true);
    loadAllComments(videoId).then((res) => {
      if (!active) return;
      setComments(res.data);
      setError(res.error);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [videoId]);

  function handleCommentAdded(comment: CommentWithAuthor) {
    setComments((list) => [...list, comment]);
  }

  function handleCommentUpdated(comment: CommentWithAuthor) {
    setComments((list) => list.map((c) => (c.id === comment.id ? comment : c)));
  }

  function handleCommentDeleted(id: string) {
    setComments((list) => removeSubtree(list, id));
  }

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" style={styles.heading}>
        Comments
      </ThemedText>

      {viewerId ? (
        <CommentComposer
          videoId={videoId}
          viewerId={viewerId}
          player={player}
          onPosted={handleCommentAdded}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : error ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
          {error}
        </ThemedText>
      ) : tree.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
          No comments yet.
        </ThemedText>
      ) : (
        tree.map((node) => (
          <CommentRow
            key={node.id}
            node={node}
            depth={0}
            viewerId={viewerId}
            player={player}
            expandedId={expandedId}
            onExpand={setExpandedId}
            onCommentAdded={handleCommentAdded}
            onCommentUpdated={handleCommentUpdated}
            onCommentDeleted={handleCommentDeleted}
          />
        ))
      )}
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
  composerBlock: {
    gap: Spacing.two,
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
  commentActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  replies: {
    marginTop: Spacing.two,
    paddingLeft: Spacing.four,
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
