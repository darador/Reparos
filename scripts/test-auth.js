const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key && val) {
        process.env[key] = val;
      }
    }
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testAuth() {
  const email = 'adornor.ftth@gmail.com';
  const password = process.env.INITIAL_USER_PASSWORD;

  console.log("Testing signInWithPassword for", email);
  let res = await supabase.auth.signInWithPassword({ email, password });
  console.log("SignIn result:", res.data?.user ? "SUCCESS" : "FAILED", res.error?.message || '');

  if (res.error) {
    console.log("Attempting signUp for", email);
    let signUpRes = await supabase.auth.signUp({ email, password });
    console.log("SignUp result:", signUpRes.data?.user ? "SUCCESS" : "FAILED", signUpRes.error?.message || '');
  }
}

testAuth();
