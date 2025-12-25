import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
    const router = useRouter();
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[600];

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <View style={styles.section}>
            <StyledText variant="bold" style={[styles.sectionTitle, { color: textColor }]}>
                {title}
            </StyledText>
            {children}
        </View>
    );

    const Paragraph = ({ children }: { children: string }) => (
        <StyledText variant="regular" style={[styles.paragraph, { color: subtitleColor }]}>
            {children}
        </StyledText>
    );

    const BulletPoint = ({ children }: { children: string }) => (
        <View style={styles.bulletRow}>
            <StyledText variant="regular" style={[styles.bullet, { color: subtitleColor }]}>•</StyledText>
            <StyledText variant="regular" style={[styles.bulletText, { color: subtitleColor }]}>
                {children}
            </StyledText>
        </View>
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <SoundButton onPress={() => router.back()} style={[styles.backButton, { backgroundColor: cardBg }]}>
                        <ArrowLeft size={24} color={textColor} />
                    </SoundButton>
                    <StyledText variant="bold" style={[styles.title, { color: textColor }]}>Privacy Policy</StyledText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <StyledText variant="regular" style={[styles.lastUpdated, { color: subtitleColor }]}>
                        Last updated: December 19, 2024
                    </StyledText>

                    <Section title="Introduction">
                        <Paragraph>
                            Welcome to Mama Mica Glow ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our mobile application.
                        </Paragraph>
                    </Section>

                    <Section title="Information We Collect">
                        <Paragraph>We collect the following types of information:</Paragraph>
                        <BulletPoint>Profile information (name, email, profile picture)</BulletPoint>
                        <BulletPoint>Health and wellness data (age, weight, height)</BulletPoint>
                        <BulletPoint>Peptide and supplement tracking data</BulletPoint>
                        <BulletPoint>Dose logs and scheduling preferences</BulletPoint>
                        <BulletPoint>App usage and preference settings</BulletPoint>
                    </Section>

                    <Section title="How We Use Your Information">
                        <Paragraph>Your information is used to:</Paragraph>
                        <BulletPoint>Provide and personalize the app experience</BulletPoint>
                        <BulletPoint>Track your peptide protocols and schedules</BulletPoint>
                        <BulletPoint>Send dose reminders and notifications</BulletPoint>
                        <BulletPoint>Improve our services and user experience</BulletPoint>
                        <BulletPoint>Ensure app security and prevent fraud</BulletPoint>
                    </Section>

                    <Section title="Data Storage and Security">
                        <Paragraph>
                            Your data is securely stored using industry-standard encryption. We use Supabase as our backend service provider, which employs robust security measures including encrypted data transmission and secure cloud storage.
                        </Paragraph>
                        <Paragraph>
                            We do not sell, trade, or rent your personal information to third parties. Your health data remains private and is only accessible to you.
                        </Paragraph>
                    </Section>

                    <Section title="Your Rights">
                        <Paragraph>You have the right to:</Paragraph>
                        <BulletPoint>Access your personal data</BulletPoint>
                        <BulletPoint>Request correction of inaccurate data</BulletPoint>
                        <BulletPoint>Request deletion of your account and data</BulletPoint>
                        <BulletPoint>Export your data in a portable format</BulletPoint>
                        <BulletPoint>Opt out of non-essential notifications</BulletPoint>
                    </Section>

                    <Section title="Third-Party Services">
                        <Paragraph>
                            Our app uses the following third-party services that may collect data:
                        </Paragraph>
                        <BulletPoint>Expo (app framework and updates)</BulletPoint>
                        <BulletPoint>Supabase (authentication and data storage)</BulletPoint>
                        <Paragraph>
                            These services have their own privacy policies governing data collection and use.
                        </Paragraph>
                    </Section>

                    <Section title="Children's Privacy">
                        <Paragraph>
                            Our app is not intended for children under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                        </Paragraph>
                    </Section>

                    <Section title="Changes to This Policy">
                        <Paragraph>
                            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy in the app and updating the "Last updated" date.
                        </Paragraph>
                    </Section>

                    <Section title="Contact Us">
                        <Paragraph>
                            If you have questions about this privacy policy or your data, please contact us at:
                        </Paragraph>
                        <Paragraph>
                            Email: support@mamamicaglow.com
                        </Paragraph>
                    </Section>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
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
    title: {
        fontSize: 20,
    },
    content: {
        padding: Layout.spacing.lg,
    },
    lastUpdated: {
        fontSize: 12,
        marginBottom: Layout.spacing.lg,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: Layout.spacing.xl,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: Layout.spacing.sm,
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: Layout.spacing.sm,
    },
    bulletRow: {
        flexDirection: 'row',
        paddingLeft: Layout.spacing.sm,
        marginBottom: 4,
    },
    bullet: {
        fontSize: 14,
        marginRight: 8,
    },
    bulletText: {
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    },
});
