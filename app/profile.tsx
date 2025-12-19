
import { AlertModal } from '@/components/AlertModal';
import { GlowCard } from '@/components/GlowCard';
import { GlowRankIcon, getRankDisplayName, getRankFromStreak } from '@/components/GlowRankIcon';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, ChevronLeft, ChevronRight, Edit2, Settings, User } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
    const router = useRouter();
    const { preferences } = usePreferences();
    const isDark = preferences.darkMode;

    // Note: Using direct async permission methods for better reliability

    // Dynamic colors
    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];
    const chevronColor = isDark ? Colors.gray[500] : Colors.gray[400];
    const [name, setName] = useState('Mama Mica');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [showImageOptions, setShowImageOptions] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: 'info' | 'warning' | 'error' }>({
        visible: false, title: '', message: '', type: 'info'
    });

    // Stats from real data
    const [doseCount, setDoseCount] = useState(0);
    const [streakDays, setStreakDays] = useState(0);
    const [adherence, setAdherence] = useState(0);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const details = await AsyncStorage.getItem('user_personal_details');
                if (details) {
                    const parsed = JSON.parse(details);
                    if (parsed.name) setName(parsed.name);
                }

                const savedAvatar = await AsyncStorage.getItem('user_avatar');
                if (savedAvatar) setAvatarUri(savedAvatar);
            } catch (e) {
                console.log('Failed to load profile data');
            }
        };
        loadProfile();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const loadStats = async () => {
                try {
                    // Calculate real stats from dose history
                    const doseHistoryJson = await AsyncStorage.getItem('user_dose_history');
                    const doseHistory = doseHistoryJson ? JSON.parse(doseHistoryJson) : [];
                    setDoseCount(doseHistory.length);

                    // Calculate streak (consecutive days with doses)
                    let streak = 0;
                    const today = new Date();
                    for (let i = 0; i < 30; i++) {
                        const checkDate = new Date(today);
                        checkDate.setDate(checkDate.getDate() - i);
                        const hasEntry = doseHistory.some((d: any) =>
                            new Date(d.date).toDateString() === checkDate.toDateString()
                        );
                        if (hasEntry) streak++;
                        else if (i > 0) break; // Break streak on missed day
                    }
                    setStreakDays(streak);

                    // Calculate adherence (days with doses in last 7 days)
                    const last7Days = Array.from({ length: 7 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        return d.toDateString();
                    });
                    const validDoses = doseHistory.filter((d: any) =>
                        last7Days.includes(new Date(d.date).toDateString())
                    );
                    setAdherence(Math.round((validDoses.length / 7) * 100));
                } catch (e) {
                    console.log('Failed to load stats');
                }
            };
            loadStats();
        }, [])
    );

    const handlePickImage = useCallback(async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (status !== 'granted') {
                setShowImageOptions(false);
                setAlertConfig({ visible: true, title: 'Permission Needed', message: 'Photo library access is required to select a photo.', type: 'warning' });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            // Close modal after picker returns
            setShowImageOptions(false);

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setAvatarUri(result.assets[0].uri);
                await AsyncStorage.setItem('user_avatar', result.assets[0].uri);
            }
        } catch (error) {
            setShowImageOptions(false);
            setAlertConfig({ visible: true, title: 'Error', message: 'Could not open photo library on this device.', type: 'error' });
        }
    }, []);

    const handleTakePhoto = useCallback(async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            
            if (status !== 'granted') {
                setShowImageOptions(false);
                setAlertConfig({ visible: true, title: 'Permission Needed', message: 'Camera access is required to take a photo.', type: 'warning' });
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            // Close modal after camera returns
            setShowImageOptions(false);

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setAvatarUri(result.assets[0].uri);
                await AsyncStorage.setItem('user_avatar', result.assets[0].uri);
            }
        } catch (error) {
            setShowImageOptions(false);
            setAlertConfig({ visible: true, title: 'Camera Error', message: 'Could not open camera on this device.', type: 'error' });
        }
    }, []);

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
                {/* Navigation Header - matches other screens */}
                <View style={styles.navHeader}>
                    <SoundButton onPress={() => router.back()} style={[styles.backButton, { backgroundColor: cardBg }]}>
                        <ChevronLeft size={24} color={textColor} />
                    </SoundButton>
                    <StyledText variant="bold" style={[styles.navTitle, { color: textColor }]}>Profile</StyledText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    {/* Profile Card Section */}
                    <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
                        <SoundButton
                            style={styles.avatarContainer}
                            onPress={() => setShowImageOptions(true)}
                            activeOpacity={0.8}
                        >
                            {avatarUri ? (
                                <Image
                                    source={{ uri: avatarUri }}
                                    style={styles.avatarImage}
                                    resizeMode="cover"
                                    onError={() => setAvatarUri(null)}
                                />
                            ) : (
                                <LinearGradient colors={Colors.gradients.accent} style={styles.avatar} />
                            )}
                            <View style={styles.editBadge}>
                                <Edit2 size={12} color={Colors.white} />
                            </View>
                        </SoundButton>
                        <StyledText variant="bold" style={[styles.name, { color: textColor }]}>{name}</StyledText>
                        <SoundButton
                            style={styles.statusPill}
                            activeOpacity={0.8}
                            onPress={() => setShowStatusModal(true)}
                        >
                            <View style={styles.statusPillContent}>
                                <GlowRankIcon rank={getRankFromStreak(streakDays)} size={18} isUnlocked={true} />
                                <StyledText variant="semibold" style={styles.statusText}>
                                    {getRankDisplayName(getRankFromStreak(streakDays))}
                                </StyledText>
                            </View>
                        </SoundButton>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsContainer}>
                        <SoundButton style={{ flex: 1 }} onPress={() => router.push('/logbook')} activeOpacity={0.8}>
                            <GlowCard variant="surface" style={[styles.statCard, isDark && { backgroundColor: cardBg }]}>
                                <StyledText variant="bold" style={[styles.statNumber, { color: textColor }]}>{doseCount}</StyledText>
                                <StyledText variant="medium" style={[styles.statLabel, { color: subtitleColor }]}>Doses</StyledText>
                            </GlowCard>
                        </SoundButton>

                        <SoundButton style={{ flex: 1 }} onPress={() => router.push('/progress')} activeOpacity={0.8}>
                            <GlowCard variant="surface" style={[styles.statCard, isDark && { backgroundColor: cardBg }]}>
                                <StyledText variant="bold" style={[styles.statNumber, { color: textColor }]}>{streakDays}</StyledText>
                                <StyledText variant="medium" style={[styles.statLabel, { color: subtitleColor }]}>Streak</StyledText>
                            </GlowCard>
                        </SoundButton>

                        <SoundButton style={{ flex: 1 }} onPress={() => router.push('/progress')} activeOpacity={0.8}>
                            <GlowCard variant="surface" style={[styles.statCard, isDark && { backgroundColor: cardBg }]}>
                                <StyledText variant="bold" style={[styles.statNumber, { color: textColor }]}>{adherence}%</StyledText>
                                <StyledText variant="medium" style={[styles.statLabel, { color: subtitleColor }]}>Adherence</StyledText>
                            </GlowCard>
                        </SoundButton>
                    </View>

                    {/* Profile Details */}
                    <View style={styles.section}>
                        <StyledText variant="bold" style={[styles.sectionTitle, { color: textColor }]}>Account Info</StyledText>

                        <SoundButton onPress={() => router.push('/personal-details')} activeOpacity={0.8}>
                            <GlowCard variant="surface" style={[styles.menuItem, isDark && { backgroundColor: cardBg }]}>
                                <View style={[styles.menuIconBox, { backgroundColor: isDark ? Colors.gray[700] : '#E0E7FF' }]}>
                                    <User size={20} color={Colors.primary} />
                                </View>
                                <View style={styles.menuContent}>
                                    <StyledText variant="semibold" style={[styles.menuTitle, { color: textColor }]}>Personal Details</StyledText>
                                    <StyledText variant="regular" style={[styles.menuSubtitle, { color: subtitleColor }]}>Name, Age, Weight</StyledText>
                                </View>
                                <ChevronRight size={20} color={chevronColor} />
                            </GlowCard>
                        </SoundButton>



                        <SoundButton onPress={() => router.push('/notifications')} activeOpacity={0.8}>
                            <GlowCard variant="surface" style={[styles.menuItem, isDark && { backgroundColor: cardBg }]}>
                                <View style={[styles.menuIconBox, { backgroundColor: isDark ? Colors.gray[700] : '#F3E8FF' }]}>
                                    <Bell size={20} color={isDark ? Colors.dark.tint : Colors.primary} />
                                </View>
                                <View style={styles.menuContent}>
                                    <StyledText variant="semibold" style={[styles.menuTitle, { color: textColor }]}>Notifications</StyledText>
                                    <StyledText variant="regular" style={[styles.menuSubtitle, { color: subtitleColor }]}>Alerts & Updates</StyledText>
                                </View>
                                <ChevronRight size={20} color={chevronColor} />
                            </GlowCard>
                        </SoundButton>

                        <SoundButton onPress={() => router.push('/settings')} activeOpacity={0.8}>
                            <GlowCard variant="surface" style={[styles.menuItem, isDark && { backgroundColor: cardBg }]}>
                                <View style={[styles.menuIconBox, { backgroundColor: isDark ? Colors.gray[700] : '#F0FDFA' }]}>
                                    <Settings size={20} color={Colors.secondary} />
                                </View>
                                <View style={styles.menuContent}>
                                    <StyledText variant="semibold" style={[styles.menuTitle, { color: textColor }]}>App Preferences</StyledText>
                                    <StyledText variant="regular" style={[styles.menuSubtitle, { color: subtitleColor }]}>Theme, Sound, Haptics</StyledText>
                                </View>
                                <ChevronRight size={20} color={chevronColor} />
                            </GlowCard>
                        </SoundButton>

                        {/* <SoundButton onPress={() => router.push('/privacy-security')} activeOpacity={0.8}>
                            <GlowCard variant="surface" style={[styles.menuItem, isDark && { backgroundColor: cardBg }]}>
                                <View style={[styles.menuIconBox, { backgroundColor: isDark ? Colors.gray[700] : '#FEF3C7' }]}>
                                    <Shield size={20} color={Colors.accent} />
                                </View>
                                <View style={styles.menuContent}>
                                    <StyledText variant="semibold" style={[styles.menuTitle, { color: textColor }]}>Privacy & Security</StyledText>
                                    <StyledText variant="regular" style={[styles.menuSubtitle, { color: subtitleColor }]}>Password, FaceID</StyledText>
                                </View>
                                <ChevronRight size={20} color={chevronColor} />
                            </GlowCard>
                        </SoundButton> */}
                    </View >

                </ScrollView >

                {/* Image Picker Modal */}
                <Modal
                    visible={showImageOptions}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowImageOptions(false)}
                >
                    <View style={styles.modalOverlay} pointerEvents="box-none">
                        <GlowCard variant="surface" style={[styles.modalContent, { backgroundColor: cardBg }]} pointerEvents="auto">
                            <StyledText variant="bold" style={[styles.modalTitle, { color: textColor }]}>Update Profile Photo</StyledText>

                            <SoundButton
                                style={[styles.modalOption, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]}
                                onPress={handleTakePhoto}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.modalIcon, { backgroundColor: isDark ? Colors.primary + '30' : '#F3E8FF' }]}>
                                    <Edit2 size={20} color={Colors.primary} />
                                </View>
                                <StyledText variant="medium" style={[styles.modalOptionText, { color: textColor }]}>Take Photo</StyledText>
                            </SoundButton>

                            <SoundButton
                                style={[styles.modalOption, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]}
                                onPress={handlePickImage}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.modalIcon, { backgroundColor: isDark ? Colors.secondary + '30' : '#E0E7FF' }]}>
                                    <User size={20} color={Colors.secondary} />
                                </View>
                                <StyledText variant="medium" style={[styles.modalOptionText, { color: textColor }]}>Choose from Library</StyledText>
                            </SoundButton>

                            <SoundButton
                                style={styles.modalCancel}
                                onPress={() => setShowImageOptions(false)}
                            >
                                <StyledText variant="bold" style={[styles.modalCancelText, { color: subtitleColor }]}>Cancel</StyledText>
                            </SoundButton>
                        </GlowCard>
                    </View>
                </Modal>

                {/* Status Hierarchy Modal */}
                <Modal
                    visible={showStatusModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowStatusModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <GlowCard variant="surface" style={[styles.modalContent, { backgroundColor: cardBg, maxHeight: '80%' }]}>
                            <View style={styles.modalHeader}>
                                <StyledText variant="bold" style={[styles.modalTitle, { color: textColor }]}>Glow Status</StyledText>
                                <SoundButton onPress={() => setShowStatusModal(false)} style={styles.closeIcon}>
                                    <View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}>
                                        <StyledText variant="medium" style={{ color: subtitleColor, fontSize: 20 }}>✕</StyledText>
                                    </View>
                                </SoundButton>
                            </View>

                            <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
                                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                                    <View style={[styles.currentRankBadge, { backgroundColor: isDark ? Colors.primary + '20' : '#F3E8FF' }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <GlowRankIcon rank={getRankFromStreak(streakDays)} size={24} isUnlocked={true} />
                                            <StyledText variant="extraBold" style={{ color: Colors.primary, fontSize: 18 }}>
                                                {getRankDisplayName(getRankFromStreak(streakDays))}
                                            </StyledText>
                                        </View>
                                    </View>
                                    <StyledText variant="medium" style={{ color: subtitleColor, marginTop: 8 }}>
                                        Current Streak: <StyledText variant="bold" style={{ color: textColor }}>{streakDays} Days</StyledText>
                                    </StyledText>
                                </View>

                                {/* Hierarchy List */}
                                <View style={styles.hierarchyContainer}>
                                    {[
                                        { days: 0, title: 'Glow Member', rank: 'member' as const, desc: 'The start of your glowing journey.' },
                                        { days: 7, title: 'Glow Getter', rank: 'getter' as const, desc: 'Consistency is key! 7+ days streak.' },
                                        { days: 30, title: 'Glow Master', rank: 'master' as const, desc: 'True dedication. 30+ days streak.' },
                                        { days: 90, title: 'Glow Legend', rank: 'legend' as const, desc: 'Elite status. 90+ days streak.' },
                                    ].map((rankData, index, arr) => {
                                        const isUnlocked = streakDays >= rankData.days;
                                        const isNext = !isUnlocked && (index === 0 || streakDays >= arr[index - 1].days);

                                        return (
                                            <View key={rankData.title} style={styles.rankRow}>
                                                {/* Connecting Line */}
                                                {index < arr.length - 1 && (
                                                    <View style={[styles.rankLine, {
                                                        backgroundColor: streakDays >= arr[index + 1].days ? Colors.primary : (isDark ? Colors.gray[700] : Colors.gray[200])
                                                    }]} />
                                                )}

                                                <View style={[
                                                    styles.rankIcon,
                                                    { backgroundColor: isUnlocked ? (isDark ? Colors.primary + '30' : '#E0E7FF') : (isDark ? Colors.gray[800] : Colors.gray[100]) },
                                                    isUnlocked && { borderColor: Colors.primary, borderWidth: 1 }
                                                ]}>
                                                    <GlowRankIcon rank={rankData.rank} size={24} isUnlocked={isUnlocked} />
                                                </View>

                                                <View style={[styles.rankContent, { opacity: isUnlocked || isNext ? 1 : 0.5 }]}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <StyledText variant="bold" style={[styles.rankTitle, { color: textColor }]}>{rankData.title}</StyledText>
                                                        {isUnlocked && <View style={styles.unlockedBadge}><StyledText style={styles.unlockedText}>Unlocked</StyledText></View>}
                                                        {!isUnlocked && isNext && <StyledText style={[styles.daysLeftText, { color: Colors.primary }]}>{rankData.days - streakDays} days left</StyledText>}
                                                    </View>
                                                    <StyledText variant="regular" style={[styles.rankDesc, { color: subtitleColor }]}>{rankData.desc}</StyledText>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </ScrollView>

                            <SoundButton
                                style={styles.modalCancel}
                                onPress={() => setShowStatusModal(false)}
                            >
                                <StyledText variant="bold" style={[styles.modalCancelText, { color: subtitleColor }]}>Close</StyledText>
                            </SoundButton>
                        </GlowCard>
                    </View>
                </Modal>

                {/* Alert Modal */}
                <AlertModal
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                    onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                />

            </SafeAreaView>
        </View >
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
    navHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Layout.spacing.lg,
        paddingVertical: Layout.spacing.md,
    },
    navTitle: {
        fontSize: 20,
        color: Colors.gray[900],
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
    profileCard: {
        alignItems: 'center',
        paddingVertical: Layout.spacing.lg,
        paddingHorizontal: Layout.spacing.lg,
        marginHorizontal: Layout.spacing.lg,
        backgroundColor: Colors.white,
        borderRadius: 32,
        ...Layout.shadows.medium,
        marginBottom: Layout.spacing.lg,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        marginBottom: Layout.spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        padding: 8,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: Colors.white,
    },
    name: {
        fontSize: 24,
        color: Colors.gray[900],
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: Colors.gray[500],
        marginBottom: Layout.spacing.md,
    },
    statusPill: {
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 24,
    },
    statusPillContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        color: Colors.primary,
        fontSize: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: Layout.spacing.lg,
        gap: Layout.spacing.md,
        marginBottom: Layout.spacing.lg,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: Layout.spacing.md,
        gap: 4,
    },
    statNumber: {
        fontSize: 24,
        color: Colors.gray[900],
    },
    statLabel: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    section: {
        paddingHorizontal: Layout.spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        color: Colors.gray[800],
        marginBottom: Layout.spacing.md,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Layout.spacing.lg,
        marginBottom: Layout.spacing.md,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Layout.spacing.md,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        color: Colors.gray[900],
    },
    menuSubtitle: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        padding: 24,
        gap: 16,
    },
    modalTitle: {
        fontSize: 20,
        color: Colors.gray[900],
        marginBottom: 8,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        backgroundColor: Colors.gray[100],
        gap: 12,
    },
    modalIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOptionText: {
        fontSize: 16,
        color: Colors.gray[800],
    },
    modalCancel: {
        marginTop: 8,
        padding: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        color: Colors.gray[500],
        fontSize: 16,
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    closeIcon: {
        position: 'absolute',
        right: 0,
        top: 0,
    },
    currentRankBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        marginBottom: 4,
    },
    hierarchyContainer: {
        paddingHorizontal: 12,
        paddingBottom: 24,
    },
    rankRow: {
        flexDirection: 'row',
        marginBottom: 24,
        position: 'relative',
    },
    rankLine: {
        position: 'absolute',
        left: 20,
        top: 36,
        bottom: -28, // Connect to next
        width: 2,
        zIndex: 0,
    },
    rankIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        marginRight: 16,
    },
    rankContent: {
        flex: 1,
        justifyContent: 'center',
    },
    rankTitle: {
        fontSize: 16,
        marginBottom: 2,
    },
    rankDesc: {
        fontSize: 12,
    },
    unlockedBadge: {
        backgroundColor: Colors.secondary + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    unlockedText: {
        fontSize: 10,
        color: Colors.secondary,
        fontWeight: 'bold',
    },
    daysLeftText: {
        fontSize: 11,
        fontWeight: '600',
    },
});
