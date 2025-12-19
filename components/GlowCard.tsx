import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Layout } from '../constants/Colors';

interface GlowCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'surface' | 'glass' | 'soft' | 'gradient';
    gradientColors?: readonly [string, string, ...string[]];
}

export function GlowCard({ children, style, variant = 'surface', gradientColors }: GlowCardProps) {

    if (variant === 'gradient' && gradientColors) {
        return (
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, styles.gradient, style]}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View style={[
            styles.card,
            variant === 'surface' && styles.surface,
            variant === 'soft' && styles.soft,
            style
        ]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.radius.xl, // Squircle 32
        padding: Layout.spacing.lg,
        overflow: 'hidden',
    },
    surface: {
        backgroundColor: Colors.white,
        ...Layout.shadows.soft,
    },
    soft: {
        backgroundColor: Colors.soft.background, // Stone 50
    },
    gradient: {
        ...Layout.shadows.medium,
    }
});
