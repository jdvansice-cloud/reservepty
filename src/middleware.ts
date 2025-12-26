import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/assets',
  '/calendar',
  '/members',
  '/tiers',
  '/settings',
  '/bookings',
  '/onboarding',
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login', '/signup'];

// Admin routes that require admin authentication
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next();
  }

  // Check for dev mode session in cookies (client-side localStorage won't work here)
  const devModeActive = request.cookies.get('devModeActive')?.value === 'true';
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  // Get real user session
  const { response, user } = await updateSession(request);

  // Check if authenticated (either dev mode or real user)
  const isAuthenticated = user || (isDevMode && devModeActive);

  // Handle protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtectedRoute && !isAuthenticated) {
    // In dev mode, allow access but redirect to login if no dev session
    if (isDevMode) {
      // Allow through in dev mode - the client-side will handle dev mode auth
      return response;
    }
    
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Handle auth routes (redirect to dashboard if already authenticated)
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Handle admin routes
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  if (isAdminRoute) {
    // Admin routes have their own authentication via admin login page
    // We'll allow access and let the client-side handle admin auth
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
