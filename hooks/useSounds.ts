import { usePreferences } from '@/contexts/PreferencesContext';
import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

type SoundType = 'success' | 'toggle' | 'tap' | 'add' | 'tick' | 'delete';

// Sound file mappings
const soundFiles: Record<SoundType, any> = {
    success: require('@/assets/sounds/success.mp3'),
    toggle: require('@/assets/sounds/toggle.mp3'),
    tap: require('@/assets/sounds/tap.mp3'),
    add: require('@/assets/sounds/add.mp3'),
    tick: require('@/assets/sounds/tick.mp3'),
    delete: require('@/assets/sounds/delete.mp3'),
};

// Volume configuration for each sound type
const volumes: Record<SoundType, number> = {
    success: 0.5,  // Clear success feedback
    toggle: 0.4,   // Noticeable for toggles
    tap: 0.15,     // Very subtle for taps - not sharp on ears
    add: 0.4,      // Clear for add actions
    tick: 0.1,     // Very subtle - plays on every unit change during slider drag
    delete: 0.35,  // Noticeable for delete/remove actions
};

// Sound pool size for rapid-fire sounds
const POOL_SIZE = 3;

// Global sound pools - multiple instances per sound type for overlapping playback
let soundPools: Record<SoundType, Audio.Sound[]> = {
    success: [],
    toggle: [],
    tap: [],
    add: [],
    tick: [],
    delete: [],
};

// Current index in each pool (round-robin)
let poolIndices: Record<SoundType, number> = {
    success: 0,
    toggle: 0,
    tap: 0,
    add: 0,
    tick: 0,
    delete: 0,
};

let isGloballyLoaded = false;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

/**
 * Initialize audio mode for proper playback on iOS
 */
async function initializeAudioMode(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: false,  // Respect iPhone silent switch
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });
        console.log('[Sound] Audio mode configured successfully');
    } catch (e) {
        console.error('[Sound] Failed to configure audio mode:', e);
    }
}

/**
 * Load all sounds globally with pooling for rapid playback
 */
async function loadAllSounds(): Promise<void> {
    if (Platform.OS === 'web') {
        console.log('[Sound] Web platform - sounds disabled');
        return;
    }

    if (isGloballyLoaded) {
        return;
    }

    if (isLoading && loadPromise) {
        return loadPromise;
    }

    isLoading = true;
    console.log('[Sound] Starting to load sounds with pooling...');

    loadPromise = (async () => {
        try {
            await initializeAudioMode();

            // Load multiple instances of each sound for the pool
            for (const [key, file] of Object.entries(soundFiles)) {
                const soundType = key as SoundType;
                soundPools[soundType] = [];

                for (let i = 0; i < POOL_SIZE; i++) {
                    try {
                        const { sound } = await Audio.Sound.createAsync(file, {
                            shouldPlay: false,
                            volume: volumes[soundType],
                        });
                        soundPools[soundType].push(sound);
                    } catch (e) {
                        console.error(`[Sound] Failed to load ${key} instance ${i}:`, e);
                    }
                }
                console.log(`[Sound] ${key} pool loaded (${soundPools[soundType].length} instances)`);
            }

            isGloballyLoaded = true;
            console.log('[Sound] All sound pools loaded successfully');
        } catch (e) {
            console.error('[Sound] Failed during sound loading:', e);
        } finally {
            isLoading = false;
        }
    })();

    return loadPromise;
}

/**
 * Play a sound by type - uses round-robin from pool for instant playback
 * Fire-and-forget approach for responsiveness
 */
function playSoundInternal(type: SoundType): void {
    const pool = soundPools[type];

    if (!pool || pool.length === 0) {
        return;
    }

    // Get next sound from pool using round-robin
    const index = poolIndices[type];
    const sound = pool[index];

    // Move to next in pool
    poolIndices[type] = (index + 1) % pool.length;

    if (!sound) {
        return;
    }

    // Fire-and-forget: don't await for faster response
    sound.setPositionAsync(0).then(() => {
        sound.playAsync().catch(() => { });
    }).catch(() => { });
}

export function useSounds() {
    const { preferences } = usePreferences();
    const soundEffectsEnabled = preferences?.soundEffects ?? true;
    const mountedRef = useRef(true);

    // Load sounds on first mount
    useEffect(() => {
        mountedRef.current = true;
        loadAllSounds().catch(() => { });
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Play a sound by type (respects user preference) - synchronous for speed
    const playSound = useCallback(
        (type: SoundType) => {
            if (!soundEffectsEnabled || Platform.OS === 'web') {
                return;
            }

            if (!isGloballyLoaded) {
                // Don't wait - just skip this sound
                loadAllSounds().catch(() => { });
                return;
            }

            playSoundInternal(type);
        },
        [soundEffectsEnabled]
    );

    // Convenience methods - all synchronous now
    const playSuccess = useCallback(() => playSound('success'), [playSound]);
    const playToggle = useCallback(() => playSound('toggle'), [playSound]);
    const playTap = useCallback(() => playSound('tap'), [playSound]);
    const playAdd = useCallback(() => playSound('add'), [playSound]);
    const playTick = useCallback(() => playSound('tick'), [playSound]);
    const playDelete = useCallback(() => playSound('delete'), [playSound]);

    return {
        playSound,
        playSuccess,
        playToggle,
        playTap,
        playAdd,
        playTick,
        playDelete,
        isEnabled: soundEffectsEnabled,
        isLoaded: isGloballyLoaded,
    };
}

/**
 * Cleanup function to unload all sounds
 */
export async function unloadAllSounds(): Promise<void> {
    for (const [key, pool] of Object.entries(soundPools)) {
        for (const sound of pool) {
            try {
                await sound.unloadAsync();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
        soundPools[key as SoundType] = [];
    }
    isGloballyLoaded = false;
    isLoading = false;
    loadPromise = null;
    console.log('[Sound] All sounds unloaded');
}
