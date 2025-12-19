import { SoundButton } from '@/components/SoundButton';

import { GlowCard } from '@/components/GlowCard';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, HelpCircle, Settings, User } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const MENU_ITEMS = [
    {
        id: 'profile',
        title: 'My Profile',
        subtitle: 'View progress & stats',
        icon: User,
        color: Colors.primary,
        route: '/profile'
    },
    {
        id: 'settings',
        title: 'Settings',
        subtitle: 'App preferences',
        icon: Settings,
        color: Colors.secondary,
        route: '/settings'
    },
    {
        id: 'logbook',
        title: 'Logbook History',
        subtitle: 'Past doses & notes',
        icon: BookOpen,
        color: Colors.accent,
        route: '/logbook'
    },
    {
        id: 'faq',
        title: 'FAQ & Help',
        subtitle: 'Guides & support',
        icon: HelpCircle,
        color: Colors.success,
        route: '/faq'
    },
];

export default function MoreScreen() {
    const { signOut } = useAuth();
    const router = useRouter();
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;
    const insets = useSafeAreaInsets();

    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const headerAnimatedStyle = useAnimatedStyle(() => {
        return {
            borderBottomColor: withTiming(scrollY.value > 10 ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent', { duration: 200 }),
        };
    });

    // Dynamic colors
    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];

    const SoftBlob = ({ color, style }: { color: string, style: any }) => (
        <View style={[styles.blob, { backgroundColor: color }, style]} />
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            {/* Background blobs */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#EDE9FE"} style={{ top: -50, left: -50, width: 300, height: 300 }} />
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ bottom: 0, right: -100, width: 400, height: 400 }} />

            {/* Sticky Glass Header */}
            <AnimatedBlurView
                intensity={isDark ? 50 : 80}
                tint={isDark ? 'dark' : 'light'}
                style={[
                    styles.stickyHeader,
                    { paddingTop: insets.top + 20 },
                    headerAnimatedStyle
                ]}
            >
                <SoundButton onPress={() => router.back()} activeOpacity={0.7}>
                    <StyledText variant="bold" style={[styles.headerTitle, { color: textColor }]}>More</StyledText>
                </SoundButton>
            </AnimatedBlurView>

            <Animated.ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 90 } // Push content below the header
                ]}
                showsVerticalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
            >
                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {MENU_ITEMS.map((item) => (
                        <SoundButton
                            key={item.id}
                            onPress={() => item.route && router.push(item.route as any)}
                            activeOpacity={0.8}
                        >
                            <GlowCard variant="surface" style={[styles.menuItem, isDark && { backgroundColor: cardBg }]}>
                                <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                                    <item.icon size={24} color={item.color} />
                                </View>
                                <View style={styles.menuText}>
                                    <StyledText variant="bold" style={[styles.menuTitle, { color: textColor }]}>{item.title}</StyledText>
                                    <StyledText variant="regular" style={[styles.menuSubtitle, { color: subtitleColor }]}>{item.subtitle}</StyledText>
                                </View>
                                <ChevronRight size={20} color={subtitleColor} />
                            </GlowCard>
                        </SoundButton>
                    ))}
                </View>

                {/* Logout Button - Hidden since app doesn't have account functionality */}
                {/* <SoundButton
                    style={[styles.logoutButton, { backgroundColor: isDark ? Colors.gray[800] : Colors.gray[800] }]}
                    onPress={() => {
                        Alert.alert(
                            'Log Out',
                            'Are you sure you want to log out?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Log Out', style: 'destructive', onPress: signOut
                                }
                            ]
                        );
                    }}
                    activeOpacity={0.8}
                >
                    <LogOut size={20} color={Colors.white} style={{ marginRight: 8 }} />
                    <StyledText variant="bold" style={styles.logoutText}>Log Out</StyledText>
                </SoundButton> */}

                <View style={{ height: 100 }} />
            </Animated.ScrollView>
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
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingHorizontal: Layout.spacing.lg,
        paddingBottom: 16,
        borderBottomWidth: 1,
        // color handled by animated style
    },
    headerTitle: {
        fontSize: 34,
        color: Colors.gray[900],
    },
    scrollContent: {
        paddingHorizontal: Layout.spacing.lg,
    },
    menuContainer: {
        gap: Layout.spacing.md,
        marginBottom: Layout.spacing.xl,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuText: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 13,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 24,
        marginTop: 20,
    },
    logoutText: {
        color: Colors.white,
        fontSize: 16,
    },
});
