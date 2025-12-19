import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { clearNotifications, deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead, NotificationEntry } from '@/constants/storage';
import { usePreferences } from '@/contexts/PreferencesContext';
// import { useSounds } from '@/hooks/useSounds';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Bell, Check, Mail, MailOpen, Pin, PinOff, Trash2, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function NotificationsScreen() {
    const router = useRouter();
    const { preferences } = usePreferences();
    // const { playDelete } = useSounds();
    const playDelete = () => { };
    const isDark = preferences.darkMode;

    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];

    const [notifications, setNotifications] = useState<NotificationEntry[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const [detailNotification, setDetailNotification] = useState<any>(null);
    const [detailVisible, setDetailVisible] = useState(false);

    const handleLongPress = (item: any) => {
        setSelectedNotification(item);
        setMenuVisible(true);
    };

    const sortedNotifications = [...notifications].sort((a, b) => {
        if (a.pinned === b.pinned) return 0;
        return a.pinned ? -1 : 1;
    });

    const loadNotifications = async () => {
        setIsLoading(true);
        const data = await getNotifications();
        setNotifications(data);
        setIsLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [])
    );

    const handlePress = async (item: any) => {
        setDetailNotification(item);
        setDetailVisible(true);
        if (!item.read) {
            await markNotificationRead(item.id);
            loadNotifications();
        }
    };



    const performAction = async (action: 'pin' | 'delete' | 'read') => {
        if (!selectedNotification) return;

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        if (action === 'delete') {
            await deleteNotification(selectedNotification.id);
            playDelete(); // Play delete sound
        } else if (action === 'read') {
            await markNotificationRead(selectedNotification.id);
        } else if (action === 'pin') {
            // Pin logic local only for now
        }

        await loadNotifications();
        setMenuVisible(false);
        setSelectedNotification(null);
    };

    const markAllRead = async () => {
        await markAllNotificationsRead();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        await loadNotifications();
    };

    const clearAll = async () => {
        await clearNotifications();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setNotifications([]);
        playDelete(); // Play delete sound
    };

    const SoftBlob = ({ color, style }: { color: string, style: any }) => (
        <View style={[styles.blob, { backgroundColor: color }, style]} />
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            {/* Background blobs - dark mode uses muted violet tones */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#EDE9FE"} style={{ top: -100, right: -100, width: 350, height: 350 }} />
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ bottom: 50, left: -50, width: 300, height: 300 }} />

            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <SoundButton onPress={() => router.back()} style={[styles.backButton, { backgroundColor: cardBg }]}>
                        <ArrowLeft size={24} color={textColor} />
                    </SoundButton>
                    <StyledText variant="bold" style={[styles.title, { color: textColor }]}>Notifications</StyledText>
                    <View style={{ width: 24 }} />
                </View>

                {!isLoading && notifications.length > 0 && (
                    <View style={styles.actions}>
                        <SoundButton style={[styles.actionButton, { backgroundColor: cardBg }]} onPress={markAllRead}>
                            <Check size={16} color={isDark ? Colors.dark.tint : Colors.primary} />
                            <StyledText variant="semibold" style={[styles.actionText, { color: isDark ? Colors.dark.tint : Colors.primary }]}>Mark all read</StyledText>
                        </SoundButton>
                        <SoundButton style={[styles.actionButton, { backgroundColor: cardBg }]} onPress={clearAll}>
                            <Trash2 size={16} color={Colors.warning} />
                            <StyledText variant="semibold" style={[styles.actionText, { color: Colors.warning }]}>Clear all</StyledText>
                        </SoundButton>
                    </View>
                )}

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {isLoading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : sortedNotifications.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Bell size={48} color={subtitleColor} />
                            <StyledText variant="semibold" style={[styles.emptyText, { color: subtitleColor }]}>No new notifications</StyledText>
                        </View>
                    ) : (
                        sortedNotifications.map(item => (
                            <SoundButton
                                key={item.id}
                                activeOpacity={0.9}
                                onPress={() => handlePress(item)}
                                onLongPress={() => handleLongPress(item)}
                            >
                                <GlowCard
                                    variant="surface"
                                    style={[
                                        styles.notificationCard,
                                        { backgroundColor: cardBg },
                                        !item.read && { borderLeftColor: Colors.primary, borderLeftWidth: 4 },
                                        item.pinned && { backgroundColor: isDark ? '#312E81' : '#F3E8FF', borderColor: Colors.primary + '40' }
                                    ]}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }, !item.read && { backgroundColor: Colors.primary }, item.pinned && { backgroundColor: isDark ? '#4338CA' : '#F3E8FF', borderColor: Colors.primary + '20', borderWidth: 1 }]}>
                                        {item.pinned ? (
                                            <Pin size={20} color={isDark ? Colors.white : Colors.primary} fill={isDark ? Colors.white : Colors.primary} />
                                        ) : (
                                            <Bell size={20} color={!item.read ? Colors.white : (isDark ? Colors.gray[400] : Colors.gray[400])} />
                                        )}
                                    </View>
                                    <View style={styles.textContainer}>
                                        <View style={styles.cardHeaderRow}>
                                            <StyledText variant={item.read ? "semibold" : "bold"} style={[styles.cardTitle, { color: textColor }, !item.read && { color: isDark ? Colors.white : Colors.gray[900] }]}>{item.title}</StyledText>
                                            <StyledText variant="medium" style={[styles.cardTime, { color: subtitleColor }]}>{item.time}</StyledText>
                                        </View>
                                        <StyledText variant="regular" style={[styles.cardMessage, { color: subtitleColor }]} numberOfLines={2}>
                                            {item.message}
                                        </StyledText>
                                    </View>
                                    {!item.read && <View style={[styles.dot, { backgroundColor: Colors.secondary }]} />}
                                </GlowCard>
                            </SoundButton>
                        ))
                    )}
                </ScrollView>

                {/* Detail Modal */}
                <Modal visible={detailVisible} transparent animationType="fade" onRequestClose={() => setDetailVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setDetailVisible(false)} />
                        <View style={styles.centerModalContainer}>
                            <GlowCard variant="surface" style={[styles.detailCard, { backgroundColor: cardBg }]}>
                                <View style={styles.detailHeader}>
                                    <View style={[styles.detailIconBox, { backgroundColor: isDark ? '#312E81' : '#F3E8FF' }]}>
                                        <Bell size={24} color={Colors.primary} />
                                    </View>
                                    <SoundButton onPress={() => setDetailVisible(false)}>
                                        <X size={24} color={subtitleColor} />
                                    </SoundButton>
                                </View>

                                <StyledText variant="bold" style={[styles.detailTitle, { color: textColor }]}>{detailNotification?.title}</StyledText>
                                <StyledText variant="medium" style={[styles.detailTime, { color: subtitleColor }]}>{detailNotification?.time}</StyledText>

                                <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={true}>
                                    <StyledText variant="regular" style={[styles.detailMessage, { color: isDark ? Colors.gray[300] : Colors.gray[600] }]}>
                                        {detailNotification?.message}
                                    </StyledText>
                                </ScrollView>

                                <SoundButton style={styles.closeButton} onPress={() => setDetailVisible(false)}>
                                    <StyledText variant="semibold" style={styles.closeButtonText}>Close</StyledText>
                                </SoundButton>
                            </GlowCard>
                        </View>
                    </View>
                </Modal>

                {/* Actions Modal */}
                <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                    <SoundButton style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
                        <GlowCard variant="surface" style={[styles.menuContainer, { backgroundColor: cardBg }]}>
                            <View style={styles.menuHeader}>
                                <StyledText variant="bold" style={[styles.menuTitle, { color: textColor }]}>Options</StyledText>
                                <SoundButton onPress={() => setMenuVisible(false)}>
                                    <X size={24} color={subtitleColor} />
                                </SoundButton>
                            </View>

                            <SoundButton style={styles.menuItem} onPress={() => performAction('pin')}>
                                <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#312E81' : '#F0F9FF' }]}>
                                    {selectedNotification?.pinned ? <PinOff size={20} color={Colors.secondary} /> : <Pin size={20} color={Colors.secondary} />}
                                </View>
                                <StyledText variant="medium" style={[styles.menuText, { color: textColor }]}>
                                    {selectedNotification?.pinned ? 'Unpin Notification' : 'Pin to Top'}
                                </StyledText>
                            </SoundButton>

                            <SoundButton style={styles.menuItem} onPress={() => performAction('read')}>
                                <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#4C1D95' : '#F3E8FF' }]}>
                                    {selectedNotification?.read ? <Mail size={20} color={Colors.primary} /> : <MailOpen size={20} color={Colors.primary} />}
                                </View>
                                <StyledText variant="medium" style={[styles.menuText, { color: textColor }]}>
                                    {selectedNotification?.read ? 'Mark as Unread' : 'Mark as Read'}
                                </StyledText>
                            </SoundButton>

                            <SoundButton style={[styles.menuItem, styles.deleteItem, { borderTopColor: isDark ? Colors.gray[700] : Colors.gray[100] }]} onPress={() => performAction('delete')}>
                                <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2' }]}>
                                    <Trash2 size={20} color={Colors.warning} />
                                </View>
                                <StyledText variant="medium" style={[styles.menuText, { color: Colors.warning }]}>Delete Notification</StyledText>
                            </SoundButton>
                        </GlowCard>
                    </SoundButton>
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
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: Layout.spacing.lg,
        marginBottom: Layout.spacing.md,
        gap: Layout.spacing.lg,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.white,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        ...Layout.shadows.small,
    },
    actionText: {
        fontSize: 12,
        color: Colors.primary,
    },
    content: {
        paddingHorizontal: Layout.spacing.lg,
        gap: Layout.spacing.md,
        paddingBottom: Layout.spacing.xl,
    },
    notificationCard: {
        flexDirection: 'row',
        padding: Layout.spacing.lg,
        alignItems: 'center',
        gap: Layout.spacing.md,
    },
    unreadCard: {
        backgroundColor: '#FFFFFF',
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadIcon: {
        backgroundColor: Colors.primary,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        color: Colors.gray[600],
        marginBottom: 2,
    },
    unreadTitle: {
        color: Colors.gray[900],
    },
    cardMessage: {
        fontSize: 14,
        color: Colors.gray[500],
        marginBottom: 4,
    },
    cardTime: {
        fontSize: 12,
        color: Colors.gray[400],
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.secondary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        gap: Layout.spacing.md,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.gray[400],
    },
    // Interaction Styles
    pinnedCard: {
        borderColor: Colors.primary + '40',
        borderWidth: 1,
        backgroundColor: '#F3E8FF',
    },
    pinnedIcon: {
        backgroundColor: '#F3E8FF',
        borderWidth: 1,
        borderColor: Colors.primary + '20',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    menuContainer: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Layout.spacing.xl,
        gap: 16,
        paddingBottom: 40, // Safe area
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    menuTitle: {
        fontSize: 18,
        color: Colors.gray[900],
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 16,
        color: Colors.gray[800],
    },
    deleteItem: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.gray[100],
        paddingTop: 16,
    },
    // Detail Modal Styles
    centerModalContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: Layout.spacing.lg,
        pointerEvents: 'box-none', // Allow touches to pass through empty space to the overlay
    },
    detailCard: {
        backgroundColor: Colors.white,
        padding: 24,
        borderRadius: 32,
        ...Layout.shadows.medium,
        maxHeight: '80%',
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    detailIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailTitle: {
        fontSize: 22,
        color: Colors.gray[900],
        marginBottom: 8,
    },
    detailTime: {
        fontSize: 14,
        color: Colors.gray[400],
        marginBottom: 24,
    },
    detailScroll: {
        marginBottom: 24,
    },
    detailMessage: {
        fontSize: 16,
        color: Colors.gray[600],
        lineHeight: 24,
    },
    closeButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    closeButtonText: {
        color: Colors.white,
        fontSize: 16,
    },
});
