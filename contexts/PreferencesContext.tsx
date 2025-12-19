import { getPreferences, savePreferences, UserPreferences } from '@/constants/storage';
import { syncAllNotifications } from '@/services/notificationService';
import * as Notifications from 'expo-notifications';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface PreferencesContextType {
    preferences: UserPreferences;
    isLoading: boolean;
    toggleNotifications: () => Promise<void>;
    toggleSoundEffects: () => Promise<void>;
    toggleHapticFeedback: () => Promise<void>;
    toggleDarkMode: () => Promise<void>;
}

const defaultPreferences: UserPreferences = {
    notifications: true,
    soundEffects: true,
    hapticFeedback: true,
    darkMode: false,
};

const PreferencesContext = createContext<PreferencesContextType>({
    preferences: defaultPreferences,
    isLoading: true,
    toggleNotifications: async () => { },
    toggleSoundEffects: async () => { },
    toggleHapticFeedback: async () => { },
    toggleDarkMode: async () => { },
});

export const usePreferences = () => useContext(PreferencesContext);

interface Props {
    children: ReactNode;
}

export function PreferencesProvider({ children }: Props) {
    const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
    const [isLoading, setIsLoading] = useState(true);

    // Load preferences on mount
    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const prefs = await getPreferences();
            setPreferences(prefs);
        } catch (e) {
            console.error('Failed to load preferences', e);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleNotifications = async () => {
        const currentValue = preferences.notifications;
        const newValue = !currentValue;

        // If turning OFF, always allow it
        if (!newValue) {
            try {
                await Notifications.cancelAllScheduledNotificationsAsync();
            } catch (err) {
                // Ignore cancellation errors
            }
            const updated = await savePreferences({ notifications: false });
            setPreferences(updated);
            return;
        }

        // If turning ON, check/request permissions
        try {
            // Check current permission status
            const { status: existingStatus } = await Notifications.getPermissionsAsync();

            if (existingStatus === 'granted') {
                // Permission already granted - enable notifications
                const updated = await savePreferences({ notifications: true });
                setPreferences(updated);
                // Sync all scheduled notifications
                await syncAllNotifications();
                return;
            }

            if (existingStatus === 'denied') {
                // Permission was denied - show alert to go to settings
                const { Alert, Platform, Linking } = require('react-native');
                Alert.alert(
                    'Notifications Disabled',
                    'Please enable notifications in your device settings to receive dose reminders.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Open Settings',
                            onPress: () => {
                                if (Platform.OS === 'ios') {
                                    Linking.openURL('app-settings:');
                                } else {
                                    Linking.openSettings();
                                }
                            }
                        }
                    ]
                );
                // Don't change the toggle - leave it as is
                return;
            }

            // Permission is undetermined - request it
            const { status: newStatus } = await Notifications.requestPermissionsAsync();

            if (newStatus === 'granted') {
                const updated = await savePreferences({ notifications: true });
                setPreferences(updated);
                // Sync all scheduled notifications
                await syncAllNotifications();
            }
            // If not granted, the toggle stays off (we don't change anything)
        } catch (err) {
            // On web or if permission check fails, just allow the toggle
            const updated = await savePreferences({ notifications: newValue });
            setPreferences(updated);
        }
    };

    const toggleSoundEffects = async () => {
        const updated = await savePreferences({ soundEffects: !preferences.soundEffects });
        setPreferences(updated);
    };

    const toggleHapticFeedback = async () => {
        const updated = await savePreferences({ hapticFeedback: !preferences.hapticFeedback });
        setPreferences(updated);
    };

    const toggleDarkMode = async () => {
        const updated = await savePreferences({ darkMode: !preferences.darkMode });
        setPreferences(updated);
    };

    return (
        <PreferencesContext.Provider
            value={{
                preferences,
                isLoading,
                toggleNotifications,
                toggleSoundEffects,
                toggleHapticFeedback,
                toggleDarkMode,
            }}
        >
            {children}
        </PreferencesContext.Provider>
    );
}
