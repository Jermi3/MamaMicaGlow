import { Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    intensity?: number;
    variant?: 'default' | 'highlight';
}

export function GlassCard({ children, style, intensity = 50, variant = 'default' }: GlassCardProps) {
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    // Glass styles based on theme
    const backgroundColor = isDark
        ? 'rgba(30, 30, 30, 0.4)'
        : 'rgba(255, 255, 255, 0.45)';

    const borderColor = isDark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(255, 255, 255, 0.6)';

    // For highlight variant (e.g., strong glass)
    const tint = isDark ? 'dark' : 'light';

    return (
        <View style={[styles.container, { borderRadius: Layout.radius.lg, overflow: 'hidden' }, style]}>
            <BlurView
                intensity={intensity}
                tint={tint}
                style={StyleSheet.absoluteFill}
            />
            <View style={[
                styles.content,
                {
                    backgroundColor,
                    borderColor,
                    borderWidth: 1,
                    borderRadius: Layout.radius.lg
                }
            ]}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // We add a subtle shadow even for glass to pop it off the aurora
        ...Layout.shadows.small,
    },
    content: {
        padding: Layout.spacing.lg,
    },
});
