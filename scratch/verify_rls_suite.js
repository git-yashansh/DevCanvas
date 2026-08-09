// scratch/verify_rls_suite.js
const { createClient } = require('@supabase/supabase-js');

// Read from env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rzgumjxitcndfgbwtlxk.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const testRLSPolicies = async () => {
  if (!ANON_KEY) {
    console.error("VITE_SUPABASE_ANON_KEY env variable is required to run tests.");
    process.exit(1);
  }

  console.log("=== STARTING AUTOMATED RLS SECURITY SUITE ===");
  
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  
  // 1. Test failed login log inserts (Unauthenticated)
  console.log("Testing failed_login_attempts insert...");
  const { error: failedLogErr } = await anonClient
    .from('failed_login_attempts')
    .insert({ 
      email: 'test@example.com', 
      reason: 'mock_test', 
      browser: 'MockBrowser', 
      os: 'MockOS' 
    });
  if (failedLogErr) {
    console.log("❌ failed_login_attempts insert FAILED:", failedLogErr.message);
  } else {
    console.log("✅ failed_login_attempts insert SUCCESS (Passed RLS)");
  }

  // 2. Test chat messages inserts (Unauthenticated)
  console.log("Testing chat_messages insert (Should be blocked)...");
  const { error: chatAnonErr } = await anonClient
    .from('chat_messages')
    .insert({ 
      project_id: 'a0000000-0000-0000-0000-000000000000', 
      role: 'user', 
      content: 'hello' 
    });
  if (chatAnonErr && (chatAnonErr.message.includes('row-level security') || chatAnonErr.message.includes('policy'))) {
    console.log("✅ chat_messages insert BLOCKED successfully (RLS working)");
  } else {
    console.log("❌ chat_messages insert security check FAILED (Allowed or returned unexpected error):", chatAnonErr?.message);
  }

  console.log("=== RLS VERIFICATION COMPLETE ===");
};

testRLSPolicies();
