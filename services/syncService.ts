import { DoseEntry, getPreferences, ScheduledDose, UserPreferences } from '@/constants/storage';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES
// ============================================

export interface SyncStatus {
    lastSyncAt: string | null;
    pendingChanges: number;
    isSyncing: boolean;
}

interface UserPeptideStack {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    status: 'Active' | 'Paused';
    color?: string;
    peptide_id?: string;
    local_id?: string;
}

// Keys for tracking sync state
const SYNC_KEYS = {
    LAST_SYNC: 'last_sync_timestamp',
    PENDING_PEPTIDES: 'pending_sync_peptides',
    PENDING_DOSES: 'pending_sync_doses',
    PENDING_SCHEDULES: 'pending_sync_schedules',
};

// ============================================
// SYNC SERVICE
// ============================================

class SyncService {
    private isSyncing = false;
    private syncQueue: (() => Promise<void>)[] = [];

    /**
     * Get current user ID or null if not authenticated
     */
    private async getUserId(): Promise<string | null> {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id ?? null;
    }

    /**
     * Main sync function - syncs all data types
     */
    async syncAll(): Promise<void> {
        if (this.isSyncing) {
            console.log('[Sync] Already syncing, skipping...');
            return;
        }

        const userId = await this.getUserId();
        if (!userId) {
            console.log('[Sync] No authenticated user, skipping sync');
            return;
        }

        this.isSyncing = true;
        console.log('[Sync] Starting full sync...');

        try {
            await Promise.all([
                this.syncUserPeptides(userId),
                this.syncDoseLogs(userId),
                this.syncSchedules(userId),
                this.syncPreferences(userId),
            ]);

            // Update last sync timestamp
            await AsyncStorage.setItem(SYNC_KEYS.LAST_SYNC, new Date().toISOString());
            console.log('[Sync] Full sync completed');
        } catch (error) {
            console.error('[Sync] Sync failed:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    // ============================================
    // USER PEPTIDES SYNC
    // ============================================

    async syncUserPeptides(userId: string): Promise<void> {
        try {
            // Get local peptides
            const localJson = await AsyncStorage.getItem('user_peptides');
            const localPeptides: any[] = localJson ? JSON.parse(localJson) : [];

            // Get cloud peptides
            const { data: cloudPeptides, error } = await supabase
                .from('user_peptide_stacks')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            // Merge strategy: Cloud is source of truth, but push local changes
            const merged = this.mergePeptides(localPeptides, cloudPeptides || []);

            // Push any new local items to cloud
            for (const item of localPeptides) {
                const existsInCloud = cloudPeptides?.some(
                    c => c.local_id === item.id || c.id === item.id
                );

                if (!existsInCloud) {
                    await supabase.from('user_peptide_stacks').insert({
                        user_id: userId,
                        name: item.name,
                        dosage: item.dosage,
                        frequency: item.frequency,
                        status: item.status || 'Active',
                        color: item.color,
                        local_id: item.id,
                    });
                }
            }

            // Update local storage with merged data
            await AsyncStorage.setItem('user_peptides', JSON.stringify(merged));
            console.log('[Sync] Peptides synced:', merged.length, 'items');
        } catch (error) {
            console.error('[Sync] Peptides sync error:', error);
        }
    }

    private mergePeptides(local: any[], cloud: any[]): any[] {
        const merged: any[] = [];
        const seenIds = new Set<string>();

        // Add cloud items first (they're the source of truth)
        for (const cloudItem of cloud) {
            const id = cloudItem.local_id || cloudItem.id;
            if (!seenIds.has(id)) {
                merged.push({
                    id: cloudItem.local_id || cloudItem.id,
                    cloudId: cloudItem.id,
                    name: cloudItem.name,
                    dosage: cloudItem.dosage,
                    frequency: cloudItem.frequency,
                    status: cloudItem.status,
                    color: cloudItem.color,
                });
                seenIds.add(id);
            }
        }

        // Add local items that don't exist in cloud
        for (const localItem of local) {
            if (!seenIds.has(localItem.id)) {
                merged.push(localItem);
                seenIds.add(localItem.id);
            }
        }

        return merged;
    }

    // ============================================
    // DOSE LOGS SYNC
    // ============================================

    async syncDoseLogs(userId: string): Promise<void> {
        try {
            // Get local dose history
            const localJson = await AsyncStorage.getItem('user_dose_history');
            const localDoses: DoseEntry[] = localJson ? JSON.parse(localJson) : [];

            // Get cloud doses
            const { data: cloudDoses, error } = await supabase
                .from('dose_logs')
                .select('*')
                .eq('user_id', userId)
                .order('logged_at', { ascending: false })
                .limit(500); // Limit to last 500 entries

            if (error) throw error;

            // Push local doses that aren't in cloud
            const cloudDates = new Set(cloudDoses?.map(d => d.logged_at) || []);

            for (const localDose of localDoses) {
                // Check if this dose exists in cloud (by date and peptide)
                const existsInCloud = cloudDoses?.some(
                    c => c.local_id === localDose.date ||
                        (c.logged_at === localDose.date && c.peptide_name === localDose.peptide)
                );

                if (!existsInCloud) {
                    await supabase.from('dose_logs').insert({
                        user_id: userId,
                        peptide_name: localDose.peptide,
                        amount: localDose.amount,
                        dose_type: localDose.type,
                        logged_at: localDose.date,
                        local_id: localDose.date, // Use date as local_id for matching
                    });
                }
            }

            // Merge cloud data into local (cloud is source of truth)
            const merged: DoseEntry[] = [];
            const seenDates = new Set<string>();

            // Add cloud items
            for (const cloudDose of cloudDoses || []) {
                const date = cloudDose.logged_at;
                if (!seenDates.has(date)) {
                    merged.push({
                        date: cloudDose.logged_at,
                        peptide: cloudDose.peptide_name,
                        amount: cloudDose.amount,
                        type: cloudDose.dose_type,
                    });
                    seenDates.add(date);
                }
            }

            // Add remaining local items
            for (const localDose of localDoses) {
                if (!seenDates.has(localDose.date)) {
                    merged.push(localDose);
                    seenDates.add(localDose.date);
                }
            }

            // Sort by date descending
            merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            await AsyncStorage.setItem('user_dose_history', JSON.stringify(merged));
            console.log('[Sync] Dose logs synced:', merged.length, 'items');
        } catch (error) {
            console.error('[Sync] Dose logs sync error:', error);
        }
    }

    // ============================================
    // SCHEDULES SYNC
    // ============================================

    async syncSchedules(userId: string): Promise<void> {
        try {
            // Get local schedules
            const localJson = await AsyncStorage.getItem('user_dose_schedules');
            const localSchedules: ScheduledDose[] = localJson ? JSON.parse(localJson) : [];

            // Get cloud schedules
            const { data: cloudSchedules, error } = await supabase
                .from('dose_schedules')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            // Push local schedules that aren't in cloud
            for (const localSchedule of localSchedules) {
                const existsInCloud = cloudSchedules?.some(
                    c => c.local_id === localSchedule.id || c.id === localSchedule.id
                );

                if (!existsInCloud) {
                    await supabase.from('dose_schedules').insert({
                        user_id: userId,
                        peptide: localSchedule.peptide,
                        amount: localSchedule.amount,
                        frequency: localSchedule.frequency,
                        days_of_week: localSchedule.daysOfWeek,
                        schedule_time: localSchedule.time,
                        enabled: localSchedule.enabled,
                        notification_ids: localSchedule.notificationIds,
                        local_id: localSchedule.id,
                    });
                }
            }

            // Merge cloud data into local
            const merged: ScheduledDose[] = [];
            const seenIds = new Set<string>();

            // Add cloud items
            for (const cloudSchedule of cloudSchedules || []) {
                const id = cloudSchedule.local_id || cloudSchedule.id;
                if (!seenIds.has(id)) {
                    merged.push({
                        id: cloudSchedule.local_id || cloudSchedule.id,
                        peptide: cloudSchedule.peptide,
                        amount: cloudSchedule.amount,
                        frequency: cloudSchedule.frequency,
                        daysOfWeek: cloudSchedule.days_of_week,
                        time: cloudSchedule.schedule_time,
                        enabled: cloudSchedule.enabled,
                        createdAt: cloudSchedule.created_at,
                        notificationIds: cloudSchedule.notification_ids,
                    });
                    seenIds.add(id);
                }
            }

            // Add remaining local items
            for (const localSchedule of localSchedules) {
                if (!seenIds.has(localSchedule.id)) {
                    merged.push(localSchedule);
                    seenIds.add(localSchedule.id);
                }
            }

            await AsyncStorage.setItem('user_dose_schedules', JSON.stringify(merged));
            console.log('[Sync] Schedules synced:', merged.length, 'items');
        } catch (error) {
            console.error('[Sync] Schedules sync error:', error);
        }
    }

    // ============================================
    // PREFERENCES SYNC
    // ============================================

    async syncPreferences(userId: string): Promise<void> {
        try {
            // Get local preferences
            const localPrefs = await getPreferences();

            // Get cloud profile
            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('preferences')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }

            const cloudPrefs = profile?.preferences as UserPreferences | null;

            if (cloudPrefs) {
                // Cloud has preferences - merge (local overrides)
                const merged = { ...cloudPrefs, ...localPrefs };
                await AsyncStorage.setItem('user_preferences', JSON.stringify(merged));

                // Push merged back to cloud
                await supabase
                    .from('user_profiles')
                    .update({ preferences: merged })
                    .eq('id', userId);
            } else {
                // No cloud preferences - push local to cloud
                await supabase
                    .from('user_profiles')
                    .upsert({
                        id: userId,
                        preferences: localPrefs,
                    });
            }

            console.log('[Sync] Preferences synced');
        } catch (error) {
            console.error('[Sync] Preferences sync error:', error);
        }
    }

    // ============================================
    // SINGLE ITEM SYNC (for immediate updates)
    // ============================================

    /**
     * Sync a single peptide after adding/updating
     */
    async pushPeptide(peptide: any): Promise<void> {
        const userId = await this.getUserId();
        if (!userId) return;

        try {
            // Check if exists
            const { data: existing } = await supabase
                .from('user_peptide_stacks')
                .select('id')
                .eq('user_id', userId)
                .eq('local_id', peptide.id)
                .single();

            if (existing) {
                // Update
                await supabase
                    .from('user_peptide_stacks')
                    .update({
                        name: peptide.name,
                        dosage: peptide.dosage,
                        frequency: peptide.frequency,
                        status: peptide.status,
                        color: peptide.color,
                    })
                    .eq('id', existing.id);
            } else {
                // Insert
                await supabase.from('user_peptide_stacks').insert({
                    user_id: userId,
                    name: peptide.name,
                    dosage: peptide.dosage,
                    frequency: peptide.frequency,
                    status: peptide.status || 'Active',
                    color: peptide.color,
                    local_id: peptide.id,
                });
            }
        } catch (error) {
            console.error('[Sync] Push peptide error:', error);
            // Queue for later sync
        }
    }

    /**
     * Remove a peptide from cloud
     */
    async deletePeptide(peptideId: string): Promise<void> {
        const userId = await this.getUserId();
        if (!userId) return;

        try {
            await supabase
                .from('user_peptide_stacks')
                .delete()
                .eq('user_id', userId)
                .eq('local_id', peptideId);
        } catch (error) {
            console.error('[Sync] Delete peptide error:', error);
        }
    }

    /**
     * Push a single dose log
     */
    async pushDoseLog(dose: DoseEntry): Promise<void> {
        const userId = await this.getUserId();
        if (!userId) return;

        try {
            await supabase.from('dose_logs').insert({
                user_id: userId,
                peptide_name: dose.peptide,
                amount: dose.amount,
                dose_type: dose.type,
                logged_at: dose.date,
                local_id: dose.date,
            });
        } catch (error) {
            console.error('[Sync] Push dose log error:', error);
        }
    }

    /**
     * Get sync status
     */
    async getSyncStatus(): Promise<SyncStatus> {
        const lastSync = await AsyncStorage.getItem(SYNC_KEYS.LAST_SYNC);
        return {
            lastSyncAt: lastSync,
            pendingChanges: 0, // TODO: track pending changes
            isSyncing: this.isSyncing,
        };
    }

    /**
     * Delete all peptides from cloud for current user
     */
    async deleteAllPeptides(): Promise<void> {
        const userId = await this.getUserId();
        if (!userId) return;

        try {
            await supabase
                .from('user_peptide_stacks')
                .delete()
                .eq('user_id', userId);
            console.log('[Sync] Deleted all peptides from cloud');
        } catch (error) {
            console.error('[Sync] Delete all peptides error:', error);
        }
    }

    /**
     * Delete all schedules from cloud for current user
     */
    async deleteAllSchedules(): Promise<void> {
        const userId = await this.getUserId();
        if (!userId) return;

        try {
            await supabase
                .from('dose_schedules')
                .delete()
                .eq('user_id', userId);
            console.log('[Sync] Deleted all schedules from cloud');
        } catch (error) {
            console.error('[Sync] Delete all schedules error:', error);
        }
    }
}

// Export singleton instance
export const syncService = new SyncService();
