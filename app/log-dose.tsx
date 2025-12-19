import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { saveDose } from '@/constants/storage';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useSounds } from '@/hooks/useSounds';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, ChevronDown, Clock, Droplets, FlaskConical, Heart, Package, Plus, Scale, Sparkles, Syringe, Zap } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogDoseScreen() {
    // Vibrant Category Configuration (copied from catalog for consistency)
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

    const router = useRouter();
    const params = useLocalSearchParams();
    const { preferences } = usePreferences();
    const { playSuccess } = useSounds();
    const isDark = preferences.darkMode;

    // Dynamic colors
    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];
    const inputBg = isDark ? Colors.gray[700] : Colors.gray[100];

    const [selectedPeptide, setSelectedPeptide] = useState('Select Peptide');
    const [amount, setAmount] = useState('');
    const [entryType, setEntryType] = useState('Injection');
    const [showPeptideModal, setShowPeptideModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [peptides, setPeptides] = useState<{ id: string; name: string; category: string; color: string; dosage?: string; displayName: string }[]>([]);

    // Reset form when screen becomes focused
    useFocusEffect(
        useCallback(() => {
            // Reset to defaults first
            setSelectedPeptide('Select Peptide');
            setAmount('');
            setEntryType('Injection');
            setCurrentTime(new Date());

            // Then apply params if they exist
            if (params.peptide) {
                setSelectedPeptide(params.peptide as string);
            }
            if (params.amount) {
                // Only use the amount if it's a valid number
                const numericAmount = (params.amount as string).replace(/[^0-9.]/g, '');
                if (numericAmount) {
                    setAmount(numericAmount);
                }
            }
        }, [params.peptide, params.amount])
    );

    useFocusEffect(
        useCallback(() => {
            const loadPeptides = async () => {
                try {
                    const saved = await AsyncStorage.getItem('user_peptides');
                    if (saved) {
                        let parsed = JSON.parse(saved);

                        // Sync categories from catalog for accurate icons
                        try {
                            const { fetchPeptides } = await import('@/services/peptideService');
                            const catalog = await fetchPeptides();
                            let hasUpdates = false;

                            parsed = parsed.map((p: any) => {
                                // Match by catalogId, exact name, or partial name
                                const match = catalog.find(c =>
                                    c.id === p.catalogId ||
                                    c.id === p.id ||
                                    c.name === p.name ||
                                    c.name.toLowerCase().includes(p.name.toLowerCase()) ||
                                    p.name.toLowerCase().includes(c.name.toLowerCase())
                                );
                                if (match && p.category !== match.category) {
                                    hasUpdates = true;
                                    return { ...p, category: match.category };
                                }
                                return p;
                            });

                            // Persist the updated categories
                            if (hasUpdates) {
                                await AsyncStorage.setItem('user_peptides', JSON.stringify(parsed));
                            }
                        } catch (syncErr) {
                            // Sync failed - continue with existing data
                        }

                        // Extract peptides with categories, deduplicate by name + dosage
                        const uniquePeptides = new Map<string, { id: string; name: string; category: string; color: string; dosage?: string; displayName: string }>();
                        parsed.forEach((p: any) => {
                            const name = p.name;
                            const dosage = p.dosage || p.strength || '';
                            const displayName = `${name} ${dosage}`.trim();
                            const uniqueKey = `${name}-${dosage}`;

                            if (!uniquePeptides.has(uniqueKey)) {
                                const config = CATEGORY_CONFIG[p.category] || DEFAULT_CONFIG;
                                uniquePeptides.set(uniqueKey, {
                                    id: p.id,
                                    name: name,
                                    dosage: dosage,
                                    displayName: displayName,
                                    category: p.category || 'Weight Management',
                                    color: p.color || config.color
                                });
                            }
                        });
                        setPeptides(Array.from(uniquePeptides.values()));
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            loadPeptides();
        }, [])
    );

    const handleSave = async () => {
        // Validation logic
        if (selectedPeptide === 'Select Peptide' || !amount) {
            return;
        }

        // Find the category for the selected peptide
        const matchedPeptide = peptides.find(p => p.displayName === selectedPeptide);
        const category = matchedPeptide?.category || 'Weight Management';

        // Save to history with category
        await saveDose({
            peptide: selectedPeptide,
            amount: amount,
            type: entryType,
            category: category
        });

        // Play success sound
        playSuccess();

        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
            router.back();
        }, 1500);
    };

    const SoftBlob = ({ color, style }: { color: string, style: any }) => (
        <View style={[styles.blob, { backgroundColor: color }, style]} />
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            {/* Background Ambience - dark mode uses muted violet tones */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#EDE9FE"} style={{ top: -100, left: -100, width: 400, height: 400 }} />
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ top: 100, right: -150, width: 350, height: 350 }} />
            <SoftBlob color={isDark ? "#3730A3" : "#F3E8FF"} style={{ bottom: 0, left: -50, width: 300, height: 300 }} />

            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <SoundButton onPress={() => router.back()} style={[styles.backButton, { backgroundColor: cardBg }]}>
                        <ArrowLeft size={24} color={textColor} />
                    </SoundButton>
                    <StyledText variant="bold" style={[styles.title, { color: textColor }]}>Log Dose</StyledText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {/* Time Display */}
                    <View style={styles.timeContainer}>
                        <Clock size={16} color={subtitleColor} />
                        <StyledText variant="medium" style={[styles.timeText, { color: subtitleColor }]}>{currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</StyledText>
                    </View>

                    <GlowCard style={[styles.formCard, isDark && { backgroundColor: cardBg }]} variant="surface">
                        {/* Peptide Selector */}
                        <View style={styles.inputGroup}>
                            <StyledText variant="semibold" style={[styles.label, { color: subtitleColor }]}>Peptide</StyledText>
                            <SoundButton
                                style={[styles.pickerButton, { backgroundColor: inputBg }]}
                                onPress={() => setShowPeptideModal(true)}
                                activeOpacity={0.8}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#E0E7FF' }]}>
                                        <FlaskConical size={20} color={isDark ? Colors.dark.tint : Colors.primary} />
                                    </View>
                                    <StyledText variant="medium" style={[
                                        styles.pickerText,
                                        { color: textColor },
                                        selectedPeptide === 'Select Peptide' && { color: subtitleColor }
                                    ]}>
                                        {selectedPeptide}
                                    </StyledText>
                                </View>
                                <ChevronDown size={20} color={subtitleColor} />
                            </SoundButton>
                        </View>

                        {/* Amount Input */}
                        <View style={styles.inputGroup}>
                            <StyledText variant="semibold" style={[styles.label, { color: subtitleColor }]}>Dosage Amount</StyledText>
                            <View style={[styles.inputContainer, { backgroundColor: inputBg }]}>
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    placeholder="0"
                                    placeholderTextColor={subtitleColor}
                                    keyboardType="decimal-pad"
                                    value={amount}
                                    onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
                                />
                                <View style={[styles.unitBadge, { backgroundColor: cardBg }]}>
                                    <StyledText variant="bold" style={[styles.unitText, { color: subtitleColor }]}>units</StyledText>
                                </View>
                            </View>
                        </View>

                        {/* Units / Type */}
                        <View style={styles.inputGroup}>
                            <StyledText variant="semibold" style={[styles.label, { color: subtitleColor }]}>Entry Type</StyledText>
                            <View style={styles.typeRow}>
                                <SoundButton
                                    style={[styles.typeButton, { backgroundColor: inputBg }, entryType === 'Injection' && [styles.activeType, isDark && { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderColor: Colors.dark.tint }]]}
                                    onPress={() => setEntryType('Injection')}
                                >
                                    <Scale size={16} color={entryType === 'Injection' ? (isDark ? Colors.dark.tint : Colors.primary) : subtitleColor} />
                                    <StyledText variant="bold" style={entryType === 'Injection' ? [styles.activeTypeText, { color: isDark ? Colors.dark.tint : Colors.primary }] : [styles.typeText, { color: subtitleColor }]}>Injection</StyledText>
                                </SoundButton>
                                <SoundButton
                                    style={[styles.typeButton, { backgroundColor: inputBg }, entryType === 'Oral' && [styles.activeType, isDark && { backgroundColor: 'rgba(139, 92, 246, 0.2)', borderColor: Colors.dark.tint }]]}
                                    onPress={() => setEntryType('Oral')}
                                >
                                    <StyledText variant="medium" style={entryType === 'Oral' ? [styles.activeTypeText, { color: isDark ? Colors.dark.tint : Colors.primary }] : [styles.typeText, { color: subtitleColor }]}>Oral</StyledText>
                                </SoundButton>
                            </View>
                        </View>
                    </GlowCard>

                    {/* Quick Add Buttons */}
                    <StyledText variant="semibold" style={[styles.sectionTitle, { color: subtitleColor }]}>Quick Fill</StyledText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFillRow}>
                        {['2.5', '5', '7.5', '10', '12.5', '15'].map((val) => (
                            <SoundButton key={val} style={[styles.quickFillButton, { backgroundColor: cardBg }]} onPress={() => setAmount(val)}>
                                <StyledText variant="bold" style={[styles.quickFillText, { color: isDark ? Colors.dark.tint : Colors.primary }]}>{val}</StyledText>
                            </SoundButton>
                        ))}
                    </ScrollView>

                    {/* Action Button */}
                    <View style={styles.footer}>
                        <SoundButton
                            style={[
                                styles.saveButton,
                                (!amount || selectedPeptide === 'Select Peptide') && {
                                    backgroundColor: isDark ? Colors.gray[700] : Colors.gray[300],
                                    shadowOpacity: 0,
                                }
                            ]}
                            onPress={handleSave}
                            disabled={!amount || selectedPeptide === 'Select Peptide'}
                            activeOpacity={0.8}
                        >
                            <StyledText
                                variant="bold"
                                style={[
                                    styles.saveButtonText,
                                    (!amount || selectedPeptide === 'Select Peptide') && {
                                        color: isDark ? Colors.gray[500] : Colors.gray[400]
                                    }
                                ]}
                            >
                                Confirm Log
                            </StyledText>
                        </SoundButton>
                    </View>

                </ScrollView>

                {/* Toast Notification */}
                {showToast && (
                    <Animated.View
                        entering={ZoomIn.duration(300)}
                        exiting={ZoomOut.duration(300)}
                        style={styles.toast}
                    >
                        <View style={styles.toastIcon}>
                            <Check size={24} color={Colors.white} />
                        </View>
                        <StyledText variant="bold" style={styles.toastText}>Dose Logged!</StyledText>
                    </Animated.View>
                )}

                <Modal visible={showPeptideModal} animationType="slide" transparent>
                    <Pressable style={styles.modalOverlay} onPress={() => setShowPeptideModal(false)}>
                        <Pressable style={[styles.modalContent, { backgroundColor: cardBg }]} onPress={(e) => e.stopPropagation()}>
                            <View style={styles.modalHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#E0E7FF' }]}>
                                        <FlaskConical size={20} color={isDark ? Colors.dark.tint : Colors.primary} />
                                    </View>
                                    <StyledText variant="bold" style={[styles.modalTitle, { color: textColor }]}>Select Peptide</StyledText>
                                </View>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                <View style={{ borderRadius: Layout.radius.lg, overflow: 'hidden', backgroundColor: isDark ? Colors.gray[800] : '#F9FAFB', borderWidth: 1, borderColor: isDark ? Colors.gray[700] : Colors.gray[200] }}>
                                    {peptides.map((item, index) => {
                                        const isSelected = selectedPeptide === item.displayName;
                                        const isLast = index === peptides.length - 1;
                                        const config = CATEGORY_CONFIG[item.category] || DEFAULT_CONFIG;
                                        const IconComponent = config.icon;

                                        return (
                                            <SoundButton
                                                key={`peptide-${index}`}
                                                style={[
                                                    styles.modalItemCard,
                                                    {
                                                        backgroundColor: isSelected
                                                            ? (isDark ? 'rgba(139, 92, 246, 0.2)' : '#E0E7FF')
                                                            : 'transparent',
                                                        borderBottomWidth: isLast ? 0 : 1,
                                                        borderBottomColor: isDark ? Colors.gray[700] : Colors.gray[200]
                                                    }
                                                ]}
                                                onPress={() => {
                                                    setSelectedPeptide(item.displayName);
                                                    setShowPeptideModal(false);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <LinearGradient
                                                        colors={config.gradient}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 1 }}
                                                        style={[styles.modalItemIcon, { borderRadius: 14 }]}
                                                    >
                                                        <IconComponent size={20} color="#FFF" />
                                                    </LinearGradient>

                                                    <StyledText variant="medium" style={[
                                                        styles.modalItemText,
                                                        { color: isSelected ? (isDark ? '#FFF' : Colors.gray[900]) : (isDark ? Colors.gray[300] : Colors.gray[600]) },
                                                        isSelected && { fontFamily: 'Outfit_700Bold' }
                                                    ]}>
                                                        {item.displayName}
                                                    </StyledText>
                                                </View>

                                                {isSelected && (
                                                    <View style={[styles.checkCircle, { backgroundColor: isDark ? Colors.dark.tint : Colors.primary }]}>
                                                        <Check size={14} color="#FFF" />
                                                    </View>
                                                )}
                                            </SoundButton>
                                        );
                                    })}
                                </View>

                                <SoundButton
                                    style={[styles.addNewButton, { borderColor: isDark ? Colors.gray[700] : Colors.gray[200] }]}
                                    onPress={() => {
                                        setShowPeptideModal(false);
                                        router.push('/peptide-catalog');
                                    }}
                                >
                                    <Plus size={20} color={isDark ? Colors.gray[400] : Colors.gray[500]} />
                                    <StyledText variant="medium" style={{ color: isDark ? Colors.gray[400] : Colors.gray[500] }}>Add New Peptide</StyledText>
                                </SoundButton>
                            </ScrollView>
                        </Pressable>
                    </Pressable>
                </Modal>

            </SafeAreaView>
        </View>
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
        color: Colors.gray[800],
    },
    content: {
        padding: Layout.spacing.lg,
        paddingBottom: 40,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: Layout.spacing.lg,
        opacity: 0.6,
    },
    timeText: {
        fontSize: 14,
        color: Colors.gray[600],
    },
    formCard: {
        padding: Layout.spacing.lg,
        gap: Layout.spacing.xl,
        marginBottom: Layout.spacing.xl,
    },
    inputGroup: {
        gap: 10,
    },
    label: {
        fontSize: 14,
        color: Colors.gray[500],
        marginLeft: 4,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.gray[100], // Slightly darker than white relative to bg
        padding: 12,
        borderRadius: Layout.radius.lg,
    },
    pickerText: {
        fontSize: 16,
        color: Colors.gray[800],
    },
    placeholderText: {
        color: Colors.gray[400],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.gray[100],
        borderRadius: Layout.radius.lg,
        padding: 4, // Inner padding for the input
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 24,
        fontFamily: 'Outfit_700Bold', // Explicit font for input
        color: Colors.gray[800],
        paddingHorizontal: 12,
        paddingVertical: 12, // Ensure touch target
    },
    unitBadge: {
        backgroundColor: Colors.white,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 4,
        ...Layout.shadows.small,
    },
    unitText: {
        fontSize: 14,
        color: Colors.gray[400],
    },
    typeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: Colors.gray[100],
        borderRadius: Layout.radius.lg,
    },
    activeType: {
        backgroundColor: '#E0E7FF', // Light Indigo
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    activeTypeText: {
        color: Colors.primary,
        fontSize: 14,
    },
    typeText: {
        color: Colors.gray[400],
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 16,
        color: Colors.gray[400],
        marginBottom: 12,
        marginLeft: 4,
    },
    quickFillRow: {
        gap: 10,
        paddingHorizontal: 4, // For shadow clipping
        marginBottom: Layout.spacing.xl,
    },
    quickFillButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Layout.shadows.small,
    },
    quickFillText: {
        fontSize: 16,
        color: Colors.primary,
    },
    footer: {
        marginTop: Layout.spacing.lg,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 30, // Pill shape
        alignItems: 'center',
        ...Layout.shadows.medium,
        shadowColor: Colors.primary,
    },

    saveButtonText: {
        color: Colors.white,
        fontSize: 18,
    },


    // Toast
    toast: {
        position: 'absolute',
        top: '45%',
        alignSelf: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.95)', // Dark Slate
        padding: 24,
        borderRadius: 32,
        alignItems: 'center',
        gap: 12,
        zIndex: 100,
        ...Layout.shadows.medium,
    },
    toastIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toastText: {
        color: Colors.white,
        fontSize: 18,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: Layout.spacing.xl,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        color: Colors.gray[900],
    },
    closeText: {
        fontSize: 16,
        color: Colors.primary,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray[100],
    },
    modalItemText: {
        fontSize: 16,
        color: Colors.gray[600],
    },
    modalItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    modalItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: Layout.radius.lg,
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 8,
        marginTop: 8,
    },
});
