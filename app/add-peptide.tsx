import { AlertModal } from '@/components/AlertModal';
import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Pill } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly'];
const COLOR_OPTIONS = [Colors.primary, Colors.secondary, Colors.accent, Colors.success];

export default function AddPeptideScreen() {
    const router = useRouter();
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];
    const inputBg = isDark ? Colors.gray[700] : Colors.soft.background;

    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('Weekly');
    const [selectedColor, setSelectedColor] = useState(Colors.primary);
    const [showToast, setShowToast] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: 'error' }>({
        visible: false, title: '', message: '', type: 'error'
    });

    const handleSave = async () => {
        if (!name.trim() || !dosage.trim()) {
            return;
        }

        // Save to AsyncStorage
        try {
            const existing = await AsyncStorage.getItem('user_peptides');
            const peptides = existing ? JSON.parse(existing) : [];
            const newPeptide = {
                id: Date.now().toString(),
                name: name.trim(),
                dosage: dosage.trim(),
                frequency,
                color: selectedColor,
                status: 'Active',
                createdAt: new Date().toISOString(),
            };
            peptides.push(newPeptide);
            await AsyncStorage.setItem('user_peptides', JSON.stringify(peptides));
        } catch (e: any) {
            console.error('Failed to save peptide', e);
            setAlertConfig({ visible: true, title: 'Error', message: `Failed to save peptide: ${e.message || 'Unknown error'}`, type: 'error' });
            return;
        }

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
            {/* Background blobs - dark mode uses muted violet tones */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#EDE9FE"} style={{ top: -100, left: -50, width: 350, height: 350 }} />
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ bottom: 100, right: -50, width: 300, height: 300 }} />

            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <SoundButton onPress={() => router.back()} style={[styles.backButton, { backgroundColor: cardBg }]}>
                        <ArrowLeft size={24} color={textColor} />
                    </SoundButton>
                    <StyledText variant="bold" style={[styles.title, { color: textColor }]}>Add Peptide</StyledText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <GlowCard variant="surface" style={[styles.formCard, isDark && { backgroundColor: cardBg }]}>
                        {/* Name */}
                        <View style={styles.fieldGroup}>
                            <StyledText variant="medium" style={[styles.label, { color: subtitleColor }]}>Peptide Name</StyledText>
                            <TextInput
                                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Tirzepatide"
                                placeholderTextColor={subtitleColor}
                            />
                        </View>

                        {/* Dosage */}
                        <View style={styles.fieldGroup}>
                            <StyledText variant="medium" style={[styles.label, { color: subtitleColor }]}>Dosage</StyledText>
                            <TextInput
                                style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
                                value={dosage}
                                onChangeText={(text) => setDosage(text.replace(/[^0-9.]/g, ''))}
                                placeholder="e.g. 5"
                                placeholderTextColor={subtitleColor}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        {/* Frequency */}
                        <View style={styles.fieldGroup}>
                            <StyledText variant="medium" style={[styles.label, { color: subtitleColor }]}>Frequency</StyledText>
                            <View style={styles.frequencyRow}>
                                {FREQUENCY_OPTIONS.map((option) => (
                                    <SoundButton
                                        key={option}
                                        style={[
                                            styles.frequencyChip,
                                            { backgroundColor: inputBg },
                                            frequency === option && styles.frequencyChipActive
                                        ]}
                                        onPress={() => setFrequency(option)}
                                    >
                                        <StyledText variant="semibold" style={[
                                            styles.frequencyText,
                                            { color: subtitleColor },
                                            frequency === option && styles.frequencyTextActive
                                        ]}>
                                            {option}
                                        </StyledText>
                                    </SoundButton>
                                ))}
                            </View>
                        </View>

                        {/* Color */}
                        <View style={styles.fieldGroup}>
                            <StyledText variant="medium" style={[styles.label, { color: subtitleColor }]}>Color Tag</StyledText>
                            <View style={styles.colorRow}>
                                {COLOR_OPTIONS.map((color) => (
                                    <SoundButton
                                        key={color}
                                        style={[
                                            styles.colorOption,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.colorOptionActive
                                        ]}
                                        onPress={() => setSelectedColor(color)}
                                    >
                                        {selectedColor === color && (
                                            <Check size={16} color={Colors.white} />
                                        )}
                                    </SoundButton>
                                ))}
                            </View>
                        </View>
                    </GlowCard>

                    {/* Preview */}
                    <StyledText variant="semibold" style={[styles.previewLabel, { color: subtitleColor }]}>Preview</StyledText>
                    <GlowCard style={[styles.previewCard, isDark && { backgroundColor: cardBg }]} variant="surface">
                        <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
                            <Pill size={24} color={selectedColor} />
                        </View>
                        <View style={styles.previewInfo}>
                            <StyledText variant="bold" style={[styles.previewName, { color: textColor }]}>{name || 'Peptide Name'}</StyledText>
                            <StyledText variant="medium" style={[styles.previewDosage, { color: subtitleColor }]}>
                                {dosage || '0mg'} / {frequency.toLowerCase()}
                            </StyledText>
                        </View>
                    </GlowCard>

                    <SoundButton
                        style={[styles.saveButton, (!name || !dosage) && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={!name || !dosage}
                        activeOpacity={0.8}
                    >
                        <StyledText variant="bold" style={styles.saveButtonText}>Add to Inventory</StyledText>
                    </SoundButton>
                </ScrollView>

                {showToast && (
                    <Animated.View
                        entering={ZoomIn.duration(300)}
                        exiting={ZoomOut.duration(300)}
                        style={styles.toast}
                    >
                        <View style={styles.toastIcon}>
                            <Check size={24} color={Colors.white} />
                        </View>
                        <StyledText variant="bold" style={styles.toastText}>Peptide Added!</StyledText>
                    </Animated.View>
                )}

                {/* Alert Modal */}
                <AlertModal
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                />
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
        gap: Layout.spacing.xl,
    },
    formCard: {
        padding: Layout.spacing.lg,
        gap: Layout.spacing.lg,
    },
    fieldGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        color: Colors.gray[400],
    },
    input: {
        fontFamily: 'Outfit_500Medium', // Explicit font
        backgroundColor: Colors.soft.background,
        padding: 16,
        borderRadius: Layout.radius.lg,
        fontSize: 16,
        color: Colors.gray[800],
    },
    frequencyRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    frequencyChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: Colors.soft.background,
    },
    frequencyChipActive: {
        backgroundColor: Colors.primary,
    },
    frequencyText: {
        fontSize: 14,
        color: Colors.gray[400],
    },
    frequencyTextActive: {
        color: Colors.white,
    },
    colorRow: {
        flexDirection: 'row',
        gap: 12,
    },
    colorOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorOptionActive: {
        borderWidth: 3,
        borderColor: Colors.white,
        ...Layout.shadows.medium,
    },
    previewLabel: {
        fontSize: 14,
        color: Colors.gray[400],
        marginBottom: -12,
        marginLeft: 4,
    },
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Layout.spacing.lg,
        gap: Layout.spacing.lg,
    },
    previewIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewInfo: {
        flex: 1,
    },
    previewName: {
        fontSize: 16,
        color: Colors.gray[800],
    },
    previewDosage: {
        fontSize: 14,
        color: Colors.gray[400],
    },
    saveButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        ...Layout.shadows.medium,
        shadowColor: Colors.primary,
    },
    saveButtonDisabled: {
        backgroundColor: Colors.gray[300],
        shadowOpacity: 0,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 18,
    },
    toast: {
        position: 'absolute',
        top: '40%',
        alignSelf: 'center',
        backgroundColor: 'rgba(50,50,50,0.95)',
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
});
