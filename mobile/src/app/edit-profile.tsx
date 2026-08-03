import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { getProfile, updateProfile, uploadAvatar } from '@/lib/profile';

export default function EditProfileScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const user = session?.user ?? null;

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getProfile(user.id).then((profile) => {
      if (!active) return;
      if (profile?.username) setUsername(profile.username);
      if (profile?.bio) setBio(profile.bio);
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
    });
    return () => {
      active = false;
    };
  }, [user]);

  async function handlePickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!user) return;

    const trimmedUsername = username.trim();
    const trimmedBio = bio.trim();

    if (!trimmedUsername) {
      Alert.alert('Username required', 'Please enter a username.');
      return;
    }

    setSaving(true);
    try {
      let newAvatarUrl = avatarUrl;
      if (newAvatarUrl && !newAvatarUrl.startsWith('http')) {
        const { url, error } = await uploadAvatar(user.id, newAvatarUrl);
        if (error) {
          Alert.alert('Upload failed', error);
          return;
        }
        newAvatarUrl = url;
      }

      const { error } = await updateProfile(user.id, {
        username: trimmedUsername,
        bio: trimmedBio,
        ...(newAvatarUrl ? { avatar_url: newAvatarUrl } : {}),
      });

      if (error) {
        Alert.alert('Save failed', error);
        return;
      }

      router.back();
    } finally {
      setSaving(false);
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
        <SafeAreaView style={styles.flex}>
          <ThemedView style={styles.header}>
            <ThemedText type="subtitle">Edit Profile</ThemedText>
          </ThemedView>

          <ThemedView style={styles.content}>
            <Pressable
              accessibilityRole="button"
              onPress={handlePickAvatar}
              style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
              ) : (
                <ThemedView type="backgroundElement" style={styles.avatar}>
                  <ThemedText type="subtitle">{(username || 'V').charAt(0).toUpperCase()}</ThemedText>
                </ThemedView>
              )}
              <ThemedText type="small" themeColor="textSecondary">
                Change photo
              </ThemedText>
            </Pressable>

            <ThemedText type="smallBold">Username</ThemedText>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Your username"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, inputStyle]}
            />

            <ThemedText type="smallBold">Bio</ThemedText>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself"
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={200}
              style={[styles.input, styles.bioInput, inputStyle]}
            />

            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
                saving && styles.disabled,
              ]}>
              <ThemedText type="smallBold">{saving ? 'Saving…' : 'Save'}</ThemedText>
            </Pressable>

            <Pressable accessibilityRole="button" onPress={() => router.back()}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.cancel}>
                Cancel
              </ThemedText>
            </Pressable>
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
  header: {
    alignItems: 'center',
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  saveButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    marginTop: Spacing.three,
  },
  cancel: {
    textAlign: 'center',
    marginTop: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
