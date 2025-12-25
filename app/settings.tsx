import { CustomSwitch } from '@/components/CustomSwitch';
import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useRouter } from 'expo-router';
import { Bell, ChevronLeft, ChevronRight, FileText, Moon, Shield, Smartphone, Volume2 } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const router = useRouter();
    const {
        preferences,
        toggleNotifications,
        toggleSoundEffects,
        toggleHapticFeedback,
        toggleDarkMode
    } = usePreferences();

    const SoftBlob = ({ color, style }: { color: string, style: any }) => (
        <View style={[styles.blob, { backgroundColor: color }, style]} />
    );




    // Dynamic colors based on dark mode
    const isDark = preferences.darkMode;
    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[800];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];
    const dividerColor = isDark ? Colors.gray[700] : Colors.gray[100];

    // Soft toggle colors - light purple like the "Premium Member" badge
    const toggleActiveTrack = isDark ? '#A78BFA' : '#DDD6FE'; // Soft violet
    const toggleInactiveTrack = isDark ? Colors.gray[700] : '#E5E7EB';

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            {/* Background Ambience - dark mode uses muted violet tones */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#EDE9FE"} style={{ top: -100, left: -100, width: 400, height: 400 }} />
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ top: 100, right: -150, width: 350, height: 350 }} />
            <SoftBlob color={isDark ? "#3730A3" : "#F3E8FF"} style={{ bottom: 0, left: -50, width: 300, height: 300 }} />

            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <SoundButton
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: cardBg }]}
                    >
                        <ChevronLeft size={24} color={textColor} />
                    </SoundButton>
                    <StyledText variant="bold" style={[styles.headerTitle, { color: textColor }]}>Settings</StyledText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    <StyledText variant="semibold" style={[styles.sectionTitle, { color: subtitleColor }]}>Preferences</StyledText>

                    <GlowCard variant="surface" style={[styles.settingsGroup, isDark && { backgroundColor: cardBg }]}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.iconBox, { backgroundColor: isDark ? Colors.gray[800] : '#E0E7FF' }]}>
                                    <Bell size={20} color={Colors.primary} />
                                </View>
                                <StyledText variant="medium" style={[styles.settingLabel, { color: textColor }]}>Push Notifications</StyledText>
                            </View>
                            <CustomSwitch
                                value={preferences.notifications}
                                onValueChange={toggleNotifications}
                                activeTrackColor={toggleActiveTrack}
                                inactiveTrackColor={toggleInactiveTrack}
                            />
                        </View>

                        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.iconBox, { backgroundColor: isDark ? Colors.gray[800] : '#FCE7F3' }]}>
                                    <Volume2 size={20} color={Colors.secondary} />
                                </View>
                                <StyledText variant="medium" style={[styles.settingLabel, { color: textColor }]}>Sound Effects</StyledText>
                            </View>
                            <CustomSwitch
                                value={preferences.soundEffects}
                                onValueChange={toggleSoundEffects}
                                activeTrackColor={toggleActiveTrack}
                                inactiveTrackColor={toggleInactiveTrack}
                            />
                        </View>

                        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.iconBox, { backgroundColor: isDark ? Colors.gray[800] : '#FEF3C7' }]}>
                                    <Smartphone size={20} color={Colors.accent} />
                                </View>
                                <StyledText variant="medium" style={[styles.settingLabel, { color: textColor }]}>Haptic Feedback</StyledText>
                            </View>
                            <CustomSwitch
                                value={preferences.hapticFeedback}
                                onValueChange={toggleHapticFeedback}
                                activeTrackColor={toggleActiveTrack}
                                inactiveTrackColor={toggleInactiveTrack}
                            />
                        </View>
                    </GlowCard>

                    <StyledText variant="semibold" style={[styles.sectionTitle, { color: subtitleColor }]}>Appearance</StyledText>

                    <GlowCard variant="surface" style={[styles.settingsGroup, isDark && { backgroundColor: cardBg }]}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.iconBox, { backgroundColor: isDark ? Colors.gray[800] : '#F3F4F6' }]}>
                                    <Moon size={20} color={isDark ? Colors.primary : Colors.gray[600]} />
                                </View>
                                <StyledText variant="medium" style={[styles.settingLabel, { color: textColor }]}>Dark Mode</StyledText>
                            </View>
                            <CustomSwitch
                                value={preferences.darkMode}
                                onValueChange={toggleDarkMode}
                                activeTrackColor={toggleActiveTrack}
                                inactiveTrackColor={toggleInactiveTrack}
                            />
                        </View>
                    </GlowCard>

                    <StyledText variant="semibold" style={[styles.sectionTitle, { color: subtitleColor }]}>Legal</StyledText>

                    <GlowCard variant="surface" style={[styles.settingsGroup, isDark && { backgroundColor: cardBg }]}>
                        <SoundButton
                            onPress={() => router.push('/privacy-policy')}
                            style={styles.settingRow}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.iconBox, { backgroundColor: isDark ? Colors.gray[800] : '#E0F2FE' }]}>
                                    <Shield size={20} color="#0EA5E9" />
                                </View>
                                <StyledText variant="medium" style={[styles.settingLabel, { color: textColor }]}>Privacy Policy</StyledText>
                            </View>
                            <ChevronRight size={20} color={subtitleColor} />
                        </SoundButton>

                        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

                        <SoundButton
                            onPress={() => router.push('/terms-of-service')}
                            style={styles.settingRow}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.iconBox, { backgroundColor: isDark ? Colors.gray[800] : '#FEF3C7' }]}>
                                    <FileText size={20} color="#F59E0B" />
                                </View>
                                <StyledText variant="medium" style={[styles.settingLabel, { color: textColor }]}>Terms of Service</StyledText>
                            </View>
                            <ChevronRight size={20} color={subtitleColor} />
                        </SoundButton>
                    </GlowCard>


                    <StyledText variant="regular" style={styles.versionText}>Version 1.0.0 (Build 1)</StyledText>

                </ScrollView >
            </SafeAreaView >
        </View >
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
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
        justifyContent: 'center',
        alignItems: 'center',
        ...Layout.shadows.small,
    },
    headerTitle: {
        fontSize: 20,
    },
    content: {
        paddingHorizontal: Layout.spacing.lg,
        paddingTop: Layout.spacing.lg,
        gap: Layout.spacing.md,
    },
    sectionTitle: {
        fontSize: 16,
        marginLeft: 4,
        marginTop: 8,
    },
    settingsGroup: {
        padding: 0, // Reset padding for cleaner rows
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Layout.spacing.lg,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 16,
    },
    divider: {
        height: 1,
        marginLeft: 60, // Align with text
        marginRight: Layout.spacing.lg,
    },
    versionText: {
        textAlign: 'center',
        color: Colors.gray[400],
        fontSize: 12,
        marginTop: 20,
        marginBottom: 40,
    },
});
