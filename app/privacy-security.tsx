import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Lock, Save, Shield, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacySecurityScreen() {
    const router = useRouter();
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];
    const inputBg = isDark ? Colors.gray[700] : Colors.white;

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [biometricsEnabled, setBiometricsEnabled] = useState(true);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const handleSave = () => {
        // Simulate API call
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    const SoftBlob = ({ color, style }: { color: string, style: any }) => (
        <View style={[styles.blob, { backgroundColor: color }, style]} />
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            {/* Background blobs - dark mode uses muted violet tones */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#F3E8FF"} style={{ top: -100, right: -100, width: 350, height: 350 }} />
            <SoftBlob color={isDark ? "#312E81" : "#F0F9FF"} style={{ bottom: 0, left: -50, width: 300, height: 300 }} />

            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <SoundButton onPress={() => router.back()} style={[styles.backButton, { backgroundColor: cardBg }]}>
                        <ArrowLeft size={24} color={textColor} />
                    </SoundButton>
                    <StyledText variant="bold" style={[styles.title, { color: textColor }]}>Privacy & Security</StyledText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Security Section */}
                    <View style={styles.sectionHeader}>
                        <StyledText variant="bold" style={[styles.heading, { color: textColor }]}>Security</StyledText>
                        <StyledText variant="regular" style={[styles.subHeading, { color: subtitleColor }]}>Protect your account.</StyledText>
                    </View>

                    {/* Toggles */}
                    <GlowCard variant="surface" style={[styles.card, isDark && { backgroundColor: cardBg }]}>
                        <View style={styles.row}>
                            <View style={styles.rowInfo}>
                                <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#E0E7FF' }]}>
                                    <Smartphone size={20} color={isDark ? Colors.dark.tint : Colors.primary} />
                                </View>
                                <View>
                                    <StyledText variant="semibold" style={[styles.rowTitle, { color: textColor }]}>Face ID / Biometrics</StyledText>
                                    <StyledText variant="regular" style={[styles.rowSubtitle, { color: subtitleColor }]}>Use Face ID to log in</StyledText>
                                </View>
                            </View>
                            <Switch
                                value={biometricsEnabled}
                                onValueChange={setBiometricsEnabled}
                                trackColor={{ false: isDark ? Colors.gray[600] : Colors.gray[200], true: isDark ? Colors.dark.tint : Colors.primary }}
                            />
                        </View>

                        <View style={[styles.divider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]} />

                        <View style={styles.row}>
                            <View style={styles.rowInfo}>
                                <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(236, 72, 153, 0.2)' : '#FCE7F3' }]}>
                                    <Shield size={20} color={Colors.secondary} />
                                </View>
                                <View>
                                    <StyledText variant="semibold" style={[styles.rowTitle, { color: textColor }]}>2-Factor Auth</StyledText>
                                    <StyledText variant="regular" style={[styles.rowSubtitle, { color: subtitleColor }]}>Extra layer of security</StyledText>
                                </View>
                            </View>
                            <Switch
                                value={twoFactorEnabled}
                                onValueChange={setTwoFactorEnabled}
                                trackColor={{ false: isDark ? Colors.gray[600] : Colors.gray[200], true: Colors.secondary }}
                            />
                        </View>
                    </GlowCard>

                    {/* Password Change */}
                    <View style={[styles.sectionHeader, { marginTop: Layout.spacing.xl }]}>
                        <StyledText variant="bold" style={[styles.heading, { color: textColor }]}>Change Password</StyledText>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <StyledText variant="medium" style={[styles.label, { color: subtitleColor }]}>Current Password</StyledText>
                            <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                                <Lock size={20} color={subtitleColor} style={styles.icon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry
                                    placeholder="••••••••"
                                    placeholderTextColor={subtitleColor}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <StyledText variant="medium" style={[styles.label, { color: subtitleColor }]}>New Password</StyledText>
                            <View style={[styles.inputWrapper, { backgroundColor: inputBg }]}>
                                <Lock size={20} color={subtitleColor} style={styles.icon} />
                                <TextInput
                                    style={[styles.input, { color: textColor }]}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                    placeholder="••••••••"
                                    placeholderTextColor={subtitleColor}
                                />
                            </View>
                        </View>
                    </View>

                    <SoundButton style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
                        <Save size={20} color={Colors.white} />
                        <StyledText variant="bold" style={styles.saveButtonText}>Update Security</StyledText>
                    </SoundButton>

                </ScrollView>

                {showToast && (
                    <Animated.View
                        entering={ZoomIn}
                        exiting={ZoomOut}
                        style={styles.toast}
                    >
                        <View style={styles.toastIcon}>
                            <Check size={24} color={Colors.white} />
                        </View>
                        <StyledText variant="bold" style={styles.toastText}>Saved!</StyledText>
                    </Animated.View>
                )}
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
    },
    sectionHeader: {
        marginBottom: Layout.spacing.lg,
    },
    heading: {
        fontSize: 20,
        color: Colors.gray[900],
        marginBottom: 4,
    },
    subHeading: {
        fontSize: 14,
        color: Colors.gray[400],
    },
    card: {
        padding: Layout.spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    rowInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowTitle: {
        fontSize: 16,
        color: Colors.gray[900],
    },
    rowSubtitle: {
        fontSize: 12,
        color: Colors.gray[400],
    },
    divider: {
        height: 1,
        backgroundColor: Colors.gray[100],
        marginVertical: 8,
    },
    formContainer: {
        gap: Layout.spacing.lg,
        marginBottom: Layout.spacing.xl,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        color: Colors.gray[500],
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: Layout.radius.md,
        paddingHorizontal: 12,
        height: 50,
        ...Layout.shadows.small,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: Colors.gray[900],
        paddingVertical: 12,
    },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: Layout.radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...Layout.shadows.medium,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 16,
    },
    toast: {
        position: 'absolute',
        top: '40%',
        alignSelf: 'center',
        width: 180,
        zIndex: 100,
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        padding: 24,
        borderRadius: Layout.radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        ...Layout.shadows.large,
    },
    toastIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toastText: {
        color: Colors.white,
        fontSize: 16,
        textAlign: 'center',
    }
});
