import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { getAuthSession, clearAuthCache } from '#/server/auth';
import { supabase } from '#/lib/supabase';
import type { User } from '@supabase/supabase-js';

type UserRole = 'super_admin' | 'admin' | 'moderator' | 'business_owner' | 'resident' | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  barangay: string | null;
  barangay_id: string | null;
  admin_scope: string | null;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
  setUserState: (user: User | null, role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  barangay: null,
  barangay_id: null,
  admin_scope: null,
  isLoading: true,
  refreshAuth: async () => {},
  setUserState: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [barangay, setBarangay] = useState<string | null>(null);
  const [barangayId, setBarangayId] = useState<string | null>(null);
  const [adminScope, setAdminScope] = useState<string | null>(null);
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
      setBarangay(auth.barangay ?? null);
      setBarangayId(auth.barangay_id ?? null);
      setAdminScope(auth.admin_scope ?? null);
    } catch {
      setUser(null);
      setRole(null);
      setBarangay(null);
      setBarangayId(null);
      setAdminScope(null);
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

  const value = useMemo(
    () => ({
      user,
      role,
      barangay,
      barangay_id: barangayId,
      admin_scope: adminScope,
      isLoading,
      refreshAuth,
      setUserState,
    }),
    [user, role, barangay, barangayId, adminScope, isLoading, refreshAuth, setUserState]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
