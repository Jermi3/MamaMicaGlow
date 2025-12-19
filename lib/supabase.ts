import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter to handle environments where window is not defined (e.g. server-side rendering or Metro bundler)
const ExpoStorage = {
    getItem: (key: string) => {
        if (typeof window === 'undefined') {
            return Promise.resolve(null);
        }
        return AsyncStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') {
            return Promise.resolve();
        }
        return AsyncStorage.setItem(key, value);
    },
    removeItem: (key: string) => {
        if (typeof window === 'undefined') {
            return Promise.resolve();
        }
        return AsyncStorage.removeItem(key);
    },
};

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: ExpoStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Required for React Native
    },
});

// ============================================
// AUTH HELPERS
// ============================================

/**
 * Sign in anonymously - creates an anonymous user that can be upgraded later
 */
export const signInAnonymously = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
        console.error('Anonymous sign in error:', error);
        throw error;
    }
    return data;
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName || 'User',
            },
        },
    });
    if (error) {
        console.error('Sign up error:', error);
        throw error;
    }
    return data;
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        console.error('Sign in error:', error);
        throw error;
    }
    return data;
};

/**
 * Link email to anonymous account (upgrade anonymous to permanent)
 */
export const linkEmailToAnonymous = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.updateUser({
        email,
        password,
    });
    if (error) {
        console.error('Link email error:', error);
        throw error;
    }
    return data;
};

/**
 * Sign out
 */
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

/**
 * Get current session
 */
export const getCurrentSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

/**
 * Check if user is anonymous
 */
export const isAnonymousUser = async () => {
    const user = await getCurrentUser();
    return user?.is_anonymous ?? false;
};
