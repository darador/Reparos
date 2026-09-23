import { createClient as createBrowserClient } from '@/lib/supabase/client';

export const ALLOWED_USERS = ['adornor', 'kozdronm', 'jarae', 'lopezfer'] as const;

export type AllowedUsername = typeof ALLOWED_USERS[number];

export const USER_DISPLAY_NAMES: Record<AllowedUsername, string> = {
  adornor: 'adornor',
  kozdronm: 'Kozdronm',
  jarae: 'Jarae',
  lopezfer: 'Lopezfer',
};

export function normalizeUsername(username: string): string {
  return (username || '').trim().toLowerCase();
}

export function isAllowedUser(username: string): boolean {
  const norm = normalizeUsername(username);
  return ALLOWED_USERS.includes(norm as AllowedUsername);
}

export function getUserDisplayName(username: string): string {
  const norm = normalizeUsername(username) as AllowedUsername;
  return USER_DISPLAY_NAMES[norm] || username;
}

export function getTechnicalEmail(username: string): string {
  const norm = normalizeUsername(username);
  return `${norm}@ftthreparos.com`;
}

// Session state storage helper for cross-browser fallback
const AUTH_USER_KEY = 'ftth_auth_user';

export function setStoredAuthUser(user: { username: string; displayName: string } | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      // Set secure cookie for SSR / Middleware compatibility
      document.cookie = `ftth_user=${encodeURIComponent(user.username)}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
      document.cookie = `ftth_user=; path=/; max-age=0; SameSite=Lax`;
    }
  } catch (e) {
    // Ignore storage errors in private browsing
  }
}

export function getStoredAuthUser(): { username: string; displayName: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.username && isAllowedUser(parsed.username)) {
        return {
          username: parsed.username,
          displayName: getUserDisplayName(parsed.username)
        };
      }
    }
    // Fallback: check cookie if localStorage is empty
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const [k, v] = c.trim().split('=');
      if (k === 'ftth_user' && v) {
        const username = decodeURIComponent(v);
        if (isAllowedUser(username)) {
          return {
            username,
            displayName: getUserDisplayName(username)
          };
        }
      }
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

export async function loginWithUsernameAndPassword(usernameInput: string, passwordInput: string): Promise<{ success: boolean; error?: string; user?: { username: string; displayName: string } }> {
  const normalized = normalizeUsername(usernameInput);

  if (!normalized || !passwordInput) {
    return { success: false, error: 'Por favor complete el usuario y la contraseña.' };
  }

  if (!isAllowedUser(normalized)) {
    return { success: false, error: 'Usuario o contraseña incorrectos.' };
  }

  // Read environment variable for initial password or default
  const expectedPassword = process.env.INITIAL_USER_PASSWORD || 'Rojo2026';

  if (passwordInput !== expectedPassword) {
    return { success: false, error: 'Usuario o contraseña incorrectos.' };
  }

  const technicalEmail = getTechnicalEmail(normalized);
  const displayName = getUserDisplayName(normalized);
  const supabase = createBrowserClient();

  if (supabase) {
    try {
      // Attempt Supabase Auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: technicalEmail,
        password: passwordInput
      });

      if (error) {
        // If user not in Supabase Auth yet, attempt auto-signup
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: technicalEmail,
          password: passwordInput,
          options: {
            data: {
              username: normalized,
              full_name: displayName
            }
          }
        });

        if (signUpErr && !signUpErr.message.includes('already registered')) {
          console.warn("Supabase Auth notice:", signUpErr.message);
        }
      }
    } catch (err) {
      console.warn("Supabase Auth sign-in exception:", err);
    }
  }

  const userObj = { username: normalized, displayName };
  setStoredAuthUser(userObj);

  return {
    success: true,
    user: userObj
  };
}

export async function logoutUser(): Promise<void> {
  const supabase = createBrowserClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }
  }
  setStoredAuthUser(null);
}
