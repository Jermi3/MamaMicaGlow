import { getSchedules, saveNotification, ScheduledDose, updateSchedule } from '@/constants/storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ... (existing code, ensure isNotificationSupported works)

// ============================================
// TEST NOTIFICATION (HELPER)
// ============================================

export async function sendTestNotification(): Promise<void> {
    if (Platform.OS === 'web') {
        // Web Simulation
        setTimeout(async () => {
            await saveNotification({
                title: "🔔 Test Notification (Web)",
                message: "If you see this, web simulation is working! 🚀",
                time: "Just now",
                type: "test"
            });
            // We can't really alert cleanly from inside a timeout if unmounted, but standard alert is fine
            console.log('Test notification saved to storage');
        }, 5000);
        return;
    }

    if (!isNotificationSupported) return;

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "🔔 Test Notification",
            body: "If you see this, your notifications are working perfectly! 🚀",
            sound: true,
            data: { type: 'test' },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 5,
        },
    });
}

// ... (rest of the file)

// ============================================
// PLATFORM CHECK - Notifications not supported on web
// ============================================
const isNotificationSupported = Platform.OS !== 'web';

// ============================================
// NOTIFICATION CONFIGURATION
// ============================================

// Configure how notifications are handled when the app is in the foreground
// Only set up on native platforms
if (isNotificationSupported) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

// ============================================
// PERMISSION HANDLING
// ============================================

export async function requestNotificationPermissions(): Promise<boolean> {
    if (!isNotificationSupported) return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
        return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

// ============================================
// SCHEDULE NOTIFICATIONS
// ============================================

/**
 * Schedule notifications for a dose schedule
 * Returns array of notification IDs for tracking/cancellation
 */
export async function scheduleNotificationsForDose(schedule: ScheduledDose): Promise<string[]> {
    if (!isNotificationSupported) return [];
    if (!schedule.enabled) return [];

    const notificationIds: string[] = [];
    const [hours, minutes] = schedule.time.split(':').map(Number);

    // Schedule for each day of the week
    for (const dayOfWeek of schedule.daysOfWeek) {
        // Main notification at scheduled time
        const mainId = await Notifications.scheduleNotificationAsync({
            content: {
                title: `💉 Time for ${schedule.peptide}`,
                body: `Your scheduled dose: ${schedule.amount} units`,
                data: {
                    type: 'dose_reminder',
                    scheduleId: schedule.id,
                    peptide: schedule.peptide,
                    amount: schedule.amount
                },
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                weekday: dayOfWeek + 1, // Expo uses 1-7 (Sun=1), our data uses 0-6 (Sun=0)
                hour: hours,
                minute: minutes,
            },
        });
        notificationIds.push(mainId);

        // Advance reminder (15 minutes before)
        let reminderHour = hours;
        let reminderMinute = minutes - 15;
        if (reminderMinute < 0) {
            reminderMinute += 60;
            reminderHour -= 1;
            if (reminderHour < 0) reminderHour = 23;
        }

        const reminderId = await Notifications.scheduleNotificationAsync({
            content: {
                title: `⏰ Upcoming: ${schedule.peptide}`,
                body: `Dose reminder in 15 minutes (${schedule.amount} units)`,
                data: {
                    type: 'dose_advance_reminder',
                    scheduleId: schedule.id,
                    peptide: schedule.peptide,
                    amount: schedule.amount
                },
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                weekday: dayOfWeek + 1,
                hour: reminderHour,
                minute: reminderMinute,
            },
        });
        notificationIds.push(reminderId);
    }

    return notificationIds;
}

/**
 * Cancel all notifications for a schedule
 */
export async function cancelNotificationsForSchedule(notificationIds: string[]): Promise<void> {
    if (!isNotificationSupported) return;

    for (const id of notificationIds) {
        try {
            await Notifications.cancelScheduledNotificationAsync(id);
        } catch (e) {
            console.warn('Failed to cancel notification:', id, e);
        }
    }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    if (!isNotificationSupported) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all pending scheduled notifications (for debugging)
 */
export async function getPendingNotifications() {
    if (!isNotificationSupported) return [];
    return await Notifications.getAllScheduledNotificationsAsync();
}

// ============================================
// STREAK NOTIFICATIONS
// ============================================

/**
 * Schedule a daily end-of-day streak reminder
 * Fires at 8 PM if user hasn't logged a dose
 */
export async function scheduleStreakReminder(): Promise<string | null> {
    if (!isNotificationSupported) return null;

    // First cancel any existing streak reminder
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const streakNotifications = existing.filter(n =>
        (n.content.data as any)?.type === 'streak_reminder'
    );
    for (const n of streakNotifications) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }

    // Schedule new daily reminder at 8 PM
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: "🔥 Don't break your streak!",
            body: "You haven't logged a dose today. Keep your progress going!",
            data: { type: 'streak_reminder' },
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 20,
            minute: 0,
        },
    });

    return id;
}

// ============================================
// SYNC ALL SCHEDULES
// ============================================

/**
 * Re-sync all notifications from stored schedules
 * Call this on app startup or when schedules change
 */
export async function syncAllNotifications(): Promise<void> {
    // Cancel all existing notifications first
    await cancelAllNotifications();

    // Get all schedules and reschedule notifications
    const schedules = await getSchedules();

    for (const schedule of schedules) {
        if (schedule.enabled) {
            const notificationIds = await scheduleNotificationsForDose(schedule);
            // Update schedule with new notification IDs
            await updateSchedule(schedule.id, { notificationIds });
        }
    }

    console.log(`Synced notifications for ${schedules.filter(s => s.enabled).length} schedules`);
}

// ============================================
// PROTOCOL PAUSE/RESUME NOTIFICATIONS
// ============================================

/**
 * Pause notifications for a specific peptide (when protocol is paused)
 * Cancels all scheduled notifications for this peptide's schedules
 */
export async function pauseNotificationsForPeptide(peptideName: string): Promise<void> {
    if (!isNotificationSupported) {
        console.log('[Notifications] Pausing notifications for:', peptideName, '(web simulation)');
        return;
    }

    const schedules = await getSchedules();
    const peptideSchedules = schedules.filter(s => s.peptide === peptideName);

    for (const schedule of peptideSchedules) {
        if (schedule.notificationIds && schedule.notificationIds.length > 0) {
            await cancelNotificationsForSchedule(schedule.notificationIds);
            // Clear the notification IDs from storage but keep enabled status
            await updateSchedule(schedule.id, { notificationIds: [] });
        }
    }

    console.log(`[Notifications] Paused ${peptideSchedules.length} schedule(s) for ${peptideName}`);
}

/**
 * Resume notifications for a specific peptide (when protocol is resumed)
 * Re-schedules all notifications for this peptide's schedules
 */
export async function resumeNotificationsForPeptide(peptideName: string): Promise<void> {
    if (!isNotificationSupported) {
        console.log('[Notifications] Resuming notifications for:', peptideName, '(web simulation)');
        return;
    }

    const schedules = await getSchedules();
    const peptideSchedules = schedules.filter(s => s.peptide === peptideName && s.enabled);

    for (const schedule of peptideSchedules) {
        const notificationIds = await scheduleNotificationsForDose(schedule);
        await updateSchedule(schedule.id, { notificationIds });
    }

    console.log(`[Notifications] Resumed ${peptideSchedules.length} schedule(s) for ${peptideName}`);
}

/**
 * Cancel all notifications for a specific peptide (when removed from stack)
 */
export async function cancelNotificationsForPeptide(peptideName: string): Promise<void> {
    if (!isNotificationSupported) {
        console.log('[Notifications] Cancelling all notifications for:', peptideName, '(web simulation)');
        return;
    }

    const schedules = await getSchedules();
    const peptideSchedules = schedules.filter(s => s.peptide === peptideName);

    for (const schedule of peptideSchedules) {
        if (schedule.notificationIds && schedule.notificationIds.length > 0) {
            await cancelNotificationsForSchedule(schedule.notificationIds);
        }
    }

    console.log(`[Notifications] Cancelled all notifications for ${peptideName}`);
}

/**
 * Send an immediate notification when protocol status changes
 */
export async function sendProtocolStatusNotification(
    peptideName: string,
    newStatus: 'Active' | 'Paused'
): Promise<void> {
    // Save to local notification history for web
    await saveNotification({
        title: newStatus === 'Paused'
            ? `⏸️ ${peptideName} Paused`
            : `▶️ ${peptideName} Resumed`,
        message: newStatus === 'Paused'
            ? 'Protocol notifications have been paused. You won\'t receive dose reminders.'
            : 'Protocol is active again! You\'ll receive dose reminders as scheduled.',
        time: 'Just now',
        type: 'protocol_status'
    });

    // On native, also show an immediate notification
    if (isNotificationSupported) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: newStatus === 'Paused'
                    ? `⏸️ ${peptideName} Protocol Paused`
                    : `▶️ ${peptideName} Protocol Resumed`,
                body: newStatus === 'Paused'
                    ? 'You won\'t receive dose reminders until you resume this protocol.'
                    : 'Dose reminders are now active. Stay consistent! 💪',
                data: {
                    type: 'protocol_status',
                    peptide: peptideName,
                    status: newStatus
                },
                sound: true,
            },
            trigger: null, // Immediate notification
        });
    }
}
