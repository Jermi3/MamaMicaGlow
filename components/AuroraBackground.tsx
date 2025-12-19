import { Colors } from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Blob configuration types
type BlobProps = {
    color: string;
    size: number;
    initialX: number;
    initialY: number;
    duration?: number;
    delay?: number;
    scaleRange?: [number, number];
};

const AnimatedBlob = ({
    color,
    size,
    initialX,
    initialY,
    duration = 10000,
    delay = 0,
    scaleRange = [0.8, 1.2],
}: BlobProps) => {
    const translateX = useSharedValue(initialX);
    const translateY = useSharedValue(initialY);
    const scale = useSharedValue(1);

    useEffect(() => {
        // Movement animation
        translateX.value = withRepeat(
            withSequence(
                withTiming(initialX + 50, { duration: duration, easing: Easing.inOut(Easing.ease) }),
                withTiming(initialX - 50, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
                withTiming(initialX, { duration: duration, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        translateY.value = withRepeat(
            withSequence(
                withTiming(initialY - 50, { duration: duration * 1.1, easing: Easing.inOut(Easing.ease) }),
                withTiming(initialY + 50, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) }),
                withTiming(initialY, { duration: duration, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        // Breathing scale animation
        scale.value = withRepeat(
            withSequence(
                withTiming(scaleRange[1], { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
                withTiming(scaleRange[0], { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
            ],
        };
    });

    return (
        <Animated.View
            style={[
                styles.blob,
                {
                    backgroundColor: color,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                },
                animatedStyle,
            ]}
        />
    );
};

import { usePreferences } from '@/contexts/PreferencesContext';

export function AuroraBackground() {
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    // Define palettes
    const palette = isDark ? {
        blob1: '#4C1D95', // Deep Violet
        blob2: '#BE185D', // Deep Pink/Magenta
        blob3: '#7C3AED', // Vivid Purple
        blob4: '#1E1B4B', // Midnight Blue (depth)
        overlay: 'rgba(0,0,0,0.3)', // Darken slightly
        tint: 'dark' as const,
    } : {
        blob1: Colors.primary,
        blob2: Colors.accent,
        blob3: Colors.secondary,
        blob4: '#4C1D95', // Depth
        overlay: 'rgba(255,255,255,0.4)', // Lighten
        tint: 'light' as const,
    };

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View entering={FadeIn.duration(1000)} style={StyleSheet.absoluteFill}>
                {/* Top Primary Blob */}
                <AnimatedBlob
                    color={palette.blob1}
                    size={width * 1.2}
                    initialX={-width * 0.2}
                    initialY={-height * 0.2}
                    duration={isDark ? 15000 : 12000} // Slower in dark mode for "deep space" vibe
                />

                {/* Bottom Right Contrast Blob */}
                <AnimatedBlob
                    color={palette.blob2}
                    size={width * 1.4}
                    initialX={width * 0.1}
                    initialY={height * 0.5}
                    duration={15000}
                    delay={2000}
                    scaleRange={[0.9, 1.3]}
                />

                {/* Middle Secondary Blob */}
                <AnimatedBlob
                    color={palette.blob3}
                    size={width}
                    initialX={-width * 0.1}
                    initialY={height * 0.2}
                    duration={18000}
                    delay={4000}
                />

                {/* Depth Blob */}
                <AnimatedBlob
                    color={palette.blob4}
                    size={width * 0.8}
                    initialX={width * 0.5}
                    initialY={-height * 0.1}
                    duration={20000}
                    delay={1000}
                />
            </Animated.View>

            {/* 
        This BlurView creates the "frosted" blend of all the blobs behind it.
      */}
            <BlurView
                intensity={80}
                tint={palette.tint}
                style={StyleSheet.absoluteFill}
            />

            {/* Optional Overlay to tune contrast */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.overlay }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    blob: {
        position: 'absolute',
        opacity: 0.6, // Base opacity before blur
    },
});
