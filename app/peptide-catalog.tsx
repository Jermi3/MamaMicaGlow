import { AlertModal } from '@/components/AlertModal';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useSounds } from '@/hooks/useSounds';
import { fetchPeptides, Peptide } from '@/services/peptideService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Clock, Droplets, Heart, Info, Layers, Package, Plus, Search, Sparkles, Syringe, Thermometer, TriangleAlert, X, XCircle, Zap } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeInDown, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Vibrant Category Configuration
const CATEGORY_CONFIG: Record<string, { color: string; gradient: readonly [string, string]; icon: typeof Syringe }> = {
    'Semaglutide': { color: '#8B5CF6', gradient: ['#A78BFA', '#7C3AED'] as const, icon: Droplets },
    'Tirzepatide': { color: '#EC4899', gradient: ['#F472B6', '#DB2777'] as const, icon: Sparkles },
    'Retatrutide': { color: '#F97316', gradient: ['#FB923C', '#EA580C'] as const, icon: Zap },
    'Weight Management': { color: '#F59E0B', gradient: ['#FCD34D', '#D97706'] as const, icon: Heart },
    'Growth Hormone': { color: '#10B981', gradient: ['#34D399', '#059669'] as const, icon: Zap },
    'Healing & Recovery': { color: '#06B6D4', gradient: ['#22D3EE', '#0891B2'] as const, icon: Heart },
    'Peptide Combinations': { color: '#6366F1', gradient: ['#818CF8', '#4F46E5'] as const, icon: Sparkles },
    'Accessories & Supplies': { color: '#3B82F6', gradient: ['#60A5FA', '#2563EB'] as const, icon: Package }, // Changed to bright blue
};

const DEFAULT_CONFIG = { color: Colors.primary, gradient: Colors.gradients.primary, icon: Syringe };

export default function PeptideCatalogScreen() {
    const router = useRouter();
    const { preferences } = usePreferences();
    const { playAdd } = useSounds();
    // const playAdd = () => { };
    const isDark = preferences.darkMode;
    const insets = useSafeAreaInsets();

    // Dynamic colors
    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];
    const inputBg = isDark ? Colors.gray[700] : Colors.white;

    const [peptides, setPeptides] = useState<Peptide[]>([]);
    const [filteredPeptides, setFilteredPeptides] = useState<Peptide[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeptide, setSelectedPeptide] = useState<Peptide | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const scheduleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>({
        visible: false, title: '', message: '', type: 'info'
    });
    const [userPeptideIds, setUserPeptideIds] = useState<Set<string>>(new Set());

    useFocusEffect(
        useCallback(() => {
            loadPeptides();
            loadUserPeptides();
        }, [])
    );

    const loadUserPeptides = async () => {
        try {
            const existing = await AsyncStorage.getItem('user_peptides');
            if (existing) {
                const userPeptides = JSON.parse(existing);
                const ids = new Set<string>(userPeptides.map((p: any) => p.catalogId || p.id));
                setUserPeptideIds(ids);
            }
        } catch (e) {
            console.error('Failed to load user peptides:', e);
        }
    };

    const loadPeptides = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchPeptides();
            setPeptides(data);
            setFilteredPeptides(data);
            const uniqueCategories = [...new Set(data.map(p => p.category))].sort();
            setCategories(uniqueCategories);
        } catch (e: any) {
            console.error('Failed to load peptides:', e?.message || e);
            setError('Failed to load peptides. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        filterPeptides(query, selectedCategory);
    };

    const handleCategorySelect = (category: string | null) => {
        setSelectedCategory(category);
        filterPeptides(searchQuery, category);
    };

    const filterPeptides = (query: string, category: string | null) => {
        let filtered = peptides;
        if (category) filtered = filtered.filter(p => p.category === category);
        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                p.description.toLowerCase().includes(lowerQuery)
            );
        }
        setFilteredPeptides(filtered);
    };

    // Parse frequency from dosing info to determine schedule type
    const parseFrequency = (frequencyStr: string): { type: 'daily' | 'weekly' | 'biweekly'; daysOfWeek: number[] } => {
        const lower = frequencyStr.toLowerCase();

        // Check for daily patterns
        if (lower.includes('daily') || lower.includes('every day') || lower.includes('1x daily') || lower.includes('2x daily')) {
            return { type: 'daily', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] };
        }

        // Check for weekly patterns with specific counts
        if (lower.includes('weekly') || lower.includes('per week') || lower.includes('/week')) {
            // Try to extract number of times per week
            const match = lower.match(/(\d+)\s*x|x\s*(\d+)|(\d+)\s*times/);
            const timesPerWeek = match ? parseInt(match[1] || match[2] || match[3]) : 3;

            if (timesPerWeek >= 5) {
                return { type: 'daily', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] };
            } else if (timesPerWeek === 4) {
                return { type: 'weekly', daysOfWeek: [1, 2, 4, 5] }; // Mon, Tue, Thu, Fri
            } else if (timesPerWeek === 3) {
                return { type: 'weekly', daysOfWeek: [1, 3, 5] }; // Mon, Wed, Fri
            } else if (timesPerWeek === 2) {
                return { type: 'weekly', daysOfWeek: [1, 4] }; // Mon, Thu
            } else {
                return { type: 'weekly', daysOfWeek: [1] }; // Monday only
            }
        }

        // Check for biweekly
        if (lower.includes('biweekly') || lower.includes('every 2 weeks') || lower.includes('every two weeks')) {
            return { type: 'biweekly', daysOfWeek: [1] }; // Monday
        }

        // Default to 3x weekly
        return { type: 'weekly', daysOfWeek: [1, 3, 5] };
    };

    const handleAddToStack = async (peptide: Peptide) => {
        // Prevent multiple simultaneous operations
        if (isAdding) {
            return;
        }

        setIsAdding(true);
        console.log('handleAddToStack called for:', peptide.name);
        try {
            const existing = await AsyncStorage.getItem('user_peptides');
            const userPeptides = existing ? JSON.parse(existing) : [];

            // Check for duplicates
            if (userPeptides.some((p: any) => p.catalogId === peptide.id || p.id === peptide.id)) {
                // Close modal first to prevent modal conflicts
                setSelectedPeptide(null);
                setIsAdding(false);

                // Show alert after modal closes (use setTimeout to ensure modal animation completes)
                setTimeout(() => {
                    setAlertConfig({ visible: true, title: 'Already Added', message: 'This peptide is already in your stack.', type: 'info' });
                }, 300);

                return;
            }

            const config = CATEGORY_CONFIG[peptide.category] || DEFAULT_CONFIG;

            const newPeptide = {
                id: peptide.id,
                name: peptide.name,
                dosage: peptide.strength,
                frequency: peptide.dosing?.[0]?.frequency || 'As directed',
                color: config.color,
                status: 'Active',
                createdAt: new Date().toISOString(),
                catalogId: peptide.id,
                category: peptide.category,
                // Rich details
                description: peptide.description,
                benefits: Array.isArray(peptide.benefits) ? peptide.benefits.join(', ') : peptide.benefits,
                side_effects: peptide.side_effects,
                contraindications: peptide.contraindications,
                dosing: peptide.dosing,
                mechanism: peptide.mechanism,
                storage: peptide.storage,
                half_life: peptide.half_life,
            };

            userPeptides.push(newPeptide);

            // Instantly update the UI to show gray card
            setUserPeptideIds(prev => new Set(prev).add(peptide.id));

            // Close modal and show toast IMMEDIATELY (before any async operations)
            setShowToast(true);
            setSelectedPeptide(null);
            setIsAdding(false);

            // Play add sound immediately
            playAdd();

            setTimeout(() => {
                setShowToast(false);
            }, 1500);

            // Save to AsyncStorage in background (non-blocking)
            // Use requestAnimationFrame to ensure UI updates first
            requestAnimationFrame(async () => {
                try {
                    await AsyncStorage.setItem('user_peptides', JSON.stringify(userPeptides));
                } catch (storageError) {
                    console.error('Failed to save peptide:', storageError);
                    // Show error but don't block UI
                    setAlertConfig({ visible: true, title: 'Warning', message: 'Peptide added but failed to save. Please try again.', type: 'warning' });
                }
            });

            // Temporarily disable automatic schedule creation to prevent lag
            // Users can create schedules manually from the Calendar screen
            // TODO: Re-enable with better performance optimization
            /*
            // Automatically create a default schedule based on dosing frequency (non-blocking)
            // Do this after UI updates to prevent lag
            // Clear any existing timeout to prevent accumulation
            if (scheduleTimeoutRef.current) {
                clearTimeout(scheduleTimeoutRef.current);
            }
            scheduleTimeoutRef.current = setTimeout(async () => {
                try {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/97cb0a92-ea5f-4b1f-85a3-1112c7246f5a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'peptide-catalog.tsx:230', message: 'starting schedule creation', data: { peptideName: peptide.name }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
                    // #endregion
                    const frequencyStr = peptide.dosing?.[0]?.frequency || '3x weekly';
                    const { type, daysOfWeek } = parseFrequency(frequencyStr);

                    // Parse the dose amount from subcutaneous info or use a default
                    const doseAmount = peptide.dosing?.[0]?.subcutaneous?.match(/([\d.]+\s*(?:mg|mcg|iu|units))/i)?.[1] || peptide.strength;

                    // Create default schedule at 9:00 AM
                    const schedules = await saveSchedule({
                        peptide: peptide.name,
                        amount: doseAmount,
                        frequency: type,
                        daysOfWeek: daysOfWeek,
                        time: '09:00',
                        enabled: true,
                    });

                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/97cb0a92-ea5f-4b1f-85a3-1112c7246f5a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'peptide-catalog.tsx:245', message: 'schedule creation success', data: { schedulesCount: schedules.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
                    // #endregion
                } catch (scheduleError) {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/97cb0a92-ea5f-4b1f-85a3-1112c7246f5a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'peptide-catalog.tsx:260', message: 'schedule creation error', data: { error: String(scheduleError) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
                    // #endregion
                    console.error('Failed to create schedule:', scheduleError);
                } finally {
                    scheduleTimeoutRef.current = null;
                }
            }, 100);
            */
        } catch (e: any) {
            console.error('Failed to add peptide:', e);
            setIsAdding(false);
            setAlertConfig({ visible: true, title: 'Error', message: `Failed to add peptide: ${e.message || 'Unknown error'}`, type: 'error' });
        }
    };

    const getConfig = (category: string) => CATEGORY_CONFIG[category] || DEFAULT_CONFIG;

    const SoftBlob = ({ color, style }: { color: string; style: any }) => (
        <View style={[styles.blob, { backgroundColor: color }, style]} />
    );

    const renderPeptideCard = ({ item, index }: { item: Peptide; index: number }) => {
        const config = getConfig(item.category);
        const IconComponent = config.icon;
        const isAlreadyInStack = userPeptideIds.has(item.id);

        return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <SoundButton activeOpacity={0.9} onPress={() => setSelectedPeptide(item)}>
                    <View style={[
                        styles.peptideCard,
                        { backgroundColor: cardBg },
                        isAlreadyInStack && { opacity: 0.55 }
                    ]}>
                        {/* Gradient accent bar */}
                        <LinearGradient
                            colors={isAlreadyInStack
                                ? [isDark ? '#4B5563' : '#9CA3AF', isDark ? '#374151' : '#6B7280']
                                : config.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.cardAccent}
                        />

                        <View style={styles.cardContent}>
                            {/* Header with icon and info */}
                            <View style={styles.cardHeader}>
                                <LinearGradient
                                    colors={isAlreadyInStack
                                        ? [isDark ? '#4B5563' : '#9CA3AF', isDark ? '#374151' : '#6B7280']
                                        : config.gradient}
                                    style={styles.iconContainer}
                                >
                                    <IconComponent size={22} color={Colors.white} />
                                </LinearGradient>

                                <View style={styles.cardInfo}>
                                    <View style={styles.nameRow}>
                                        <StyledText variant="bold" style={[styles.peptideName, { color: textColor }]}>
                                            {item.name}
                                        </StyledText>
                                        {isAlreadyInStack && (
                                            <View style={[styles.inStackBadge, { backgroundColor: isDark ? Colors.gray[600] : Colors.gray[200] }]}>
                                                <StyledText variant="medium" style={[styles.inStackText, { color: isDark ? Colors.gray[300] : Colors.gray[600] }]}>
                                                    In Stack
                                                </StyledText>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.strengthRow}>
                                        <View style={[styles.strengthBadge, { backgroundColor: (isAlreadyInStack ? Colors.gray[500] : config.color) + '15' }]}>
                                            <StyledText variant="semibold" style={[styles.strengthText, { color: isAlreadyInStack ? Colors.gray[500] : config.color }]}>
                                                {item.strength}
                                            </StyledText>
                                        </View>
                                    </View>
                                </View>

                                <SoundButton
                                    style={[styles.viewButton, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]}
                                    onPress={() => setSelectedPeptide(item)}
                                >
                                    <ChevronRight size={20} color={subtitleColor} />
                                </SoundButton>
                            </View>

                            {/* Description */}
                            <StyledText variant="regular" style={[styles.description, { color: subtitleColor }]} numberOfLines={2}>
                                {item.description}
                            </StyledText>

                            {/* Footer with category */}
                            <View style={styles.cardFooter}>
                                <View style={[styles.categoryPill, { backgroundColor: (isAlreadyInStack ? Colors.gray[500] : config.color) + '10' }]}>
                                    <View style={[styles.categoryDot, { backgroundColor: isAlreadyInStack ? Colors.gray[500] : config.color }]} />
                                    <StyledText variant="medium" style={[styles.categoryText, { color: isAlreadyInStack ? Colors.gray[500] : config.color }]}>
                                        {item.category}
                                    </StyledText>
                                </View>
                            </View>
                        </View>
                    </View>
                </SoundButton>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            {/* Background blobs - dark mode uses muted violet tones */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#EDE9FE"} style={{ top: -100, right: -50, width: 300, height: 300 }} />
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ bottom: 100, left: -100, width: 350, height: 350 }} />
            <SoftBlob color={isDark ? "#3730A3" : "#F3E8FF"} style={{ top: 200, left: -80, width: 200, height: 200 }} />

            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <SoundButton onPress={() => router.back()} style={[styles.backButton, { backgroundColor: cardBg }]}>
                        <ChevronLeft size={24} color={textColor} />
                    </SoundButton>
                    <View style={styles.titleContainer}>
                        <StyledText variant="bold" style={[styles.title, { color: textColor }]}>Peptide Catalog</StyledText>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchBar, { backgroundColor: inputBg }]}>
                        <Search size={20} color={isDark ? Colors.dark.tint : Colors.primary} />
                        <TextInput
                            style={[styles.searchInput, { color: textColor }]}
                            placeholder="Search peptides..."
                            placeholderTextColor={subtitleColor}
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        {searchQuery.length > 0 && (
                            <SoundButton onPress={() => handleSearch('')} style={styles.clearButton}>
                                <X size={16} color={Colors.white} />
                            </SoundButton>
                        )}
                    </View>
                </View>

                {/* Category Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScrollView}
                    contentContainerStyle={styles.categoryContainer}
                >
                    {!selectedCategory ? (
                        <LinearGradient
                            colors={Colors.gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.categoryChipGradient}
                        >
                            <SoundButton onPress={() => handleCategorySelect(null)}>
                                <StyledText variant="bold" style={styles.categoryChipTextActive}>
                                    All ({peptides.length})
                                </StyledText>
                            </SoundButton>
                        </LinearGradient>
                    ) : (
                        <SoundButton
                            style={[styles.categoryChip, { backgroundColor: cardBg }]}
                            onPress={() => handleCategorySelect(null)}
                        >
                            <StyledText variant="medium" style={[styles.categoryChipText, { color: subtitleColor }]}>
                                All ({peptides.length})
                            </StyledText>
                        </SoundButton>
                    )}

                    {categories.map(category => {
                        const config = getConfig(category);
                        const isSelected = selectedCategory === category;
                        const count = peptides.filter(p => p.category === category).length;
                        // Removed truncation to show full category names
                        const label = category;

                        return isSelected ? (
                            <LinearGradient
                                key={category}
                                colors={config.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.categoryChipGradient}
                            >
                                <SoundButton onPress={() => handleCategorySelect(category)}>
                                    <StyledText variant="bold" style={styles.categoryChipTextActive}>
                                        {label} ({count})
                                    </StyledText>
                                </SoundButton>
                            </LinearGradient>
                        ) : (
                            <SoundButton
                                key={category}
                                style={[styles.categoryChip, { backgroundColor: cardBg }]}
                                onPress={() => handleCategorySelect(category)}
                            >
                                <StyledText variant="medium" style={[styles.categoryChipText, { color: subtitleColor }]}>
                                    {label} ({count})
                                </StyledText>
                            </SoundButton>
                        );
                    })}
                </ScrollView>

                {/* Results Count */}
                <View style={styles.resultsRow}>
                    <StyledText variant="medium" style={[styles.resultsText, { color: subtitleColor }]}>
                        {filteredPeptides.length} peptide{filteredPeptides.length !== 1 ? 's' : ''} found
                    </StyledText>
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={isDark ? Colors.dark.tint : Colors.primary} />
                        <StyledText variant="medium" style={[styles.loadingText, { color: subtitleColor }]}>Loading peptides...</StyledText>
                    </View>
                ) : error ? (
                    <View style={styles.centerContent}>
                        <Package size={48} color={subtitleColor} />
                        <StyledText variant="medium" style={[styles.errorText, { color: subtitleColor }]}>{error}</StyledText>
                        <SoundButton style={styles.retryButton} onPress={loadPeptides}>
                            <StyledText variant="bold" style={styles.retryText}>Retry</StyledText>
                        </SoundButton>
                    </View>
                ) : (
                    <FlatList
                        data={filteredPeptides}
                        renderItem={renderPeptideCard}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.centerContent}>
                                <Package size={48} color={subtitleColor} />
                                <StyledText variant="medium" style={[styles.emptyText, { color: subtitleColor }]}>
                                    No peptides found
                                </StyledText>
                            </View>
                        }
                        ListFooterComponent={
                            <View style={{ height: 100 }} />
                        }
                    />
                )}
            </SafeAreaView>

            {/* Peptide Detail Modal */}
            <Modal
                visible={selectedPeptide !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedPeptide(null)}
            >
                <View style={styles.modalOverlay}>
                    {/* Added SafeAreaView for proper bottom padding */}
                    <SafeAreaView edges={['bottom']} style={[styles.modalContent, { backgroundColor: isDark ? Colors.gray[900] : Colors.white }]}>
                        {selectedPeptide && (
                            <>
                                {/* Modal Header with Gradient */}
                                <LinearGradient
                                    colors={getConfig(selectedPeptide.category).gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.modalGradientHeader}
                                >
                                    <SoundButton
                                        style={styles.modalClose}
                                        onPress={() => setSelectedPeptide(null)}
                                    >
                                        <X size={24} color={Colors.white} />
                                    </SoundButton>

                                    <View style={styles.modalIconLarge}>
                                        {(() => {
                                            const IconComp = getConfig(selectedPeptide.category).icon;
                                            return <IconComp size={32} color={Colors.white} />;
                                        })()}
                                    </View>

                                    <StyledText variant="bold" style={styles.modalTitle}>
                                        {selectedPeptide.name}
                                    </StyledText>
                                    <View style={styles.modalStrengthBadge}>
                                        <StyledText variant="semibold" style={styles.modalStrengthText}>
                                            {selectedPeptide.strength}
                                        </StyledText>
                                    </View>
                                </LinearGradient>

                                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                                    {/* Description */}
                                    <StyledText variant="regular" style={[styles.modalDescription, { color: isDark ? Colors.gray[300] : Colors.gray[600] }]}>
                                        {selectedPeptide.description}
                                    </StyledText>

                                    {/* How It Works */}
                                    {selectedPeptide.mechanism && (
                                        <View style={styles.modalSection}>
                                            <View style={styles.sectionHeader}>
                                                <View style={[styles.sectionIcon, { backgroundColor: (isDark ? Colors.dark.tint : Colors.primary) + '15' }]}>
                                                    <Info size={16} color={isDark ? Colors.dark.tint : Colors.primary} />
                                                </View>
                                                <StyledText variant="bold" style={[styles.sectionTitle, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                    How It Works
                                                </StyledText>
                                            </View>
                                            <StyledText variant="regular" style={[styles.mechanismText, { color: isDark ? Colors.gray[300] : Colors.gray[600] }]}>
                                                {selectedPeptide.mechanism}
                                            </StyledText>
                                        </View>
                                    )}

                                    {/* Storage & Half-Life Row */}
                                    {(selectedPeptide.storage || selectedPeptide.half_life) && (
                                        <View style={styles.infoCardsRow}>
                                            {selectedPeptide.storage && (
                                                <View style={[styles.infoCard, { backgroundColor: isDark ? Colors.gray[800] : Colors.white, borderColor: isDark ? Colors.gray[700] : Colors.gray[200] }]}>
                                                    <View style={[styles.infoCardIcon, { backgroundColor: '#3B82F620' }]}>
                                                        <Thermometer size={18} color="#3B82F6" />
                                                    </View>
                                                    <StyledText variant="semibold" style={[styles.infoCardLabel, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                        Storage
                                                    </StyledText>
                                                    <StyledText variant="regular" style={[styles.infoCardValue, { color: isDark ? Colors.gray[400] : Colors.gray[500] }]}>
                                                        {selectedPeptide.storage}
                                                    </StyledText>
                                                </View>
                                            )}
                                            {selectedPeptide.half_life && (
                                                <View style={[styles.infoCard, { backgroundColor: isDark ? Colors.gray[800] : Colors.white, borderColor: isDark ? Colors.gray[700] : Colors.gray[200] }]}>
                                                    <View style={[styles.infoCardIcon, { backgroundColor: '#F59E0B20' }]}>
                                                        <Clock size={18} color="#F59E0B" />
                                                    </View>
                                                    <StyledText variant="semibold" style={[styles.infoCardLabel, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                        Half-Life
                                                    </StyledText>
                                                    <StyledText variant="regular" style={[styles.infoCardValue, { color: isDark ? Colors.gray[400] : Colors.gray[500] }]}>
                                                        {selectedPeptide.half_life}
                                                    </StyledText>
                                                </View>
                                            )}
                                        </View>
                                    )}

                                    {/* Key Benefits */}
                                    {Array.isArray(selectedPeptide.benefits) && selectedPeptide.benefits.length > 0 && (
                                        <View style={styles.modalSection}>
                                            <View style={styles.sectionHeader}>
                                                <View style={[styles.sectionIcon, { backgroundColor: Colors.success + '20' }]}>
                                                    <Sparkles size={16} color={Colors.success} />
                                                </View>
                                                <StyledText variant="bold" style={[styles.sectionTitle, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                    Key Benefits
                                                </StyledText>
                                            </View>
                                            {selectedPeptide.benefits.map((benefit, i) => (
                                                <View key={i} style={styles.benefitItem}>
                                                    <LinearGradient
                                                        colors={['#34D399', '#10B981']}
                                                        style={styles.benefitDot}
                                                    />
                                                    <StyledText variant="regular" style={[styles.benefitText, { color: isDark ? Colors.gray[300] : Colors.gray[600] }]}>
                                                        {benefit}
                                                    </StyledText>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* Enhanced Dosing Guide */}
                                    {Array.isArray(selectedPeptide.dosing) && selectedPeptide.dosing.length > 0 && (
                                        <View style={styles.modalSection}>
                                            <View style={styles.sectionHeader}>
                                                <View style={[styles.sectionIcon, { backgroundColor: (isDark ? Colors.dark.tint : Colors.primary) + '20' }]}>
                                                    <Syringe size={16} color={isDark ? Colors.dark.tint : Colors.primary} />
                                                </View>
                                                <StyledText variant="bold" style={[styles.sectionTitle, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                    Dosing Guide
                                                </StyledText>
                                            </View>
                                            <View style={[styles.dosingCard, { backgroundColor: isDark ? Colors.gray[800] : Colors.gray[100] }]}>
                                                {selectedPeptide.dosing[0].vialSize && (
                                                    <>
                                                        <View style={styles.dosingRowEnhanced}>
                                                            <View style={styles.dosingIndicator} />
                                                            <View style={styles.dosingContent}>
                                                                <StyledText variant="medium" style={[styles.dosingLabel, { color: isDark ? Colors.gray[400] : Colors.gray[500] }]}>
                                                                    Vial Size
                                                                </StyledText>
                                                                <StyledText variant="semibold" style={[styles.dosingValue, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                                    {selectedPeptide.dosing[0].vialSize}
                                                                </StyledText>
                                                            </View>
                                                        </View>
                                                        <View style={[styles.dosingDivider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]} />
                                                    </>
                                                )}
                                                <View style={styles.dosingRowEnhanced}>
                                                    <View style={[styles.dosingIndicator, { backgroundColor: isDark ? Colors.dark.tint : Colors.primary }]} />
                                                    <View style={styles.dosingContent}>
                                                        <StyledText variant="medium" style={[styles.dosingLabel, { color: isDark ? Colors.gray[400] : Colors.gray[500] }]}>
                                                            Frequency
                                                        </StyledText>
                                                        <StyledText variant="regular" style={[styles.dosingValue, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                            {selectedPeptide.dosing[0].frequency}
                                                        </StyledText>
                                                    </View>
                                                </View>
                                                {selectedPeptide.dosing[0].subcutaneous && (
                                                    <>
                                                        <View style={[styles.dosingDivider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]} />
                                                        <View style={styles.dosingRowEnhanced}>
                                                            <View style={[styles.dosingIndicator, { backgroundColor: isDark ? Colors.dark.tint : Colors.primary }]} />
                                                            <View style={styles.dosingContent}>
                                                                <StyledText variant="medium" style={[styles.dosingLabel, { color: isDark ? Colors.gray[400] : Colors.gray[500] }]}>
                                                                    Subcutaneous
                                                                </StyledText>
                                                                <StyledText variant="regular" style={[styles.dosingValue, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                                    {selectedPeptide.dosing[0].subcutaneous}
                                                                </StyledText>
                                                            </View>
                                                        </View>
                                                    </>
                                                )}
                                                <View style={[styles.dosingDivider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]} />
                                                <View style={styles.dosingRowEnhanced}>
                                                    <View style={[styles.dosingIndicator, { backgroundColor: isDark ? Colors.dark.tint : Colors.primary }]} />
                                                    <View style={styles.dosingContent}>
                                                        <StyledText variant="medium" style={[styles.dosingLabel, { color: isDark ? Colors.gray[400] : Colors.gray[500] }]}>
                                                            Reconstitution
                                                        </StyledText>
                                                        <StyledText variant="regular" style={[styles.dosingValue, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                            {selectedPeptide.dosing[0].reconstitution}
                                                        </StyledText>
                                                    </View>
                                                </View>
                                                {selectedPeptide.dosing[0].notes && (
                                                    <>
                                                        <View style={[styles.dosingDivider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]} />
                                                        <View style={styles.dosingRowEnhanced}>
                                                            <View style={[styles.dosingIndicator, { backgroundColor: Colors.accent }]} />
                                                            <View style={styles.dosingContent}>
                                                                <StyledText variant="medium" style={[styles.dosingLabel, { color: isDark ? Colors.gray[400] : Colors.gray[500] }]}>
                                                                    Note
                                                                </StyledText>
                                                                <StyledText variant="regular" style={[styles.dosingValue, { fontStyle: 'italic', color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                                    {selectedPeptide.dosing[0].notes}
                                                                </StyledText>
                                                            </View>
                                                        </View>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                    )}

                                    {/* Possible Side Effects */}
                                    {Array.isArray(selectedPeptide.side_effects) && selectedPeptide.side_effects.length > 0 && (
                                        <View style={styles.modalSection}>
                                            <View style={styles.sectionHeader}>
                                                <View style={[styles.sectionIcon, { backgroundColor: '#F59E0B20' }]}>
                                                    <TriangleAlert size={16} color="#F59E0B" />
                                                </View>
                                                <StyledText variant="bold" style={[styles.sectionTitle, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                    Possible Side Effects
                                                </StyledText>
                                            </View>
                                            <View style={[styles.warningCard, { backgroundColor: isDark ? '#F59E0B15' : '#FEF3C720' }]}>
                                                {selectedPeptide.side_effects.map((effect, i) => (
                                                    <View key={i} style={styles.warningItem}>
                                                        <View style={styles.warningDot} />
                                                        <StyledText variant="regular" style={[styles.warningText, { color: isDark ? Colors.gray[300] : Colors.gray[700] }]}>
                                                            {effect}
                                                        </StyledText>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Contraindications */}
                                    {Array.isArray(selectedPeptide.contraindications) && selectedPeptide.contraindications.length > 0 && (
                                        <View style={styles.modalSection}>
                                            <View style={styles.sectionHeader}>
                                                <View style={[styles.sectionIcon, { backgroundColor: '#EF444420' }]}>
                                                    <XCircle size={16} color="#EF4444" />
                                                </View>
                                                <StyledText variant="bold" style={[styles.sectionTitle, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                    Contraindications
                                                </StyledText>
                                            </View>
                                            <View style={[styles.dangerCard, { backgroundColor: isDark ? '#EF444415' : '#FEE2E220' }]}>
                                                {selectedPeptide.contraindications.map((item, i) => (
                                                    <View key={i} style={styles.dangerItem}>
                                                        <View style={styles.dangerDot} />
                                                        <StyledText variant="regular" style={[styles.dangerText, { color: isDark ? Colors.gray[300] : Colors.gray[700] }]}>
                                                            {item}
                                                        </StyledText>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Stacking Options */}
                                    {Array.isArray(selectedPeptide.stacking) && selectedPeptide.stacking.length > 0 && (
                                        <View style={styles.modalSection}>
                                            <View style={styles.sectionHeader}>
                                                <View style={[styles.sectionIcon, { backgroundColor: (isDark ? Colors.dark.tint : Colors.primary) + '20' }]}>
                                                    <Layers size={16} color={isDark ? Colors.dark.tint : Colors.primary} />
                                                </View>
                                                <StyledText variant="bold" style={[styles.sectionTitle, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                    Stacking Options
                                                </StyledText>
                                            </View>
                                            <View style={styles.stackingContainer}>
                                                {selectedPeptide.stacking.map((stack, i) => (
                                                    <View key={i} style={[styles.stackingPill, { backgroundColor: (isDark ? Colors.dark.tint : Colors.primary) + '15', borderColor: (isDark ? Colors.dark.tint : Colors.primary) + '30' }]}>
                                                        <StyledText variant="medium" style={[styles.stackingText, { color: isDark ? Colors.dark.tint : Colors.primary }]}>
                                                            {stack}
                                                        </StyledText>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Bottom spacing for scroll */}
                                    <View style={{ height: 20 }} />
                                </ScrollView>

                                <SoundButton
                                    style={[styles.addToStackButton, isAdding && { opacity: 0.6 }]}
                                    onPress={() => {
                                        console.log('Button pressed for:', selectedPeptide.name);
                                        if (selectedPeptide && !isAdding) {
                                            handleAddToStack(selectedPeptide);
                                        }
                                    }}
                                    activeOpacity={0.9}
                                    disabled={isAdding}
                                >
                                    <LinearGradient
                                        colors={getConfig(selectedPeptide.category).gradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.addButtonGradient}
                                    >
                                        <Plus size={20} color={Colors.white} />
                                        <StyledText variant="bold" style={styles.addToStackText}>
                                            Add to My Stack
                                        </StyledText>
                                    </LinearGradient>
                                </SoundButton>
                            </>
                        )}
                        {/* End of content */}
                    </SafeAreaView>
                </View>
            </Modal >

            {/* Toast */}
            {
                showToast && (
                    <Animated.View
                        entering={ZoomIn}
                        exiting={ZoomOut}
                        style={[styles.toast, { top: insets.top + 10, bottom: undefined }]}
                    >
                        <LinearGradient
                            colors={['#C084FC', '#A855F7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.toastGradient}
                        >
                            <StyledText variant="bold" style={styles.toastText}>
                                ✓ Added to your stack!
                            </StyledText>
                        </LinearGradient>
                    </Animated.View>
                )
            }

            {/* Alert Modal */}
            <AlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />
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
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.lg,
        marginTop: Layout.spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Layout.shadows.small,
        zIndex: 10,
    },
    titleContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    title: {
        fontSize: 20,
        color: Colors.gray[900],
    },
    searchContainer: {
        paddingHorizontal: Layout.spacing.lg,
        marginVertical: Layout.spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.radius.xl,
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: 14,
        gap: Layout.spacing.sm,
        ...Layout.shadows.soft,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Outfit_500Medium',
        fontSize: 16,
        color: Colors.gray[900],
    },
    clearButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.gray[400],
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryScrollView: {
        minHeight: 52, // Ensure chips are not clipped
        flexGrow: 0,
        flexShrink: 0,
    },
    categoryContainer: {
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.sm,
        alignItems: 'center',
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 12, // Increased from 10
        borderRadius: 24,
        backgroundColor: Colors.white,
        marginRight: 8,
        ...Layout.shadows.small,
    },
    categoryChipGradient: {
        paddingHorizontal: 16,
        paddingVertical: 12, // Increased from 10
        borderRadius: 24,
        marginRight: 8,
        ...Layout.shadows.small,
    },
    categoryChipText: {
        fontSize: 14, // Increased from 13
        color: Colors.gray[600],
        lineHeight: 20, // Increased from 18
        paddingBottom: 2,
    },
    categoryChipTextActive: {
        fontSize: 14, // Increased from 13
        color: Colors.white,
        lineHeight: 20, // Increased from 18
        paddingBottom: 2,
    },
    resultsRow: {
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.sm,
    },
    resultsText: {
        fontSize: 13,
        color: Colors.gray[500],
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Layout.spacing.md,
    },
    loadingText: {
        color: Colors.gray[500],
        fontSize: 14,
    },
    errorText: {
        color: Colors.gray[500],
        fontSize: 14,
        textAlign: 'center',
    },
    emptyText: {
        color: Colors.gray[400],
        fontSize: 16,
    },
    retryButton: {
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: 20,
    },
    retryText: {
        color: Colors.white,
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: Layout.spacing.lg,
        paddingBottom: Layout.spacing.xxl,
        gap: 16,
    },
    peptideCard: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        overflow: 'hidden',
        ...Layout.shadows.soft,
    },
    cardAccent: {
        height: 4,
    },
    cardContent: {
        padding: Layout.spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    inStackBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    inStackText: {
        fontSize: 10,
    },

    manualEntryButton: {
        padding: Layout.spacing.lg,
        alignItems: 'center',
        gap: 4,
        marginTop: Layout.spacing.lg,
        marginBottom: Layout.spacing.xl,
        borderWidth: 1,
        borderColor: Colors.gray[200],
        borderRadius: 16,
        borderStyle: 'dashed',
    },
    manualEntryText: {
        color: Colors.gray[500],
        fontSize: 14,
    },
    manualEntryLink: {
        color: Colors.primary,
        fontSize: 15,
    },
    peptideName: {
        fontSize: 17,
        color: Colors.gray[900],
        marginBottom: 4,
    },
    strengthRow: {
        flexDirection: 'row',
    },
    strengthBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    strengthText: {
        fontSize: 12,
    },
    viewButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    description: {
        fontSize: 13,
        color: Colors.gray[500],
        lineHeight: 19,
        marginBottom: 12,
        minHeight: 38, // Ensure consistent height
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    categoryDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    categoryText: {
        fontSize: 11,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: 20,
        color: Colors.gray[900],
    },
    priceUnit: {
        fontSize: 13,
        color: Colors.gray[400],
        marginLeft: 2,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '90%',
        overflow: 'hidden',
    },
    modalGradientHeader: {
        paddingTop: 20,
        paddingBottom: 24,
        paddingHorizontal: Layout.spacing.lg,
        alignItems: 'center',
    },
    modalClose: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalIconLarge: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 24,
        color: Colors.white,
        textAlign: 'center',
    },
    modalStrengthBadge: {
        marginTop: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    modalStrengthText: {
        fontSize: 14,
        color: Colors.white,
    },
    modalScroll: {
        padding: Layout.spacing.lg,
        maxHeight: 380,
    },
    modalDescription: {
        fontSize: 15,
        color: Colors.gray[600],
        lineHeight: 24,
        marginBottom: Layout.spacing.lg,
    },
    modalSection: {
        marginBottom: Layout.spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        color: Colors.gray[800],
        marginBottom: 12,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    benefitDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
        marginRight: 12,
    },
    benefitText: {
        flex: 1,
        fontSize: 14,
        color: Colors.gray[600],
        lineHeight: 20,
    },
    dosingCard: {
        backgroundColor: Colors.gray[100],
        borderRadius: 16,
        padding: 16,
    },
    dosingRow: {
        marginBottom: 4,
    },
    dosingLabel: {
        fontSize: 12,
        color: Colors.gray[500],
        marginBottom: 2,
    },
    dosingValue: {
        fontSize: 14,
        color: Colors.gray[800],
    },
    dosingDivider: {
        height: 1,
        backgroundColor: Colors.gray[200],
        marginVertical: 12,
    },
    pricingSection: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    priceBox: {
        flex: 1,
        backgroundColor: Colors.gray[100],
        borderRadius: 16,
        padding: 16,
        overflow: 'hidden',
    },
    priceBoxHighlight: {
        backgroundColor: 'transparent',
    },
    priceBoxLabel: {
        fontSize: 12,
        color: Colors.gray[500],
        marginBottom: 4,
    },
    priceBoxValue: {
        fontSize: 18,
        color: Colors.gray[900],
    },
    addToStackButton: {
        margin: Layout.spacing.lg,
        borderRadius: 30,
        overflow: 'hidden',
        ...Layout.shadows.medium,
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    addToStackText: {
        color: Colors.white,
        fontSize: 16,
    },
    toast: {
        position: 'absolute',
        // bottom: 100, // Overridden by inline style
        left: Layout.spacing.xl,
        right: Layout.spacing.xl,
        borderRadius: 30,
        overflow: 'hidden',
        ...Layout.shadows.medium,
        zIndex: 100, // Ensure it's on top
    },
    toastGradient: {
        paddingVertical: Layout.spacing.md,
        paddingHorizontal: Layout.spacing.lg,
        alignItems: 'center',
    },
    toastText: {
        color: Colors.white,
        fontSize: 14,
    },
    // New styles for enhanced modal sections
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    sectionIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mechanismText: {
        fontSize: 14,
        color: Colors.gray[600],
        lineHeight: 22,
    },
    infoCardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: Layout.spacing.lg,
    },
    infoCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.gray[200],
    },
    infoCardIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoCardLabel: {
        fontSize: 13,
        color: Colors.gray[800],
        marginBottom: 4,
    },
    infoCardValue: {
        fontSize: 12,
        color: Colors.gray[500],
        lineHeight: 18,
    },
    dosingRowEnhanced: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    dosingIndicator: {
        width: 3,
        height: '100%',
        minHeight: 36,
        backgroundColor: Colors.primary,
        borderRadius: 2,
        marginRight: 12,
    },
    dosingContent: {
        flex: 1,
    },
    warningCard: {
        backgroundColor: '#FEF3C720',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F59E0B30',
    },
    warningItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    warningDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
        marginTop: 7,
        marginRight: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: Colors.gray[700],
        lineHeight: 20,
    },
    dangerCard: {
        backgroundColor: '#FEE2E220',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EF444430',
    },
    dangerItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    dangerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
        marginTop: 7,
        marginRight: 12,
    },
    dangerText: {
        flex: 1,
        fontSize: 13,
        color: Colors.gray[700],
        lineHeight: 20,
    },
    stackingContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    stackingPill: {
        backgroundColor: Colors.primary + '15',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    stackingText: {
        fontSize: 13,
        color: Colors.primary,
        lineHeight: 18,
    },
});
