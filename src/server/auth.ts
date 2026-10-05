import { createServerFn } from '@tanstack/react-start';
import { createSupabaseServerClient } from '#/lib/supabase.server';

export type AdminJurisdiction = 'daine_1' | 'daine_2' | 'both' | string;

export function assertAdmin(
  role: string | null | undefined,
  options: { allowModerator?: boolean } = { allowModerator: true }
): 'super_admin' | 'admin' | 'moderator' {
  if (role === 'super_admin') return 'super_admin';
  if (role === 'admin') return 'admin';
  if (options.allowModerator && role === 'moderator') return 'moderator';
  throw new Error('Forbidden: Insufficient administrative privileges');
}

export function assertAdminScope(scope: unknown): AdminJurisdiction {
  if (!scope || scope === 'both' || scope === 'all') {
    return 'both';
  }
  if (typeof scope === 'string') {
    return scope as AdminJurisdiction;
  }
  throw new Error('Forbidden: Unassigned or invalid admin jurisdiction scope');
}

export const getAuthSession = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        session: null, 
        user: null, 
        role: null, 
        admin_scope: null, 
        barangay: null,
        barangay_id: null,
        user_role_barangay_id: null,
      };
    }
    
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role, barangay, barangay_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: profile } = await supabase
      .from('profiles')
      .select('barangay, barangay_id')
      .eq('id', user.id)
      .maybeSingle();
      
    return { 
      session: { user }, 
      user, 
      role: (userRole?.role as any) ?? 'resident',
      admin_scope: (userRole?.barangay as AdminJurisdiction) ?? (userRole?.role === 'super_admin' ? 'both' : null),
      barangay: profile?.barangay ?? 'daine_1',
      barangay_id: profile?.barangay_id ?? userRole?.barangay_id ?? null,
      user_role_barangay_id: userRole?.barangay_id ?? null,
    };
  });

// In-memory auth cache for client-side navigation (5 minute TTL)
let cachedAuth: { auth: Awaited<ReturnType<typeof getAuthSession>>; timestamp: number } | null = null;

export async function getCachedAuthSession() {
  // Only use in-memory cache in browser context
  if (typeof window !== 'undefined') {
    const now = Date.now();
    if (cachedAuth && (now - cachedAuth.timestamp) < 5 * 60 * 1000) {
      return cachedAuth.auth;
    }
  }
  
  const auth = await getAuthSession();
  if (typeof window !== 'undefined' && auth.user) {
    cachedAuth = { auth, timestamp: Date.now() };
  }
  return auth;
}

export function clearAuthCache() {
  cachedAuth = null;
}

// Shared sign-out server function (used by Navbar and SessionTimeoutModal)
export const signOutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  await supabase.auth.signOut()
  return { success: true }
})
