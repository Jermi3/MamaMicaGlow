import { usePreferences } from '@/contexts/PreferencesContext';
import { useHaptics } from '@/hooks/useHaptics';
import { useSounds } from '@/hooks/useSounds';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Calendar, Home, Plus, Settings, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors, Layout } from '../constants/Colors';

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { preferences } = usePreferences();
    const { playTap } = useSounds();
    const { triggerHaptic } = useHaptics();
    const isDark = preferences.darkMode;

    return (
        <View style={styles.container}>
            <View style={styles.pillContainer}>
                {/* Helper to render blurred background if available (iOS mostly), else solid */}
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.blur} />
                ) : (
                    <View style={[styles.solidBackground, isDark && styles.solidBackgroundDark]} />
                )}

                <View style={styles.tabsRow}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                // Play sound and haptic feedback when switching tabs
                                playTap();
                                triggerHaptic('light');
                                navigation.navigate(route.name, route.params);
                            }
                        };

                        // Map route names to icons
                        let IconComponent = Home;
                        let label = "Home";

                        if (route.name === 'index') { IconComponent = Home; label = "Home"; }
                        if (route.name === 'peptides') { IconComponent = Plus; label = "Peptides"; }
                        if (route.name === 'calendar') { IconComponent = Calendar; label = "Calendar"; }
                        if (route.name === 'progress') { IconComponent = TrendingUp; label = "Progress"; }
                        if (route.name === 'more') { IconComponent = Settings; label = "More"; }

                        if (route.name === 'explore') return null;

                        const activeColor = isDark ? Colors.dark.tint : Colors.primary;
                        const inactiveColor = isDark ? Colors.gray[500] : Colors.gray[400];

                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}

                                onPress={onPress}
                                style={styles.tabButton}
                            >
                                <IconComponent
                                    size={24}
                                    color={isFocused ? activeColor : inactiveColor}
                                />
                                {isFocused && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30, // Float above bottom
        left: 0,
        right: 0,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    pillContainer: {
        borderRadius: 30,
        overflow: 'hidden',
        ...Layout.shadows.soft,
    },
    blur: {
        ...StyleSheet.absoluteFillObject,
    },
    solidBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    solidBackgroundDark: {
        backgroundColor: 'rgba(31,41,55,0.95)', // gray.800 with opacity
    },
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: 'transparent', // Let blur show through
    },
    tabButton: {
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
    },
    activeDot: {
        position: 'absolute',
        bottom: 6,
        width: 4,
        height: 4,
        borderRadius: 2,
        // backgroundColor set dynamically in component
    }
});
