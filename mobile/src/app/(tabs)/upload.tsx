import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { clearCache } from '@/lib/cache';
import { saveVideo, uploadVideoToCloudinary } from '@/lib/video';
import { updateProfile } from '@/lib/profile';

type PickedVideo = {
  uri: string;
  fileName: string | null;
  fileSize: number | null;
  duration: number | null;
  file: Blob | File | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function UploadScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const user = session?.user ?? null;

  const [video, setVideo] = useState<PickedVideo | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    return () => {
      if (video?.uri.startsWith('blob:')) {
        URL.revokeObjectURL(video.uri);
      }
    };
  }, [video]);

  async function stageAsset(asset: ImagePicker.ImagePickerAsset) {
    setVideo({
      uri: asset.uri,
      fileName: asset.fileName ?? null,
      fileSize: asset.fileSize ?? null,
      duration: asset.duration ?? null,
      file: asset.file ?? null,
    });
    setDone(false);
  }

  async function handlePickVideo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow access to your photo library to pick a video.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;
    await stageAsset(result.assets[0]);
  }

  async function handleRecordVideo() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to record a video.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;
    await stageAsset(result.assets[0]);
  }

  function handleAddVideo() {
    if (Platform.OS === 'web') {
      handlePickVideo();
      return;
    }
    Alert.alert('Video upload', 'How would you like to add your video?', [
      { text: 'Record a video', onPress: () => handleRecordVideo() },
      { text: 'Choose from library', onPress: () => handlePickVideo() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function handleUpload() {
    if (!user || !video) return;

    if (!title.trim()) {
      Alert.alert('Title required', 'Please give your video a title.');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadVideoToCloudinary(video);
      if (uploaded.error) {
        Alert.alert('Upload failed', uploaded.error);
        return;
      }

      const ensured = await updateProfile(user.id, {});
      if (ensured.error) {
        Alert.alert('Save failed', ensured.error);
        return;
      }

      const saved = await saveVideo({
        userId: user.id,
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl: uploaded.url ?? '',
        cloudinaryPublicId: uploaded.publicId,
        durationSeconds: video.duration ? Math.round(video.duration) : null,
      });

      if (saved.error) {
        Alert.alert('Save failed', saved.error);
        return;
      }

      setDone(true);
      setVideo(null);
      setTitle('');
      setDescription('');
      clearCache('feed:');
      Alert.alert('Uploaded!', 'Your video is live.');
    } finally {
      setUploading(false);
    }
  }

  const inputStyle = {
    backgroundColor: theme.backgroundElement,
    color: theme.text,
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title" style={styles.header}>
            Upload a video
          </ThemedText>

          <ThemedView style={styles.content}>
            <Pressable
              accessibilityRole="button"
              disabled={uploading}
              onPress={handleAddVideo}
              style={({ pressed }) => [
                styles.pickArea,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
                uploading && styles.disabled,
              ]}>
              {video ? (
                <ThemedView style={styles.videoInfo}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {video.fileName ?? 'Selected video'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {video.fileSize ? formatBytes(video.fileSize) : 'size unknown'}
                    {video.duration ? ` · ${formatDuration(video.duration)}` : ''}
                  </ThemedText>
                </ThemedView>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  {Platform.OS === 'web'
                    ? 'Pick a video from your device'
                    : 'Record a video or pick from your device'}
                </ThemedText>
              )}
            </Pressable>

            <ThemedText type="smallBold">Title</ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Video title"
              placeholderTextColor={theme.textSecondary}
              editable={!uploading}
              style={[styles.input, inputStyle]}
            />

            <ThemedText type="smallBold">Description</ThemedText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tell viewers what this is about"
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={500}
              editable={!uploading}
              style={[styles.input, styles.bioInput, inputStyle]}
            />

            <Pressable
              accessibilityRole="button"
              disabled={uploading || !video}
              onPress={handleUpload}
              style={({ pressed }) => [
                styles.uploadButton,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
                (uploading || !video) && styles.disabled,
              ]}>
              <ThemedText type="smallBold">
                {uploading ? 'Uploading…' : done ? 'Uploaded' : 'Upload'}
              </ThemedText>
            </Pressable>

            {done && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.doneText}>
                Your video has been saved to the database.
              </ThemedText>
            )}
          </ThemedView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    textAlign: 'center',
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
  },
  content: {
    flex: 1,
    gap: Spacing.two,
  },
  pickArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
    borderRadius: Spacing.three,
    marginBottom: Spacing.three,
  },
  videoInfo: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  input: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  uploadButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    marginTop: Spacing.three,
  },
  doneText: {
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
