import { Colors } from '@/constants/Colors';
import { saveNotification } from '@/constants/storage';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PreferencesProvider, usePreferences } from '@/contexts/PreferencesContext';
import { useLoadedAssets } from '@/hooks/useLoadedAssets';
import { requestNotificationPermissions, syncAllNotifications } from '@/services/notificationService';
import { syncService } from '@/services/syncService';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Custom light theme
const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.soft.background,
    card: Colors.white,
    text: Colors.gray[800],
    border: Colors.gray[200],
  },
};

// Custom dark theme
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.gray[900],
    text: Colors.dark.text,
    border: Colors.gray[700],
  },
};

function AppContent() {
  const { preferences, isLoading } = usePreferences();
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const theme = preferences.darkMode ? CustomDarkTheme : LightTheme;

  // Trigger cloud sync when user is authenticated
  useEffect(() => {
    if (user && !isAuthLoading) {
      // Sync data with cloud
      syncService.syncAll().catch(console.error);
    }
  }, [user, isAuthLoading]);

  // Initialize notifications on app start
  useEffect(() => {
    async function setupNotifications() {
      // 1. Request permissions immediately on load (or usually checking preference first)
      const granted = await requestNotificationPermissions();
      if (!granted) console.log('Notification permissions denied');

      if (!isLoading && preferences.notifications) {
        // Sync all scheduled notifications
        syncAllNotifications();

        // 2. Listener: Received Notification (Foreground)
        const receivedSubscription = Notifications.addNotificationReceivedListener(async (notification) => {
          const content = notification.request.content;
          await saveNotification({
            title: content.title || 'Notification',
            message: content.body || '',
            time: 'Just now',
            data: content.data,
            type: (content.data?.type as string) || 'system'
          });
        });

        // 3. Listener: User Tapped Notification (Background/Foreground)
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
          const content = response.notification.request.content;
          const data = content.data as any;

          // Save to history (deduplication happens by ID if we used ID, but here we just append)
          // We could potentially check deduplication but simple append is fine for now
          await saveNotification({
            title: content.title || 'Notification',
            message: content.body || '',
            time: 'Just now',
            data: data,
            type: (data?.type as string) || 'system'
          });

          if (data?.type === 'dose_reminder' || data?.type === 'dose_advance_reminder') {
            // Navigate to log-dose with pre-filled data
            router.push({
              pathname: '/log-dose',
              params: { peptide: data.peptide, amount: data.amount }
            });
          } else if (data?.type === 'protocol_status') {
            // Navigate to peptides screen when tapping protocol status notification
            router.push('/(tabs)/peptides');
          }
        });

        return () => {
          receivedSubscription.remove();
          responseSubscription.remove();
        };
      }
    }

    setupNotifications();
  }, [isLoading, preferences.notifications]);

  if (isLoading || isAuthLoading) {
    return null;
  }

  return (
    <ThemeProvider value={theme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="personal-details" options={{ headerShown: false }} />
        <Stack.Screen name="privacy-security" options={{ headerShown: false }} />

        <Stack.Screen name="logbook" options={{ headerShown: false }} />
        <Stack.Screen name="faq" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="log-dose" options={{ headerShown: false }} />
        <Stack.Screen name="progress" options={{ headerShown: false }} />
        <Stack.Screen name="peptide-catalog" options={{ headerShown: false }} />
        <Stack.Screen name="add-peptide" options={{ headerShown: false }} />
        <Stack.Screen name="day-detail" options={{ headerShown: false }} />
        <Stack.Screen name="metric-history" options={{ headerShown: false }} />

        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={preferences.darkMode ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const isLoaded = useLoadedAssets();

  if (!isLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PreferencesProvider>
          <AppContent />
        </PreferencesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

