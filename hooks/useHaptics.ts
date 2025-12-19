import { usePreferences } from '@/contexts/PreferencesContext';
import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

type ImpactStyle = 'light' | 'medium' | 'heavy';

export function useHaptics() {
    const { preferences } = usePreferences();

    const triggerHaptic = useCallback(
        async (style: ImpactStyle = 'light') => {
            // Only trigger if haptic feedback is enabled and on iOS
            if (!preferences.hapticFeedback || Platform.OS === 'web') {
                return;
            }

            const styleMap = {
                light: Haptics.ImpactFeedbackStyle.Light,
                medium: Haptics.ImpactFeedbackStyle.Medium,
                heavy: Haptics.ImpactFeedbackStyle.Heavy,
            };

            try {
                await Haptics.impactAsync(styleMap[style]);
            } catch (e) {
                // Haptics not available on this device
            }
        },
        [preferences.hapticFeedback]
    );

    const triggerNotification = useCallback(
        async (type: 'success' | 'warning' | 'error' = 'success') => {
            if (!preferences.hapticFeedback || Platform.OS === 'web') {
                return;
            }

            const typeMap = {
                success: Haptics.NotificationFeedbackType.Success,
                warning: Haptics.NotificationFeedbackType.Warning,
                error: Haptics.NotificationFeedbackType.Error,
            };

            try {
                await Haptics.notificationAsync(typeMap[type]);
            } catch (e) {
                // Haptics not available
            }
        },
        [preferences.hapticFeedback]
    );

    const triggerSelection = useCallback(async () => {
        if (!preferences.hapticFeedback || Platform.OS === 'web') {
            return;
        }

        try {
            await Haptics.selectionAsync();
        } catch (e) {
            // Haptics not available
        }
    }, [preferences.hapticFeedback]);

    return {
        triggerHaptic,
        triggerNotification,
        triggerSelection,
        isEnabled: preferences.hapticFeedback,
    };
}
