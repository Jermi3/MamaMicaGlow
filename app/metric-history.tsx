import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { getMetricHistory, MetricEntry, MetricType } from '@/constants/storage';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Brain, Calendar, ChevronDown, Dumbbell, Heart, Scale, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Map metric IDs to icons
const METRIC_ICONS: Record<string, any> = {
    weight: Scale,
    cognitive: Brain,
    recovery: Heart,
    antiaging: Sparkles,
    muscle: Dumbbell,
};

export default function MetricHistoryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;
    const { metricId, metricTitle, metricUnit, metricColor } = useLocalSearchParams<{
        metricId: string;
        metricTitle: string;
        metricUnit: string;
        metricColor: string;
    }>();

    const [history, setHistory] = useState<MetricEntry[]>([]);
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

    // Dynamic colors
    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];
    const themeColor = metricColor || Colors.primary;

    useEffect(() => {
        loadHistory();
    }, [metricId]);

    const loadHistory = async () => {
        if (metricId) {
            const data = await getMetricHistory(metricId as MetricType);
            setHistory(data);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const entryDate = new Date(date);
        entryDate.setHours(0, 0, 0, 0);

        if (entryDate.getTime() === today.getTime()) {
            return 'Today';
        }

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (entryDate.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        }

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const IconComponent = METRIC_ICONS[metricId || 'weight'] || Scale;

    // Group entries by date
    const groupedHistory = history.reduce((acc, entry) => {
        const dateKey = formatDate(entry.date);
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(entry);
        return acc;
    }, {} as Record<string, MetricEntry[]>);

    // Get sorted date keys
    const dateKeys = Object.keys(groupedHistory);

    // Toggle date expansion
    const toggleDate = (date: string) => {
        setExpandedDates(prev => ({
            ...prev,
            [date]: !prev[date]
        }));
    };

    // Check if a date is expanded (first date expanded by default)
    const isExpanded = (date: string, index: number) => {
        if (expandedDates[date] === undefined) {
            return index === 0; // First date expanded by default
        }
        return expandedDates[date];
    };

    const SoftBlob = ({ color, style }: { color: string; style: any }) => (
        <View
            style={[
                { position: 'absolute', borderRadius: 999, opacity: 0.5 },
                { backgroundColor: color },
                style,
            ]}
        />
    );

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ top: 50, right: -100, width: 300, height: 300 }} />
            <SoftBlob color={isDark ? "#3730A3" : "#F3E8FF"} style={{ bottom: 0, left: -50, width: 250, height: 250 }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: isDark ? Colors.gray[700] : Colors.gray[200] }]}>
                <SoundButton onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={textColor} />
                </SoundButton>
                <View style={styles.headerContent}>
                    <View style={[styles.headerIcon, { backgroundColor: themeColor + '20' }]}>
                        <IconComponent size={20} color={themeColor} />
                    </View>
                    <StyledText variant="bold" style={[styles.title, { color: textColor }]}>
                        {metricTitle} History
                    </StyledText>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Card */}
                <GlowCard variant="surface" style={[styles.summaryCard, { backgroundColor: cardBg }]}>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <StyledText variant="extraBold" style={[styles.summaryValue, { color: themeColor }]}>
                                {history.length}
                            </StyledText>
                            <StyledText variant="medium" style={[styles.summaryLabel, { color: subtitleColor }]}>
                                Total Entries
                            </StyledText>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]} />
                        <View style={styles.summaryItem}>
                            <StyledText variant="extraBold" style={[styles.summaryValue, { color: themeColor }]}>
                                {history.length > 0 ? history[0].value : '-'}
                            </StyledText>
                            <StyledText variant="medium" style={[styles.summaryLabel, { color: subtitleColor }]}>
                                Latest Value{metricUnit}
                            </StyledText>
                        </View>
                    </View>
                </GlowCard>

                {/* History List */}
                {dateKeys.length === 0 ? (
                    <GlowCard variant="surface" style={[styles.emptyCard, { backgroundColor: cardBg }]}>
                        <Calendar size={48} color={subtitleColor} />
                        <StyledText variant="semibold" style={[styles.emptyTitle, { color: textColor }]}>
                            No History Yet
                        </StyledText>
                        <StyledText variant="medium" style={[styles.emptyText, { color: subtitleColor }]}>
                            Start tracking your {metricTitle?.toLowerCase()} by adjusting the slider and tapping Save
                        </StyledText>
                    </GlowCard>
                ) : (
                    dateKeys.map((date, dateIndex) => {
                        const entries = groupedHistory[date];
                        const expanded = isExpanded(date, dateIndex);

                        return (
                            <View key={date} style={styles.dateGroup}>
                                {/* Collapsible Header */}
                                <SoundButton
                                    onPress={() => toggleDate(date)}
                                    style={styles.dateHeaderRow}
                                    activeOpacity={0.7}
                                >
                                    <StyledText variant="semibold" style={[styles.dateHeader, { color: subtitleColor }]}>
                                        {date} ({entries.length})
                                    </StyledText>
                                    <View style={[
                                        styles.chevronContainer,
                                        { transform: [{ rotate: expanded ? '180deg' : '0deg' }] }
                                    ]}>
                                        <ChevronDown size={18} color={subtitleColor} />
                                    </View>
                                </SoundButton>

                                {/* Entries - Only show if expanded */}
                                {expanded && (
                                    <GlowCard variant="surface" style={[styles.entriesCard, { backgroundColor: cardBg }]}>
                                        {entries.map((entry, index) => {
                                            const isLast = index === entries.length - 1;
                                            return (
                                                <View key={index}>
                                                    <View style={styles.entryRow}>
                                                        <View style={[styles.entryIcon, { backgroundColor: themeColor + '15' }]}>
                                                            <IconComponent size={18} color={themeColor} />
                                                        </View>
                                                        <View style={styles.entryContent}>
                                                            <View style={styles.entryValueRow}>
                                                                <StyledText variant="bold" style={[styles.entryValue, { color: textColor }]}>
                                                                    {entry.value}
                                                                </StyledText>
                                                                <StyledText variant="medium" style={[styles.entryUnit, { color: subtitleColor }]}>
                                                                    {metricUnit}
                                                                </StyledText>
                                                            </View>
                                                            <StyledText variant="medium" style={[styles.entryTime, { color: subtitleColor }]}>
                                                                {formatTime(entry.date)}
                                                            </StyledText>
                                                        </View>
                                                    </View>
                                                    {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]} />}
                                                </View>
                                            );
                                        })}
                                    </GlowCard>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.lg,
        paddingBottom: Layout.spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
    },
    scrollContent: {
        padding: Layout.spacing.lg,
    },
    summaryCard: {
        padding: Layout.spacing.lg,
        marginBottom: Layout.spacing.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 32,
    },
    summaryLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    summaryDivider: {
        width: 1,
        height: 50,
    },
    emptyCard: {
        padding: Layout.spacing.xl,
        alignItems: 'center',
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        marginTop: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    dateGroup: {
        marginBottom: Layout.spacing.md,
    },
    dateHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    dateHeader: {
        fontSize: 13,
    },
    chevronContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    entriesCard: {
        padding: Layout.spacing.md,
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    entryIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    entryContent: {
        flex: 1,
    },
    entryValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    entryValue: {
        fontSize: 18,
    },
    entryUnit: {
        fontSize: 14,
    },
    entryTime: {
        fontSize: 12,
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginLeft: 52,
    },
});
