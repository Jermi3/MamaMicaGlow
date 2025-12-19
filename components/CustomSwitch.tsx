import { useSounds } from '@/hooks/useSounds';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface CustomSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    activeTrackColor?: string;
    inactiveTrackColor?: string;
    thumbColor?: string;
    disabled?: boolean;
}

export function CustomSwitch({
    value,
    onValueChange,
    activeTrackColor = '#DDD6FE',
    inactiveTrackColor = '#E5E7EB',
    thumbColor = '#FFFFFF',
    disabled = false,
}: CustomSwitchProps) {
    const progress = useSharedValue(value ? 1 : 0);
    const { playToggle } = useSounds();

    React.useEffect(() => {
        progress.value = withTiming(value ? 1 : 0, { duration: 200 });
    }, [value, progress]);

    const trackStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: interpolateColor(
                progress.value,
                [0, 1],
                [inactiveTrackColor, activeTrackColor]
            ),
        };
    });

    const thumbStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: progress.value * 20, // Move 20px to the right when ON
                },
            ],
        };
    });

    const handlePress = () => {
        if (!disabled) {
            playToggle();
            onValueChange(!value);
        }
    };

    return (
        <Pressable onPress={handlePress} disabled={disabled}>
            <Animated.View style={[styles.track, trackStyle]}>
                <Animated.View style={[styles.thumb, thumbStyle, { backgroundColor: thumbColor }]}>
                    {/* Optional: Add shadow for depth */}
                    <View style={styles.thumbInner} />
                </Animated.View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    track: {
        width: 50,
        height: 30,
        borderRadius: 15,
        padding: 2,
        justifyContent: 'center',
    },
    thumb: {
        width: 26,
        height: 26,
        borderRadius: 13,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    thumbInner: {
        flex: 1,
        borderRadius: 13,
    },
});
