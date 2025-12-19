import { Colors } from '@/constants/Colors';
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Path, Polygon, Rect, Stop, LinearGradient as SvgGradient } from 'react-native-svg';

export type GlowRank = 'member' | 'getter' | 'master' | 'legend';

interface GlowRankIconProps {
    rank: GlowRank;
    size?: number;
    isUnlocked?: boolean;
}

// Glow Member - Sparkle star with inner glow
const MemberIcon = ({ size, isUnlocked }: { size: number; isUnlocked: boolean }) => {
    const primaryColor = isUnlocked ? Colors.primary : Colors.gray[400];
    const secondaryColor = isUnlocked ? '#A78BFA' : Colors.gray[300];

    return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
            <Defs>
                <SvgGradient id="memberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={secondaryColor} />
                    <Stop offset="100%" stopColor={primaryColor} />
                </SvgGradient>
            </Defs>
            {/* Main 4-point sparkle */}
            <Path
                d="M20 4 L22 16 L34 20 L22 24 L20 36 L18 24 L6 20 L18 16 Z"
                fill="url(#memberGrad)"
            />
            {/* Inner highlight */}
            <Circle cx={20} cy={20} r={4} fill={Colors.white} opacity={0.6} />
            {/* Small accent sparkles */}
            <Circle cx={10} cy={10} r={1.5} fill={primaryColor} opacity={0.7} />
            <Circle cx={30} cy={10} r={1} fill={primaryColor} opacity={0.5} />
            <Circle cx={32} cy={30} r={1.2} fill={primaryColor} opacity={0.6} />
        </Svg>
    );
};

// Glow Getter - Flame/fire icon with energy
const GetterIcon = ({ size, isUnlocked }: { size: number; isUnlocked: boolean }) => {
    const primaryColor = isUnlocked ? '#F97316' : Colors.gray[400]; // Orange
    const secondaryColor = isUnlocked ? '#FBBF24' : Colors.gray[300]; // Amber
    const accentColor = isUnlocked ? '#EF4444' : Colors.gray[500]; // Red

    return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
            <Defs>
                <SvgGradient id="getterGrad" x1="50%" y1="100%" x2="50%" y2="0%">
                    <Stop offset="0%" stopColor={accentColor} />
                    <Stop offset="50%" stopColor={primaryColor} />
                    <Stop offset="100%" stopColor={secondaryColor} />
                </SvgGradient>
            </Defs>
            {/* Main flame body */}
            <Path
                d="M20 4 C20 4 28 12 28 20 C28 22 27 26 25 28 C26 26 26 23 25 21 C24 18 22 16 20 18 C18 16 16 18 15 21 C14 23 14 26 15 28 C13 26 12 22 12 20 C12 12 20 4 20 4 Z"
                fill="url(#getterGrad)"
            />
            {/* Inner flame */}
            <Path
                d="M20 14 C20 14 24 18 24 22 C24 26 22 28 20 28 C18 28 16 26 16 22 C16 18 20 14 20 14 Z"
                fill={secondaryColor}
                opacity={0.8}
            />
            {/* Core glow */}
            <Path
                d="M20 20 C20 20 22 22 22 24 C22 26 21 28 20 28 C19 28 18 26 18 24 C18 22 20 20 20 20 Z"
                fill={Colors.white}
                opacity={0.7}
            />
            {/* Base platform */}
            <Rect x={14} y={32} width={12} height={3} rx={1.5} fill={isUnlocked ? Colors.gray[300] : Colors.gray[400]} />
        </Svg>
    );
};

// Glow Master - Star medal with ribbon
const MasterIcon = ({ size, isUnlocked }: { size: number; isUnlocked: boolean }) => {
    const primaryColor = isUnlocked ? '#FBBF24' : Colors.gray[400]; // Amber/Gold
    const secondaryColor = isUnlocked ? '#FCD34D' : Colors.gray[300];
    const ribbonColor = isUnlocked ? Colors.primary : Colors.gray[400];

    return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
            <Defs>
                <SvgGradient id="masterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={secondaryColor} />
                    <Stop offset="100%" stopColor={primaryColor} />
                </SvgGradient>
            </Defs>
            {/* Left ribbon */}
            <Path
                d="M12 24 L8 36 L14 32 L12 24 Z"
                fill={ribbonColor}
            />
            {/* Right ribbon */}
            <Path
                d="M28 24 L32 36 L26 32 L28 24 Z"
                fill={ribbonColor}
            />
            {/* Medal circle */}
            <Circle cx={20} cy={18} r={12} fill="url(#masterGrad)" />
            {/* Inner circle border */}
            <Circle cx={20} cy={18} r={9} fill="none" stroke={Colors.white} strokeWidth={1} opacity={0.6} />
            {/* 6-point star in center */}
            <Polygon
                points="20,9 22,15 28,15 23,19 25,25 20,21 15,25 17,19 12,15 18,15"
                fill={Colors.white}
                opacity={0.9}
            />
        </Svg>
    );
};

// Glow Legend - Crown with jewels
const LegendIcon = ({ size, isUnlocked }: { size: number; isUnlocked: boolean }) => {
    const primaryColor = isUnlocked ? '#FBBF24' : Colors.gray[400]; // Gold
    const secondaryColor = isUnlocked ? '#FCD34D' : Colors.gray[300];
    const jewelColor = isUnlocked ? Colors.primary : Colors.gray[400];
    const accentJewel = isUnlocked ? Colors.secondary : Colors.gray[400];

    return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
            <Defs>
                <SvgGradient id="legendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor={secondaryColor} />
                    <Stop offset="100%" stopColor={primaryColor} />
                </SvgGradient>
            </Defs>
            {/* Crown base */}
            <Path
                d="M6 28 L10 14 L16 20 L20 8 L24 20 L30 14 L34 28 Z"
                fill="url(#legendGrad)"
            />
            {/* Crown bottom band */}
            <Rect x={6} y={28} width={28} height={6} rx={2} fill={primaryColor} />
            {/* Crown highlights */}
            <Path
                d="M8 28 L11 16 L16 21"
                fill="none"
                stroke={Colors.white}
                strokeWidth={1}
                opacity={0.4}
            />
            {/* Center jewel (large) */}
            <Circle cx={20} cy={31} r={2.5} fill={jewelColor} />
            <Circle cx={20} cy={30.5} r={1} fill={Colors.white} opacity={0.6} />
            {/* Side jewels */}
            <Circle cx={13} cy={31} r={1.5} fill={accentJewel} />
            <Circle cx={27} cy={31} r={1.5} fill={accentJewel} />
            {/* Crown point jewels */}
            <Circle cx={10} cy={14} r={2} fill={jewelColor} />
            <Circle cx={20} cy={8} r={2.5} fill={jewelColor} />
            <Circle cx={30} cy={14} r={2} fill={jewelColor} />
            {/* Jewel highlights */}
            <Circle cx={20} cy={7.5} r={0.8} fill={Colors.white} opacity={0.7} />
        </Svg>
    );
};

export const GlowRankIcon: React.FC<GlowRankIconProps> = ({
    rank,
    size = 24,
    isUnlocked = true,
}) => {
    const renderIcon = () => {
        switch (rank) {
            case 'member':
                return <MemberIcon size={size} isUnlocked={isUnlocked} />;
            case 'getter':
                return <GetterIcon size={size} isUnlocked={isUnlocked} />;
            case 'master':
                return <MasterIcon size={size} isUnlocked={isUnlocked} />;
            case 'legend':
                return <LegendIcon size={size} isUnlocked={isUnlocked} />;
            default:
                return <MemberIcon size={size} isUnlocked={isUnlocked} />;
        }
    };

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            {renderIcon()}
        </View>
    );
};

// Helper function to get rank from streak days
export const getRankFromStreak = (streakDays: number): GlowRank => {
    if (streakDays >= 90) return 'legend';
    if (streakDays >= 30) return 'master';
    if (streakDays >= 7) return 'getter';
    return 'member';
};

// Helper to get rank display name
export const getRankDisplayName = (rank: GlowRank): string => {
    switch (rank) {
        case 'member': return 'Glow Member';
        case 'getter': return 'Glow Getter';
        case 'master': return 'Glow Master';
        case 'legend': return 'Glow Legend';
    }
};

