import { Colors } from '@/constants/Colors';
import { useSounds } from '@/hooks/useSounds';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedProps,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ArcSliderProps {
    min: number;
    max: number;
    value: number;
    onChange: (value: number) => void;
    onComplete?: (value: number) => void;
    size?: number;
    strokeWidth?: number;
    gradientColors?: [string, string];
    showThumb?: boolean;
    gradientId?: string;
    trackColor?: string;
    /** How often to play tick sound (every N units). Default: 5 */
    tickInterval?: number;
}

const { width } = Dimensions.get('window');

export const ArcSlider = ({
    min,
    max,
    value,
    onChange,
    onComplete,
    size = width * 0.6,
    strokeWidth = 20,
    gradientColors = [Colors.primary, Colors.secondary],
    showThumb = true,
    gradientId = 'gradient',
    trackColor = Colors.gray[100],
    tickInterval = 1,
}: ArcSliderProps) => {
    const center = size / 2;
    const padding = showThumb ? (strokeWidth * 0.9) + 6 : strokeWidth / 2;
    const radius = (size / 2) - padding;
    const circumference = 2 * Math.PI * radius;

    const containerRef = useRef<View>(null);
    const currentValueRef = useRef(value);
    const lastTickValueRef = useRef(Math.floor(value / tickInterval) * tickInterval);

    // Sound hook
    const { playTick, isEnabled: soundEnabled } = useSounds();

    // Store the layout position
    const layoutX = useSharedValue(0);
    const layoutY = useSharedValue(0);

    const targetAngle = ((value - min) / (max - min)) * 2 * Math.PI;
    const angle = useSharedValue(targetAngle);

    useEffect(() => {
        angle.value = withTiming(((value - min) / (max - min)) * 2 * Math.PI);
        currentValueRef.current = value;
    }, [value, min, max]);

    // Calculate value from angle
    const calculateValueFromAngle = useCallback((theta: number) => {
        const percent = theta / (2 * Math.PI);
        return Math.min(max, Math.max(min, Math.round(min + (max - min) * percent)));
    }, [min, max]);

    // JS callback for haptics
    const triggerHaptic = useCallback(() => {
        Haptics.selectionAsync().catch(() => { });
    }, []);

    const triggerCompleteHaptic = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    }, []);

    // Play tick sound when crossing tick intervals
    const triggerTickSound = useCallback(() => {
        if (soundEnabled) {
            playTick();
        }
    }, [playTick, soundEnabled]);

    // JS callback for onChange with tick sound
    const handleChange = useCallback((newValue: number) => {
        if (newValue !== currentValueRef.current) {
            // Check if we crossed a tick interval boundary
            const currentTickMark = Math.floor(currentValueRef.current / tickInterval);
            const newTickMark = Math.floor(newValue / tickInterval);

            if (newTickMark !== currentTickMark) {
                // We crossed a tick boundary - play sound and haptic
                triggerTickSound();
                triggerHaptic();
                lastTickValueRef.current = newTickMark * tickInterval;
            }

            currentValueRef.current = newValue;
            onChange(newValue);
        }
    }, [onChange, tickInterval, triggerTickSound, triggerHaptic]);

    // JS callback for onComplete
    const handleComplete = useCallback(() => {
        if (onComplete) {
            onComplete(currentValueRef.current);
            triggerCompleteHaptic();
        }
    }, [onComplete, triggerCompleteHaptic]);

    // Re-measure layout
    const measureLayout = useCallback(() => {
        containerRef.current?.measureInWindow((x, y) => {
            layoutX.value = x;
            layoutY.value = y;
        });
    }, []);

    // Pan gesture using react-native-gesture-handler
    const panGesture = Gesture.Pan()
        .onBegin(() => {
            'worklet';
            // Re-measure layout at the start of gesture (on JS thread)
            runOnJS(measureLayout)();
        })
        .onStart((event) => {
            'worklet';
            // Use x/y which are relative to the view, not absoluteX/Y
            const x = event.x - center;
            const y = event.y - center;
            let theta = Math.atan2(y, x);
            theta += Math.PI / 2;
            if (theta < 0) {
                theta += 2 * Math.PI;
            }
            angle.value = theta;
            const newValue = Math.min(max, Math.max(min, Math.round(min + (max - min) * (theta / (2 * Math.PI)))));
            runOnJS(handleChange)(newValue);
        })
        .onUpdate((event) => {
            'worklet';
            // Use x/y which are relative to the view
            const x = event.x - center;
            const y = event.y - center;
            let theta = Math.atan2(y, x);
            theta += Math.PI / 2;
            if (theta < 0) {
                theta += 2 * Math.PI;
            }
            angle.value = theta;
            const newValue = Math.min(max, Math.max(min, Math.round(min + (max - min) * (theta / (2 * Math.PI)))));
            runOnJS(handleChange)(newValue);
        })
        .onEnd(() => {
            'worklet';
            runOnJS(handleComplete)();
        });

    // Tap gesture for direct positioning
    const tapGesture = Gesture.Tap()
        .onStart((event) => {
            'worklet';
            // Use x/y which are relative to the view
            const x = event.x - center;
            const y = event.y - center;
            let theta = Math.atan2(y, x);
            theta += Math.PI / 2;
            if (theta < 0) {
                theta += 2 * Math.PI;
            }
            angle.value = theta;
            const newValue = Math.min(max, Math.max(min, Math.round(min + (max - min) * (theta / (2 * Math.PI)))));
            runOnJS(handleChange)(newValue);
            runOnJS(handleComplete)();
        });

    // Combine gestures - race between tap and pan
    const composedGesture = Gesture.Race(tapGesture, panGesture);

    // Calculate angle from touch position for web
    const calculateAngleFromPosition = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
        const x = clientX - rect.left - center;
        const y = clientY - rect.top - center;
        let theta = Math.atan2(y, x);
        theta += Math.PI / 2;
        if (theta < 0) {
            theta += 2 * Math.PI;
        }
        return theta;
    }, [center]);

    const isDraggingRef = useRef(false);

    const handleInteraction = useCallback((clientX: number, clientY: number) => {
        if (Platform.OS === 'web' && containerRef.current) {
            const element = containerRef.current as unknown as HTMLElement;
            const rect = element.getBoundingClientRect();
            const theta = calculateAngleFromPosition(clientX, clientY, rect);
            angle.value = theta;
            const newValue = calculateValueFromAngle(theta);
            if (newValue !== currentValueRef.current) {
                // Check if we crossed a tick interval boundary
                const currentTickMark = Math.floor(currentValueRef.current / tickInterval);
                const newTickMark = Math.floor(newValue / tickInterval);

                if (newTickMark !== currentTickMark) {
                    // We crossed a tick boundary - play sound
                    triggerTickSound();
                    lastTickValueRef.current = newTickMark * tickInterval;
                }

                currentValueRef.current = newValue;
                onChange(newValue);
            }
        }
    }, [calculateAngleFromPosition, calculateValueFromAngle, onChange, angle, tickInterval, triggerTickSound]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        handleInteraction(e.clientX, e.clientY);
    }, [handleInteraction]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDraggingRef.current) {
            handleInteraction(e.clientX, e.clientY);
        }
    }, [handleInteraction]);

    const handleMouseUp = useCallback(() => {
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            if (onComplete) {
                onComplete(currentValueRef.current);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
            }
        }
    }, [onComplete]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        const touch = e.touches[0];
        handleInteraction(touch.clientX, touch.clientY);
    }, [handleInteraction]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (isDraggingRef.current) {
            const touch = e.touches[0];
            handleInteraction(touch.clientX, touch.clientY);
        }
    }, [handleInteraction]);

    const handleTouchEnd = useCallback(() => {
        if (isDraggingRef.current) {
            isDraggingRef.current = false;
            if (onComplete) {
                onComplete(currentValueRef.current);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
            }
        }
    }, [onComplete]);

    // Add global event listeners for mouse up/move (for web)
    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleGlobalMouseMove = (e: MouseEvent) => {
                if (isDraggingRef.current && containerRef.current) {
                    const element = containerRef.current as unknown as HTMLElement;
                    const rect = element.getBoundingClientRect();
                    const theta = calculateAngleFromPosition(e.clientX, e.clientY, rect);
                    angle.value = theta;
                    const newValue = calculateValueFromAngle(theta);
                    if (newValue !== currentValueRef.current) {
                        // Check if we crossed a tick interval boundary
                        const currentTickMark = Math.floor(currentValueRef.current / tickInterval);
                        const newTickMark = Math.floor(newValue / tickInterval);

                        if (newTickMark !== currentTickMark) {
                            // We crossed a tick boundary - play sound
                            triggerTickSound();
                            lastTickValueRef.current = newTickMark * tickInterval;
                        }

                        currentValueRef.current = newValue;
                        onChange(newValue);
                    }
                }
            };

            const handleGlobalMouseUp = () => {
                if (isDraggingRef.current) {
                    isDraggingRef.current = false;
                    if (onComplete) {
                        onComplete(currentValueRef.current);
                    }
                }
            };

            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);

            return () => {
                window.removeEventListener('mousemove', handleGlobalMouseMove);
                window.removeEventListener('mouseup', handleGlobalMouseUp);
            };
        }
    }, [calculateAngleFromPosition, calculateValueFromAngle, onChange, onComplete, angle, tickInterval, triggerTickSound]);

    const animatedProps = useAnimatedProps(() => {
        const strokeDashoffset = circumference - (angle.value / (2 * Math.PI)) * circumference;
        return { strokeDashoffset };
    });

    const thumbAnimatedProps = useAnimatedProps(() => {
        const theta = angle.value - Math.PI / 2;
        const x = center + radius * Math.cos(theta);
        const y = center + radius * Math.sin(theta);
        return { cx: x, cy: y };
    });

    // Web-specific props
    const webProps = Platform.OS === 'web' ? {
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        style: {
            width: size,
            height: size,
            cursor: 'pointer',
            userSelect: 'none',
            touchAction: 'none',
        } as any
    } : {};

    // Render for native (iOS/Android)
    if (Platform.OS !== 'web') {
        return (
            <GestureDetector gesture={composedGesture}>
                <View
                    ref={containerRef}
                    style={{ width: size, height: size }}
                    onLayout={measureLayout}
                >
                    <Svg width={size} height={size}>
                        <Defs>
                            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
                                <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
                            </LinearGradient>
                        </Defs>

                        <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke={trackColor}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeLinecap="round"
                        />

                        <AnimatedCircle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke={`url(#${gradientId})`}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={`${circumference} ${circumference}`}
                            animatedProps={animatedProps}
                            strokeLinecap="round"
                            origin={`${center}, ${center}`}
                            rotation="-90"
                        />

                        {showThumb && (
                            <AnimatedCircle
                                r={strokeWidth * 0.9}
                                fill={Colors.white}
                                stroke={gradientColors[1]}
                                strokeWidth={4}
                                animatedProps={thumbAnimatedProps}
                            />
                        )}
                    </Svg>
                </View>
            </GestureDetector>
        );
    }

    // Render for web
    return (
        // @ts-ignore
        <View
            ref={containerRef}
            style={{ width: size, height: size }}
            {...webProps}
        >
            <Svg width={size} height={size} pointerEvents="none">
                <Defs>
                    <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
                        <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />

                <AnimatedCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                    origin={`${center}, ${center}`}
                    rotation="-90"
                />

                {showThumb && (
                    <AnimatedCircle
                        r={strokeWidth * 0.9}
                        fill={Colors.white}
                        stroke={gradientColors[1]}
                        strokeWidth={4}
                        animatedProps={thumbAnimatedProps}
                    />
                )}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({});
