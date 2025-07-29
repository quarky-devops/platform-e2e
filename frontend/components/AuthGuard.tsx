'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import OnboardingFlow from './OnboardingFlow'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, userProfile, loading, refreshUserProfile } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/auth/callback',
    '/auth/reset-password',
    '/pricing',
    '/'
  ]

  // Routes that require onboarding completion
  const protectedRoutes = [
    '/platform',
    '/dashboard',
    '/assessment-report'
  ]

  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/')
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  useEffect(() => {
    if (loading) return

    // If user is not authenticated and trying to access protected route
    if (!user && isProtectedRoute) {
      router.push('/login')
      return
    }

    // If user is authenticated but trying to access auth pages
    if (user && (pathname === '/login' || pathname === '/signup')) {
      router.push('/platform')
      return
    }

    // Redirect root to appropriate page
    if (pathname === '/') {
      if (user) {
        router.push('/platform')
      } else {
        router.push('/login')
      }
    }
  }, [user, userProfile, loading, pathname, router, isProtectedRoute])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-quark-blue mx-auto mb-4" />
          <p className="text-slate-600 font-inter">Loading...</p>
        </div>
      </div>
    )
  }

  // Show onboarding flow if user exists but profile is incomplete
  // DISABLED - Skip onboarding for now
  /*
  if (user && (!userProfile || !userProfile.onboarding_completed) && isProtectedRoute) {
    return (
      <OnboardingFlow 
        onComplete={() => {
          refreshUserProfile().then(() => {
            router.push('/platform')
          })
        }}
      />
    )
  }
  */

  // For public routes, always show content
  if (isPublicRoute) {
    return <>{children}</>
  }

  // For protected routes, only show if user is authenticated
  // (Skip profile completeness check for now)
  if (user) {
    return <>{children}</>
  }

  // Fallback - redirect to login
  if (typeof window !== 'undefined') {
    router.push('/login')
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-quark-blue mx-auto mb-4" />
        <p className="text-slate-600 font-inter">Redirecting...</p>
      </div>
    </div>
  )
}
