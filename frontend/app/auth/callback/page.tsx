'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../components/AuthProvider'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { user, userProfile, refreshUserProfile } = useAuth()
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait for auth state to be processed
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        if (user) {
          // Refresh user profile to get backend data
          await refreshUserProfile()
          
          // Check if user needs onboarding
          if (!userProfile || !userProfile.onboarding_completed) {
            // User will be redirected to onboarding via AuthGuard
            router.push('/platform')
          } else {
            // User is fully set up, go to platform
            router.push('/platform')
          }
        } else {
          setError('Authentication failed')
          setTimeout(() => router.push('/login'), 3000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setError('Authentication failed')
        setTimeout(() => router.push('/login'), 3000)
      } finally {
        setProcessing(false)
      }
    }

    handleAuthCallback()
  }, [user, userProfile, router, refreshUserProfile])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-slate-800 mb-2 font-inter">Authentication Failed</h1>
          <p className="text-slate-600 font-inter">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-quark-blue mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-slate-800 mb-2 font-inter">Setting up your account...</h1>
        <p className="text-slate-600 font-inter">Please wait while we complete your authentication</p>
      </div>
    </div>
  )
}
