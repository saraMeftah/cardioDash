import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, type User } from './supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type AuthContextType = {
  user: SupabaseUser | null;
  profile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!error && data) {
        setProfile(data as User);
      } else {
        const fallbackName =
          authUser.user_metadata?.full_name ||
          authUser.email?.split('@')[0] ||
          'New User';

        // Security: NEVER read role from user_metadata — it is user-supplied
        // and could be set to 'admin'. Always fall back to 'guest'.
        const { data: created, error: createError } = await supabase
          .from('users')
          .upsert({ id: authUser.id, full_name: fallbackName, role: 'guest' })
          .select()
          .single();

        if (!createError && created) {
          setProfile(created as User);
        }
      }
    } catch (err) {
      console.error('Error fetching/creating profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user);
  }, [user, fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
