import { GlowCard } from '@/components/GlowCard';
import { SoundButton } from '@/components/SoundButton';
import { StyledText } from '@/components/StyledText';
import { Colors, Layout } from '@/constants/Colors';
import { DoseEntry, getDoseHistory, getScheduledDosesForDate, getSchedules, ScheduledDose } from '@/constants/storage';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useSounds } from '@/hooks/useSounds';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Activity, Bell, BookOpen, Calendar, ChevronRight, Clock, Flame, Pill, Plus, Target, X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface DayStatus {
  completed: boolean;
  scheduled: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const { preferences } = usePreferences();
  const { playTap } = useSounds();
  const isDark = preferences.darkMode;

  // Dynamic colors
  const bgColor = isDark ? Colors.dark.background : Colors.soft.background;
  const cardBg = isDark ? Colors.gray[800] : Colors.white;
  const textColor = isDark ? Colors.dark.text : Colors.gray[900];
  const subtitleColor = isDark ? Colors.gray[400] : Colors.gray[500];
  const sectionTitleColor = isDark ? Colors.gray[100] : Colors.gray[900];

  const [userName, setUserName] = useState('');
  const [weeklyStatus, setWeeklyStatus] = useState<DayStatus[]>(
    DAYS.map(() => ({ completed: false, scheduled: false }))
  );
  const [adherencePercent, setAdherencePercent] = useState(0);
  const [todaySchedules, setTodaySchedules] = useState<(ScheduledDose & { scheduledTime: Date })[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalDoses, setTotalDoses] = useState(0);
  const [recentDoses, setRecentDoses] = useState<DoseEntry[]>([]);

  // Performance: Track last load time to prevent reloading on every focus
  const lastLoadRef = useRef<number>(0);

  useFocusEffect(
    useCallback(() => {
      // Only reload if 30 seconds have passed since last load
      const now = Date.now();
      if (now - lastLoadRef.current > 30000) {
        lastLoadRef.current = now;
        loadData();
      }
    }, [])
  );

  const loadData = async () => {
    // Load user profile from AsyncStorage
    try {
      const profileStr = await AsyncStorage.getItem('user_personal_details');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        if (profile?.name) {
          setUserName(profile.name);
        }
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }

    // Calculate weekly adherence
    const schedules = await getSchedules();
    const doseHistory = await getDoseHistory();

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday

    // Get start of this week (Sunday)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const newWeeklyStatus: DayStatus[] = DAYS.map((_, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      // Use local date format (YYYY-MM-DD) instead of UTC
      const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;

      // Check if any dose was logged on this day
      const hasLoggedDose = doseHistory.some(dose => {
        const d = new Date(dose.date);
        // Use local date format for dose date too
        const doseDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return doseDate === dateStr;
      });

      // Check if there's a schedule for this day
      const hasSchedule = schedules.some(schedule => {
        if (!schedule.enabled) return false;
        return schedule.daysOfWeek.includes(index);
      });

      return {
        completed: hasLoggedDose,
        scheduled: hasSchedule,
      };
    });

    setWeeklyStatus(newWeeklyStatus);

    // Calculate adherence percentage
    const scheduledDays = newWeeklyStatus.filter(d => d.scheduled).length;
    const completedDays = newWeeklyStatus.filter(d => d.completed && d.scheduled).length;
    const adherence = scheduledDays > 0 ? Math.round((completedDays / scheduledDays) * 100) : 100;
    setAdherencePercent(adherence);

    // Load today's scheduled doses
    const todaysDoses = await getScheduledDosesForDate(today);
    setTodaySchedules(todaysDoses);

    // Calculate streak (consecutive days with logged doses)
    let currentStreak = 0;
    const sortedDoses = [...doseHistory].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sortedDoses.length > 0) {
      const checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      // CRITICAL: Use local date string, not UTC (toISOString converts to UTC which shifts the date)
      const toLocalDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Check if there's a dose today or yesterday to start streak
      const todayStr = toLocalDateStr(checkDate);
      const yesterdayDate = new Date(checkDate);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = toLocalDateStr(yesterdayDate);

      const hasTodayDose = sortedDoses.some(d => toLocalDateStr(new Date(d.date)) === todayStr);
      const hasYesterdayDose = sortedDoses.some(d => toLocalDateStr(new Date(d.date)) === yesterdayStr);

      if (hasTodayDose || hasYesterdayDose) {
        // Start counting from today or yesterday
        let streakDate = hasTodayDose ? new Date(checkDate) : yesterdayDate;

        while (true) {
          const dateStr = toLocalDateStr(streakDate);
          const hasDose = sortedDoses.some(d => toLocalDateStr(new Date(d.date)) === dateStr);
          if (hasDose) {
            currentStreak++;
            streakDate.setDate(streakDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }
    setStreak(currentStreak);

    // Total doses logged
    setTotalDoses(doseHistory.length);

    // Recent doses (last 3)
    const recent = [...doseHistory]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
    setRecentDoses(recent);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const SoftBlob = ({ color, style }: { color: string; style: any }) => (
    <View pointerEvents="none" style={[styles.blob, { backgroundColor: color }, style]} />
  );

  const quickActions = [
    { id: 'log', title: 'Log Dose', icon: Plus, color: Colors.primary, route: '/log-dose' },
    { id: 'peptides', title: 'My Peptides', icon: Pill, color: '#EC4899', route: '/(tabs)/peptides' },
    { id: 'logbook', title: 'Logbook', icon: BookOpen, color: '#F59E0B', route: '/logbook' },
    { id: 'schedule', title: 'Schedule', icon: Calendar, color: '#10B981', route: '/(tabs)/calendar' },
  ];

  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Animate header background: transparent at top, solid when scrolled
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollY.value,
      [0, 50],
      ['transparent', bgColor]
    );
    return { backgroundColor };
  });

  return (
    <View style={[styles.mainContainer, { backgroundColor: bgColor }]}>
      {/* Ambient Background Blobs */}
      <SoftBlob color={isDark ? "#1E1B4B" : "#EDE9FE"} style={{ top: -100, left: -100, width: 400, height: 400 }} />
      <SoftBlob color={isDark ? "#312E81" : "#DDD6FE"} style={{ top: 100, right: -150, width: 350, height: 350 }} />
      <SoftBlob color={isDark ? "#3730A3" : "#F3E8FF"} style={{ bottom: 0, left: -50, width: 300, height: 300 }} />

      {/* NEW: Aurora Background */}
      {/* <AuroraBackground /> */}

      {/* Sticky Header - animated bg: transparent at top, solid when scrolled */}
      <Animated.View
        style={[
          styles.stickyHeader,
          { paddingTop: insets.top + 16 },
          headerAnimatedStyle
        ]}
      >
        <View>
          <StyledText variant="medium" style={[styles.greetingSub, { color: subtitleColor }]}>
            {getGreeting()},
          </StyledText>
          <SoundButton
            style={styles.nameRow}
            onPress={() => router.push('/profile')}
          >
            <StyledText variant="bold" style={[styles.greetingName, { color: textColor }]}>
              {userName || 'Friend'}
            </StyledText>
            <ChevronRight size={20} color={subtitleColor} />
          </SoundButton>
        </View>
        <SoundButton
          style={[styles.bellButton, { backgroundColor: cardBg }]}
          onPress={() => { playTap(); router.push('/notifications'); }}
        >
          <Bell size={22} color={textColor} />
        </SoundButton>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 100 } // Push content below sticky header
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Weekly Activity Section */}
        <View style={styles.section}>
          <StyledText variant="bold" style={[styles.sectionTitle, { color: sectionTitleColor }]}>
            Weekly Activity
          </StyledText>

          <View>
            <GlowCard variant="surface" style={[styles.activityCard, { backgroundColor: cardBg }]}>
              <View style={styles.activityHeader}>
                <View>
                  <StyledText variant="medium" style={[styles.activityLabel, { color: subtitleColor }]}>
                    Protocol Adherence
                  </StyledText>
                  <StyledText variant="extraBold" style={[styles.adherenceValue, { color: Colors.primary }]}>
                    {adherencePercent}%
                  </StyledText>
                </View>
                <SoundButton
                  style={[styles.viewReportButton, { borderColor: isDark ? Colors.gray[600] : Colors.gray[300] }]}
                  onPress={() => router.push('/progress')}
                >
                  <StyledText variant="medium" style={[styles.viewReportText, { color: subtitleColor }]}>
                    View Report
                  </StyledText>
                  <ChevronRight size={16} color={subtitleColor} />
                </SoundButton>
              </View>


              <View style={styles.daysRow}>
                {DAYS.map((day, index) => {
                  const status = weeklyStatus[index];
                  const isToday = index === new Date().getDay();
                  const isPast = index < new Date().getDay();

                  return (
                    <SoundButton
                      key={index}
                      style={styles.dayItem}
                      activeOpacity={0.7}
                      onPress={() => router.push({ pathname: '/day-detail', params: { dayIndex: index } })}
                    >
                      <View
                        style={[
                          styles.dayCircle,
                          { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[200] },
                          status.completed && styles.dayCircleCompleted,
                          isToday && !status.completed && styles.dayCircleToday,
                        ]}
                      >
                        {status.completed && (
                          <StyledText variant="bold" style={styles.checkmark}>✓</StyledText>
                        )}
                        {!status.completed && status.scheduled && isPast && (
                          <X size={16} color={isDark ? Colors.gray[500] : Colors.gray[400]} />
                        )}
                        {!status.completed && !status.scheduled && isPast && (
                          <StyledText variant="bold" style={styles.dash}>-</StyledText>
                        )}
                      </View>
                      <StyledText
                        variant="medium"
                        style={[
                          styles.dayLabel,
                          { color: subtitleColor },
                          isToday && { color: Colors.primary }
                        ]}
                      >
                        {day}
                      </StyledText>
                    </SoundButton>
                  );
                })}
              </View>
            </GlowCard>

            {/* 
            <GlassCard style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View>
                  <StyledText variant="medium" style={[styles.activityLabel, { color: subtitleColor }]}>
                    Protocol Adherence
                  </StyledText>
                  <StyledText variant="extraBold" style={[styles.adherenceValue, { color: Colors.primary }]}>
                    {adherencePercent}%
                  </StyledText>
                </View>
                <SoundButton
                  style={[styles.viewReportButton, { borderColor: isDark ? Colors.gray[600] : Colors.gray[300] }]}
                  onPress={() => router.push('/progress')}
                >
                  <StyledText variant="medium" style={[styles.viewReportText, { color: subtitleColor }]}>
                    View Report
                  </StyledText>
                  <ChevronRight size={16} color={subtitleColor} />
                </SoundButton>
              </View>

              
              <View style={styles.daysRow}>
                {DAYS.map((day, index) => {
                  const status = weeklyStatus[index];
                  const isToday = index === new Date().getDay();
                  const isPast = index < new Date().getDay();

                  return (
                    <SoundButton
                      key={index}
                      style={styles.dayItem}
                      activeOpacity={0.7}
                      onPress={() => router.push({ pathname: '/day-detail', params: { dayIndex: index } })}
                    >
                      <View
                        style={[
                          styles.dayCircle,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }, // Glassy check circle
                          status.completed && styles.dayCircleCompleted,
                          isToday && !status.completed && styles.dayCircleToday,
                        ]}
                      >
                        {status.completed && (
                          <StyledText variant="bold" style={styles.checkmark}>✓</StyledText>
                        )}
                        {!status.completed && status.scheduled && isPast && (
                          <X size={16} color={isDark ? Colors.gray[500] : Colors.gray[400]} />
                        )}
                        {!status.completed && !status.scheduled && isPast && (
                          <StyledText variant="bold" style={styles.dash}>-</StyledText>
                        )}
                      </View>
                      <StyledText
                        variant="medium"
                        style={[
                          styles.dayLabel,
                          { color: subtitleColor },
                          isToday && { color: Colors.primary }
                        ]}
                      >
                        {day}
                      </StyledText>
                    </SoundButton>
                  );
                })}
              </View>
            </GlassCard> 
            */}
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <StyledText variant="bold" style={[styles.sectionTitle, { color: sectionTitleColor }]}>
            Quick Actions
          </StyledText>

          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <View
                  key={action.id}
                  style={styles.actionCardWrapper}
                >
                  <SoundButton
                    activeOpacity={0.8}
                    onPress={() => { playTap(); router.push(action.route as any); }}
                  >
                    <GlowCard variant="surface" style={[styles.actionCard, { backgroundColor: cardBg }]}>
                      <View style={[styles.actionIconBox, { backgroundColor: action.color + '20' }]}>
                        <IconComponent size={28} color={action.color} />
                      </View>
                      <StyledText variant="semibold" style={[styles.actionTitle, { color: textColor }]}>
                        {action.title}
                      </StyledText>
                    </GlowCard>
                  </SoundButton>
                </View>
              );
            })}

            {/* 
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <View
                  key={action.id}
                  style={styles.actionCardWrapper}
                >
                  <SoundButton
                    activeOpacity={0.8}
                    onPress={() => { playTap(); router.push(action.route as any); }}
                  >
                    <GlassCard style={styles.actionCard}>
                      <View style={[styles.actionIconBox, { backgroundColor: action.color + '20' }]}>
                        <IconComponent size={28} color={action.color} />
                      </View>
                      <StyledText variant="semibold" style={[styles.actionTitle, { color: textColor }]}>
                        {action.title}
                      </StyledText>
                    </GlassCard>
                  </SoundButton>
                </View>
              );
            })} 
            */}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <StyledText variant="bold" style={[styles.sectionTitle, { color: sectionTitleColor }]}>
            Your Stats
          </StyledText>

          <View style={styles.statsGrid}>
            <GlowCard variant="surface" style={[styles.statCard, { backgroundColor: cardBg }]}>
              <View style={[styles.statIconBox, { backgroundColor: '#F59E0B20' }]}>
                <Flame size={24} color="#F59E0B" />
              </View>
              <View style={styles.statContent}>
                <StyledText variant="extraBold" style={[styles.statValue, { color: textColor }]}>
                  {streak}
                </StyledText>
                <StyledText variant="medium" style={[styles.statLabel, { color: subtitleColor }]}>
                  Day Streak
                </StyledText>
              </View>
            </GlowCard>

            {/* 
            <GlassCard style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: '#F59E0B20' }]}>
                <Flame size={24} color="#F59E0B" />
              </View>
              <View style={styles.statContent}>
                <StyledText variant="extraBold" style={[styles.statValue, { color: textColor }]}>
                  {streak}
                </StyledText>
                <StyledText variant="medium" style={[styles.statLabel, { color: subtitleColor }]}>
                  Day Streak
                </StyledText>
              </View>
            </GlassCard> 
            */}


            <GlowCard variant="surface" style={[styles.statCard, { backgroundColor: cardBg }]}>
              <View style={[styles.statIconBox, { backgroundColor: Colors.primary + '20' }]}>
                <Target size={24} color={Colors.primary} />
              </View>
              <View style={styles.statContent}>
                <StyledText variant="extraBold" style={[styles.statValue, { color: textColor }]}>
                  {totalDoses}
                </StyledText>
                <StyledText variant="medium" style={[styles.statLabel, { color: subtitleColor }]}>
                  Total Doses
                </StyledText>
              </View>
            </GlowCard>


            {/* 
            <GlassCard style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: Colors.primary + '20' }]}>
                <Target size={24} color={Colors.primary} />
              </View>
              <View style={styles.statContent}>
                <StyledText variant="extraBold" style={[styles.statValue, { color: textColor }]}>
                  {totalDoses}
                </StyledText>
                <StyledText variant="medium" style={[styles.statLabel, { color: subtitleColor }]}>
                  Total Doses
                </StyledText>
              </View>
            </GlassCard> 
            */}
          </View>
        </View>

        {/* Today's Schedule */}
        {todaySchedules.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <StyledText variant="bold" style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                Today&apos;s Schedule
              </StyledText>
              <SoundButton onPress={() => router.push('/(tabs)/calendar')}>
                <StyledText variant="medium" style={{ color: Colors.primary, fontSize: 14 }}>
                  View All
                </StyledText>
              </SoundButton>
            </View>


            <GlowCard variant="surface" style={[styles.scheduleCard, { backgroundColor: cardBg }]}>
              {todaySchedules.slice(0, 3).map((schedule, index) => {
                const time = new Date(schedule.scheduledTime);
                const timeStr = time.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
                const isLast = index === Math.min(todaySchedules.length - 1, 2);

                return (
                  <View key={schedule.id}>
                    <View style={styles.scheduleItem}>
                      <View style={[styles.scheduleIconBox, { backgroundColor: Colors.primary + '20' }]}>
                        <Clock size={18} color={Colors.primary} />
                      </View>
                      <View style={styles.scheduleInfo}>
                        <StyledText variant="semibold" style={[styles.scheduleName, { color: textColor }]}>
                          {schedule.peptide}
                        </StyledText>
                        <StyledText variant="medium" style={[styles.scheduleTime, { color: subtitleColor }]}>
                          {timeStr} • {schedule.amount}
                        </StyledText>
                      </View>
                      <SoundButton
                        style={styles.logButton}
                        onPress={() => router.push({
                          pathname: '/log-dose',
                          params: { peptide: schedule.peptide, amount: schedule.amount }
                        })}
                      >
                        <StyledText variant="semibold" style={styles.logButtonText}>
                          Log
                        </StyledText>
                      </SoundButton>
                    </View>
                    {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]} />}
                  </View>
                );
              })}
            </GlowCard>


            {/* 
            <GlassCard style={styles.scheduleCard}>
              {todaySchedules.slice(0, 3).map((schedule, index) => {
                const time = new Date(schedule.scheduledTime);
                const timeStr = time.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
                const isLast = index === Math.min(todaySchedules.length - 1, 2);

                return (
                  <View key={schedule.id}>
                    <View style={styles.scheduleItem}>
                      <View style={[styles.scheduleIconBox, { backgroundColor: Colors.primary + '20' }]}>
                        <Clock size={18} color={Colors.primary} />
                      </View>
                      <View style={styles.scheduleInfo}>
                        <StyledText variant="semibold" style={[styles.scheduleName, { color: textColor }]}>
                          {schedule.peptide}
                        </StyledText>
                        <StyledText variant="medium" style={[styles.scheduleTime, { color: subtitleColor }]}>
                          {timeStr} • {schedule.amount}
                        </StyledText>
                      </View>
                      <SoundButton
                        style={styles.logButton}
                        onPress={() => router.push({
                          pathname: '/log-dose',
                          params: { peptide: schedule.peptide, amount: schedule.amount }
                        })}
                      >
                        <StyledText variant="semibold" style={styles.logButtonText}>
                          Log
                        </StyledText>
                      </SoundButton>
                    </View>
                    {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]} />}
                  </View>
                );
              })}
            </GlassCard> 
            */}
          </View>
        )}

        {/* Recent Activity */}
        {recentDoses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <StyledText variant="bold" style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                Recent Activity
              </StyledText>
              <SoundButton onPress={() => router.push('/logbook')}>
                <StyledText variant="medium" style={{ color: Colors.primary, fontSize: 14 }}>
                  See All
                </StyledText>
              </SoundButton>
            </View>

            <GlowCard variant="surface" style={[styles.activityListCard, { backgroundColor: cardBg }]}>
              {recentDoses.map((dose, index) => {
                const doseDate = new Date(dose.date);
                const isToday = doseDate.toDateString() === new Date().toDateString();
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const isYesterday = doseDate.toDateString() === yesterday.toDateString();

                const dateStr = isToday
                  ? 'Today'
                  : isYesterday
                    ? 'Yesterday'
                    : doseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                const timeStr = doseDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });

                const isLast = index === recentDoses.length - 1;

                return (
                  <View key={index}>
                    <View style={styles.activityItem}>
                      <View style={[styles.activityIconBox, { backgroundColor: '#10B98120' }]}>
                        <Activity size={18} color="#10B981" />
                      </View>
                      <View style={styles.activityInfo}>
                        <StyledText variant="semibold" style={[styles.activityName, { color: textColor }]}>
                          {dose.peptide}
                        </StyledText>
                        <StyledText variant="medium" style={[styles.activityMeta, { color: subtitleColor }]}>
                          {dose.amount} • {dateStr} at {timeStr}
                        </StyledText>
                      </View>
                    </View>
                    {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]} />}
                  </View>
                );
              })}
            </GlowCard>

            {/* 
            <GlassCard style={styles.activityListCard}>
              {recentDoses.map((dose, index) => {
                const doseDate = new Date(dose.date);
                const isToday = doseDate.toDateString() === new Date().toDateString();
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const isYesterday = doseDate.toDateString() === yesterday.toDateString();

                const dateStr = isToday
                  ? 'Today'
                  : isYesterday
                    ? 'Yesterday'
                    : doseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                const timeStr = doseDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });

                const isLast = index === recentDoses.length - 1;

                return (
                  <View key={index}>
                    <View style={styles.activityItem}>
                      <View style={[styles.activityIconBox, { backgroundColor: '#10B98120' }]}>
                        <Activity size={18} color="#10B981" />
                      </View>
                      <View style={styles.activityInfo}>
                        <StyledText variant="semibold" style={[styles.activityName, { color: textColor }]}>
                          {dose.peptide}
                        </StyledText>
                        <StyledText variant="medium" style={[styles.activityMeta, { color: subtitleColor }]}>
                          {dose.amount} • {dateStr} at {timeStr}
                        </StyledText>
                      </View>
                    </View>
                    {!isLast && <View style={[styles.divider, { backgroundColor: isDark ? Colors.gray[700] : Colors.gray[100] }]} />}
                  </View>
                );
              })}
            </GlassCard> 
            */}
          </View>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.6,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.lg,
  },
  greetingSub: {
    fontSize: 14,
    marginBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greetingName: {
    fontSize: 28,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Layout.shadows.small,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  activityCard: {
    padding: Layout.spacing.lg,
    gap: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  adherenceValue: {
    fontSize: 36,
  },
  viewReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  viewReportText: {
    fontSize: 13,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: 6,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleCompleted: {
    backgroundColor: Colors.primary,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 16,
  },
  dash: {
    color: Colors.gray[500],
    fontSize: 16,
  },
  dayLabel: {
    fontSize: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCardWrapper: {
    width: '48%',
  },
  actionCard: {
    padding: Layout.spacing.lg,
    alignItems: 'center',
    gap: 12,
    minHeight: 120,
    justifyContent: 'center',
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: Layout.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleCard: {
    padding: Layout.spacing.md,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  scheduleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 15,
  },
  scheduleTime: {
    fontSize: 13,
    marginTop: 2,
  },
  logButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  logButtonText: {
    color: Colors.white,
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
  activityListCard: {
    padding: Layout.spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 15,
  },
  activityMeta: {
    fontSize: 13,
    marginTop: 2,
  },
});
