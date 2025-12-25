import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AlertCircle, CheckCircle, FileText, Shield } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
    const router = useRouter();
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);

    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[600];

    const canContinue = agreedToTerms && agreedToDisclaimer;

    const handleContinue = async () => {
        // Mark onboarding as complete
        await AsyncStorage.setItem('onboarding_completed', 'true');
        await AsyncStorage.setItem('terms_accepted_date', new Date().toISOString());
        router.replace('/(tabs)');
    };

    const CheckboxItem = ({
        checked,
        onPress,
        title,
        description
    }: {
        checked: boolean;
        onPress: () => void;
        title: string;
        description: string;
    }) => (
        <SoundButton onPress={onPress} activeOpacity={0.8}>
            <View style={[styles.checkboxItem, { backgroundColor: cardBg }]}>
                <View style={[
                    styles.checkbox,
                    { borderColor: checked ? Colors.primary : (isDark ? Colors.gray[600] : Colors.gray[300]) },
                    checked && { backgroundColor: Colors.primary }
                ]}>
                    {checked && <CheckCircle size={16} color={Colors.white} />}
                </View>
                <View style={styles.checkboxContent}>
                    <StyledText variant="semibold" style={[styles.checkboxTitle, { color: textColor }]}>
                        {title}
                    </StyledText>
                    <StyledText variant="regular" style={[styles.checkboxDescription, { color: subtitleColor }]}>
                        {description}
                    </StyledText>
                </View>
            </View>
        </SoundButton>
    );

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.header}>
                        <LinearGradient
                            colors={Colors.gradients.primary}
                            style={styles.iconGradient}
                        >
                            <Shield size={40} color={Colors.white} />
                        </LinearGradient>
                        <StyledText variant="bold" style={[styles.title, { color: textColor }]}>
                            Welcome to Mama Mica Glow
                        </StyledText>
                        <StyledText variant="regular" style={[styles.subtitle, { color: subtitleColor }]}>
                            Before you begin, please review and accept the following
                        </StyledText>
                    </View>

                    {/* Medical Disclaimer Card */}
                    <View style={[styles.disclaimerCard, { backgroundColor: 'rgba(184, 134, 11, 0.08)' }]}>
                        <View style={styles.disclaimerHeader}>
                            <AlertCircle size={20} color="#B8860B" />
                            <StyledText variant="bold" style={styles.disclaimerTitle}>
                                Important Medical Disclaimer
                            </StyledText>
                        </View>
                        <StyledText variant="regular" style={styles.disclaimerText}>
                            This app is designed for personal wellness tracking and educational purposes only.
                            It is NOT a substitute for professional medical advice, diagnosis, or treatment.
                        </StyledText>
                        <StyledText variant="semibold" style={styles.disclaimerHighlight}>
                            ⚕️ Always consult with a qualified healthcare provider before starting,
                            stopping, or modifying any peptide or supplement regimen.
                        </StyledText>
                        <StyledText variant="regular" style={styles.disclaimerText}>
                            We make no claims about the efficacy, safety, or appropriateness of any
                            peptides or supplements mentioned in this app. Individual results may vary.
                        </StyledText>
                    </View>

                    {/* Agreement Checkboxes */}
                    <View style={styles.checkboxSection}>
                        <CheckboxItem
                            checked={agreedToDisclaimer}
                            onPress={() => setAgreedToDisclaimer(!agreedToDisclaimer)}
                            title="I understand the medical disclaimer"
                            description="I acknowledge this app is for tracking only and will consult a healthcare provider for medical decisions."
                        />

                        <CheckboxItem
                            checked={agreedToTerms}
                            onPress={() => setAgreedToTerms(!agreedToTerms)}
                            title="I agree to the Terms of Service"
                            description="I have read and agree to the Terms of Service and Privacy Policy."
                        />
                    </View>

                    {/* Legal Links */}
                    <View style={styles.legalLinks}>
                        <SoundButton
                            style={styles.legalLink}
                            onPress={() => router.push('/terms-of-service')}
                        >
                            <FileText size={14} color={Colors.primary} />
                            <StyledText variant="medium" style={styles.legalLinkText}>
                                Terms of Service
                            </StyledText>
                        </SoundButton>
                        <View style={styles.linkDivider} />
                        <SoundButton
                            style={styles.legalLink}
                            onPress={() => router.push('/privacy-policy')}
                        >
                            <Shield size={14} color={Colors.primary} />
                            <StyledText variant="medium" style={styles.legalLinkText}>
                                Privacy Policy
                            </StyledText>
                        </SoundButton>
                    </View>

                </ScrollView>

                {/* Continue Button */}
                <View style={styles.footer}>
                    <SoundButton
                        onPress={handleContinue}
                        disabled={!canContinue}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={canContinue ? Colors.gradients.primary : [Colors.gray[400], Colors.gray[500]]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
                        >
                            <StyledText variant="bold" style={styles.continueButtonText}>
                                Get Started
                            </StyledText>
                        </LinearGradient>
                    </SoundButton>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: Layout.spacing.lg,
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    disclaimerCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(184, 134, 11, 0.2)',
    },
    disclaimerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    disclaimerTitle: {
        fontSize: 16,
        color: '#8B7355',
    },
    disclaimerText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    disclaimerHighlight: {
        fontSize: 13,
        color: '#8B7355',
        lineHeight: 20,
        marginBottom: 12,
        backgroundColor: 'rgba(184, 134, 11, 0.1)',
        padding: 12,
        borderRadius: 8,
    },
    checkboxSection: {
        gap: 12,
        marginBottom: 20,
    },
    checkboxItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        ...Layout.shadows.small,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxContent: {
        flex: 1,
    },
    checkboxTitle: {
        fontSize: 15,
        marginBottom: 4,
    },
    checkboxDescription: {
        fontSize: 12,
        lineHeight: 18,
    },
    legalLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    legalLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legalLinkText: {
        fontSize: 13,
        color: Colors.primary,
    },
    linkDivider: {
        width: 1,
        height: 16,
        backgroundColor: Colors.gray[300],
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Layout.spacing.lg,
        paddingBottom: 40,
    },
    continueButton: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    continueButtonDisabled: {
        opacity: 0.6,
    },
    continueButtonText: {
        color: Colors.white,
        fontSize: 17,
    },
});
