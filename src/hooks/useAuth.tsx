import { createContext, useContext, useEffect, useState } from 'react';
import { getAuthSession } from '#/server/auth';
import type { User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'moderator' | 'business_owner' | 'resident' | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch auth state from the SERVER (reads the session cookie)
    getAuthSession()
      .then((auth) => {
        setUser(auth.user ?? null);
        setRole((auth.role as UserRole) ?? null);
      })
      .catch(() => {
        setUser(null);
        setRole(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
