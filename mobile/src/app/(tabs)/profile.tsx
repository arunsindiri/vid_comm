import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { getProfile, type Profile } from '@/lib/profile';

function getFallbackUsername(user: { email?: string; user_metadata?: Record<string, unknown> }) {
  const meta = user.user_metadata ?? {};
  const fullName = meta.full_name ?? meta.name;
  if (typeof fullName === 'string' && fullName) return fullName;
  if (user.email) return user.email.split('@')[0];
  return 'VidTalk User';
}

function getFallbackAvatar(user: { user_metadata?: Record<string, unknown> }) {
  const avatar = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  return typeof avatar === 'string' && avatar ? avatar : null;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const user = session?.user ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;
      getProfile(user.id).then((data) => {
        if (active) setProfile(data);
      });
      return () => {
        active = false;
      };
    }, [user])
  );

  const username = profile?.username || (user ? getFallbackUsername(user) : '');
  const bio = profile?.bio;
  const avatarUrl = profile?.avatar_url || (user ? getFallbackAvatar(user) : null);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.content}>
          <ThemedView style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <ThemedView type="backgroundElement" style={styles.avatar}>
                <ThemedText type="subtitle">{username.charAt(0).toUpperCase()}</ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          <ThemedText type="subtitle" style={styles.username}>
            {username}
          </ThemedText>

          {bio ? (
            <ThemedText type="default" themeColor="textSecondary" style={styles.bio}>
              {bio}
            </ThemedText>
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.bio}>
              No bio yet — add one in Edit Profile.
            </ThemedText>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/edit-profile')}
            style={({ pressed }) => [
              styles.editButton,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">Edit Profile</ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={signOut}
            style={({ pressed }) => [
              styles.editButton,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Log out
            </ThemedText>
          </Pressable>
        </ThemedView>
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
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  avatarContainer: {
    marginBottom: Spacing.two,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  username: {
    textAlign: 'center',
  },
  bio: {
    textAlign: 'center',
    maxWidth: 420,
  },
  editButton: {
    marginTop: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
