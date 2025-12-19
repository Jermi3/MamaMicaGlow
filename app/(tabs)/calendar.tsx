import { AlertModal } from '@/components/AlertModal';
import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { deleteSchedule, getDoseHistory, getSchedules, saveSchedule, ScheduledDose } from '@/constants/storage';
import { usePreferences } from '@/contexts/PreferencesContext';
// import { useSounds } from '@/hooks/useSounds';
import { cancelNotificationsForSchedule, requestNotificationPermissions, syncAllNotifications } from '@/services/notificationService';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, Clock, Droplets, FlaskConical, Heart, Package, Plus, Search, Sparkles, X, Zap } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FREQUENCIES = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'biweekly', label: 'Every 2 Weeks' },
];

// Color palette for peptides without custom colors
const PEPTIDE_COLORS = [
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#EC4899', // pink
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#EF4444', // red
    '#6366F1', // indigo
];

const CATEGORY_CONFIG: Record<string, { color: string; gradient: readonly [string, string]; icon: any }> = {
    'Semaglutide': { color: '#8B5CF6', gradient: ['#A78BFA', '#7C3AED'] as const, icon: Droplets },
    'Tirzepatide': { color: '#EC4899', gradient: ['#F472B6', '#DB2777'] as const, icon: Sparkles },
    'Retatrutide': { color: '#F97316', gradient: ['#FB923C', '#EA580C'] as const, icon: Zap },
    'Weight Management': { color: '#F59E0B', gradient: ['#FCD34D', '#D97706'] as const, icon: Heart },
    'Growth Hormone': { color: '#10B981', gradient: ['#34D399', '#059669'] as const, icon: Zap },
    'Healing & Recovery': { color: '#06B6D4', gradient: ['#22D3EE', '#0891B2'] as const, icon: Heart },
    'Peptide Combinations': { color: '#6366F1', gradient: ['#818CF8', '#4F46E5'] as const, icon: Sparkles },
    'Accessories & Supplies': { color: '#3B82F6', gradient: ['#60A5FA', '#2563EB'] as const, icon: Package },
};

const DEFAULT_CONFIG = { color: Colors.primary, gradient: Colors.gradients.primary, icon: FlaskConical };

const getPeptideColor = (peptide: any, index: number): string => {
    if (peptide && peptide.color) return peptide.color;
    return PEPTIDE_COLORS[index % PEPTIDE_COLORS.length];
};

const getPeptideIcon = (peptide: any) => {
    if (!peptide) return FlaskConical;

    // Check category first
    if (peptide.category && CATEGORY_CONFIG[peptide.category]) {
        return CATEGORY_CONFIG[peptide.category].icon;
    }

    // Fallback: Check name keywords
    const name = peptide.name?.toLowerCase() || '';
    if (name.includes('sema')) return Droplets;
    if (name.includes('tirz') || name.includes('reta') || name.includes('lipo')) return Sparkles;
    if (name.includes('bpc') || name.includes('tb')) return Heart;
    if (name.includes('growth') || name.includes('cjc')) return Zap;

    return FlaskConical;
};

export default function CalendarScreen() {
    const { preferences } = usePreferences();
    // const { playAdd, playDelete } = useSounds();
    const playAdd = () => { };
    const playDelete = () => { };
    const isDark = preferences.darkMode;
    const insets = useSafeAreaInsets();

    // Dynamic colors
    const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
    const cardBg = isDark ? Colors.gray[800] : Colors.white;
    const textColor = isDark ? Colors.dark.text : Colors.gray[900];
    const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];

    // State management for calendar and modals
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
    const [eventsMap, setEventsMap] = useState<Record<string, any[]>>({});
    const [name, setName] = useState('Mama Mica');
    const user = { user_metadata: { avatar_url: null, full_name: name }, email: 'user@example.com' }; // Mock user with state name
    const router = useRouter();

    // Schedule modal state
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [userPeptides, setUserPeptides] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<ScheduledDose[]>([]);

    // Schedule form state
    const [selectedPeptide, setSelectedPeptide] = useState<string>('');
    const [showPeptidePicker, setShowPeptidePicker] = useState(false);
    const [pickerSearchQuery, setPickerSearchQuery] = useState('');
    const [scheduleAmount, setScheduleAmount] = useState('');
    const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'biweekly'>('weekly');
    const [scheduleDays, setScheduleDays] = useState<number[]>([1]); // Default Monday
    const [scheduleTime, setScheduleTime] = useState('09:00');
    // Time Form State
    const [pickerDate, setPickerDate] = useState(() => {
        const d = new Date();
        d.setHours(9, 0, 0, 0);
        return d;
    });
    const [showTimer, setShowTimer] = useState(false);
    // Web time picker text input state (for free-form typing)
    const [webHourInput, setWebHourInput] = useState('09');
    const [webMinuteInput, setWebMinuteInput] = useState('00');
    // Alert states
    const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
    const [scheduleToDeleteId, setScheduleToDeleteId] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>({
        visible: false, title: '', message: '', type: 'error'
    });
    const [showLegend, setShowLegend] = useState(false);

    // FAB visibility state - subtle by default, visible on tap
    const fabOpacity = useSharedValue(0.4); // Start subtle
    const fabScale = useSharedValue(0.9); // Slightly smaller by default

    const handleFabPressIn = () => {
        // Make FAB fully visible and bouncy when touched
        fabOpacity.value = withTiming(1, { duration: 100 });
        fabScale.value = withSpring(1.05, { damping: 10, stiffness: 200 });
    };

    const handleFabPressOut = () => {
        // Return to subtle state after release
        fabOpacity.value = withTiming(0.4, { duration: 300 });
        fabScale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
    };

    const fabAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: fabScale.value }],
        opacity: fabOpacity.value,
    }));

    const formatTimeDisplay = (time24: string) => {
        if (!time24) return '';
        const [h, m] = time24.split(':');
        let hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12;
        return `${hour}:${m} ${ampm}`;
    };

    // Performance: Reduced cache to 2 seconds to ensure quick refresh while preventing infinite loops
    const lastLoadRef = useRef<number>(0);

    useFocusEffect(
        useCallback(() => {
            // Reduced to 2 seconds to ensure orphaned schedules are cleaned up quickly when peptides are deleted
            const now = Date.now();
            if (now - lastLoadRef.current > 2000) {
                lastLoadRef.current = now;
                const loadAll = async () => {
                    try {
                        // Load schedules first to clean up orphans before loading events
                        await loadSchedules();
                        await Promise.all([
                            loadEvents(),
                            loadUserPeptides(),
                        ]);
                    } catch (e) {
                        console.error('Error loading calendar data:', e);
                    }
                };
                loadAll();
            }
        }, [])
    );

    const loadUserPeptides = async () => {
        try {
            const json = await AsyncStorage.getItem('user_peptides');
            let peptides = json ? JSON.parse(json) : [];

            // Sync categories from catalog for accurate icons/colors
            try {
                const { fetchPeptides } = await import('@/services/peptideService');
                const catalog = await fetchPeptides();
                let hasUpdates = false;

                peptides = peptides.map((p: any) => {
                    // Match by catalogId, exact name, or partial name
                    const match = catalog.find(c =>
                        c.id === p.catalogId ||
                        c.name.toLowerCase() === p.name?.toLowerCase() ||
                        p.name?.toLowerCase().includes(c.name.toLowerCase()) ||
                        c.name.toLowerCase().includes(p.name?.toLowerCase() || '')
                    );

                    if (match && (!p.category || p.category !== match.category)) {
                        hasUpdates = true;
                        return { ...p, category: match.category };
                    }
                    return p;
                });

                // Persist the updated categories
                if (hasUpdates) {
                    await AsyncStorage.setItem('user_peptides', JSON.stringify(peptides));
                }
            } catch (syncErr) {
                console.warn('Failed to sync peptide categories:', syncErr);
            }

            setUserPeptides(peptides);
        } catch (e) {
            console.error('Failed to load peptides', e);
        }
    };

    const loadSchedules = async () => {
        let data = await getSchedules();

        // Cleanup: Remove orphaned schedules (schedules for peptides that no longer exist)
        // CRITICAL: Fetch fresh user_peptides directly from storage to avoid race conditions with state
        try {
            const json = await AsyncStorage.getItem('user_peptides');
            const freshPeptides = json ? JSON.parse(json) : [];

            if (freshPeptides.length === 0 && data.length > 0) {
                // If there are truly no peptides but there are schedules, clear all schedules
                console.log('[Calendar] Fresh check: No peptides found, clearing all orphaned schedules');
                const { clearAllSchedules } = await import('@/constants/storage');
                await clearAllSchedules();
                data = [];
            } else if (freshPeptides.length > 0 && data.length > 0) {
                // Check each schedule to see if its peptide still exists
                const peptideNames = freshPeptides.map((p: any) => p.name.toLowerCase());
                const validSchedules = data.filter(schedule => {
                    const schedulePeptideName = schedule.peptide.toLowerCase();
                    return peptideNames.some(name => schedulePeptideName.includes(name) || name.includes(schedulePeptideName));
                });

                if (validSchedules.length !== data.length) {
                    console.log(`[Calendar] Fresh check: Found ${data.length - validSchedules.length} orphaned schedules, cleaning up`);
                    await AsyncStorage.setItem('user_dose_schedules', JSON.stringify(validSchedules));
                    data = validSchedules;
                }
            }
        } catch (err) {
            console.warn('[Calendar] Failed to perform fresh cleanup check:', err);
        }

        setSchedules(data);
    };

    const loadEvents = async () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/97cb0a92-ea5f-4b1f-85a3-1112c7246f5a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'calendar.tsx:255', message: 'loadEvents entry', data: {}, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
        // #endregion
        const doses = await getDoseHistory();
        const allSchedules = await getSchedules();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/97cb0a92-ea5f-4b1f-85a3-1112c7246f5a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'calendar.tsx:257', message: 'loaded schedules', data: { schedulesCount: allSchedules.length, schedules: allSchedules.map(s => ({ id: s.id, peptide: s.peptide, daysOfWeek: s.daysOfWeek, enabled: s.enabled })) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
        // #endregion
        const map: Record<string, any[]> = {};

        // Add completed doses
        doses.forEach((dose: any) => {
            const doseDate = new Date(dose.date);
            // CRITICAL: Use local date string, not UTC (toISOString converts to UTC which shifts the date)
            const dateKey = `${doseDate.getFullYear()}-${String(doseDate.getMonth() + 1).padStart(2, '0')}-${String(doseDate.getDate()).padStart(2, '0')}`;
            if (!map[dateKey]) map[dateKey] = [];

            map[dateKey].push({
                id: dose.date,
                peptide: dose.peptide,
                amount: dose.amount,
                time: new Date(dose.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                completed: true,
                isScheduled: false,
                color: Colors.primary
            });
        });

        // Add scheduled doses for the next 60 days
        const today = new Date();

        // Extra safety: Filter schedules here too in case storage is out of sync or stale
        try {
            const json = await AsyncStorage.getItem('user_peptides');
            const freshPeptides = json ? JSON.parse(json) : [];
            const activePeptideNames = freshPeptides.map((p: any) => p.name.toLowerCase());

            // CRITICAL: If no peptides exist, skip all scheduled doses entirely
            if (freshPeptides.length === 0) {
                console.log('[Calendar] No peptides found, skipping all scheduled doses');
                // Don't add any scheduled doses to the map
            } else {
                for (let i = 0; i < 60; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() + i);
                    const dayOfWeek = date.getDay();
                    // CRITICAL: Use local date string, not UTC (toISOString converts to UTC which shifts the date)
                    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                    allSchedules.forEach((schedule) => {
                        if (!schedule.enabled) return;

                        // Filter out orphaned schedules even if they are in storage
                        const schedulePeptideName = schedule.peptide.toLowerCase();
                        const isOrphaned = !activePeptideNames.some(name =>
                            schedulePeptideName.includes(name) || name.includes(schedulePeptideName)
                        );

                        if (isOrphaned) {
                            console.log(`[Calendar] Skipping orphaned schedule for: ${schedule.peptide}`);
                            return;
                        }

                        // Ensure daysOfWeek is an array of numbers
                        const scheduleDaysOfWeek = Array.isArray(schedule.daysOfWeek)
                            ? schedule.daysOfWeek.map(d => typeof d === 'number' ? d : parseInt(String(d), 10)).filter(d => !isNaN(d))
                            : [];

                        if (scheduleDaysOfWeek.includes(dayOfWeek)) {
                            if (!map[dateKey]) map[dateKey] = [];

                            // Check if already logged for this day (use partial match since names may differ)
                            const schedulePeptideLower = schedule.peptide.toLowerCase();
                            const alreadyLogged = map[dateKey].some(e => {
                                if (!e.completed) return false;
                                const loggedPeptideLower = (e.peptide || '').toLowerCase();
                                return loggedPeptideLower.includes(schedulePeptideLower) ||
                                    schedulePeptideLower.includes(loggedPeptideLower);
                            });

                            if (!alreadyLogged) {
                                map[dateKey].push({
                                    id: `scheduled-${schedule.id}-${dateKey}`,
                                    peptide: schedule.peptide,
                                    amount: schedule.amount,
                                    time: schedule.time,
                                    completed: false,
                                    isScheduled: true,
                                    scheduleId: schedule.id,
                                    color: Colors.secondary
                                });
                            }
                        }
                    });
                }
            }
        } catch (err) {
            console.warn('[Calendar] Error filtering schedules in loadEvents:', err);
        }

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/97cb0a92-ea5f-4b1f-85a3-1112c7246f5a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'calendar.tsx:310', message: 'loadEvents complete', data: { eventsMapKeys: Object.keys(map).length, sampleDates: Object.keys(map).slice(0, 5) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
        // #endregion
        setEventsMap(map);
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    // CRITICAL: Use local date string, not UTC (toISOString converts to UTC which shifts the date)
    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const events = eventsMap[dateKey] || [];

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDeleteSchedule = async (scheduleId: string) => {
        setScheduleToDeleteId(scheduleId);
        setConfirmDeleteVisible(true);
    };

    const confirmDeleteSchedule = async () => {
        if (!scheduleToDeleteId) return;

        // Cancel notifications for this schedule
        const scheduleToDelete = schedules.find(s => s.id === scheduleToDeleteId);
        if (scheduleToDelete?.notificationIds) {
            await cancelNotificationsForSchedule(scheduleToDelete.notificationIds);
        }

        await deleteSchedule(scheduleToDeleteId);
        await loadEvents();
        await loadSchedules();

        // Play delete sound
        playDelete();

        setConfirmDeleteVisible(false);
        setScheduleToDeleteId(null);
    };

    const handleSaveSchedule = async () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/97cb0a92-ea5f-4b1f-85a3-1112c7246f5a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'calendar.tsx:358', message: 'handleSaveSchedule entry', data: { selectedPeptide, scheduleAmount, scheduleFrequency, scheduleDays, scheduleTime }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
        // #endregion
        console.log('[Schedule] Attempting to save:', { selectedPeptide, scheduleAmount, scheduleFrequency, scheduleDays, scheduleTime });

        if (!selectedPeptide || !scheduleAmount) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/97cb0a92-ea5f-4b1f-85a3-1112c7246f5a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'calendar.tsx:361', message: 'validation failed', data: { selectedPeptide, scheduleAmount }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
            // #endregion
            console.log('[Schedule] Validation failed:', { selectedPeptide, scheduleAmount });
            setAlertConfig({
                visible: true,
                title: 'Missing Information',
                message: !selectedPeptide ? 'Please select a peptide.' : 'Please enter a dosage amount.',
                type: 'warning'
            });
            return;
        }

        // Validate that at least one day is selected for weekly/biweekly schedules
        if (scheduleFrequency !== 'daily' && (!scheduleDays || scheduleDays.length === 0)) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/97cb0a92-ea5f-4b1f-85a3-1112c7246f5a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'calendar.tsx:372', message: 'validation failed - no days selected', data: { scheduleFrequency, scheduleDays }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
            // #endregion
            setAlertConfig({
                visible: true,
                title: 'Missing Information',
                message: 'Please select at least one day for the schedule.',
                type: 'warning'
            });
            return;
        }

        try {
            // Ensure we have permissions
            await requestNotificationPermissions();

            // Get the peptide name and dosage for the schedule
            const peptideObj = userPeptides.find((p: any) => p.id === selectedPeptide);
            const peptideLabel = peptideObj ? `${peptideObj.name} ${peptideObj.dosage || ''}`.trim() : selectedPeptide;

            // Ensure daysOfWeek is always an array of numbers
            const daysOfWeekToSave = scheduleFrequency === 'daily'
                ? [0, 1, 2, 3, 4, 5, 6]
                : scheduleDays.map(d => typeof d === 'number' ? d : parseInt(String(d), 10)).filter(d => !isNaN(d));

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/97cb0a92-ea5f-4b1f-85a3-1112c7246f5a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'calendar.tsx:420', message: 'before saveSchedule', data: { peptideLabel, scheduleAmount, scheduleFrequency, daysOfWeekToSave, scheduleDays, scheduleTime }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
            // #endregion

            const savedSchedules = await saveSchedule({
                peptide: peptideLabel,
                amount: scheduleAmount,
                frequency: scheduleFrequency,
                daysOfWeek: daysOfWeekToSave,
                time: scheduleTime,
                enabled: true,
            });

            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/97cb0a92-ea5f-4b1f-85a3-1112c7246f5a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'calendar.tsx:387', message: 'after saveSchedule', data: { savedSchedulesCount: savedSchedules.length, lastSchedule: savedSchedules[savedSchedules.length - 1] }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
            // #endregion

            // Sync notifications for the new schedule
            await syncAllNotifications();

            // Play add sound
            playAdd();

            // Reset form and close modal
            setSelectedPeptide('');
            setScheduleAmount('');
            setScheduleFrequency('weekly');
            setScheduleDays([1]);
            setScheduleTime('09:00');
            const d = new Date();
            d.setHours(9, 0, 0, 0);
            setPickerDate(d);
            setShowScheduleModal(false);

            // Reload data - load schedules first to ensure they're available
            await loadSchedules();
            // Small delay to ensure schedules are set in state before loading events
            await new Promise(resolve => setTimeout(resolve, 100));
            await loadEvents();

            console.log('[Schedule] Successfully saved schedule');
            setAlertConfig({ visible: true, title: 'Success', message: 'Schedule created! You will be notified at the scheduled time.', type: 'success' });
        } catch (e) {
            console.error('Error saving schedule:', e);
            setAlertConfig({ visible: true, title: 'Error', message: 'Failed to save schedule. Please try again.', type: 'error' });
        }
    };

    const toggleDay = (day: number) => {
        if (scheduleDays.includes(day)) {
            setScheduleDays(scheduleDays.filter(d => d !== day));
        } else {
            setScheduleDays([...scheduleDays, day].sort());
        }
    };

    const openScheduleModal = () => {
        // Pre-select first peptide if available
        if (userPeptides.length > 0 && !selectedPeptide) {
            setSelectedPeptide(userPeptides[0].id);
        }
        setShowScheduleModal(true);
    };

    const renderCalendarGrid = () => {
        const grid = [];

        // Calculate how many rows are actually needed
        // Formula: (firstDay + days) / 7, rounded up
        const totalCellsNeeded = firstDay + days;
        const rowsNeeded = Math.ceil(totalCellsNeeded / 7);
        const totalSlotsNeeded = rowsNeeded * 7;

        // Empty slots for days before start of month
        for (let i = 0; i < firstDay; i++) {
            grid.push(<View key={`empty-prev-${i}`} style={styles.dayCell} />);
        }

        // Days of the month
        for (let i = 1; i <= days; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const isSelected = date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear(); // Ensure year matches
            // CRITICAL: Use local date string, not UTC (toISOString converts to UTC which shifts the date)
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const dayEvents = eventsMap[dateStr] || [];
            const hasEvent = dayEvents.length > 0;

            // Check if this day is in the past
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPast = date < today;

            // Check if all events for this day are completed (for past/today)
            const allCompleted = dayEvents.length > 0 && dayEvents.every((e: any) => e.completed);
            const hasPendingScheduled = dayEvents.some((e: any) => e.isScheduled && !e.completed);
            const hasMissedScheduled = isPast && dayEvents.some((e: any) => e.isScheduled && !e.completed);

            // Determine dot style:
            // - Missed scheduled (past day with uncompleted scheduled) → red/warning
            // - All completed (past or today) → green success
            // - Today/Future with pending scheduled → vibrant violet
            // - Past with only logged doses (no schedule) → faded gray
            let dotStyle;
            if (hasMissedScheduled) {
                dotStyle = { backgroundColor: '#F87171', opacity: 0.8 }; // Soft red for missed
            } else if (allCompleted) {
                dotStyle = { backgroundColor: Colors.success, opacity: isPast ? 0.6 : 1 }; // Green for completed (faded if past)
            } else if (isPast) {
                dotStyle = { backgroundColor: isDark ? Colors.gray[600] : Colors.gray[400], opacity: 0.5 };
            } else if (hasPendingScheduled) {
                dotStyle = { backgroundColor: Colors.primary };
            } else {
                dotStyle = { backgroundColor: Colors.success };
            }

            grid.push(
                <SoundButton
                    key={i}
                    style={[styles.dayCell, isSelected && styles.selectedDay]}
                    onPress={() => setSelectedDate(date)}
                >
                    <StyledText variant="medium" style={[styles.dayText, { color: isDark ? Colors.gray[300] : Colors.gray[700] }, isSelected && styles.selectedDayText]}>{i}</StyledText>
                    {hasEvent && <View style={[styles.eventDot, dotStyle, isSelected && { backgroundColor: Colors.white, opacity: 1 }]} />}
                </SoundButton>
            );
        }

        // Only fill remaining slots to complete the last row (no extra empty rows)
        const filledSlots = grid.length;
        const remainingSlots = totalSlotsNeeded - filledSlots;
        for (let i = 0; i < remainingSlots; i++) {
            grid.push(<View key={`empty-next-${i}`} style={styles.dayCell} />);
        }

        return grid;
    };

    const SoftBlob = ({ color, style }: { color: string, style: any }) => (
        <View style={[styles.blob, { backgroundColor: color }, style]} />
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
            {/* Background Ambience */}
            <SoftBlob color={isDark ? "#1E1B4B" : "#EDE9FE"} style={{ top: -100, left: -100, width: 400, height: 400 }} />
            <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ top: 100, right: -150, width: 350, height: 350 }} />
            <SoftBlob color={isDark ? "#3730A3" : "#F3E8FF"} style={{ bottom: 0, left: -50, width: 300, height: 300 }} />


            {/* Static Header */}
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: insets.top + 4,
                        backgroundColor: 'transparent',
                    }
                ]}
            >
                <SoundButton onPress={() => router.back()} activeOpacity={0.7}>
                    <StyledText variant="bold" style={[styles.screenTitle, { color: isDark ? Colors.gray[100] : Colors.gray[900] }]}>Schedule</StyledText>
                    <StyledText variant="medium" style={[styles.screenSubtitle, { color: isDark ? Colors.gray[400] : Colors.gray[500] }]}>Manage your protocol</StyledText>
                </SoundButton>
                <SoundButton style={[styles.todayButton, isDark ? { backgroundColor: Colors.gray[800] } : { backgroundColor: Colors.white }]} onPress={() => {
                    const now = new Date();
                    setSelectedDate(now);
                    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                }}>
                    <CalendarIcon size={16} color={isDark ? Colors.dark.tint : Colors.primary} />
                    <StyledText variant="bold" style={[styles.todayText, { color: isDark ? Colors.dark.tint : Colors.primary }]}>Today</StyledText>
                </SoundButton>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: 20 }]}
                showsVerticalScrollIndicator={false}
            >

                {/* Calendar Card */}
                <GlowCard variant="surface" style={[styles.calendarCard, isDark && { backgroundColor: cardBg }]}>
                    {/* Month Navigation */}
                    <View style={styles.monthHeader}>
                        <SoundButton onPress={handlePrevMonth} style={styles.navButton}>
                            <ChevronLeft size={20} color={subtitleColor} />
                        </SoundButton>
                        <SoundButton onPress={() => setIsMonthPickerVisible(true)}>
                            <StyledText variant="bold" style={[styles.monthTitle, { color: textColor }]}>
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </StyledText>
                        </SoundButton>
                        <SoundButton onPress={handleNextMonth} style={styles.navButton}>
                            <ChevronRight size={20} color={subtitleColor} />
                        </SoundButton>
                    </View>

                    {/* Week Days Header */}
                    <View style={styles.weekRow}>
                        {WEEK_DAYS.map(day => (
                            <StyledText key={day} variant="medium" style={[styles.weekDayText, { color: isDark ? Colors.gray[400] : Colors.gray[500] }]}>{day}</StyledText>
                        ))}
                    </View>

                    {/* Days Grid */}
                    <View style={styles.daysGrid}>
                        {renderCalendarGrid()}
                    </View>

                    {/* Color Legend Toggle */}
                    <SoundButton
                        style={styles.legendToggle}
                        onPress={() => setShowLegend(!showLegend)}
                    >
                        <View style={styles.legendToggleContent}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                            <View style={[styles.legendDot, { backgroundColor: '#F87171' }]} />
                            <View style={[styles.legendDot, { backgroundColor: isDark ? Colors.gray[600] : Colors.gray[400] }]} />
                            <ChevronDown size={14} color={isDark ? Colors.gray[400] : Colors.gray[500]} style={{ marginLeft: 4, transform: [{ rotate: showLegend ? '180deg' : '0deg' }] }} />
                        </View>
                    </SoundButton>

                    {/* Color Legend Content */}
                    {showLegend && (
                        <Animated.View entering={FadeIn.duration(200)} style={[styles.legendContent, { backgroundColor: isDark ? Colors.gray[800] : Colors.gray[100] }]}>
                            <View style={styles.legendRow}>
                                <View style={[styles.legendDotLarge, { backgroundColor: Colors.primary }]} />
                                <StyledText variant="regular" style={{ color: isDark ? Colors.gray[300] : Colors.gray[600], fontSize: 12 }}>Upcoming</StyledText>
                            </View>
                            <View style={styles.legendRow}>
                                <View style={[styles.legendDotLarge, { backgroundColor: Colors.success }]} />
                                <StyledText variant="regular" style={{ color: isDark ? Colors.gray[300] : Colors.gray[600], fontSize: 12 }}>Completed</StyledText>
                            </View>
                            <View style={styles.legendRow}>
                                <View style={[styles.legendDotLarge, { backgroundColor: '#F87171' }]} />
                                <StyledText variant="regular" style={{ color: isDark ? Colors.gray[300] : Colors.gray[600], fontSize: 12 }}>Missed</StyledText>
                            </View>
                            <View style={styles.legendRow}>
                                <View style={[styles.legendDotLarge, { backgroundColor: isDark ? Colors.gray[600] : Colors.gray[400], opacity: 0.5 }]} />
                                <StyledText variant="regular" style={{ color: isDark ? Colors.gray[300] : Colors.gray[600], fontSize: 12 }}>Logged</StyledText>
                            </View>
                        </Animated.View>
                    )}
                </GlowCard>

                {/* Selected Date Header */}
                <View style={styles.scheduleHeader}>
                    <StyledText variant="bold" style={[styles.scheduleTitle, { color: textColor }]}>
                        {selectedDate.getDate() === new Date().getDate() ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </StyledText>
                    <View style={[styles.eventCount, isDark && { backgroundColor: cardBg, borderColor: Colors.dark.tint }]}>
                        <StyledText variant="bold" style={styles.eventCountText}>{events.length} Dose{events.length !== 1 ? 's' : ''}</StyledText>
                    </View>
                </View>

                {/* Events List */}
                <View style={styles.eventsList}>
                    {events.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Clock size={40} color={subtitleColor} />
                            <StyledText variant="medium" style={[styles.emptyText, { color: subtitleColor }]}>No doses scheduled</StyledText>
                        </View>
                    ) : (
                        events.map((event, index) => (
                            <Animated.View key={event.id} entering={FadeIn.delay(index * 100)} style={styles.eventCardContainer}>
                                {/* iOS-style delete button on top-left corner */}
                                {!event.completed && event.isScheduled && (
                                    <SoundButton
                                        style={styles.cornerDeleteButton}
                                        onPress={() => handleDeleteSchedule(event.scheduleId)}
                                    >
                                        <Ionicons name="close" size={14} color={Colors.white} />
                                    </SoundButton>
                                )}

                                <GlowCard variant="surface" style={[styles.eventCard, { backgroundColor: cardBg }]}>
                                    <View style={[styles.timeBox, { backgroundColor: isDark ? Colors.dark.tint + '20' : Colors.primary + '15' }]}>
                                        <StyledText variant="bold" style={[styles.timeText, { color: isDark ? Colors.dark.tint : Colors.primary }]}>
                                            {event.isScheduled ? formatTimeDisplay(event.time) : event.time}
                                        </StyledText>
                                    </View>

                                    <View style={styles.eventInfo}>
                                        <StyledText variant="semibold" style={[styles.peptideName, { color: textColor }]}>{event.peptide}</StyledText>
                                        <StyledText variant="regular" style={[styles.doseAmount, { color: subtitleColor }]}>{event.amount} • Injection</StyledText>
                                    </View>

                                    {event.completed ? (
                                        <View style={styles.statusBadge}>
                                            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                                        </View>
                                    ) : (
                                        // Only show Log button for today or past dates
                                        selectedDate <= new Date(new Date().setHours(23, 59, 59, 999)) ? (
                                            <SoundButton
                                                style={styles.actionButton}
                                                onPress={() => router.push({
                                                    pathname: '/log-dose',
                                                    params: { peptide: event.peptide, amount: event.amount }
                                                })}
                                            >
                                                <StyledText variant="bold" style={styles.actionText}>Log</StyledText>
                                            </SoundButton>
                                        ) : (
                                            <View style={[styles.actionButton, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]}>
                                                <StyledText variant="bold" style={[styles.actionText, { color: isDark ? Colors.gray[500] : Colors.gray[400] }]}>Scheduled</StyledText>
                                            </View>
                                        )
                                    )}
                                </GlowCard>
                            </Animated.View>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Simple Month Picker Modal placeholder */}
            <Modal visible={isMonthPickerVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <StyledText variant="bold" style={styles.modalTitle}>Select Month</StyledText>
                            <SoundButton onPress={() => setIsMonthPickerVisible(false)}>
                                <X size={24} color={Colors.gray[500]} />
                            </SoundButton>
                        </View>
                        <StyledText variant="regular" style={styles.placeholderText}>Month picker implementation coming soon...</StyledText>
                    </View>
                </View>
            </Modal>



            {/* Delete Schedule Confirmation Modal */}
            <AlertModal
                visible={confirmDeleteVisible}
                title="Delete Schedule"
                message="Are you sure you want to delete this schedule? Future reminders will be removed."
                type="warning"
                buttons={[
                    { text: 'Cancel', style: 'cancel', onPress: () => setConfirmDeleteVisible(false) },
                    { text: 'Delete', style: 'destructive', onPress: confirmDeleteSchedule },
                ]}
                onClose={() => setConfirmDeleteVisible(false)}
            />

            {/* Error Alert Modal */}
            <AlertModal
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            />

            {/* Schedule Creation Modal */}
            <Modal visible={showScheduleModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%', backgroundColor: isDark ? Colors.gray[900] : Colors.white }]}>
                        <View style={styles.modalHeader}>
                            <StyledText variant="bold" style={[styles.modalTitle, { color: isDark ? Colors.gray[100] : Colors.gray[900] }]}>New Schedule</StyledText>
                            <SoundButton onPress={() => setShowScheduleModal(false)}>
                                <X size={24} color={isDark ? Colors.gray[400] : Colors.gray[500]} />
                            </SoundButton>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                            {/* Peptide Selection */}
                            <StyledText variant="semibold" style={[styles.formLabel, { color: isDark ? Colors.gray[300] : Colors.gray[700] }]}>Peptide</StyledText>
                            <SoundButton
                                style={[styles.pickerButton, { backgroundColor: isDark ? Colors.gray[800] : Colors.gray[100] }]}
                                onPress={() => {
                                    setPickerSearchQuery('');
                                    setShowPeptidePicker(true);
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={[styles.pickerIconBox, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#E0E7FF' }]}>
                                        {(() => {
                                            const p = userPeptides.find(up => up.id === selectedPeptide);
                                            const IconComp = getPeptideIcon(p);
                                            const pColor = p ? getPeptideColor(p, 0) : (isDark ? Colors.dark.tint : Colors.primary);
                                            return <IconComp size={20} color={pColor} />;
                                        })()}
                                    </View>
                                    <StyledText variant="medium" style={[
                                        styles.pickerText,
                                        { color: isDark ? Colors.gray[100] : Colors.gray[900] },
                                        !selectedPeptide && { color: isDark ? Colors.gray[500] : Colors.gray[400] }
                                    ]}>
                                        {(() => {
                                            const p = userPeptides.find(up => up.id === selectedPeptide);
                                            if (!p) return 'Select Peptide';
                                            return `${p.name}${p.dosage ? ` ${p.dosage}` : ''}`;
                                        })()}
                                    </StyledText>
                                </View>
                                <ChevronDown size={20} color={isDark ? Colors.gray[400] : Colors.gray[500]} />
                            </SoundButton>

                            {/* Dosage */}
                            <StyledText variant="semibold" style={[styles.formLabel, { color: isDark ? Colors.gray[300] : Colors.gray[700] }]}>Dosage</StyledText>
                            <TextInput
                                style={[styles.formInput, { backgroundColor: isDark ? Colors.gray[800] : Colors.gray[100], color: isDark ? Colors.gray[100] : Colors.gray[900] }]}
                                placeholder="e.g. 5"
                                placeholderTextColor={isDark ? Colors.gray[500] : Colors.gray[400]}
                                value={scheduleAmount}
                                keyboardType="decimal-pad"
                                onChangeText={(text) => setScheduleAmount(text.replace(/[^0-9.]/g, ''))}
                            />

                            {/* Frequency */}
                            <StyledText variant="semibold" style={[styles.formLabel, { color: isDark ? Colors.gray[300] : Colors.gray[700] }]}>Frequency</StyledText>
                            <View style={styles.frequencyOptions}>
                                {FREQUENCIES.map(f => (
                                    <SoundButton
                                        key={f.id}
                                        style={[styles.frequencyChip, { backgroundColor: isDark ? Colors.gray[800] : Colors.gray[100] }, scheduleFrequency === f.id && styles.frequencyChipActive]}
                                        onPress={() => setScheduleFrequency(f.id as any)}
                                    >
                                        <StyledText variant="medium" style={[styles.frequencyChipText, { color: isDark ? Colors.gray[300] : Colors.gray[700] }, scheduleFrequency === f.id && styles.frequencyChipTextActive]}>
                                            {f.label}
                                        </StyledText>
                                    </SoundButton>
                                ))}
                            </View>

                            {/* Days of Week (for weekly/biweekly) */}
                            {scheduleFrequency !== 'daily' && (
                                <>
                                    <StyledText variant="semibold" style={[styles.formLabel, { color: isDark ? Colors.gray[300] : Colors.gray[700] }]}>Days</StyledText>
                                    <View style={styles.daysRow}>
                                        {WEEK_DAYS.map((day, idx) => (
                                            <SoundButton
                                                key={day}
                                                style={[styles.dayButton, { backgroundColor: isDark ? Colors.gray[800] : Colors.gray[100] }, scheduleDays.includes(idx) && styles.dayButtonActive]}
                                                onPress={() => toggleDay(idx)}
                                            >
                                                <StyledText variant="medium" style={[styles.dayButtonText, { color: isDark ? Colors.gray[400] : Colors.gray[600] }, scheduleDays.includes(idx) && styles.dayButtonTextActive]}>
                                                    {day.charAt(0)}
                                                </StyledText>
                                            </SoundButton>
                                        ))}
                                    </View>
                                </>
                            )}

                            {/* Time Input (Seamless Trigger) */}
                            <StyledText variant="semibold" style={[styles.formLabel, { color: isDark ? Colors.gray[300] : Colors.gray[700] }]}>Time</StyledText>
                            <SoundButton
                                activeOpacity={0.7}
                                onPress={() => {
                                    // Sync web input state with current picker date
                                    let h = pickerDate.getHours() % 12;
                                    h = h === 0 ? 12 : h;
                                    setWebHourInput(h.toString().padStart(2, '0'));
                                    setWebMinuteInput(pickerDate.getMinutes().toString().padStart(2, '0'));
                                    setShowTimer(true);
                                }}
                            >
                                <View style={[styles.seamlessTimeContainer, { backgroundColor: isDark ? Colors.gray[800] : Colors.gray[100] }]}>

                                    {/* Time Display */}
                                    <View style={styles.timeInputGroup}>
                                        <StyledText style={[styles.timeDisplay, { color: isDark ? Colors.gray[100] : Colors.gray[900] }]}>
                                            {(() => {
                                                let h = pickerDate.getHours();
                                                h = h % 12;
                                                h = h ? h : 12;
                                                return h.toString().padStart(2, '0');
                                            })()}
                                        </StyledText>
                                        <StyledText style={[styles.timeSeparator, { color: isDark ? Colors.gray[400] : Colors.gray[400] }]}>:</StyledText>
                                        <StyledText style={[styles.timeDisplay, { color: isDark ? Colors.gray[100] : Colors.gray[900] }]}>
                                            {pickerDate.getMinutes().toString().padStart(2, '0')}
                                        </StyledText>
                                    </View>

                                    {/* AM/PM Display */}
                                    <View style={[styles.amPmSegment, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] }]}>
                                        <View style={[styles.amPmOption, pickerDate.getHours() < 12 && styles.amPmOptionActive]}>
                                            <StyledText variant="bold" style={[styles.amPmText, { color: isDark ? Colors.gray[400] : Colors.gray[500] }, pickerDate.getHours() < 12 && styles.amPmTextActive]}>AM</StyledText>
                                        </View>
                                        <View style={[styles.amPmOption, pickerDate.getHours() >= 12 && styles.amPmOptionActive]}>
                                            <StyledText variant="bold" style={[styles.amPmText, { color: isDark ? Colors.gray[400] : Colors.gray[500] }, pickerDate.getHours() >= 12 && styles.amPmTextActive]}>PM</StyledText>
                                        </View>
                                    </View>
                                </View>
                            </SoundButton>

                        </ScrollView>

                        {/* Save Button */}
                        <SoundButton
                            style={[styles.saveButton, (!selectedPeptide || !scheduleAmount) && { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[300] }]}
                            onPress={handleSaveSchedule}
                            disabled={!selectedPeptide || !scheduleAmount}
                        >
                            <StyledText variant="bold" style={[styles.saveButtonText, (!selectedPeptide || !scheduleAmount) && { color: isDark ? Colors.gray[500] : Colors.gray[400] }]}>Save Schedule</StyledText>
                        </SoundButton>
                    </View>

                    {/* FAKE MODAL OVERLAY FOR PICKER (Inside existing Modal) */}
                    {showTimer && Platform.OS === 'ios' && (
                        <SoundButton
                            style={[styles.modalOverlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }]}
                            activeOpacity={1}
                            onPress={() => setShowTimer(false)}
                        >
                            <SoundButton activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                                <View style={styles.pickerModalContent}>
                                    <StyledText variant="bold" style={[styles.modalTitle, { textAlign: 'center', marginBottom: 8 }]}>Select Time</StyledText>
                                    <DateTimePicker
                                        value={pickerDate}
                                        mode="time"
                                        display="spinner"
                                        locale="en_US"
                                        textColor="black"
                                        onChange={(event, date) => {
                                            if (date) {
                                                setPickerDate(date);
                                                const h = date.getHours().toString().padStart(2, '0');
                                                const m = date.getMinutes().toString().padStart(2, '0');
                                                setScheduleTime(`${h}:${m}`);
                                            }
                                        }}
                                        style={{ height: 216, width: 320 }} // Fixed recommended size for iOS spinner
                                    />
                                    <StyledText variant="regular" style={[styles.webPickerHint, { color: Colors.gray[400] }]}>Tap outside to close</StyledText>
                                </View>
                            </SoundButton>
                        </SoundButton>
                    )}

                    {/* Peptide Picker Overlay (Inside Modal) */}
                    {showPeptidePicker && (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={[styles.modalOverlay, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }]}
                        >
                            <SoundButton
                                style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}
                                activeOpacity={1}
                                onPress={() => setShowPeptidePicker(false)}
                            >
                                <SoundButton activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ width: '100%' }}>
                                    <View style={[styles.peptidePickerContent, { backgroundColor: isDark ? Colors.gray[900] : Colors.white, paddingBottom: insets.bottom + 24 }]}>
                                        <View style={styles.modalHeader}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                <LinearGradient
                                                    colors={Colors.gradients.primary}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    style={styles.pickerIconBox}
                                                >
                                                    <FlaskConical size={20} color="#FFF" />
                                                </LinearGradient>
                                                <StyledText variant="bold" style={[styles.modalTitle, { color: isDark ? Colors.gray[100] : Colors.gray[900] }]}>Select Peptide</StyledText>
                                            </View>
                                            <SoundButton onPress={() => setShowPeptidePicker(false)}>
                                                <X size={24} color={isDark ? Colors.gray[400] : Colors.gray[500]} />
                                            </SoundButton>
                                        </View>

                                        {/* Search Bar */}
                                        <View style={[styles.pickerSearchContainer, { backgroundColor: isDark ? Colors.gray[800] : Colors.gray[100] }]}>
                                            <Search size={20} color={isDark ? Colors.gray[400] : Colors.gray[500]} />
                                            <TextInput
                                                style={[styles.pickerSearchInput, { color: isDark ? Colors.gray[100] : Colors.gray[900] }]}
                                                placeholder="Search your stack..."
                                                placeholderTextColor={isDark ? Colors.gray[500] : Colors.gray[400]}
                                                value={pickerSearchQuery}
                                                onChangeText={setPickerSearchQuery}
                                            />
                                        </View>

                                        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                                            <View style={styles.pickerList}>
                                                {userPeptides
                                                    .filter(p => p.name.toLowerCase().includes(pickerSearchQuery.toLowerCase()))
                                                    .map((p: any, index: number) => {
                                                        const isSelected = selectedPeptide === p.id;
                                                        const config = p.category && CATEGORY_CONFIG[p.category] ? CATEGORY_CONFIG[p.category] : DEFAULT_CONFIG;
                                                        const IconComp = getPeptideIcon(p);
                                                        return (
                                                            <SoundButton
                                                                key={p.id}
                                                                style={[
                                                                    styles.pickerItem,
                                                                    { borderBottomColor: isDark ? Colors.gray[800] : Colors.gray[100] },
                                                                    isSelected && { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : '#F5F3FF' }
                                                                ]}
                                                                onPress={() => {
                                                                    setSelectedPeptide(p.id);
                                                                }}
                                                            >
                                                                <View style={styles.pickerItemContent}>
                                                                    <LinearGradient
                                                                        colors={config.gradient}
                                                                        start={{ x: 0, y: 0 }}
                                                                        end={{ x: 1, y: 1 }}
                                                                        style={styles.pickerItemIcon}
                                                                    >
                                                                        <IconComp size={18} color="#FFF" />
                                                                    </LinearGradient>
                                                                    <View style={{ flex: 1 }}>
                                                                        <StyledText variant="bold" style={[styles.pickerItemName, { color: isDark ? Colors.gray[100] : Colors.gray[900] }]} numberOfLines={1}>
                                                                            {p.name}
                                                                        </StyledText>
                                                                        {p.dosage && (
                                                                            <StyledText variant="medium" style={[styles.pickerItemDosage, { color: isDark ? Colors.gray[400] : Colors.gray[500] }]}>
                                                                                {p.dosage}
                                                                            </StyledText>
                                                                        )}
                                                                    </View>
                                                                    {isSelected && (
                                                                        <SoundButton
                                                                            onPress={() => setShowPeptidePicker(false)}
                                                                            style={[styles.pickerConfirmButton, { backgroundColor: Colors.primary }]}
                                                                        >
                                                                            <Plus size={18} color="#FFF" />
                                                                        </SoundButton>
                                                                    )}
                                                                </View>
                                                            </SoundButton>
                                                        );
                                                    })}
                                            </View>
                                        </ScrollView>
                                    </View>
                                </SoundButton>
                            </SoundButton>
                        </KeyboardAvoidingView>
                    )}
                </View>
            </Modal>

            {/* Android Picker (Native) */}
            {
                showTimer && Platform.OS === 'android' && (
                    <DateTimePicker
                        value={pickerDate}
                        mode="time"
                        display="spinner"
                        is24Hour={false}
                        onChange={(event, date) => {
                            setShowTimer(false);
                            if (date) {
                                setPickerDate(date);
                                const h = date.getHours().toString().padStart(2, '0');
                                const m = date.getMinutes().toString().padStart(2, '0');
                                setScheduleTime(`${h}:${m}`);
                            }
                        }}
                    />
                )
            }

            {/* Web Time Picker Modal */}
            {
                showTimer && Platform.OS === 'web' && (
                    <Modal visible={showTimer} transparent animationType="fade">
                        <SoundButton
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setShowTimer(false)}
                        >
                            <SoundButton
                                activeOpacity={1}
                                onPress={(e) => e.stopPropagation()}
                            >
                                <View style={[styles.pickerModalContent, { backgroundColor: cardBg }]}>
                                    <StyledText variant="bold" style={[styles.modalTitle, { textAlign: 'center', marginBottom: 8, color: textColor }]}>Select Time</StyledText>

                                    {/* Web Time Picker Controls */}
                                    <View style={styles.webTimePickerContainer}>
                                        {/* Hour Picker */}
                                        <View style={styles.webPickerColumn}>
                                            <SoundButton
                                                style={styles.webPickerArrow}
                                                onPress={() => {
                                                    const newDate = new Date(pickerDate);
                                                    let h = newDate.getHours();
                                                    h = (h + 1) % 24;
                                                    newDate.setHours(h);
                                                    setPickerDate(newDate);
                                                    // Update text input state
                                                    let displayH = h % 12;
                                                    displayH = displayH === 0 ? 12 : displayH;
                                                    setWebHourInput(displayH.toString().padStart(2, '0'));
                                                    const hStr = h.toString().padStart(2, '0');
                                                    const mStr = newDate.getMinutes().toString().padStart(2, '0');
                                                    setScheduleTime(`${hStr}:${mStr}`);
                                                }}
                                            >
                                                <Ionicons name="chevron-up" size={24} color={Colors.gray[500]} />
                                            </SoundButton>
                                            <TextInput
                                                style={[styles.webPickerInput, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100], color: textColor }]}
                                                keyboardType="number-pad"
                                                maxLength={2}
                                                value={webHourInput}
                                                onChangeText={(text) => {
                                                    // Allow free typing - only allow numbers
                                                    setWebHourInput(text.replace(/[^0-9]/g, ''));
                                                }}
                                                onBlur={() => {
                                                    // Validate and apply on blur
                                                    const val = parseInt(webHourInput) || 0;
                                                    let validHour = val;
                                                    if (val < 1 || val > 12) {
                                                        // Reset to current value
                                                        let h = pickerDate.getHours() % 12;
                                                        validHour = h === 0 ? 12 : h;
                                                    } else {
                                                        // Apply the new hour
                                                        const newDate = new Date(pickerDate);
                                                        const isPM = newDate.getHours() >= 12;
                                                        let newHour = val === 12 ? 0 : val;
                                                        if (isPM) newHour += 12;
                                                        newDate.setHours(newHour);
                                                        setPickerDate(newDate);
                                                        const hStr = newHour.toString().padStart(2, '0');
                                                        const mStr = newDate.getMinutes().toString().padStart(2, '0');
                                                        setScheduleTime(`${hStr}:${mStr}`);
                                                    }
                                                    setWebHourInput(validHour.toString().padStart(2, '0'));
                                                }}
                                                onFocus={() => {
                                                    // Select all text on focus for easy replacement
                                                    setWebHourInput('');
                                                }}
                                            />
                                            <SoundButton
                                                style={styles.webPickerArrow}
                                                onPress={() => {
                                                    const newDate = new Date(pickerDate);
                                                    let h = newDate.getHours();
                                                    h = (h - 1 + 24) % 24;
                                                    newDate.setHours(h);
                                                    setPickerDate(newDate);
                                                    // Update text input state
                                                    let displayH = h % 12;
                                                    displayH = displayH === 0 ? 12 : displayH;
                                                    setWebHourInput(displayH.toString().padStart(2, '0'));
                                                    const hStr = h.toString().padStart(2, '0');
                                                    const mStr = newDate.getMinutes().toString().padStart(2, '0');
                                                    setScheduleTime(`${hStr}:${mStr}`);
                                                }}
                                            >
                                                <Ionicons name="chevron-down" size={24} color={Colors.gray[500]} />
                                            </SoundButton>
                                        </View>

                                        <StyledText style={styles.webPickerSeparator}>:</StyledText>

                                        {/* Minute Picker */}
                                        <View style={styles.webPickerColumn}>
                                            <SoundButton
                                                style={styles.webPickerArrow}
                                                onPress={() => {
                                                    const newDate = new Date(pickerDate);
                                                    let m = newDate.getMinutes();
                                                    m = (m + 1) % 60;
                                                    newDate.setMinutes(m);
                                                    setPickerDate(newDate);
                                                    setWebMinuteInput(m.toString().padStart(2, '0'));
                                                    const hStr = newDate.getHours().toString().padStart(2, '0');
                                                    const mStr = m.toString().padStart(2, '0');
                                                    setScheduleTime(`${hStr}:${mStr}`);
                                                }}
                                            >
                                                <Ionicons name="chevron-up" size={24} color={Colors.gray[500]} />
                                            </SoundButton>
                                            <TextInput
                                                style={[styles.webPickerInput, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100], color: textColor }]}
                                                keyboardType="number-pad"
                                                maxLength={2}
                                                value={webMinuteInput}
                                                onChangeText={(text) => {
                                                    // Allow free typing - only allow numbers
                                                    setWebMinuteInput(text.replace(/[^0-9]/g, ''));
                                                }}
                                                onBlur={() => {
                                                    // Validate and apply on blur
                                                    const val = parseInt(webMinuteInput);
                                                    if (isNaN(val) || val < 0) {
                                                        // Invalid input, reset to current value
                                                        const currentMinute = pickerDate.getMinutes();
                                                        setWebMinuteInput(currentMinute.toString().padStart(2, '0'));
                                                    } else {
                                                        // Handle overflow: 70 mins = 1 hour 10 mins
                                                        const extraHours = Math.floor(val / 60);
                                                        const validMinute = val % 60;

                                                        const newDate = new Date(pickerDate);
                                                        if (extraHours > 0) {
                                                            // Add extra hours from minute overflow
                                                            let h = newDate.getHours();
                                                            h = (h + extraHours) % 24;
                                                            newDate.setHours(h);
                                                            // Update hour display
                                                            let displayH = h % 12;
                                                            displayH = displayH === 0 ? 12 : displayH;
                                                            setWebHourInput(displayH.toString().padStart(2, '0'));
                                                        }
                                                        newDate.setMinutes(validMinute);
                                                        setPickerDate(newDate);
                                                        setWebMinuteInput(validMinute.toString().padStart(2, '0'));
                                                        const hStr = newDate.getHours().toString().padStart(2, '0');
                                                        const mStr = validMinute.toString().padStart(2, '0');
                                                        setScheduleTime(`${hStr}:${mStr}`);
                                                    }
                                                }}
                                                onFocus={() => {
                                                    // Clear text on focus for easy typing
                                                    setWebMinuteInput('');
                                                }}
                                            />
                                            <SoundButton
                                                style={styles.webPickerArrow}
                                                onPress={() => {
                                                    const newDate = new Date(pickerDate);
                                                    let m = newDate.getMinutes();
                                                    m = (m - 1 + 60) % 60;
                                                    newDate.setMinutes(m);
                                                    setPickerDate(newDate);
                                                    setWebMinuteInput(m.toString().padStart(2, '0'));
                                                    const hStr = newDate.getHours().toString().padStart(2, '0');
                                                    const mStr = m.toString().padStart(2, '0');
                                                    setScheduleTime(`${hStr}:${mStr}`);
                                                }}
                                            >
                                                <Ionicons name="chevron-down" size={24} color={Colors.gray[500]} />
                                            </SoundButton>
                                        </View>

                                        {/* AM/PM Picker */}
                                        <View style={[styles.webAmPmContainer, { backgroundColor: isDark ? Colors.gray[700] : Colors.white, borderRadius: 12, padding: 4 }]}>
                                            <SoundButton
                                                style={[styles.webAmPmButton, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }, pickerDate.getHours() < 12 && styles.webAmPmButtonActive]}
                                                onPress={() => {
                                                    const newDate = new Date(pickerDate);
                                                    let h = newDate.getHours();
                                                    if (h >= 12) {
                                                        h = h - 12;
                                                        newDate.setHours(h);
                                                        setPickerDate(newDate);
                                                        const hStr = h.toString().padStart(2, '0');
                                                        const mStr = newDate.getMinutes().toString().padStart(2, '0');
                                                        setScheduleTime(`${hStr}:${mStr}`);
                                                    }
                                                }}
                                            >
                                                <StyledText variant="bold" style={[styles.webAmPmText, pickerDate.getHours() < 12 && styles.webAmPmTextActive]}>AM</StyledText>
                                            </SoundButton>
                                            <SoundButton
                                                style={[styles.webAmPmButton, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }, pickerDate.getHours() >= 12 && styles.webAmPmButtonActive]}
                                                onPress={() => {
                                                    const newDate = new Date(pickerDate);
                                                    let h = newDate.getHours();
                                                    if (h < 12) {
                                                        h = h + 12;
                                                        newDate.setHours(h);
                                                        setPickerDate(newDate);
                                                        const hStr = h.toString().padStart(2, '0');
                                                        const mStr = newDate.getMinutes().toString().padStart(2, '0');
                                                        setScheduleTime(`${hStr}:${mStr}`);
                                                    }
                                                }}
                                            >
                                                <StyledText variant="bold" style={[styles.webAmPmText, pickerDate.getHours() >= 12 && styles.webAmPmTextActive]}>PM</StyledText>
                                            </SoundButton>
                                        </View>
                                    </View>

                                    {/* Manual Input Hint */}
                                    <StyledText variant="regular" style={[styles.webPickerHint, { color: subtitleColor }]}>Tap outside to close</StyledText>
                                </View>
                            </SoundButton>
                        </SoundButton>
                    </Modal>
                )
            }

            {/* FAB Button - subtle by default, visible on tap */}
            <Animated.View style={[styles.fab, fabAnimatedStyle]}>
                <SoundButton
                    style={styles.fabInner}
                    onPress={openScheduleModal}
                    onPressIn={handleFabPressIn}
                    onPressOut={handleFabPressOut}
                >
                    <Plus size={28} color={Colors.white} />
                </SoundButton>
            </Animated.View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Layout.spacing.lg,
        paddingBottom: 16,
    },
    screenTitle: {
        fontSize: 32,
        color: Colors.gray[900],
    },
    screenSubtitle: {
        fontSize: 16,
        color: Colors.gray[500],
    },
    todayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        ...Layout.shadows.small,
    },
    todayText: {
        color: Colors.primary,
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: Layout.spacing.lg,
    },
    calendarCard: {
        padding: Layout.spacing.lg,
        marginBottom: Layout.spacing.xl,
    },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.lg,
    },
    monthTitle: {
        fontSize: 18,
        color: Colors.gray[900],
    },
    navButton: {
        padding: 8,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekDayText: {
        width: 32,
        textAlign: 'center',
        color: Colors.gray[400],
        fontSize: 12,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
        minHeight: 288, // Fixed minimum height for 6 rows - keeps calendar card consistent across all months
    },
    dayCell: {
        width: '13.5%', // Revert to original width for safe spacing
        aspectRatio: 0.85, // Keep taller shape
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        paddingBottom: 6, // Shift content up (as requested: reduce top, increase bottom)
    },
    selectedDay: {
        backgroundColor: Colors.primary,
        ...Layout.shadows.medium,
        shadowColor: Colors.primary,
        transform: [{ scale: 1.15 }], // Expand visually without affecting layout spacing
        zIndex: 10,
    },
    dayText: {
        fontSize: 14,
        color: Colors.gray[700],
        marginBottom: 2,
    },
    selectedDayText: {
        color: Colors.white,
        fontFamily: 'Outfit_700Bold',
        // No scale needed here as parent scales
    },
    eventDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
        marginTop: 4, // More space between number and dot
    },
    legendToggle: {
        alignSelf: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
        marginBottom: 4,
    },
    legendToggleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    legendDotLarge: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendContent: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        gap: 10,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    scheduleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
    },
    scheduleTitle: {
        fontSize: 18,
        color: Colors.gray[800],
    },
    eventCount: {
        backgroundColor: Colors.white,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    eventCountText: {
        fontSize: 12,
        color: Colors.gray[500],
    },
    eventsList: {
        gap: Layout.spacing.md,
    },
    eventCardContainer: {
        position: 'relative',
    },
    cornerDeleteButton: {
        position: 'absolute',
        top: -6,
        left: -6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.gray[400],
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        ...Layout.shadows.small,
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Layout.spacing.md,
    },
    timeBox: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 12,
    },
    timeText: {
        fontSize: 12,
    },
    eventInfo: {
        flex: 1,
    },
    peptideName: {
        fontSize: 16,
        color: Colors.gray[900],
    },
    doseAmount: {
        fontSize: 14,
        color: Colors.gray[500],
    },
    statusBadge: {
        padding: 4,
    },
    actionButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    actionText: {
        color: Colors.white,
        fontSize: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 8,
        opacity: 0.6,
    },
    emptyText: {
        color: Colors.gray[400],
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: 24,
        width: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        color: Colors.gray[900],
    },
    placeholderText: {
        color: Colors.gray[500],
        textAlign: 'center',
        paddingVertical: 20,
    },

    // Schedule Modal Form Styles
    formLabel: {
        fontSize: 14,
        color: Colors.gray[700],
        marginTop: 16,
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: Colors.gray[100],
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: Colors.gray[900],
        minHeight: 48,
    },
    peptideOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    peptideChip: {
        backgroundColor: Colors.gray[100],
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    peptideChipActive: {
        backgroundColor: Colors.primary,
    },
    peptideChipText: {
        fontSize: 14,
        color: Colors.gray[700],
    },
    peptideChipTextActive: {
        color: Colors.white,
    },
    frequencyOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    frequencyChip: {
        flex: 1,
        backgroundColor: Colors.gray[100],
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    frequencyChipActive: {
        backgroundColor: Colors.primary,
    },
    frequencyChipText: {
        fontSize: 13,
        color: Colors.gray[700],
    },
    frequencyChipTextActive: {
        color: Colors.white,
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
    },
    dayButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayButtonActive: {
        backgroundColor: Colors.primary,
    },
    dayButtonText: {
        fontSize: 12,
        color: Colors.gray[600],
    },
    dayButtonTextActive: {
        color: Colors.white,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonDisabled: {
        backgroundColor: Colors.gray[300],
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: Layout.spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        ...Layout.shadows.medium,
    },
    fabInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Seamless Time Styles (Restored)
    seamlessTimeContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.gray[100],
        borderRadius: 16,
        padding: 12,
        minHeight: 56,
        alignItems: 'center',
        marginBottom: 8,
    },
    timeInputGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeDisplay: {
        fontSize: 22,
        fontFamily: 'Outfit_600SemiBold',
        color: Colors.gray[900],
        paddingVertical: 12,
        width: 44,
        textAlign: 'center',
    },
    timeSeparator: {
        fontSize: 22,
        color: Colors.gray[400],
        marginHorizontal: 2,
        paddingBottom: 2,
    },
    amPmSegment: {
        flexDirection: 'row',
        backgroundColor: Colors.gray[200],
        borderRadius: 12,
        padding: 4,
        marginRight: 4,
    },
    amPmOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    amPmOptionActive: {
        backgroundColor: Colors.primary,
        ...Layout.shadows.small,
    },
    amPmText: {
        fontSize: 14,
        color: Colors.gray[500],
    },
    amPmTextActive: {
        color: Colors.white,
    },
    // Picker Modal Styles
    pickerModalContent: {
        width: '95%',
        maxWidth: 500,
        backgroundColor: Colors.white,
        borderRadius: 20,
        paddingHorizontal: 40,
        paddingVertical: 28,
        alignItems: 'center',
        ...Layout.shadows.medium,
    },
    // Web Time Picker Styles
    webTimePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 16,
    },
    webPickerColumn: {
        alignItems: 'center',
    },
    webPickerArrow: {
        padding: 8,
    },
    webPickerValue: {
        backgroundColor: Colors.gray[100],
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: 64,
        alignItems: 'center',
    },
    webPickerValueText: {
        fontSize: 24,
        color: Colors.gray[900],
    },
    webPickerSeparator: {
        fontSize: 24,
        color: Colors.gray[400],
        marginHorizontal: 4,
    },
    webAmPmContainer: {
        marginLeft: 16,
        gap: 8,
    },
    webAmPmButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.gray[100],
    },
    webAmPmButtonActive: {
        backgroundColor: Colors.primary,
    },
    webAmPmText: {
        fontSize: 14,
        color: Colors.gray[600],
    },
    webAmPmTextActive: {
        color: Colors.white,
    },
    webPickerInput: {
        backgroundColor: Colors.gray[100],
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 12,
        width: 64,
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: Colors.gray[900],
        textAlign: 'center',
    },
    webPickerHint: {
        fontSize: 12,
        color: Colors.gray[400],
        marginTop: 12,
    },
    // Picker Styles
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 16,
        marginBottom: 20,
    },
    pickerIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerText: {
        fontSize: 16,
    },
    // Peptide Picker Modal Styles
    peptidePickerModal: {
        width: '95%',
        maxWidth: 500,
        backgroundColor: Colors.white,
        borderRadius: 20,
        paddingHorizontal: 40,
        paddingVertical: 28,
        alignItems: 'center',
        ...Layout.shadows.medium,
    },
    peptidePickerContent: {
        width: '100%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        marginTop: 'auto',
    },
    pickerSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 16,
        gap: 12,
    },
    pickerSearchInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
    },
    pickerList: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    pickerItemContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pickerItemIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerItemName: {
        fontSize: 16,
    },
    pickerItemDosage: {
        fontSize: 13,
    },
    pickerItemCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerConfirmButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...Layout.shadows.small,
    },

});
