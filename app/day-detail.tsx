import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { DoseEntry, getDoseHistory, getScheduledDosesForDate, ScheduledDose } from '@/constants/storage';
import { usePreferences } from '@/contexts/PreferencesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, Calendar, Check, Clock, Droplets, Heart, Package, Sparkles, Syringe, X, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Category Config for icons (consistent with other screens)
const CATEGORY_CONFIG: Record<string, { color: string; gradient: readonly [string, string]; icon: typeof Syringe }> = {
    'Semaglutide': { color: '#8B5CF6', gradient: ['#A78BFA', '#7C3AED'] as const, icon: Droplets },
    'Tirzepatide': { color: '#EC4899', gradient: ['#F472B6', '#DB2777'] as const, icon: Sparkles },
    'Retatrutide': { color: '#F97316', gradient: ['#FB923C', '#EA580C'] as const, icon: Zap },
    'Weight Management': { color: '#F59E0B', gradient: ['#FCD34D', '#D97706'] as const, icon: Heart },
    'Growth Hormone': { color: '#10B981', gradient: ['#34D399', '#059669'] as const, icon: Zap },
    'Healing & Recovery': { color: '#06B6D4', gradient: ['#22D3EE', '#0891B2'] as const, icon: Heart },
    'Peptide Combinations': { color: '#6366F1', gradient: ['#818CF8', '#4F46E5'] as const, icon: Sparkles },
    'Accessories & Supplies': { color: '#3B82F6', gradient: ['#60A5FA', '#2563EB'] as const, icon: Package },
};
const DEFAULT_CONFIG = { color: Colors.primary, gradient: Colors.gradients.primary as readonly [string, string], icon: Syringe };

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SoftBlob = ({ color, style }: { color: string; style: any }) => (
    <View
        style={[
            { position: 'absolute', borderRadius: 999, opacity: 0.5 },
            { backgroundColor: color },
            style,
        ]}
    />
);

export default function DayDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;
    const { dayIndex } = useLocalSearchParams<{ dayIndex: string }>();

    const [targetDate, setTargetDate] = useState<Date>(new Date());
    const [loggedDoses, setLoggedDoses] = useState<DoseEntry[]>([]);
    const [scheduledDoses, setScheduledDoses] = useState<(ScheduledDose & { scheduledTime: Date })[]>([]);
    const [missedDoses, setMissedDoses] = useState<(ScheduledDose & { scheduledTime: Date })[]>([]);
    const [peptideMap, setPeptideMap] = useState<Map<string, string>>(new Map());

    // Dynamic colors
    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];

    useEffect(() => {
        const idx = parseInt(dayIndex || '0', 10);
        const today = new Date();
        const currentDayOfWeek = today.getDay();

        // Calculate the target date based on the day index within the current week
        const diff = idx - currentDayOfWeek;
        const date = new Date(today);
        date.setDate(today.getDate() + diff);
        date.setHours(0, 0, 0, 0);
        setTargetDate(date);

        loadDayData(date);
    }, [dayIndex]);

    const loadDayData = async (date: Date) => {
        // Load peptides to get category info for icons
        const savedPeptides = await AsyncStorage.getItem('user_peptides');
        const newPeptideMap = new Map<string, string>();
        if (savedPeptides) {
            const peptides = JSON.parse(savedPeptides);
            peptides.forEach((p: any) => {
                newPeptideMap.set(p.name.toLowerCase(), p.category || 'Weight Management');
            });
        }
        setPeptideMap(newPeptideMap);

        // Get dose history and filter for this date
        const history = await getDoseHistory();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        const daysLogged = history.filter((dose) => {
            const doseDate = new Date(dose.date);
            const doseDateStr = `${doseDate.getFullYear()}-${String(doseDate.getMonth() + 1).padStart(2, '0')}-${String(doseDate.getDate()).padStart(2, '0')}`;
            return doseDateStr === dateStr;
        });
        setLoggedDoses(daysLogged);

        // Get scheduled doses for this date
        const scheduled = await getScheduledDosesForDate(date);

        // Determine if this is a past date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDateCopy = new Date(date);
        targetDateCopy.setHours(0, 0, 0, 0);
        const isPastDate = targetDateCopy < today;

        // If it's a past date, calculate missed doses (scheduled but not logged)
        if (isPastDate && scheduled.length > 0) {
            const loggedPeptideNames = daysLogged.map(d => d.peptide?.toLowerCase() || '');
            const missed = scheduled.filter(s => {
                const schedulePeptide = s.peptide?.toLowerCase() || '';
                // Check if this scheduled dose was logged
                return !loggedPeptideNames.some(logged =>
                    logged.includes(schedulePeptide) || schedulePeptide.includes(logged)
                );
            });
            setMissedDoses(missed);
            setScheduledDoses([]); // Past dates don't have "pending" scheduled doses
        } else {
            setMissedDoses([]);
            setScheduledDoses(scheduled);
        }
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDateCopy = new Date(date);
        targetDateCopy.setHours(0, 0, 0, 0);

        if (targetDateCopy.getTime() === today.getTime()) {
            return 'Today';
        }

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (targetDateCopy.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        }

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        if (targetDateCopy.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        }

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const dayName = DAYS_FULL[targetDate.getDay()];
    const dateLabel = formatDate(targetDate);

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ top: 50, right: -100, width: 300, height: 300 }} />
            <SoftBlob color={isDark ? "#3730A3" : "#F3E8FF"} style={{ bottom: 0, left: -50, width: 250, height: 250 }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <SoundButton onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={textColor} />
                </SoundButton>
                <View style={styles.headerContent}>
                    <StyledText variant="bold" style={[styles.title, { color: textColor }]}>
                        {dayName}
                    </StyledText>
                    <StyledText variant="medium" style={[styles.subtitle, { color: subtitleColor }]}>
                        {dateLabel}
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
                            <View style={[styles.summaryIcon, { backgroundColor: Colors.primary + '20' }]}>
                                <Check size={20} color={Colors.primary} />
                            </View>
                            <StyledText variant="extraBold" style={[styles.summaryValue, { color: textColor }]}>
                                {loggedDoses.length}
                            </StyledText>
                            <StyledText variant="medium" style={[styles.summaryLabel, { color: subtitleColor }]}>
                                Logged
                            </StyledText>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]} />
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: '#F59E0B20' }]}>
                                <Calendar size={20} color="#F59E0B" />
                            </View>
                            <StyledText variant="extraBold" style={[styles.summaryValue, { color: textColor }]}>
                                {scheduledDoses.length}
                            </StyledText>
                            <StyledText variant="medium" style={[styles.summaryLabel, { color: subtitleColor }]}>
                                Scheduled
                            </StyledText>
                        </View>
                        <View style={[styles.summaryDivider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]} />
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: '#EF444420' }]}>
                                <AlertTriangle size={20} color="#EF4444" />
                            </View>
                            <StyledText variant="extraBold" style={[styles.summaryValue, { color: textColor }]}>
                                {missedDoses.length}
                            </StyledText>
                            <StyledText variant="medium" style={[styles.summaryLabel, { color: subtitleColor }]}>
                                Missed
                            </StyledText>
                        </View>
                    </View>
                </GlowCard>

                {/* Logged Doses Section */}
                <View style={styles.section}>
                    <StyledText variant="bold" style={[styles.sectionTitle, { color: textColor }]}>
                        Logged Doses
                    </StyledText>

                    {loggedDoses.length === 0 ? (
                        <GlowCard variant="surface" style={[styles.emptyCard, { backgroundColor: cardBg }]}>
                            <X size={32} color={subtitleColor} />
                            <StyledText variant="medium" style={[styles.emptyText, { color: subtitleColor }]}>
                                No doses logged for this day
                            </StyledText>
                        </GlowCard>
                    ) : (
                        <GlowCard variant="surface" style={[styles.listCard, { backgroundColor: cardBg }]}>
                            {loggedDoses.map((dose, index) => {
                                const time = new Date(dose.date).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                });
                                const isLast = index === loggedDoses.length - 1;

                                // Get category-based config for proper icon
                                const category = peptideMap.get(dose.peptide?.toLowerCase()) || 'Weight Management';
                                const config = CATEGORY_CONFIG[category] || DEFAULT_CONFIG;
                                const IconComponent = config.icon;

                                return (
                                    <View key={index}>
                                        <View style={styles.listItem}>
                                            <LinearGradient
                                                colors={config.gradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.itemIcon}
                                            >
                                                <IconComponent size={18} color="#FFF" />
                                            </LinearGradient>
                                            <View style={styles.itemContent}>
                                                <StyledText variant="semibold" style={[styles.itemTitle, { color: textColor }]}>
                                                    {dose.peptide}
                                                </StyledText>
                                                <StyledText variant="medium" style={[styles.itemMeta, { color: subtitleColor }]}>
                                                    {time} • {dose.amount}
                                                </StyledText>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
                                                <Check size={14} color={config.color} />
                                            </View>
                                        </View>
                                        {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]} />}
                                    </View>
                                );
                            })}
                        </GlowCard>
                    )}
                </View>

                {/* Scheduled Doses Section */}
                <View style={styles.section}>
                    <StyledText variant="bold" style={[styles.sectionTitle, { color: textColor }]}>
                        Scheduled Doses
                    </StyledText>

                    {scheduledDoses.length === 0 ? (
                        <GlowCard variant="surface" style={[styles.emptyCard, { backgroundColor: cardBg }]}>
                            <Calendar size={32} color={subtitleColor} />
                            <StyledText variant="medium" style={[styles.emptyText, { color: subtitleColor }]}>
                                No doses scheduled for this day
                            </StyledText>
                        </GlowCard>
                    ) : (
                        <GlowCard variant="surface" style={[styles.listCard, { backgroundColor: cardBg }]}>
                            {scheduledDoses.map((schedule, index) => {
                                const time = new Date(schedule.scheduledTime).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                });
                                const isLast = index === scheduledDoses.length - 1;

                                return (
                                    <View key={schedule.id}>
                                        <View style={styles.listItem}>
                                            <View style={[styles.itemIcon, { backgroundColor: '#F59E0B20' }]}>
                                                <Clock size={18} color="#F59E0B" />
                                            </View>
                                            <View style={styles.itemContent}>
                                                <StyledText variant="semibold" style={[styles.itemTitle, { color: textColor }]}>
                                                    {schedule.peptide}
                                                </StyledText>
                                                <StyledText variant="medium" style={[styles.itemMeta, { color: subtitleColor }]}>
                                                    {time} • {schedule.amount}
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
        paddingTop: Layout.spacing.lg,
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
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
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
    summaryIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryValue: {
        fontSize: 28,
    },
    summaryLabel: {
        fontSize: 13,
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        height: 60,
    },
    section: {
        marginBottom: Layout.spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: Layout.spacing.sm,
    },
    emptyCard: {
        padding: Layout.spacing.xl,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    listCard: {
        padding: Layout.spacing.md,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
    },
    itemMeta: {
        fontSize: 13,
        marginTop: 2,
    },
    statusBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        marginLeft: 52,
    },
});
