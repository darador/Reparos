import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/reparos', '/proyectos', '/pendientes', '/configuracion'];
const ALLOWED_USERNAMES = ['adornor', 'kozdronm', 'jarae', 'lopezfer'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files and Next.js internal routes are always public
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  let isAuthenticated = false;

  // 1. Check ftth_user cookie set by auth helper
  const userCookie = request.cookies.get('ftth_user')?.value;
  if (userCookie && ALLOWED_USERNAMES.includes(userCookie.toLowerCase())) {
    isAuthenticated = true;
  }

  // 2. Check Supabase Auth SSR session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isAuthenticated && supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(
        supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, ''),
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        isAuthenticated = true;
      }
    } catch (e) {
      // Ignore Supabase connection error in middleware
    }
  }

  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));

  // If unauthenticated user tries to access protected route -> redirect to /login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated user tries to access /login -> redirect to /reparos
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/reparos', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
