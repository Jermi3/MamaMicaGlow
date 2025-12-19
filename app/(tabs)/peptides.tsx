import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useSounds } from '@/hooks/useSounds';
import {
    pauseNotificationsForPeptide,
    resumeNotificationsForPeptide,
    sendProtocolStatusNotification
} from '@/services/notificationService';
import { fetchPeptides } from '@/services/peptideService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { AlertCircle, ChevronRight, Clock, Droplets, Heart, Info, Package, Plus, Search, Sparkles, Syringe, Thermometer, Trash2, TriangleAlert, X, XCircle, Zap } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function PeptidesScreen() {
    const router = useRouter();
    const { preferences } = usePreferences();
    const { playTap, playDelete } = useSounds();
    // const playTap = () => { };
    // const playDelete = () => { };
    const isDark = preferences.darkMode;
    const insets = useSafeAreaInsets();

    // Dynamic colors
    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];

    // Category Config for colors (copied from catalog for consistency)
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
    const DEFAULT_CONFIG = { color: Colors.primary, gradient: Colors.gradients.primary, icon: Syringe };

    const getConfig = (category: string) => CATEGORY_CONFIG[category] || DEFAULT_CONFIG;

    const [peptides, setPeptides] = useState<any[]>([]);

    const [selectedPeptide, setSelectedPeptide] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmClearAllVisible, setConfirmClearAllVisible] = useState(false);
    const [peptideToDelete, setPeptideToDelete] = useState<string | null>(null);

    const filteredPeptides = useMemo(() => {
        if (!searchQuery) return peptides;
        return peptides.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.benefits && p.benefits.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [peptides, searchQuery]);

    const handlePeptidePress = (peptide: any) => {
        setSelectedPeptide(peptide);
        // showPeptideMenu(peptide); // Disabled old menu
    };

    useFocusEffect(
        useCallback(() => {
            const loadPeptides = async () => {
                try {
                    const saved = await AsyncStorage.getItem('user_peptides');
                    let currentPeptides = saved ? JSON.parse(saved) : [];

                    // Only sync categories once per session (every 10 minutes) to avoid lag
                    const lastSyncTime = await AsyncStorage.getItem('peptides_last_sync');
                    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
                    // Force sync if peptides are missing descriptions
                    const needsDescriptionSync = currentPeptides.some((p: any) => !p.description);
                    const shouldSync = needsDescriptionSync || !lastSyncTime || parseInt(lastSyncTime) < tenMinutesAgo;

                    if (shouldSync && currentPeptides.length > 0) {
                        try {
                            const catalog = await fetchPeptides();
                            let hasUpdates = false;

                            currentPeptides = currentPeptides.map((p: any) => {
                                // Match by catalogId first, then by exact name, then by partial name
                                const match = catalog.find(c =>
                                    c.id === p.catalogId ||
                                    c.name === p.name ||
                                    c.name.toLowerCase().includes(p.name.toLowerCase()) ||
                                    p.name.toLowerCase().includes(c.name.toLowerCase())
                                );
                                if (match) {
                                    // Check if any important field needs updating
                                    if (p.category !== match.category || !p.description || !p.benefits) {
                                        hasUpdates = true;
                                        return {
                                            ...p,
                                            category: match.category,
                                            description: match.description || p.description,
                                            benefits: Array.isArray(match.benefits) ? match.benefits.join(', ') : match.benefits,
                                            mechanism: match.mechanism || p.mechanism,
                                            half_life: match.half_life || p.half_life,
                                            storage: match.storage || p.storage,
                                            side_effects: match.side_effects || p.side_effects,
                                        };
                                    }
                                }
                                return p;
                            });

                            if (hasUpdates) {
                                await AsyncStorage.setItem('user_peptides', JSON.stringify(currentPeptides));
                            }
                            await AsyncStorage.setItem('peptides_last_sync', Date.now().toString());
                        } catch (err) {
                            console.warn('Failed to sync peptides from catalog:', err);
                        }
                    }

                    setPeptides(currentPeptides);
                } catch (e) {
                    console.error('Failed to load peptides', e);
                }
            };
            loadPeptides();
        }, [])
    );

    // Toggle peptide status between Active and Paused
    const toggleStatus = async (peptideId: string) => {
        const peptide = peptides.find(p => p.id === peptideId);
        if (!peptide) return;

        const newStatus = peptide.status === 'Active' ? 'Paused' : 'Active';

        const updated = peptides.map(p =>
            p.id === peptideId
                ? { ...p, status: newStatus }
                : p
        );
        setPeptides(updated);
        await AsyncStorage.setItem('user_peptides', JSON.stringify(updated));

        // Sync notifications based on new status
        if (newStatus === 'Paused') {
            await pauseNotificationsForPeptide(peptide.name);
        } else {
            await resumeNotificationsForPeptide(peptide.name);
        }

        // Send immediate notification about the status change
        await sendProtocolStatusNotification(peptide.name, newStatus);
    };

    // Initiate remove flow
    const removePeptide = (peptideId: string) => {
        console.log('[Remove] removePeptide called with id:', peptideId);
        setPeptideToDelete(peptideId);
        setConfirmVisible(true);
    };

    // Confirm and execute removal
    const confirmRemove = async () => {
        console.log('[Remove] confirmRemove called, peptideToDelete:', peptideToDelete);
        if (!peptideToDelete) {
            console.log('[Remove] No peptideToDelete, returning');
            return;
        }

        const peptide = peptides.find(p => p.id === peptideToDelete);
        console.log('[Remove] Found peptide:', peptide?.name);

        if (peptide) {
            // Ensure type safety comparisons
            const updated = peptides.filter(p => String(p.id) !== String(peptideToDelete));
            console.log('[Remove] Updating peptides, remaining:', updated.length);

            // Close modal first for better performance
            setConfirmVisible(false);
            setPeptideToDelete(null);
            setSelectedPeptide(null);

            // Update state after modal close interaction
            requestAnimationFrame(async () => {
                setPeptides(updated);
                try {
                    await AsyncStorage.setItem('user_peptides', JSON.stringify(updated));
                    // Also delete schedules for this peptide
                    const { deleteSchedulesByPeptide } = await import('@/constants/storage');
                    await deleteSchedulesByPeptide(peptide.name);
                    console.log('[Remove] Also deleted schedules for:', peptide.name);
                } catch (err) {
                    console.error('Failed to save peptides:', err);
                }
            });

            // Play delete sound
            playDelete();
            console.log('[Remove] Removal complete');
        }

    };

    // Clear all peptides from stack
    const clearAllPeptides = async () => {
        // Close modal first to prevent UI freeze/lag
        setConfirmClearAllVisible(false);

        // Use setTimeout instead of requestAnimationFrame to avoid blocking
        setTimeout(async () => {
            setPeptides([]);
            try {
                await AsyncStorage.setItem('user_peptides', JSON.stringify([]));
                // Also clear all schedules locally
                const { clearAllSchedules } = await import('@/constants/storage');
                await clearAllSchedules();

                // CRITICAL: Also delete from cloud to prevent sync from restoring them
                const { syncService } = await import('@/services/syncService');
                await syncService.deleteAllPeptides();
                await syncService.deleteAllSchedules();

                console.log('[ClearAll] Cleared all peptides and schedules (local + cloud)');
            } catch (err) {
                console.error('Failed to clear peptides:', err);
            }
        }, 0);

        // Play delete sound
        // playDelete();
    };


    const SoftBlob = ({ color, style }: { color: string, style: any }) => (
        <View style={[styles.blob, { backgroundColor: color }, style]} />
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            {/* Background blobs */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#EDE9FE"} style={{ top: -100, left: -50, width: 350, height: 350 }} />
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ bottom: 100, right: -50, width: 300, height: 300 }} />


            {/* Static Header */}
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: insets.top + 10,
                    }
                ]}
            >
                <SoundButton onPress={() => router.back()} style={styles.headerContent} activeOpacity={0.7}>
                    <StyledText variant="bold" style={[styles.screenTitle, { color: textColor, fontSize: 24 }]}>My Stack</StyledText>
                    <StyledText variant="medium" style={[styles.screenSubtitle, { color: subtitleColor }]}>Active protocols</StyledText>
                </SoundButton>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    {peptides.length > 0 && (
                        <SoundButton
                            style={[styles.clearButton, isDark && { backgroundColor: Colors.gray[700] }]}
                            onPress={() => { playTap(); setConfirmClearAllVisible(true); }}
                        >
                            <Trash2 size={20} color={isDark ? '#EF4444' : '#DC2626'} />
                        </SoundButton>
                    )}
                    <SoundButton
                        style={[styles.addButton, isDark && { backgroundColor: Colors.gray[700] }]}
                        onPress={() => { playTap(); router.push('/peptide-catalog'); }}
                    >
                        <Plus size={24} color={Colors.white} />
                    </SoundButton>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[styles.container, { paddingTop: 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Search Bar */}
                <GlowCard variant="surface" style={[styles.searchContainer, isDark && { backgroundColor: cardBg }]}>
                    <Search size={20} color={subtitleColor} />
                    <TextInput
                        placeholder="Search your stack..."
                        placeholderTextColor={subtitleColor}
                        style={[styles.searchInput, { color: textColor }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </GlowCard>

                {/* Peptides List */}
                <View style={styles.listContainer}>
                    {filteredPeptides.length > 0 ? (
                        filteredPeptides.map((peptide) => (
                            <PeptideListItem
                                key={peptide.id}
                                peptide={peptide}
                                isDark={isDark}
                                textColor={textColor}
                                subtitleColor={subtitleColor}
                                cardBg={cardBg}
                                onPressModal={() => handlePeptidePress(peptide)}
                                getConfig={getConfig}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <AlertCircle size={48} color={subtitleColor} />
                            <StyledText variant="medium" style={[styles.emptyText, { color: subtitleColor }]}>
                                {searchQuery ? 'No peptides found matching your search.' : 'Your stack is empty. Start by adding a protocol.'}
                            </StyledText>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Peptide Detail Modal */}
            <Modal
                visible={selectedPeptide !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedPeptide(null)}
            >
                <View style={[styles.modalOverlay]}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? Colors.gray[900] : Colors.white, paddingBottom: insets.bottom }]}>
                        {selectedPeptide && (
                            <>
                                {/* Modal Header with Gradient */}
                                <LinearGradient
                                    colors={getConfig(selectedPeptide.category || '').gradient}
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
                                            const IconComp = getConfig(selectedPeptide.category || '').icon;
                                            return <IconComp size={32} color={Colors.white} />;
                                        })()}
                                    </View>

                                    <StyledText variant="bold" style={styles.modalTitle}>
                                        {selectedPeptide.name}
                                    </StyledText>
                                    <View style={styles.modalStrengthBadge}>
                                        <StyledText variant="semibold" style={styles.modalStrengthText}>
                                            {selectedPeptide.dosage || selectedPeptide.strength} {selectedPeptide.dosage_unit}
                                        </StyledText>
                                    </View>
                                </LinearGradient>

                                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                                    {/* Description */}
                                    <StyledText variant="regular" style={[styles.modalDescription, { color: isDark ? Colors.gray[300] : Colors.gray[600] }]}>
                                        {selectedPeptide.description || 'No description available.'}
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
                                    {/* Handle benefits string or array */}
                                    {(selectedPeptide.benefits) && (
                                        <View style={styles.modalSection}>
                                            <View style={styles.sectionHeader}>
                                                <View style={[styles.sectionIcon, { backgroundColor: Colors.success + '20' }]}>
                                                    <Sparkles size={16} color={Colors.success} />
                                                </View>
                                                <StyledText variant="bold" style={[styles.sectionTitle, { color: isDark ? Colors.gray[100] : Colors.gray[800] }]}>
                                                    Key Benefits
                                                </StyledText>
                                            </View>
                                            {/* If benefits is array */}
                                            {Array.isArray(selectedPeptide.benefits) ? (
                                                selectedPeptide.benefits.map((benefit: string, i: number) => (
                                                    <View key={i} style={styles.benefitItem}>
                                                        <LinearGradient
                                                            colors={['#34D399', '#10B981']}
                                                            style={styles.benefitDot}
                                                        />
                                                        <StyledText variant="regular" style={[styles.benefitText, { color: isDark ? Colors.gray[300] : Colors.gray[600] }]}>
                                                            {benefit}
                                                        </StyledText>
                                                    </View>
                                                ))
                                            ) : (
                                                // If benefits is string (legacy or joined)
                                                <StyledText variant="regular" style={[styles.benefitText, { color: isDark ? Colors.gray[300] : Colors.gray[600], marginLeft: 4 }]}>
                                                    {selectedPeptide.benefits}
                                                </StyledText>
                                            )}
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
                                                {/* Reconstitution */}
                                                {selectedPeptide.dosing[0].reconstitution && (
                                                    <>
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
                                                {selectedPeptide.side_effects.map((effect: string, i: number) => (
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
                                                {selectedPeptide.contraindications.map((item: string, i: number) => (
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

                                    {/* Bottom spacing for scroll */}
                                    <View style={{ height: 20 }} />
                                </ScrollView>

                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => {
                                        if (selectedPeptide?.id) {
                                            removePeptide(selectedPeptide.id);
                                        }
                                    }}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.removeButtonContent}>
                                        <Trash2 size={20} color="#EF4444" />
                                        <StyledText variant="bold" style={styles.removeButtonText}>
                                            Remove from Stack
                                        </StyledText>
                                    </View>
                                </TouchableOpacity>

                                {/* Nested Confirmation Overlay */}
                                {confirmVisible && (
                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000, pointerEvents: 'box-none' }]}>
                                        <View style={{ pointerEvents: 'auto' }}>
                                            <GlowCard variant="surface" style={[styles.confirmCard, isDark && { backgroundColor: Colors.gray[900], borderColor: Colors.gray[800] }]}>
                                                <View style={styles.confirmIconContainer}>
                                                    <Trash2 size={32} color="#EF4444" />
                                                </View>
                                                <StyledText variant="bold" style={[styles.confirmTitle, { color: textColor }]}>
                                                    Remove from Stack?
                                                </StyledText>
                                                <StyledText variant="regular" style={[styles.confirmMessage, { color: subtitleColor }]}>
                                                    Are you sure you want to remove this peptide? This action cannot be undone.
                                                </StyledText>

                                                <View style={styles.confirmActions}>
                                                    <TouchableOpacity
                                                        style={[styles.confirmButton, styles.cancelButton, isDark && { backgroundColor: Colors.gray[800] }]}
                                                        onPress={() => setConfirmVisible(false)}
                                                    >
                                                        <StyledText variant="semibold" style={{ color: isDark ? Colors.gray[300] : Colors.gray[600] }}>
                                                            Cancel
                                                        </StyledText>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={[styles.confirmButton, styles.deleteButton]}
                                                        onPress={confirmRemove}
                                                    >
                                                        <StyledText variant="semibold" style={{ color: Colors.white }}>
                                                            Delete
                                                        </StyledText>
                                                    </TouchableOpacity>
                                                </View>
                                            </GlowCard>
                                        </View>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Clear All Confirmation Modal */}
            <Modal
                visible={confirmClearAllVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmClearAllVisible(false)}
            >
                <View style={styles.confirmOverlay}>
                    <GlowCard variant="surface" style={[styles.confirmCard, isDark && { backgroundColor: Colors.gray[900], borderColor: Colors.gray[800] }]}>
                        <View style={styles.confirmIconContainer}>
                            <Trash2 size={32} color="#EF4444" />
                        </View>
                        <StyledText variant="bold" style={[styles.confirmTitle, { color: textColor }]}>
                            Clear All Peptides?
                        </StyledText>
                        <StyledText variant="regular" style={[styles.confirmMessage, { color: subtitleColor }]}>
                            This will remove all {peptides.length} peptide(s) from your stack. This action cannot be undone.
                        </StyledText>

                        <View style={styles.confirmActions}>
                            <SoundButton
                                style={[styles.confirmButton, styles.cancelButton, isDark && { backgroundColor: Colors.gray[800] }]}
                                onPress={() => setConfirmClearAllVisible(false)}
                            >
                                <StyledText variant="semibold" style={{ color: isDark ? Colors.gray[300] : Colors.gray[600] }}>
                                    Cancel
                                </StyledText>
                            </SoundButton>

                            <SoundButton
                                style={[styles.confirmButton, styles.deleteButton]}
                                onPress={() => {
                                    clearAllPeptides();
                                    setConfirmClearAllVisible(false);
                                }}
                            >
                                <StyledText variant="semibold" style={{ color: Colors.white }}>
                                    Clear All
                                </StyledText>
                            </SoundButton>
                        </View>
                    </GlowCard>
                </View>
            </Modal>
        </View>
    );
}

function PeptideListItem({ peptide, isDark, textColor, subtitleColor, cardBg, onPressModal, getConfig }: any) {
    const config = getConfig(peptide.category || '');
    const IconComponent = config.icon;

    return (
        <SoundButton
            activeOpacity={0.7}
            onPress={onPressModal}
        >
            <GlowCard variant="surface" style={[styles.peptideCard, isDark && { backgroundColor: cardBg }]}>
                <LinearGradient
                    colors={config.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconContainer}
                >
                    <IconComponent size={28} color="#FFF" />
                </LinearGradient>

                <View style={styles.cardContent}>
                    {/* Top Row: Name and Badge */}
                    <View style={[styles.cardHeader, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }]}>
                        <StyledText variant="bold" style={[styles.peptideName, { color: textColor, flex: 1, marginRight: 8 }]} numberOfLines={1}>
                            {peptide.name}
                        </StyledText>
                        <View style={[styles.badge, { backgroundColor: (peptide.color || Colors.primary) + '15', alignSelf: 'flex-start' }]}>
                            <StyledText variant="medium" style={[styles.badgeText, { color: peptide.color || Colors.primary }]}>
                                {peptide.dosage_amount || peptide.dosage} {peptide.dosage_unit}
                            </StyledText>
                        </View>
                    </View>

                    {/* Bottom Row: Frequency and Chevron */}
                    <View style={[styles.metaRow, { justifyContent: 'space-between', alignItems: 'center' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Clock size={14} color={subtitleColor} />
                            <StyledText variant="regular" style={[styles.metaText, { color: subtitleColor, marginLeft: 6 }]}>
                                {peptide.frequency}
                            </StyledText>
                        </View>
                        <ChevronRight
                            size={18}
                            color={subtitleColor}
                            style={{ opacity: 0.5 }}
                        />
                    </View>
                </View>
            </GlowCard>
        </SoundButton>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.lg,
        paddingBottom: 16,
    },
    headerContent: {
        gap: 4,
    },
    container: {
        padding: Layout.spacing.lg,
    },
    screenTitle: {
        fontSize: 32,
    },
    screenSubtitle: {
        fontSize: 16,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Layout.shadows.medium,
    },
    clearButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Layout.shadows.small,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: Layout.spacing.lg,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Outfit_400Regular',
        fontSize: 16,
    },
    listContainer: {
        gap: Layout.spacing.lg,
    },
    peptideCard: {
        flexDirection: 'row',
        padding: 16,
        gap: 16,
        alignItems: 'center',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        gap: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    peptideName: {
        fontSize: 17,
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
    },
    safetyCard: {
        backgroundColor: 'rgba(139, 92, 246, 0.05)', // Very light purple
        borderColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 1,
        gap: 8,
    },
    safetyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    safetyTitle: {
        fontSize: 16,
        color: Colors.primary,
    },
    safetyText: {
        fontSize: 14,
        color: Colors.gray[600],
        lineHeight: 20,
    },
    safetyLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    safetyLinkText: {
        fontSize: 14,
        color: Colors.primary,
    },

    // Expected Benefits
    benefitsRow: {
        backgroundColor: '#FEF3C7',
        borderRadius: Layout.radius.md,
        padding: Layout.spacing.md,
        gap: 6,
    },
    benefitsLabel: {
        fontSize: 11,
        color: '#B45309',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    benefitsText: {
        fontSize: 13,
        color: '#92400E',
        lineHeight: 18,
    },

    // Modal styles for Details
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '92%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 0,
        overflow: 'hidden',
    },
    modalGradientHeader: {
        padding: 24,
        paddingTop: 32,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    modalClose: {
        position: 'absolute',
        top: 24,
        right: 24,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    confirmCard: {
        width: '100%',
        maxWidth: 340,
        padding: 24,
        alignItems: 'center',
        borderRadius: 24,
    },
    confirmIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EF444415',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    confirmTitle: {
        fontSize: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    confirmMessage: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    confirmActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    confirmButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.gray[100],
    },
    deleteButton: {
        backgroundColor: '#EF4444',
    },
    modalIconLarge: {
        width: 64,
        height: 64,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 24,
        color: Colors.white,
        textAlign: 'center',
        marginBottom: 8,
    },
    modalStrengthBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    modalStrengthText: {
        color: Colors.white,
        fontSize: 14,
    },
    modalScroll: {
        flex: 1,
        padding: 24,
    },
    modalDescription: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 24,
    },
    modalSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    sectionIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
    },
    mechanismText: {
        fontSize: 15,
        lineHeight: 22,
    },
    infoCardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    infoCard: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    infoCardIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoCardLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    infoCardValue: {
        fontSize: 13,
        textAlign: 'center',
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 8,
    },
    benefitDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 8,
    },
    benefitText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    dosingCard: {
        borderRadius: 16,
        padding: 16,
    },
    dosingRowEnhanced: {
        flexDirection: 'row',
        gap: 12,
    },
    dosingIndicator: {
        width: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
    },
    dosingContent: {
        flex: 1,
        gap: 4,
    },
    dosingLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dosingValue: {
        fontSize: 15,
        lineHeight: 20,
    },
    dosingDivider: {
        height: 1,
        marginVertical: 12,
        marginLeft: 16,
    },
    warningCard: {
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    warningItem: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
    },
    warningDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
        marginTop: 8,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    dangerCard: {
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    dangerItem: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
    },
    dangerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
        marginTop: 8,
    },
    dangerText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    removeButton: {
        margin: 24,
        marginTop: 0,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        alignItems: 'center',
    },
    removeButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    removeButtonText: {
        fontSize: 16,
        color: '#DC2626',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 12,
    },
    benefitsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 16,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 14,
    },
});
