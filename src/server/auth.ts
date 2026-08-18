import { createServerFn } from '@tanstack/react-start';
import { createSupabaseServerClient } from '#/lib/supabase.server';

export const getAuthSession = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (userError || !user) return { session: null, user: null, role: null, admin_scope: null, barangay: null };
    
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role, barangay')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: profile } = await supabase
      .from('profiles')
      .select('barangay')
      .eq('id', user.id)
      .maybeSingle();
      
    return { 
      session: { user }, 
      user, 
      role: userRole?.role ?? 'resident',
      admin_scope: userRole?.barangay ?? 'both',
      barangay: profile?.barangay ?? 'daine_1'
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
