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
  '/reservations',
  '/approvals',
  '/onboarding',
  '/upgrade',
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

  // Get real user session with error handling
  let response: NextResponse;
  let user = null;
  
  try {
    const sessionResult = await updateSession(request);
    response = sessionResult.response;
    user = sessionResult.user;
  } catch (error) {
    console.error('Middleware session error:', error);
    // Continue without auth on error - pages will handle auth state
    response = NextResponse.next();
  }

  // Handle protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtectedRoute && !user) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Handle auth routes (redirect to dashboard if already authenticated)
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  if (isAuthRoute && user) {
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
