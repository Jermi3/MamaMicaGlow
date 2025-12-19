import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Droplets, Heart, History, Package, Plus, Sparkles, Syringe, Zap } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
const DEFAULT_CONFIG = { color: Colors.primary, gradient: Colors.gradients.primary, icon: Syringe };

export default function LogbookScreen() {
    const router = useRouter();
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];

    const [doses, setDoses] = useState<any[]>([]);

    useFocusEffect(
        useCallback(() => {
            const loadDoses = async () => {
                try {
                    // Build category map from multiple sources for robust lookup
                    const peptideMap = new Map<string, string>();

                    // 1. Try to fetch from peptide catalog API (most accurate source)
                    try {
                        const { fetchPeptides } = await import('@/services/peptideService');
                        const catalogPeptides = await fetchPeptides();

                        // Priority: Specific categories are better than generic "Weight Management"
                        const specificCategories = ['Tirzepatide', 'Semaglutide', 'Retatrutide', 'Growth Hormone', 'Healing & Recovery', 'Peptide Combinations', 'Accessories & Supplies'];

                        catalogPeptides.forEach((p: any) => {
                            const category = p.category || 'Weight Management';
                            const nameLower = p.name.toLowerCase();
                            const nameWithStrength = p.strength ? `${p.name} ${p.strength}`.toLowerCase() : null;

                            // Only set if: 1) key doesn't exist, OR 2) new category is more specific than existing
                            const existingCategory = peptideMap.get(nameLower);
                            const isMoreSpecific = !existingCategory ||
                                (existingCategory === 'Weight Management' && specificCategories.includes(category));

                            if (isMoreSpecific) {
                                peptideMap.set(nameLower, category);
                            }

                            // Always store the name+strength combo as exact match
                            if (nameWithStrength) {
                                peptideMap.set(nameWithStrength, category);
                            }
                        });
                    } catch (catalogErr) {
                        console.log('Could not fetch from catalog, using local data');
                    }

                    // 2. Also load from user_peptides for local-only peptides
                    const savedPeptides = await AsyncStorage.getItem('user_peptides');
                    if (savedPeptides) {
                        const peptides = JSON.parse(savedPeptides);
                        peptides.forEach((p: any) => {
                            if (p.category) {
                                peptideMap.set(p.name.toLowerCase(), p.category);
                                const dosage = p.dosage || p.strength || '';
                                if (dosage) {
                                    peptideMap.set(`${p.name} ${dosage}`.toLowerCase(), p.category);
                                }
                            }
                        });
                    }

                    const savedDoses = await AsyncStorage.getItem('user_dose_history');
                    if (savedDoses) {
                        const parsed = JSON.parse(savedDoses);
                        setDoses(parsed.map((d: any) => {
                            // Priority 1: Use stored category from dose entry
                            let category = d.category;

                            // Priority 2: Exact lookup by full peptide name
                            if (!category && d.peptide) {
                                category = peptideMap.get(d.peptide.toLowerCase());
                            }

                            // Priority 3: Try matching without dosage numbers (e.g., "Tirzepatide 7.5 mg" -> "Tirzepatide")
                            if (!category && d.peptide) {
                                const baseName = d.peptide.split(/\s+\d/)[0].trim().toLowerCase();
                                category = peptideMap.get(baseName);
                            }

                            // Priority 4: Partial match - check if any catalog name is contained in dose peptide name
                            if (!category && d.peptide) {
                                const peptideLower = d.peptide.toLowerCase();
                                for (const [key, cat] of peptideMap.entries()) {
                                    // Match if peptide name starts with catalog key
                                    if (peptideLower.startsWith(key) || key.startsWith(peptideLower)) {
                                        category = cat;
                                        break;
                                    }
                                }
                            }

                            // Final fallback
                            category = category || 'Weight Management';
                            const config = CATEGORY_CONFIG[category] || DEFAULT_CONFIG;

                            return {
                                id: d.date,
                                date: d.date,
                                timestamp: new Date(d.date).getTime(),
                                peptideName: d.peptide,
                                amount: d.amount,
                                unit: 'mg',
                                type: d.type,
                                category: category,
                                color: config.color,
                            };
                        }));
                    }
                } catch (error) {
                    console.error('Failed to load doses:', error);
                }
            };
            loadDoses();
        }, [])
    );

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const SoftBlob = ({ color, style }: { color: string, style: any }) => (
        <View style={[styles.blob, { backgroundColor: color }, style]} />
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            {/* Background blobs - dark mode uses muted violet tones */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#F0FDFA"} style={{ top: -100, left: -50, width: 350, height: 350 }} />
            <SoftBlob color={isDark ? "#312E81" : "#FFF1F2"} style={{ bottom: 100, right: -50, width: 300, height: 300 }} />

            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <SoundButton onPress={() => router.back()} style={[styles.backButton, { backgroundColor: cardBg }]}>
                        <ChevronLeft size={24} color={textColor} />
                    </SoundButton>
                    <StyledText variant="bold" style={[styles.headerTitle, { color: textColor }]}>Dose History</StyledText>
                    <SoundButton style={[styles.addButton, { backgroundColor: cardBg }]} onPress={() => router.push('/log-dose')}>
                        <Plus size={24} color={isDark ? Colors.dark.tint : Colors.primary} />
                    </SoundButton>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {doses.length === 0 ? (
                        <View style={styles.emptyState}>
                            <History size={48} color={subtitleColor} />
                            <StyledText variant="bold" style={[styles.emptyText, { color: subtitleColor }]}>No doses logged yet</StyledText>
                            <StyledText variant="regular" style={[styles.emptySubtext, { color: subtitleColor }]}>Your history will appear here</StyledText>
                        </View>
                    ) : (
                        doses.map((dose) => {
                            const config = CATEGORY_CONFIG[dose.category] || DEFAULT_CONFIG;
                            const IconComponent = config.icon;
                            return (
                                <GlowCard key={dose.id} variant="surface" style={[styles.logCard, isDark && { backgroundColor: cardBg }]}>
                                    <View style={styles.logHeader}>
                                        <StyledText variant="medium" style={[styles.logDate, { color: subtitleColor }]}>{formatDate(dose.date)} • {formatTime(dose.timestamp)}</StyledText>
                                        <View style={[styles.tag, { backgroundColor: config.color + '15' }]}>
                                            <StyledText variant="bold" style={[styles.tagText, { color: config.color }]}>Completed</StyledText>
                                        </View>
                                    </View>
                                    <View style={styles.detailsRow}>
                                        <LinearGradient
                                            colors={config.gradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.iconBox}
                                        >
                                            <IconComponent size={20} color="#FFF" />
                                        </LinearGradient>
                                        <View>
                                            <StyledText variant="bold" style={[styles.logTitle, { color: textColor }]}>{dose.peptideName}</StyledText>
                                            <StyledText variant="medium" style={[styles.logNote, { color: subtitleColor }]}>{dose.amount} {dose.unit}</StyledText>
                                        </View>
                                    </View>
                                </GlowCard>
                            );
                        })
                    )}
                </ScrollView>
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
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Layout.shadows.small,
    },
    headerTitle: {
        fontSize: 20,
        color: Colors.gray[800],
    },
    content: {
        paddingHorizontal: Layout.spacing.lg,
        gap: Layout.spacing.md,
        paddingBottom: Layout.spacing.xl,
    },
    logCard: {
        padding: Layout.spacing.lg,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    logDate: {
        fontSize: 13,
        color: Colors.gray[400],
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 10,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logTitle: {
        fontSize: 16,
        color: Colors.gray[800],
        marginBottom: 2,
    },
    logNote: {
        fontSize: 14,
        color: Colors.gray[400],
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        color: Colors.gray[400],
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.gray[400],
    }
});
