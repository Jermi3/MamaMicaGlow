import { getPreferences } from '@/constants/storage';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform } from 'react-native';

// Singleton for tab sound - shared across all tab instances
let tabSound: Audio.Sound | null = null;
let isTabSoundLoaded = false;
let isLoadingTabSound = false;

// Load tab sound once
async function loadTabSound(): Promise<void> {
  if (Platform.OS === 'web' || isTabSoundLoaded || isLoadingTabSound) {
    return;
  }

  isLoadingTabSound = true;

  try {
    // Configure audio for iOS
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      require('@/assets/sounds/tap.mp3'),
      { shouldPlay: false, volume: 0.3 }
    );
    tabSound = sound;
    isTabSoundLoaded = true;
    console.log('[HapticTab] Tap sound loaded successfully');
  } catch (e) {
    console.error('[HapticTab] Sound loading failed:', e);
  } finally {
    isLoadingTabSound = false;
  }
}

// Play the tab sound
async function playTabSound(): Promise<void> {
  if (!tabSound || !isTabSoundLoaded) {
    console.log('[HapticTab] Sound not loaded yet');
    return;
  }

  try {
    const status = await tabSound.getStatusAsync();
    if (status.isLoaded) {
      await tabSound.setPositionAsync(0);
      await tabSound.playAsync();
    }
  } catch (e) {
    console.error('[HapticTab] Error playing sound:', e);
  }
}

export function HapticTab(props: BottomTabBarButtonProps) {
  // Load sound on mount
  useEffect(() => {
    loadTabSound();
  }, []);

  return (
    <PlatformPressable
      {...props}
      onPressIn={async (ev) => {
        if (Platform.OS !== 'web') {
          try {
            const prefs = await getPreferences();

            // Play haptic feedback
            if (prefs.hapticFeedback && Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            // Play tap sound
            if (prefs.soundEffects) {
              await playTabSound();
            }
          } catch (e) {
            console.error('[HapticTab] Error in onPressIn:', e);
            // Fallback: trigger haptic anyway
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
