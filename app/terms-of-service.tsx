import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsOfServiceScreen() {
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
                    <StyledText variant="bold" style={[styles.title, { color: textColor }]}>Terms of Service</StyledText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <StyledText variant="regular" style={[styles.lastUpdated, { color: subtitleColor }]}>
                        Last updated: December 19, 2024
                    </StyledText>

                    <Section title="Agreement to Terms">
                        <Paragraph>
                            By downloading, installing, or using Mama Mica Glow ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
                        </Paragraph>
                    </Section>

                    <Section title="Description of Service">
                        <Paragraph>
                            Mama Mica Glow is a personal wellness tracking application designed to help users monitor their peptide and supplement protocols. The App provides features including:
                        </Paragraph>
                        <BulletPoint>Peptide catalog and information</BulletPoint>
                        <BulletPoint>Dose logging and tracking</BulletPoint>
                        <BulletPoint>Scheduling and reminders</BulletPoint>
                        <BulletPoint>Progress monitoring</BulletPoint>
                        <BulletPoint>Personal profile management</BulletPoint>
                    </Section>

                    <Section title="Medical Disclaimer">
                        <Paragraph>
                            IMPORTANT: The App is intended for informational and personal tracking purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment.
                        </Paragraph>
                        <Paragraph>
                            Always consult with a qualified healthcare provider before starting any peptide or supplement regimen. Never disregard professional medical advice or delay seeking it because of information provided in this App.
                        </Paragraph>
                        <Paragraph>
                            We make no claims about the efficacy, safety, or appropriateness of any peptides or supplements mentioned in the App.
                        </Paragraph>
                    </Section>

                    <Section title="User Responsibilities">
                        <Paragraph>As a user of the App, you agree to:</Paragraph>
                        <BulletPoint>Provide accurate information when creating your profile</BulletPoint>
                        <BulletPoint>Use the App only for lawful purposes</BulletPoint>
                        <BulletPoint>Not attempt to reverse engineer or modify the App</BulletPoint>
                        <BulletPoint>Keep your account credentials secure</BulletPoint>
                        <BulletPoint>Take responsibility for all activities under your account</BulletPoint>
                    </Section>

                    <Section title="Intellectual Property">
                        <Paragraph>
                            All content, features, and functionality of the App, including but not limited to text, graphics, logos, and software, are the exclusive property of Mama Mica Glow and are protected by copyright, trademark, and other intellectual property laws.
                        </Paragraph>
                    </Section>

                    <Section title="Account Termination">
                        <Paragraph>
                            We reserve the right to suspend or terminate your account at any time for violations of these Terms or for any other reason at our discretion. You may also delete your account at any time through the App settings.
                        </Paragraph>
                    </Section>

                    <Section title="Limitation of Liability">
                        <Paragraph>
                            To the maximum extent permitted by law, Mama Mica Glow shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.
                        </Paragraph>
                        <Paragraph>
                            We do not guarantee that the App will be error-free, uninterrupted, or free of harmful components.
                        </Paragraph>
                    </Section>

                    <Section title="Changes to Terms">
                        <Paragraph>
                            We reserve the right to modify these Terms at any time. We will notify users of significant changes through the App. Continued use of the App after changes constitutes acceptance of the new Terms.
                        </Paragraph>
                    </Section>

                    <Section title="Governing Law">
                        <Paragraph>
                            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Mama Mica Glow operates, without regard to conflict of law principles.
                        </Paragraph>
                    </Section>

                    <Section title="Contact Information">
                        <Paragraph>
                            For questions about these Terms, please contact us at:
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
