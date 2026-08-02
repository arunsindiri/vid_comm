import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const redirectTo = makeRedirectUri({ scheme: 'vidtalk' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' },
        },
      });

      if (error) {
        Alert.alert('Sign in failed', error.message);
        return;
      }

      if (data.url) {
        if (Platform.OS === 'web') {
          window.location.href = data.url;
          return;
        }

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        if (result.type === 'success') {
          const code = new URL(result.url).searchParams.get('code');
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              Alert.alert('Sign in failed', exchangeError.message);
            }
          }
        } else if (result.type === 'cancel') {
          Alert.alert('Sign in cancelled');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen title="Welcome to VidTalk" subtitle="Sign in to start the conversation">
      <GoogleSignInButton onPress={handleGoogleSignIn} loading={loading} />
      <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
        You will be redirected to Google to sign in securely.
      </ThemedText>
    </AuthScreen>
  );
}

const styles = {
  note: {
    textAlign: 'center' as const,
    marginTop: Spacing.two,
  },
};
