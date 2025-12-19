import { StyledText } from '@/components/StyledText';
import { Check, Flame, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { GlowCard } from './GlowCard';

interface GlowStatusProps {
    status: 'active' | 'rest' | 'complete';
    streak: number;
    dosesLeft?: number;
    nextDoseTime?: string;
}

export function GlowStatus({ status, streak, dosesLeft = 0, nextDoseTime }: GlowStatusProps) {
    const isComplete = status === 'complete';
    const isActive = status === 'active';

    return (
        <GlowCard variant="surface" style={styles.container}>
            <View style={styles.iconContainer}>
                {/* Orb Logic: 
                    Active/Pending -> Warning/Amber or Secondary
                    Complete -> Success/Green
                    Rest -> Soft/Purple
                 */}
                <View style={[
                    styles.orb,
                    { backgroundColor: isComplete ? Colors.soft.success : (isActive ? Colors.soft.secondary : Colors.soft.primary) }
                ]}>
                    {isComplete ? (
                        <Check size={40} color={Colors.success} strokeWidth={3} />
                    ) : (
                        <Zap size={32} color={Colors.white} fill={Colors.white} />
                    )}
                </View>
            </View>

            <View style={styles.textContainer}>
                <StyledText variant="bold" style={styles.title}>
                    {isComplete ? 'All Done for Today' : (isActive ? 'Dose Required' : 'Rest Day')}
                </StyledText>
                <StyledText variant="regular" style={styles.subtitle}>
                    {isActive
                        ? (dosesLeft > 1 ? `${dosesLeft} doses remaining today.` : `1 dose remaining today.`)
                        : (isComplete ? 'Great job! See you tomorrow.' : 'Recovery is part of the process.')}
                </StyledText>
            </View>

            {/* Streak Pill */}
            <View style={styles.streakPill}>
                <Flame size={16} color="#B45309" fill="#B45309" />
                <StyledText variant="bold" style={styles.streakText}>{streak} Day Streak!</StyledText>
            </View>
        </GlowCard>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: Layout.spacing.xl,
        gap: Layout.spacing.md,
    },
    iconContainer: {
        marginBottom: Layout.spacing.sm,
    },
    orb: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        // Mocking a glow effect
        shadowColor: Colors.secondary,
        shadowOpacity: 0.3,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 0 },
        elevation: 10,
    },
    textContainer: {
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 24,
        color: Colors.light.text,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.gray[400],
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: Layout.spacing.md,
    },
    streakPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FEF3C7', // Soft amber/yellow
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: Layout.spacing.sm,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    streakText: {
        fontSize: 14,
        color: '#B45309', // Dark amber
    }
});
