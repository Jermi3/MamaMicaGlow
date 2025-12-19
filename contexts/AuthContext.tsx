import { getCurrentUser, signInAnonymously, supabase, signOut as supabaseSignOut } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAnonymous: boolean;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAnonymous = user?.is_anonymous ?? false;

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Check for existing session
                const currentUser = await getCurrentUser();

                if (currentUser) {
                    setUser(currentUser);
                    console.log('Restored session for user:', currentUser.id);
                } else {
                    // No existing session - sign in anonymously
                    console.log('No session found, signing in anonymously...');
                    const { user: anonUser } = await signInAnonymously();
                    setUser(anonUser);
                    console.log('Anonymous user created:', anonUser?.id);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                // Even if anonymous auth fails, we can still use local storage
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);
                setUser(session?.user ?? null);

                if (event === 'SIGNED_IN') {
                    // Trigger sync when user signs in
                    // This will be handled by the sync service
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            await supabaseSignOut();
            setUser(null);
            // After sign out, auto sign in anonymously again
            const { user: anonUser } = await signInAnonymously();
            setUser(anonUser);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const refreshUser = async () => {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isAnonymous, signOut, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
