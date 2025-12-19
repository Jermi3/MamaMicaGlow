import { ArcSlider } from '@/components/ArcSlider';
import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { getJourneyMilestones } from '@/constants/expectedResults';
import { DoseEntry, MetricEntry, MetricType, getDoseHistory, getMetricHistory, saveMetric } from '@/constants/storage';
import { usePreferences } from '@/contexts/PreferencesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Award, Brain, Check, ChevronDown, Dumbbell, Flame, Heart, Pill, Scale, Sparkles, Target, TrendingUp, Trophy, Zap } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_MARGIN = 12;

// Tracker card definitions
const TRACKER_CARDS = [
    { id: 'weight', title: 'Weight', icon: Scale, color: Colors.primary, gradient: [Colors.primary, '#818cf8'], unit: 'lbs', description: 'Track your body weight', min: 50, max: 300, type: 'weight' as MetricType },
    { id: 'cognitive', title: 'Cognitive', icon: Brain, color: '#F59E0B', gradient: ['#FCD34D', '#F59E0B'], unit: '/10', description: 'Rate your mental clarity', min: 1, max: 10, type: 'cognitive' as MetricType },
    { id: 'recovery', title: 'Recovery', icon: Heart, color: '#EC4899', gradient: ['#F472B6', '#EC4899'], unit: '/10', description: 'Track pain & mobility', min: 1, max: 10, type: 'recovery' as MetricType },
    { id: 'antiaging', title: 'Anti-Aging', icon: Sparkles, color: '#0EA5E9', gradient: ['#7DD3FC', '#0EA5E9'], unit: '/10', description: 'Wellness check-in', min: 1, max: 10, type: 'antiaging' as MetricType },
    { id: 'muscle', title: 'Muscle', icon: Dumbbell, color: '#10B981', gradient: ['#8B5CF6', '#10B981'], unit: '/10', description: 'Strength & performance', min: 1, max: 10, type: 'muscle' as MetricType },
];

export default function ProgressScreen() {
    const router = useRouter();
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    // Dynamic colors
    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];

    const scrollRef = useRef<ScrollView>(null);
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [selectedPeriod, setSelectedPeriod] = useState('Weekly');

    // Data state
    const [metricsHistory, setMetricsHistory] = useState<Record<string, MetricEntry[]>>({});
    const [currentValues, setCurrentValues] = useState<Record<string, number>>({});
    const [modifiedCards, setModifiedCards] = useState<Record<string, boolean>>({});
    const [doseHistory, setDoseHistory] = useState<DoseEntry[]>([]);
    const [chartData, setChartData] = useState<{ day: string; score: number; hasDose: boolean; showLabel?: boolean }[]>([]);

    // Derived stats
    const [trendData, setTrendData] = useState<{ change: number; previous: number | null; label: string }>({ change: 0, previous: null, label: 'Stable' });
    const [adherence, setAdherence] = useState(0);

    // New feature states
    const [streakData, setStreakData] = useState({ current: 0, best: 0, totalDoses: 0 });
    const [topPeptides, setTopPeptides] = useState<{ name: string; count: number; percentage: number }[]>([]);
    const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
    const [expectExpanded, setExpectExpanded] = useState(false);
    const [statsExpanded, setStatsExpanded] = useState(true);
    const [achievementsExpanded, setAchievementsExpanded] = useState(true);
    const [peptidesExpanded, setPeptidesExpanded] = useState(true);
    const [effectivenessExpanded, setEffectivenessExpanded] = useState(true);

    // Achievement definitions
    const ACHIEVEMENTS = [
        { id: 'first_dose', title: 'First Step', icon: Zap, color: '#10B981', requirement: 1, label: 'Log first dose' },
        { id: 'week_streak', title: '7-Day Streak', icon: Flame, color: '#F59E0B', requirement: 7, label: '7 days in a row' },
        { id: 'month_streak', title: '30-Day Streak', icon: Trophy, color: '#8B5CF6', requirement: 30, label: '30 days in a row' },
        { id: 'century', title: 'Century Club', icon: Award, color: '#EC4899', requirement: 100, label: '100 doses logged' },
        { id: 'dedicated', title: 'Dedicated', icon: Target, color: '#0EA5E9', requirement: 50, label: '50 doses logged' },
    ];

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        const doses = await getDoseHistory();
        setDoseHistory(doses);

        // Load all metrics
        const newMetricsHistory: Record<string, MetricEntry[]> = {};
        const newCurrentValues: Record<string, number> = {};

        // Try to get personal details weight as fallback for weight tracker
        let personalDetailsWeight = 150; // Ultimate fallback
        try {
            const personalDetails = await AsyncStorage.getItem('user_personal_details');
            if (personalDetails) {
                const parsed = JSON.parse(personalDetails);
                if (parsed.weight) {
                    const weight = parseFloat(parsed.weight);
                    if (!isNaN(weight) && weight > 0) {
                        personalDetailsWeight = weight;
                    }
                }
            }
        } catch (e) {
            // Ignore, use default
        }

        for (const card of TRACKER_CARDS) {
            const history = await getMetricHistory(card.type);
            newMetricsHistory[card.id] = history;
            if (history.length > 0) {
                newCurrentValues[card.id] = history[0].value;
            } else {
                // Default starting values - use personal details weight for weight tracker
                newCurrentValues[card.id] = card.type === 'weight' ? personalDetailsWeight : 5;
            }
        }

        setMetricsHistory(newMetricsHistory);
        setCurrentValues(newCurrentValues);

        // Initial trend calculation happens in useEffect

        // Adherence calculation
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toDateString();
        });
        const validDoses = doses.filter(d => last7Days.includes(new Date(d.date).toDateString()));
        setAdherence(Math.round((validDoses.length / 7) * 100));

        calculateChartData(selectedPeriod, newMetricsHistory, doses);

        // Calculate streak data
        const uniqueDoseDays = [...new Set(doses.map(d => new Date(d.date).toDateString()))].sort((a, b) =>
            new Date(b).getTime() - new Date(a).getTime()
        );

        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate current streak (consecutive days ending today or yesterday)
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const checkDateStr = checkDate.toDateString();

            if (uniqueDoseDays.includes(checkDateStr)) {
                if (i === 0 || currentStreak > 0) {
                    currentStreak++;
                }
                tempStreak++;
            } else {
                if (i === 0) {
                    // Today has no dose yet, check from yesterday
                    continue;
                }
                bestStreak = Math.max(bestStreak, tempStreak);
                tempStreak = 0;
                if (currentStreak > 0) break;
            }
        }
        bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

        setStreakData({
            current: currentStreak,
            best: bestStreak,
            totalDoses: doses.length
        });

        // Calculate top peptides
        const peptideCounts: Record<string, number> = {};
        doses.forEach(dose => {
            peptideCounts[dose.peptide] = (peptideCounts[dose.peptide] || 0) + 1;
        });

        const sortedPeptides = Object.entries(peptideCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([name, count]) => ({
                name,
                count,
                percentage: doses.length > 0 ? Math.round((count / doses.length) * 100) : 0
            }));
        setTopPeptides(sortedPeptides);

        // Calculate unlocked achievements
        const unlocked: string[] = [];
        if (doses.length >= 1) unlocked.push('first_dose');
        if (doses.length >= 50) unlocked.push('dedicated');
        if (doses.length >= 100) unlocked.push('century');
        if (currentStreak >= 7 || bestStreak >= 7) unlocked.push('week_streak');
        if (currentStreak >= 30 || bestStreak >= 30) unlocked.push('month_streak');
        setUnlockedAchievements(unlocked);
    };

    // Recalculate stats when active card or history changes
    useEffect(() => {
        const card = TRACKER_CARDS[activeCardIndex];
        const history = metricsHistory[card.id] || [];

        if (history.length > 0) {
            const current = history[0].value;

            // Determine comparison window based on explicit desire for "Weekly Change" or adapt to period?
            // User complained about "change form where".

            // Let's compare "Current" vs "7 Days Ago" (Last Week)
            const daysAgo = 7;
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - daysAgo);

            // Find the entry closest to 7 days ago continuously, or just the first one before that date?
            // Ideally: Find distinct entry ~7 days ago.
            // If sparse data, finding the *previous* entry might be better?
            // "Change from where": compares to the *previous* logged value? No, that's too volatile.
            // Let's do: Value ~7 days ago. If not found, look back up to 14 days.

            let previousEntry = history.find(h => {
                const d = new Date(h.date);
                // We want entries older than 6 days but not ancient (e.g. < 30 days)
                const diff = (new Date().getTime() - d.getTime()) / (1000 * 3600 * 24);
                return diff >= 6;
            });

            // If no entry > 6 days ago is found (new user), use the oldest available?
            if (!previousEntry && history.length > 1) {
                // Just compare with oldest if history is short (< 1 week)
                previousEntry = history[history.length - 1];
            }

            if (previousEntry) {
                const change = current - previousEntry.value;
                setTrendData({
                    change,
                    previous: previousEntry.value,
                    label: 'Since last week'
                });
            } else {
                // No previous history to compare
                setTrendData({ change: 0, previous: null, label: 'No data yet' });
            }
        } else {
            setTrendData({ change: 0, previous: null, label: 'No data' });
        }
    }, [activeCardIndex, metricsHistory]);

    // Recalculate chart when period or data changes
    useEffect(() => {
        if (Object.keys(metricsHistory).length > 0) {
            calculateChartData(selectedPeriod, metricsHistory, doseHistory);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPeriod, metricsHistory, doseHistory]);

    const calculateChartData = (period: string, metrics: Record<string, MetricEntry[]>, doses: DoseEntry[]) => {
        const now = new Date();
        const subjectiveKeys = ['cognitive', 'recovery', 'antiaging', 'muscle'];
        const data = [];

        if (period === 'All Time') {
            // Aggregate by Week (Last 12 Weeks)
            const weeksToView = 12;
            for (let i = weeksToView - 1; i >= 0; i--) {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - (i * 7) - 6);
                const weekEnd = new Date(now);
                weekEnd.setDate(now.getDate() - (i * 7));

                // Verify Dose in this week
                const hasDose = doses.some(dose => {
                    const d = new Date(dose.date);
                    return d >= weekStart && d <= weekEnd;
                });

                // Aggregate Scores
                let totalScore = 0;
                let count = 0;

                subjectiveKeys.forEach(key => {
                    const history = metrics[key] || [];
                    history.forEach(h => {
                        const hDate = new Date(h.date);
                        if (hDate >= weekStart && hDate <= weekEnd) {
                            totalScore += h.value;
                            count++;
                        }
                    });
                });

                let weeklyPercentage = 0;
                if (count > 0) {
                    weeklyPercentage = (totalScore / count / 10) * 100;
                }

                data.push({
                    day: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // E.g. "Oct 6"
                    score: weeklyPercentage,
                    hasDose: hasDose,
                    showLabel: i % 2 === 0
                });
            }
        } else if (period === 'Monthly') {
            // Aggregate by 5-Day Blocks (Last 30 Days = 6 Blocks)
            const blocks = 6;
            const blockSize = 5;

            for (let i = blocks - 1; i >= 0; i--) {
                const blockStart = new Date(now);
                blockStart.setDate(now.getDate() - (i * blockSize) - (blockSize - 1));
                const blockEnd = new Date(now);
                blockEnd.setDate(now.getDate() - (i * blockSize));

                // Verify Dose in this block
                const hasDose = doses.some(dose => {
                    const d = new Date(dose.date);
                    return d >= blockStart && d <= blockEnd;
                });

                // Aggregate Scores
                let totalScore = 0;
                let count = 0;

                subjectiveKeys.forEach(key => {
                    const history = metrics[key] || [];
                    history.forEach(h => {
                        const hDate = new Date(h.date);
                        if (hDate >= blockStart && hDate <= blockEnd) {
                            totalScore += h.value;
                            count++;
                        }
                    });
                });

                let blockPercentage = 0;
                if (count > 0) {
                    blockPercentage = (totalScore / count / 10) * 100;
                }

                data.push({
                    day: blockEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    score: blockPercentage,
                    hasDose: hasDose,
                    showLabel: true // 6 labels fit perfectly
                });
            }
        } else {
            // Weekly: Daily View (Last 7 Days)
            const daysToView = 7;

            for (let i = daysToView - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const dateStr = d.toDateString();

                const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });

                const hasDose = doses.some(dose => new Date(dose.date).toDateString() === dateStr);

                let totalScore = 0;
                let count = 0;

                subjectiveKeys.forEach(key => {
                    const history = metrics[key] || [];
                    const entry = history.find(h => new Date(h.date).toDateString() === dateStr);
                    if (entry) {
                        totalScore += entry.value;
                        count++;
                    }
                });

                let dailyPercentage = 0;
                if (count > 0) {
                    dailyPercentage = (totalScore / count / 10) * 100;
                }

                data.push({
                    day: dayLabel,
                    score: dailyPercentage,
                    hasDose: hasDose,
                    showLabel: true
                });
            }
        }
        setChartData(data);
    };

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (CARD_WIDTH + CARD_MARGIN * 2));
        setActiveCardIndex(Math.min(index, TRACKER_CARDS.length - 1));
    };

    const handleSliderChange = (cardId: string, value: number) => {
        setCurrentValues(prev => ({
            ...prev,
            [cardId]: value
        }));
        // Mark card as modified
        setModifiedCards(prev => ({
            ...prev,
            [cardId]: true
        }));
    };

    const handleSliderComplete = (cardId: string, value: number) => {
        // No auto-save - user must tap save button
    };

    const handleSave = async (cardId: string) => {
        const card = TRACKER_CARDS.find(c => c.id === cardId);
        const value = currentValues[cardId];
        if (card && value !== undefined) {
            await saveMetric(card.type, value);
            // Reload history to update timestamp
            const history = await getMetricHistory(card.type);
            setMetricsHistory(prev => ({
                ...prev,
                [cardId]: history
            }));
            // Clear modified state
            setModifiedCards(prev => ({
                ...prev,
                [cardId]: false
            }));
        }
    };

    const getLastUpdatedText = (cardId: string) => {
        const history = metricsHistory[cardId];
        if (!history || history.length === 0) return 'Tap dial to set';

        const lastDate = new Date(history[0].date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Updated today';
        if (diffDays === 1) return 'Updated yesterday';
        return `Updated ${diffDays} days ago`;
    };

    const SoftBlob = ({ color, style }: { color: string, style: any }) => (
        <View pointerEvents="none" style={[styles.blob, { backgroundColor: color }, style]} />
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            {/* Background blobs - dark mode uses muted violet tones */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#EDE9FE"} style={{ top: -100, right: -100, width: 350, height: 350 }} />
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ bottom: 100, left: -50, width: 300, height: 300 }} />

            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <SoundButton onPress={() => router.back()} activeOpacity={0.7}>
                        <StyledText variant="bold" style={[styles.title, { color: textColor }]}>Your Progress</StyledText>
                    </SoundButton>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Swipeable Tracker Cards */}
                    <View>
                        <GHScrollView
                            ref={scrollRef}
                            horizontal
                            pagingEnabled={false}
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
                            decelerationRate="fast"
                            contentContainerStyle={styles.carouselContent}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                        >
                            {TRACKER_CARDS.map((card, index) => {
                                const IconComponent = card.icon;
                                const value = currentValues[card.id] || card.min;
                                const lastUpdated = getLastUpdatedText(card.id);

                                return (
                                    <GlowCard key={card.id} variant="surface" style={[styles.trackerCard, { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN, backgroundColor: cardBg }]}>
                                        <View style={styles.trackerHeader}>
                                            <View style={[styles.trackerIconBox, { backgroundColor: card.color + '20' }]}>
                                                <IconComponent size={24} color={card.color} />
                                            </View>
                                            <View style={styles.trackerTitleGroup}>
                                                <StyledText variant="bold" style={[styles.trackerTitle, { color: textColor }]}>{card.title}</StyledText>
                                                <StyledText variant="medium" style={[styles.trackerDescription, { color: subtitleColor }]}>{card.description}</StyledText>
                                            </View>
                                        </View>

                                        <View style={styles.trackerBody}>
                                            {/* Interactive Arc Slider */}
                                            <View style={styles.sliderContainer}>
                                                <ArcSlider
                                                    min={card.min}
                                                    max={card.max}
                                                    value={value}
                                                    onChange={(val) => handleSliderChange(card.id, val)}
                                                    onComplete={(val) => handleSliderComplete(card.id, val)}
                                                    gradientColors={card.gradient as [string, string]}
                                                    size={180}
                                                    strokeWidth={18}
                                                    trackColor={isDark ? Colors.gray[700] : Colors.gray[100]}
                                                />
                                                <View style={styles.innerValue} pointerEvents="none">
                                                    <StyledText variant="bold" style={[styles.valueText, { color: textColor }]}>{Math.round(value)}</StyledText>
                                                    <StyledText variant="medium" style={[styles.unitText, { color: subtitleColor }]}>{card.unit}</StyledText>
                                                </View>
                                            </View>
                                            <StyledText variant="medium" style={[styles.lastUpdatedText, { color: subtitleColor }]}>
                                                {lastUpdated}
                                            </StyledText>

                                            {/* Save Button - Only visible when slider is moved */}
                                            {modifiedCards[card.id] && (
                                                <SoundButton
                                                    style={[styles.saveButton, { backgroundColor: card.color }]}
                                                    onPress={() => handleSave(card.id)}
                                                    activeOpacity={0.8}
                                                >
                                                    <Check size={18} color={Colors.white} />
                                                    <StyledText variant="semibold" style={styles.saveButtonText}>
                                                        Save
                                                    </StyledText>
                                                </SoundButton>
                                            )}
                                        </View>

                                        <View style={{ height: 10 }} />
                                    </GlowCard>
                                );
                            })}
                        </GHScrollView>

                        {/* Pagination Dots */}
                        <View style={styles.paginationDots}>
                            {TRACKER_CARDS.map((card, index) => {
                                const isActive = activeCardIndex === index;
                                return (
                                    <SoundButton
                                        key={index}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            scrollRef.current?.scrollTo({
                                                x: index * (CARD_WIDTH + CARD_MARGIN * 2),
                                                animated: true
                                            });
                                        }}
                                    >
                                        <View
                                            style={[
                                                styles.dot,
                                                isActive && styles.dotActive
                                            ]}
                                        />
                                    </SoundButton>
                                );
                            })}
                        </View>
                    </View>

                    {/* Secondary Stats Grid */}
                    <View style={styles.gridRow}>
                        <GlowCard variant="surface" style={[styles.gridCard, { backgroundColor: cardBg }]}>
                            <View style={[styles.iconBox, { backgroundColor: isDark ? Colors.primary + '30' : '#E0E7FF' }]}>
                                <TrendingUp size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.gridContent}>
                                <StyledText variant="bold" style={[styles.gridValue, { color: textColor }]}>{adherence}%</StyledText>
                                <StyledText variant="medium" style={[styles.gridLabel, { color: subtitleColor }]}>Protocol Adherence</StyledText>
                            </View>
                        </GlowCard>

                        <SoundButton
                            activeOpacity={0.8}
                            onPress={() => router.push({
                                pathname: '/metric-history',
                                params: {
                                    metricId: TRACKER_CARDS[activeCardIndex].id,
                                    metricTitle: TRACKER_CARDS[activeCardIndex].title,
                                    metricUnit: TRACKER_CARDS[activeCardIndex].unit,
                                    metricColor: TRACKER_CARDS[activeCardIndex].color
                                }
                            })}
                        >
                            <GlowCard variant="surface" style={[styles.gridCard, { backgroundColor: cardBg }]}>
                                <View style={[styles.iconBox, { backgroundColor: TRACKER_CARDS[activeCardIndex].color + '20' }]}>
                                    {(() => {
                                        const ActiveIcon = TRACKER_CARDS[activeCardIndex].icon;
                                        return <ActiveIcon size={20} color={TRACKER_CARDS[activeCardIndex].color} />;
                                    })()}
                                </View>
                                <View style={styles.gridContent}>
                                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                        <StyledText variant="bold" style={[styles.gridValue, { color: textColor }]}>
                                            {trendData.change > 0 ? '+' : ''}{trendData.change.toFixed(1)}
                                        </StyledText>
                                        <StyledText variant="medium" style={[styles.unitSmall, { color: subtitleColor }]}>
                                            {TRACKER_CARDS[activeCardIndex].unit}
                                        </StyledText>
                                    </View>
                                    <StyledText variant="medium" style={[styles.gridLabel, { color: subtitleColor }]}>
                                        {trendData.label}
                                    </StyledText>
                                </View>
                            </GlowCard>
                        </SoundButton>
                    </View>

                    {/* Effectiveness Section */}
                    <GlowCard variant="surface" style={[styles.effectivenessCard, { backgroundColor: cardBg }]}>
                        <View style={styles.effectivenessHeader}>
                            <SoundButton
                                onPress={() => setEffectivenessExpanded(!effectivenessExpanded)}
                                activeOpacity={0.7}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                <StyledText variant="bold" style={[styles.sectionTitle, { color: textColor }]}>Protocol Effectiveness</StyledText>
                            </SoundButton>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={[styles.toggleContainer, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]}>
                                    {['Weekly', 'Monthly', 'All Time'].map((p) => (
                                        <SoundButton
                                            key={p}
                                            style={[styles.toggleButton, selectedPeriod === p && styles.toggleActive]}
                                            onPress={() => setSelectedPeriod(p)}
                                        >
                                            <StyledText variant="medium" style={[styles.toggleText, { color: isDark ? Colors.gray[400] : Colors.gray[500] }, selectedPeriod === p && styles.toggleTextActive]}>
                                                {p}
                                            </StyledText>
                                        </SoundButton>
                                    ))}
                                </View>
                                <SoundButton onPress={() => setEffectivenessExpanded(!effectivenessExpanded)} activeOpacity={0.7}>
                                    <View style={[styles.chevronContainer, effectivenessExpanded && styles.chevronExpanded]}>
                                        <ChevronDown size={20} color={subtitleColor} />
                                    </View>
                                </SoundButton>
                            </View>
                        </View>

                        {effectivenessExpanded && (
                            <View style={styles.placeholderChart}>
                                {/* Y-Axis & Grid Background */}
                                <View style={styles.chartContainer}>
                                    <View style={styles.yAxis}>
                                        {[100, 80, 60, 40, 20, 0].map((val) => (
                                            <StyledText key={val} variant="medium" style={[styles.yAxisLabel, { color: subtitleColor }]}>{val}</StyledText>
                                        ))}
                                    </View>
                                    <View style={styles.chartArea}>
                                        {/* Grid Lines */}
                                        {[100, 80, 60, 40, 20, 0].map((val, i) => (
                                            <View key={i} style={[styles.gridLine, { bottom: `${val}%`, backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]} />
                                        ))}

                                        {/* Bars */}
                                        <View style={styles.chartBars}>
                                            {chartData.length === 0 ? (
                                                <View style={styles.emptyStateContainer}>
                                                    <StyledText variant="medium" style={{ color: subtitleColor }}>No data yet</StyledText>
                                                </View>
                                            ) : (
                                                chartData.map((d, i) => (
                                                    <View key={i} style={styles.barContainer}>
                                                        <View style={[styles.barTrack, { height: '100%' }]}>
                                                            <View style={[
                                                                styles.bar,
                                                                {
                                                                    height: `${Math.max(d.score, 2)}%`, // Min height 2% for visibility
                                                                    backgroundColor: d.hasDose ? (isDark ? Colors.dark.tint : Colors.primary) : (isDark ? Colors.gray[600] : Colors.gray[300]),
                                                                    opacity: d.score > 0 ? 1 : 0.3
                                                                }
                                                            ]} />
                                                        </View>
                                                        {d.showLabel && (
                                                            <StyledText variant="medium" style={[styles.barLabel, { color: subtitleColor }]}>{d.day}</StyledText>
                                                        )}
                                                    </View>
                                                ))
                                            )}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                    </GlowCard>

                    {/* What to Expect Card - Collapsible */}
                    <SoundButton activeOpacity={0.8} onPress={() => setExpectExpanded(!expectExpanded)}>
                        <GlowCard variant="surface" style={[styles.expectCard, { backgroundColor: cardBg }]}>
                            <View style={styles.expectHeader}>
                                <View style={[styles.iconBox, { backgroundColor: isDark ? '#F59E0B30' : '#FEF3C7' }]}>
                                    <Sparkles size={20} color="#F59E0B" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <StyledText variant="bold" style={[styles.expectTitle, { color: textColor }]}>What to Expect</StyledText>
                                    <StyledText variant="medium" style={[styles.expectSubtitle, { color: subtitleColor }]}>Your journey timeline</StyledText>
                                </View>
                                <View style={[styles.chevronContainer, expectExpanded && styles.chevronExpanded]}>
                                    <ChevronDown size={20} color={subtitleColor} />
                                </View>
                            </View>

                            {expectExpanded && (
                                <View style={styles.timelineContainer}>
                                    {getJourneyMilestones().map((milestone, i, arr) => (
                                        <View key={i} style={styles.milestoneRow}>
                                            <View style={[styles.milestoneDot, i === 0 && styles.milestoneDotActive]} />
                                            {i < arr.length - 1 && <View style={[styles.milestoneLine, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }, i === 0 && styles.milestoneLineActive]} />}
                                            <View style={styles.milestoneContent}>
                                                <StyledText variant="bold" style={[styles.milestoneWeek, { color: isDark ? Colors.gray[400] : Colors.gray[400] }, i === 0 && styles.milestoneWeekActive]}>Week {milestone.week}</StyledText>
                                                <StyledText variant="semibold" style={[styles.milestoneTitle, { color: textColor }]}>{milestone.title}</StyledText>
                                                <StyledText variant="medium" style={[styles.milestoneDesc, { color: subtitleColor }]}>{milestone.desc}</StyledText>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </GlowCard>
                    </SoundButton>

                    {/* Streak & Stats Card */}
                    <SoundButton onPress={() => setStatsExpanded(!statsExpanded)} activeOpacity={0.8}>
                        <GlowCard variant="surface" style={[styles.streakCard, { backgroundColor: cardBg }]}>
                            <View style={styles.streakHeader}>
                                <View style={[styles.iconBox, { backgroundColor: isDark ? '#F59E0B30' : '#FEF3C7' }]}>
                                    <Flame size={20} color="#F59E0B" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <StyledText variant="bold" style={[styles.streakTitle, { color: textColor }]}>Your Stats</StyledText>
                                    <StyledText variant="medium" style={[styles.streakSubtitle, { color: subtitleColor }]}>Keep the momentum going!</StyledText>
                                </View>
                                <View style={[styles.chevronContainer, statsExpanded && styles.chevronExpanded]}>
                                    <ChevronDown size={20} color={subtitleColor} />
                                </View>
                            </View>

                            {statsExpanded && (
                                <View style={styles.streakStatsRow}>
                                    <View style={styles.streakStatItem}>
                                        <View style={[styles.streakStatIcon, { backgroundColor: isDark ? Colors.primary + '30' : '#E0E7FF' }]}>
                                            <Flame size={18} color={Colors.primary} />
                                        </View>
                                        <StyledText variant="bold" style={[styles.streakStatValue, { color: textColor }]}>{streakData.current}</StyledText>
                                        <StyledText variant="medium" style={[styles.streakStatLabel, { color: subtitleColor }]}>Current{'\n'}Streak</StyledText>
                                    </View>

                                    <View style={[styles.streakDivider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]} />

                                    <View style={styles.streakStatItem}>
                                        <View style={[styles.streakStatIcon, { backgroundColor: isDark ? '#EC489930' : '#FCE7F3' }]}>
                                            <Trophy size={18} color="#EC4899" />
                                        </View>
                                        <StyledText variant="bold" style={[styles.streakStatValue, { color: textColor }]}>{streakData.best}</StyledText>
                                        <StyledText variant="medium" style={[styles.streakStatLabel, { color: subtitleColor }]}>Best{'\n'}Streak</StyledText>
                                    </View>

                                    <View style={[styles.streakDivider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]} />

                                    <View style={styles.streakStatItem}>
                                        <View style={[styles.streakStatIcon, { backgroundColor: isDark ? '#10B98130' : '#D1FAE5' }]}>
                                            <Pill size={18} color="#10B981" />
                                        </View>
                                        <StyledText variant="bold" style={[styles.streakStatValue, { color: textColor }]}>{streakData.totalDoses}</StyledText>
                                        <StyledText variant="medium" style={[styles.streakStatLabel, { color: subtitleColor }]}>Total{'\n'}Doses</StyledText>
                                    </View>
                                </View>
                            )}
                        </GlowCard>
                    </SoundButton>

                    {/* Top Peptides Section */}
                    {topPeptides.length > 0 && (
                        <SoundButton onPress={() => setPeptidesExpanded(!peptidesExpanded)} activeOpacity={0.8}>
                            <GlowCard variant="surface" style={[styles.topPeptidesCard, { backgroundColor: cardBg }]}>
                                <View style={styles.topPeptidesHeader}>
                                    <View style={[styles.iconBox, { backgroundColor: isDark ? Colors.primary + '30' : '#E0E7FF' }]}>
                                        <Pill size={20} color={Colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <StyledText variant="bold" style={[styles.topPeptidesTitle, { color: textColor }]}>Top Peptides</StyledText>
                                        <StyledText variant="medium" style={[styles.topPeptidesSubtitle, { color: subtitleColor }]}>Your most used compounds</StyledText>
                                    </View>
                                    <View style={[styles.chevronContainer, peptidesExpanded && styles.chevronExpanded]}>
                                        <ChevronDown size={20} color={subtitleColor} />
                                    </View>
                                </View>

                                {peptidesExpanded && (
                                    <View style={styles.peptidesList}>
                                        {topPeptides.map((peptide, index) => (
                                            <View key={index} style={styles.peptideItem}>
                                                <View style={styles.peptideInfo}>
                                                    <View style={[styles.peptideRank, { backgroundColor: index === 0 ? Colors.primary : isDark ? Colors.gray[700] : Colors.gray[200] }]}>
                                                        <StyledText variant="bold" style={[styles.peptideRankText, { color: index === 0 ? Colors.white : subtitleColor }]}>{index + 1}</StyledText>
                                                    </View>
                                                    <View style={styles.peptideDetails}>
                                                        <StyledText variant="semibold" style={[styles.peptideName, { color: textColor }]}>{peptide.name}</StyledText>
                                                        <StyledText variant="medium" style={[styles.peptideCount, { color: subtitleColor }]}>{peptide.count} doses</StyledText>
                                                    </View>
                                                </View>
                                                <View style={styles.peptideBarContainer}>
                                                    <View style={[styles.peptideBarTrack, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]}>
                                                        <View style={[styles.peptideBarFill, { width: `${peptide.percentage}%`, backgroundColor: index === 0 ? Colors.primary : isDark ? Colors.gray[500] : Colors.gray[400] }]} />
                                                    </View>
                                                    <StyledText variant="medium" style={[styles.peptidePercentage, { color: subtitleColor }]}>{peptide.percentage}%</StyledText>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </GlowCard>
                        </SoundButton>
                    )}

                    {/* Achievements Section */}
                    <SoundButton onPress={() => setAchievementsExpanded(!achievementsExpanded)} activeOpacity={0.8}>
                        <GlowCard variant="surface" style={[styles.achievementsCard, { backgroundColor: cardBg }]}>
                            <View style={styles.achievementsHeader}>
                                <View style={[styles.iconBox, { backgroundColor: isDark ? '#8B5CF630' : '#EDE9FE' }]}>
                                    <Award size={20} color="#8B5CF6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <StyledText variant="bold" style={[styles.achievementsTitle, { color: textColor }]}>Achievements</StyledText>
                                    <StyledText variant="medium" style={[styles.achievementsSubtitle, { color: subtitleColor }]}>{unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked</StyledText>
                                </View>
                                <View style={[styles.chevronContainer, achievementsExpanded && styles.chevronExpanded]}>
                                    <ChevronDown size={20} color={subtitleColor} />
                                </View>
                            </View>

                            {achievementsExpanded && (
                                <View style={styles.achievementsList}>
                                    {ACHIEVEMENTS.map((achievement) => {
                                        const isUnlocked = unlockedAchievements.includes(achievement.id);
                                        const IconComponent = achievement.icon;
                                        return (
                                            <View key={achievement.id} style={[styles.achievementItem, !isUnlocked && styles.achievementLocked]}>
                                                <View style={[styles.achievementIcon, { backgroundColor: isUnlocked ? achievement.color + '20' : isDark ? Colors.gray[700] : Colors.gray[200] }]}>
                                                    <IconComponent size={20} color={isUnlocked ? achievement.color : subtitleColor} />
                                                </View>
                                                <StyledText variant="semibold" style={[styles.achievementTitle, { color: isUnlocked ? textColor : subtitleColor }]}>{achievement.title}</StyledText>
                                                <StyledText variant="medium" style={[styles.achievementLabel, { color: subtitleColor }]}>{achievement.label}</StyledText>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </GlowCard>
                    </SoundButton>

                    <View style={{ height: 120 }} />
                </ScrollView >


            </SafeAreaView >
        </View >
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.soft.background,
    },
    blob: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.5,
    },
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.md,
        zIndex: 10, // Ensure header is above everything
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Layout.shadows.small,
    },
    title: {
        fontSize: 20,
        color: Colors.gray[900],
    },
    content: {
        padding: Layout.spacing.lg,
        gap: Layout.spacing.lg,
    },
    mainCard: {
        padding: Layout.spacing.xl,
        alignItems: 'center',
        gap: 24,
    },
    cardHeader: {
        alignItems: 'center',
        gap: 4,
    },
    cardTitle: {
        fontSize: 18,
        color: Colors.gray[900],
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.gray[500],
    },
    chartWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 220,
        height: 220,
    },
    svg: {
        position: 'absolute',
    },
    centerText: {
        alignItems: 'center',
    },
    weightValue: {
        fontSize: 48,
        color: Colors.gray[900],
        lineHeight: 56,
    },
    weightLabel: {
        fontSize: 16,
        color: Colors.gray[500],
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
    },
    statItem: {
        alignItems: 'center',
        gap: 2,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.gray[400],
    },
    statValue: {
        fontSize: 20,
        color: Colors.gray[900],
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: Colors.gray[200],
    },
    gridRow: {
        flexDirection: 'row',
        gap: Layout.spacing.md,
    },
    gridCard: {
        flex: 1,
        padding: Layout.spacing.lg,
        gap: 12,
        minHeight: 140,
        justifyContent: 'space-between',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridContent: {
        gap: 4,
    },
    gridValue: {
        fontSize: 28,
        color: Colors.gray[900],
    },
    gridLabel: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    unitSmall: {
        fontSize: 18,
        marginLeft: 2,
    },
    effectivenessCard: {
        padding: Layout.spacing.lg,
        gap: 20,
    },
    effectivenessHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        color: Colors.gray[900],
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.gray[100],
        padding: 3,
        borderRadius: 10,
    },
    toggleButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    toggleActive: {
        backgroundColor: Colors.white,
        ...Layout.shadows.small,
    },
    toggleText: {
        fontSize: 10,
        color: Colors.gray[500],
    },
    toggleTextActive: {
        color: Colors.gray[900],
        fontFamily: 'Outfit_600SemiBold',
    },
    placeholderChart: {
        height: 180, // Increased height for labels
        marginTop: 16,
    },
    chartContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    yAxis: {
        justifyContent: 'space-between',
        paddingRight: 8,
        paddingBottom: 20, // Align with chart area excluding date labels
    },
    yAxisLabel: {
        fontSize: 10,
        color: Colors.gray[400],
        textAlign: 'right',
        height: 14, // Fixed height for alignment
    },
    chartArea: {
        flex: 1,
        position: 'relative',
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: Colors.gray[100],
    },
    chartBars: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingTop: 10, // Avoid capping top label
        paddingBottom: 0,
    },
    barContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%',
        flex: 1, // Distribute space evenly
    },
    barTrack: {
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        flex: 1,
        marginBottom: 4,
    },
    bar: {
        width: 6, // Fixed width bar
        borderRadius: 3,
        minHeight: 2,
    },
    barLabel: {
        fontSize: 10,
        color: Colors.gray[400],
        marginTop: 4,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Swipeable Tracker Cards
    carouselContent: {
        paddingHorizontal: Layout.spacing.lg - CARD_MARGIN,
    },
    trackerCard: {
        padding: Layout.spacing.lg,
        gap: 16,
    },
    trackerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    trackerIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackerTitleGroup: {
        flex: 1,
        gap: 2,
    },
    trackerTitle: {
        fontSize: 18,
        color: Colors.gray[900],
    },
    trackerDescription: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    trackerBody: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    sliderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        position: 'relative',
    },
    innerValue: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    valueText: {
        fontSize: 42,
        fontFamily: 'Outfit_700Bold',
        color: Colors.gray[900],
    },
    unitText: {
        fontSize: 14,
        color: Colors.gray[500],
        marginTop: -4, // Tweak alignment
    },
    lastUpdatedText: {
        fontSize: 12,
        color: Colors.gray[400],
        marginTop: 12,
        textAlign: 'center',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
        marginTop: 16,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 15,
    },
    logButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        borderRadius: 24,
        alignItems: 'center',
    },
    logButtonText: {
        color: Colors.white,
        fontSize: 14,
    },

    // Pagination Dots
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary + '50', // More visible purple with opacity
    },
    dotActive: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        shadowColor: Colors.primary, // Neon violet glow
        shadowOffset: {
            width: 0,
            height: 0, // Even spread for glow
        },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 8,
    },
    // Log Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Layout.spacing.xl,
    },
    logModalCard: {
        width: '100%',
        padding: Layout.spacing.xl,
        gap: 20,
    },
    logModalTitle: {
        fontSize: 20,
        color: Colors.gray[900],
        textAlign: 'center',
    },
    logInput: {
        backgroundColor: Colors.gray[100],
        borderRadius: Layout.radius.lg,
        padding: 16,
        fontSize: 18,
        fontFamily: 'Outfit_500Medium',
        color: Colors.gray[900],
        textAlign: 'center',
    },
    logModalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    logCancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
        backgroundColor: Colors.gray[100],
    },
    logCancelText: {
        color: Colors.gray[600],
        fontSize: 14,
    },
    logSaveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
        backgroundColor: Colors.primary,
    },
    logSaveText: {
        color: Colors.white,
        fontSize: 14,
    },

    // What to Expect Card
    expectCard: {
        padding: Layout.spacing.lg,
        gap: 20,
    },
    expectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    expectTitle: {
        fontSize: 16,
        color: Colors.gray[900],
    },
    expectSubtitle: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    timelineContainer: {
        gap: 0,
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        minHeight: 72,
    },
    milestoneDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.gray[200],
        marginTop: 4,
        zIndex: 2,
    },
    milestoneDotActive: {
        backgroundColor: Colors.primary,
    },
    milestoneLine: {
        position: 'absolute',
        left: 5,
        top: 16,
        width: 2,
        height: 56,
        backgroundColor: Colors.gray[200],
        zIndex: 1,
    },
    milestoneLineActive: {
        backgroundColor: Colors.primary,
    },
    milestoneContent: {
        marginLeft: 16,
        flex: 1,
        gap: 2,
    },
    milestoneWeek: {
        fontSize: 11,
        color: Colors.gray[400],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    milestoneWeekActive: {
        color: Colors.primary,
    },
    milestoneTitle: {
        fontSize: 15,
        color: Colors.gray[900],
    },
    milestoneDesc: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    chevronContainer: {
        padding: 4,
    },
    chevronExpanded: {
        transform: [{ rotate: '180deg' }],
    },

    // Streak Card Styles
    streakCard: {
        padding: Layout.spacing.lg,
        gap: 20,
    },
    streakHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    streakTitle: {
        fontSize: 16,
        color: Colors.gray[900],
    },
    streakSubtitle: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    streakStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    streakStatItem: {
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    streakStatIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakStatValue: {
        fontSize: 24,
        color: Colors.gray[900],
    },
    streakStatLabel: {
        fontSize: 11,
        color: Colors.gray[500],
        textAlign: 'center',
    },
    streakDivider: {
        width: 1,
        height: 50,
        backgroundColor: Colors.gray[200],
    },

    // Top Peptides Styles
    topPeptidesCard: {
        padding: Layout.spacing.lg,
        gap: 16,
    },
    topPeptidesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    topPeptidesTitle: {
        fontSize: 16,
        color: Colors.gray[900],
    },
    topPeptidesSubtitle: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    peptidesList: {
        gap: 12,
    },
    peptideItem: {
        gap: 8,
    },
    peptideInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    peptideRank: {
        width: 24,
        height: 24,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    peptideRankText: {
        fontSize: 12,
    },
    peptideDetails: {
        flex: 1,
    },
    peptideName: {
        fontSize: 14,
        color: Colors.gray[900],
    },
    peptideCount: {
        fontSize: 11,
        color: Colors.gray[500],
    },
    peptideBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 34,
    },
    peptideBarTrack: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.gray[200],
    },
    peptideBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    peptidePercentage: {
        fontSize: 11,
        color: Colors.gray[500],
        minWidth: 30,
        textAlign: 'right',
    },

    // Achievements Styles
    achievementsCard: {
        padding: Layout.spacing.lg,
        gap: 16,
    },
    achievementsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    achievementsTitle: {
        fontSize: 16,
        color: Colors.gray[900],
    },
    achievementsSubtitle: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    achievementsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    achievementItem: {
        width: '30%',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 12,
    },
    achievementLocked: {
        opacity: 0.5,
    },
    achievementIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    achievementTitle: {
        fontSize: 11,
        color: Colors.gray[900],
        textAlign: 'center',
    },
    achievementLabel: {
        fontSize: 9,
        color: Colors.gray[500],
        textAlign: 'center',
    },
});
