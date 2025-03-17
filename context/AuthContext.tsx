import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import { showToast } from '@/components/Toast';

// Add this at the top of your file
const isBrowser = () => {
  return typeof window !== 'undefined';
};

// Define your types
type User = {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  // Add other user properties as needed
};

type AuthContextType = {
  user: User | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  updateUserProfile: (updates: Partial<User>) => Promise<{ error?: any }>;
  // Add other auth methods as needed
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    if (!isBrowser()) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUser({
          id: userId,
          email: session?.user?.email || '',
          name: data.name,
          avatar_url: data.avatar_url,
          // Add other user properties as needed
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  useEffect(() => {
    // Mark that we're now on the client side
    setIsClient(true);
    
    // Skip auth initialization on server
    if (!isBrowser()) {
      setLoading(false);
      return;
    }
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    if (!isBrowser()) return { error: new Error('Cannot sign in on server') };
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };
      return { error: null };
    } catch (error) {
      console.error('Error in signIn:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!isBrowser()) return { error: new Error('Cannot sign up on server') };
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) return { error };

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              name,
              email,
            },
          ]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return { error: profileError };
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { error };
    }
  };

  const signOut = async () => {
    if (!isBrowser()) return;
    
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error in signOut:', error);
    }
  };

  const resetPassword = async (email: string) => {
    if (!isBrowser()) return { error: new Error('Cannot reset password on server') };
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) return { error };
      return { error: null };
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return { error };
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!isBrowser() || !user) return { error: new Error('Cannot update profile on server or when not logged in') };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) return { error };

      // Update local user state
      setUser({ ...user, ...updates });
      return { error: null };
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return { error };
    }
  };

  // Provide a default value for server-side rendering
  const value = isClient ? {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
  } : {
    user: null,
    session: null,
    loading: false,
    signIn: async () => ({ error: new Error('Cannot sign in on server') }),
    signUp: async () => ({ error: new Error('Cannot sign up on server') }),
    signOut: async () => {},
    resetPassword: async () => ({ error: new Error('Cannot reset password on server') }),
    updateUserProfile: async () => ({ error: new Error('Cannot update profile on server') }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}