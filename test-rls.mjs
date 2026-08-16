import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const residentClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const unauthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function testAuthAndRls() {
  console.log("=== Testing Supabase Connection & Auth ===");
  
  // Sign In Admin
  const { data: adminData, error: adminErr } = await adminClient.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL,
    password: process.env.TEST_ADMIN_PASSWORD
  });
  if (adminErr) {
    console.error("Admin Login Failed:", adminErr.message);
  } else {
    console.log("Admin Login Success!");
  }

  // Sign In Resident
  const { data: resData, error: resErr } = await residentClient.auth.signInWithPassword({
    email: process.env.TEST_RESIDENT_EMAIL,
    password: process.env.TEST_RESIDENT_PASSWORD
  });
  if (resErr) {
    console.error("Resident Login Failed:", resErr.message);
  } else {
    console.log("Resident Login Success!");
  }
  
  console.log("\n=== Testing Profiles API ===");
  const { data: pUnauth } = await unauthClient.from('profiles').select('*').limit(1);
  console.log("Unauth Profiles Count:", pUnauth?.length ?? 'Error/None');
  
  const { data: pRes } = await residentClient.from('profiles').select('*').limit(10);
  console.log("Resident Profiles Count:", pRes?.length ?? 'Error');

  const { data: pAdmin } = await adminClient.from('profiles').select('*').limit(10);
  console.log("Admin Profiles Count:", pAdmin?.length ?? 'Error');

  console.log("\n=== Testing Businesses API ===");
  const { data: bRes } = await residentClient.from('businesses').select('*').limit(10);
  console.log("Resident Businesses Count:", bRes?.length ?? 'Error');

  const { data: bAdmin } = await adminClient.from('businesses').select('*').limit(10);
  console.log("Admin Businesses Count:", bAdmin?.length ?? 'Error');

  console.log("\n=== Testing Document Requests API ===");
  const { data: drRes } = await residentClient.from('document_requests').select('*');
  console.log("Resident Document Requests Count:", drRes?.length ?? 'Error');

  const { data: drAdmin } = await adminClient.from('document_requests').select('*');
  console.log("Admin Document Requests Count:", drAdmin?.length ?? 'Error');

  console.log("\n=== Testing Complaints API & RLS ===");
  // Verify residents cannot read other residents' non-anonymous complaints
  const { data: cRes, error: errCRes } = await residentClient.from('complaints').select('*');
  if (errCRes) {
    console.log("Resident Complaints Fetch Error:", errCRes.message);
  } else {
    console.log(`Resident Fetched ${cRes?.length ?? 0} complaints.`);
    let readOtherNonAnon = false;
    for (const c of (cRes || [])) {
        if (c.user_id !== resData.user?.id && !c.is_anonymous) {
            readOtherNonAnon = true;
            console.log("VIOLATION: Resident can read other resident's non-anonymous complaint:", c.id);
        }
    }
    if (!readOtherNonAnon) {
        console.log("PASS: Resident cannot read other residents' non-anonymous complaints (or none exist in result set).");
    }
  }

  const { data: cAdmin } = await adminClient.from('complaints').select('*');
  console.log(`Admin Fetched ${cAdmin?.length ?? 0} complaints.`);

}

testAuthAndRls().catch(console.error);
