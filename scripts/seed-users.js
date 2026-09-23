const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local natively
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const initialPassword = process.env.INITIAL_USER_PASSWORD;

if (!supabaseUrl || !supabaseKey || !initialPassword) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or INITIAL_USER_PASSWORD");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const USERS = [
  { username: 'adornor', email: 'adornor@ftthreparos.com', full_name: 'adornor' },
  { username: 'kozdronm', email: 'kozdronm@ftthreparos.com', full_name: 'Kozdronm' },
  { username: 'jarae', email: 'jarae@ftthreparos.com', full_name: 'Jarae' },
  { username: 'lopezfer', email: 'lopezfer@ftthreparos.com', full_name: 'Lopezfer' },
];

async function seed() {
  console.log("Seeding 4 internal users in Supabase Auth...");

  for (const user of USERS) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: initialPassword,
        options: {
          data: {
            username: user.username,
            full_name: user.full_name
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered') || error.status === 422 || error.message.includes('already exists')) {
          console.log(`User ${user.username} (${user.email}) is already registered.`);
        } else {
          console.error(`Error registering ${user.username}:`, error.message);
        }
      } else {
        console.log(`User ${user.username} (${user.email}) registered successfully.`);
      }
    } catch (err) {
      console.error(`Unexpected error for ${user.username}:`, err.message);
    }
  }

  console.log("User seeding completed.");
}

seed();
