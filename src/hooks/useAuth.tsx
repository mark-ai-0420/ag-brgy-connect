import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAuthSession, clearAuthCache } from '#/server/auth';
import { supabase } from '#/lib/supabase';
import type { User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'moderator' | 'business_owner' | 'resident' | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
  setUserState: (user: User | null, role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  refreshAuth: async () => {},
  setUserState: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setUserState = useCallback((newUser: User | null, newRole: UserRole) => {
    setUser(newUser);
    setRole(newRole);
  }, []);

  const refreshAuth = useCallback(async () => {
    clearAuthCache();
    try {
      const auth = await getAuthSession();
      setUser(auth.user ?? null);
      setRole((auth.role as UserRole) ?? null);
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch from server session cookie
    refreshAuth();

    // Listen to client-side auth events for immediate cross-tab / local updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearAuthCache();
        setUser(null);
        setRole(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        refreshAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshAuth]);

  return (
    <AuthContext.Provider value={{ user, role, isLoading, refreshAuth, setUserState }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
