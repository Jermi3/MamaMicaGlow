import AsyncStorage from '@react-native-async-storage/async-storage';

export type MetricType = 'weight' | 'cognitive' | 'recovery' | 'antiaging' | 'muscle';

export interface MetricEntry {
    date: string; // ISO String
    value: number;
    type: MetricType;
}

export interface WeightEntry {
    date: string; // ISO String
    weight: number;
}

export interface DoseEntry {
    date: string; // ISO String
    peptide: string;
    amount: string;
    type: string; // 'Injection' | 'Oral'
    category?: string; // Peptide category for icon display
}

const KEYS = {
    WEIGHT_HISTORY: 'user_weight_history',
    DOSE_HISTORY: 'user_dose_history',
    COGNITIVE_HISTORY: 'user_cognitive_history',
    RECOVERY_HISTORY: 'user_recovery_history',
    ANTI_AGING_HISTORY: 'user_anti_aging_history',
    MUSCLE_HISTORY: 'user_muscle_history',
    NOTIFICATIONS: 'notifications',
};

const getStorageKey = (type: MetricType) => {
    switch (type) {
        case 'weight': return KEYS.WEIGHT_HISTORY;
        case 'cognitive': return KEYS.COGNITIVE_HISTORY;
        case 'recovery': return KEYS.RECOVERY_HISTORY;
        case 'antiaging': return KEYS.ANTI_AGING_HISTORY;
        case 'muscle': return KEYS.MUSCLE_HISTORY;
        default: return KEYS.WEIGHT_HISTORY;
    }
};

export const saveMetric = async (type: MetricType, value: number) => {
    try {
        const key = getStorageKey(type);
        const historyJson = await AsyncStorage.getItem(key);
        // Handle weight legacy format (WeightEntry has 'weight', others have 'value')
        // For simplicity, we will just use the generic structure for new metrics, 
        // and keep saving weight as WeightEntry for backward compatibility if needed, 
        // OR we unify.
        // Given existing code uses WeightEntry with .weight, let's keep saveWeight for weight
        // and use this for the others, OR map them.

        if (type === 'weight') {
            return saveWeight(value);
        }

        let history: MetricEntry[] = historyJson ? JSON.parse(historyJson) : [];

        const newEntry: MetricEntry = {
            date: new Date().toISOString(),
            value,
            type
        };

        history.unshift(newEntry);
        await AsyncStorage.setItem(key, JSON.stringify(history));
        return history;
    } catch (e) {
        console.error(`Failed to save metric ${type}`, e);
        return [];
    }
};

export const getMetricHistory = async (type: MetricType): Promise<MetricEntry[]> => {
    try {
        if (type === 'weight') {
            const weights = await getWeightHistory();
            return weights.map(w => ({ date: w.date, value: w.weight, type: 'weight' }));
        }

        const key = getStorageKey(type);
        const historyJson = await AsyncStorage.getItem(key);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (e) {
        console.error(`Failed to fetch metric history ${type}`, e);
        return [];
    }
};

export const saveWeight = async (weight: number) => {
    try {
        const historyJson = await AsyncStorage.getItem(KEYS.WEIGHT_HISTORY);
        let history: WeightEntry[] = historyJson ? JSON.parse(historyJson) : [];

        const newEntry: WeightEntry = {
            date: new Date().toISOString(),
            weight,
        };

        // Prepend new entry (newest first)
        history.unshift(newEntry);

        // Optional: Limit history size if needed, e.g., keep last 500
        // history = history.slice(0, 500);

        await AsyncStorage.setItem(KEYS.WEIGHT_HISTORY, JSON.stringify(history));
        return history;
    } catch (e) {
        console.error('Failed to save weight', e);
        return [];
    }
};

export const getWeightHistory = async (): Promise<WeightEntry[]> => {
    try {
        const historyJson = await AsyncStorage.getItem(KEYS.WEIGHT_HISTORY);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (e) {
        console.error('Failed to fetch weight history', e);
        return [];
    }
};

export const saveDose = async (dose: Omit<DoseEntry, 'date'>) => {
    try {
        const historyJson = await AsyncStorage.getItem(KEYS.DOSE_HISTORY);
        let history: DoseEntry[] = historyJson ? JSON.parse(historyJson) : [];

        const newEntry: DoseEntry = {
            ...dose,
            date: new Date().toISOString(),
        };

        // Prepend new entry
        history.unshift(newEntry);

        await AsyncStorage.setItem(KEYS.DOSE_HISTORY, JSON.stringify(history));

        // Trigger cloud sync (fire and forget)
        import('@/services/syncService').then(({ syncService }) => {
            syncService.pushDoseLog(newEntry).catch(console.error);
        }).catch(() => { /* sync service not available */ });

        return history;
    } catch (e) {
        console.error('Failed to save dose', e);
        return [];
    }
};

export const getDoseHistory = async (): Promise<DoseEntry[]> => {
    try {
        const historyJson = await AsyncStorage.getItem(KEYS.DOSE_HISTORY);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (e) {
        console.error('Failed to fetch dose history', e);
        return [];
    }
};

export const clearAllHistory = async () => {
    try {
        await AsyncStorage.multiRemove([KEYS.WEIGHT_HISTORY, KEYS.DOSE_HISTORY]);
    } catch (e) {
        console.error('Failed to clear history', e);
    }
}

// ============================================
// SCHEDULED DOSES
// ============================================

export interface ScheduledDose {
    id: string;
    peptide: string;
    amount: string;
    frequency: 'daily' | 'weekly' | 'biweekly';
    daysOfWeek: number[];  // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    time: string;          // "09:00" format
    enabled: boolean;
    createdAt: string;
    notificationIds?: string[];  // IDs of scheduled notifications for cancellation
}

const SCHEDULE_KEY = 'user_dose_schedules';

export const getSchedules = async (): Promise<ScheduledDose[]> => {
    try {
        const json = await AsyncStorage.getItem(SCHEDULE_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error('Failed to get schedules', e);
        return [];
    }
};

export const saveSchedule = async (schedule: Omit<ScheduledDose, 'id' | 'createdAt'>): Promise<ScheduledDose[]> => {
    try {
        const schedules = await getSchedules();
        const newSchedule: ScheduledDose = {
            ...schedule,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };
        schedules.push(newSchedule);
        await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
        return schedules;
    } catch (e) {
        console.error('Failed to save schedule', e);
        return [];
    }
};

export const updateSchedule = async (id: string, updates: Partial<ScheduledDose>): Promise<ScheduledDose[]> => {
    try {
        const schedules = await getSchedules();
        const index = schedules.findIndex(s => s.id === id);
        if (index !== -1) {
            schedules[index] = { ...schedules[index], ...updates };
            await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
        }
        return schedules;
    } catch (e) {
        console.error('Failed to update schedule', e);
        return [];
    }
};

export const deleteSchedule = async (id: string): Promise<ScheduledDose[]> => {
    try {
        let schedules = await getSchedules();
        schedules = schedules.filter(s => s.id !== id);
        await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
        return schedules;
    } catch (e) {
        console.error('Failed to delete schedule', e);
        return [];
    }
};

/**
 * Delete all schedules for a specific peptide (by name match)
 */
export const deleteSchedulesByPeptide = async (peptideName: string): Promise<ScheduledDose[]> => {
    try {
        let schedules = await getSchedules();
        // Filter out schedules where the peptide field contains the peptide name
        schedules = schedules.filter(s => !s.peptide.toLowerCase().includes(peptideName.toLowerCase()));
        await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
        console.log(`[Storage] Deleted schedules for peptide: ${peptideName}, remaining: ${schedules.length}`);
        return schedules;
    } catch (e) {
        console.error('Failed to delete schedules by peptide', e);
        return [];
    }
};

/**
 * Clear all schedules (used when clearing all peptides)
 */
export const clearAllSchedules = async (): Promise<void> => {
    try {
        await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify([]));
        console.log('[Storage] Cleared all schedules');
    } catch (e) {
        console.error('Failed to clear all schedules', e);
    }
};

/**
 * Get scheduled doses for a specific date
 */
export const getScheduledDosesForDate = async (date: Date): Promise<(ScheduledDose & { scheduledTime: Date })[]> => {
    const schedules = await getSchedules();
    const dayOfWeek = date.getDay();
    const result: (ScheduledDose & { scheduledTime: Date })[] = [];

    for (const schedule of schedules) {
        if (!schedule.enabled) continue;

        // Check if this schedule applies to this day
        if (schedule.daysOfWeek.includes(dayOfWeek)) {
            const [hours, minutes] = schedule.time.split(':').map(Number);
            const scheduledTime = new Date(date);
            scheduledTime.setHours(hours, minutes, 0, 0);
            result.push({ ...schedule, scheduledTime });
        }
    }

    return result.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
};

// ============================================
// NOTIFICATIONS
// ============================================

export interface NotificationEntry {
    id: string;
    title: string;
    message: string;
    time: string; // Formatting: "2h ago" or ISO
    timestamp: number; // For sorting
    read: boolean;
    pinned?: boolean;
    type?: string;
    data?: any;
}

export const getNotifications = async (): Promise<NotificationEntry[]> => {
    try {
        const json = await AsyncStorage.getItem(KEYS.NOTIFICATIONS);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        console.error('Failed to get notifications', e);
        return [];
    }
};

export const saveNotification = async (notification: Omit<NotificationEntry, 'id' | 'timestamp' | 'read'>) => {
    try {
        const notifications = await getNotifications();
        const newNotification: NotificationEntry = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            read: false,
            ...notification,
        };

        // Add to beginning
        const updated = [newNotification, ...notifications];
        // Limit to 50
        if (updated.length > 50) updated.pop();

        await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
        return newNotification;
    } catch (e) {
        console.error('Failed to save notification', e);
    }
};

export const markNotificationRead = async (id: string) => {
    try {
        const notifications = await getNotifications();
        const updated = notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        );
        await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to mark notification read', e);
    }
};

export const markAllNotificationsRead = async () => {
    try {
        const notifications = await getNotifications();
        const updated = notifications.map(n => ({ ...n, read: true }));
        await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to mark all read', e);
    }
};

export const deleteNotification = async (id: string) => {
    try {
        const notifications = await getNotifications();
        const updated = notifications.filter(n => n.id !== id);
        await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to delete notification', e);
    }
};

export const clearNotifications = async () => {
    try {
        await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
    } catch (e) {
        console.error('Failed to clear notifications', e);
    }
};

// ============================================
// USER PREFERENCES
// ============================================

export interface UserPreferences {
    notifications: boolean;
    soundEffects: boolean;
    hapticFeedback: boolean;
    darkMode: boolean;
}

const PREFERENCES_KEY = 'user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
    notifications: true,
    soundEffects: true,
    hapticFeedback: true,
    darkMode: false,
};

export const getPreferences = async (): Promise<UserPreferences> => {
    try {
        const json = await AsyncStorage.getItem(PREFERENCES_KEY);
        if (json) {
            return { ...DEFAULT_PREFERENCES, ...JSON.parse(json) };
        }
        return DEFAULT_PREFERENCES;
    } catch (e) {
        console.error('Failed to get preferences', e);
        return DEFAULT_PREFERENCES;
    }
};

export const savePreferences = async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    try {
        const current = await getPreferences();
        const updated = { ...current, ...preferences };
        await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error('Failed to save preferences', e);
        return await getPreferences();
    }
};
