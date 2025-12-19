import { useSounds } from '@/hooks/useSounds';
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface SoundButtonProps extends TouchableOpacityProps {
    /** Whether to play tap sound on press. Defaults to true. */
    playSound?: boolean;
    children: React.ReactNode;
}

/**
 * A TouchableOpacity that plays a subtle tap sound on press.
 * Respects the user's Sound Effects preference.
 */
export function SoundButton({
    playSound = true,
    onPress,
    children,
    ...props
}: SoundButtonProps) {
    const { playTap } = useSounds();
    // const playTap = () => { }; // No-op replacement

    const handlePress = (event: any) => {
        if (playSound) {
            playTap();
        }
        onPress?.(event);
    };

    return (
        <TouchableOpacity onPress={handlePress} {...props}>
            {children}
        </TouchableOpacity>
    );
}
