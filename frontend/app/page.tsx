'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Logo } from '../components/Logo'
import { useAuth } from '../components/AuthProvider'

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, go to platform
        router.push('/platform')
      } else {
        // User is not authenticated, go to login
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Logo size="xl" className="mb-6 justify-center" />
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-quark-blue" />
          <span className="text-slate-600 font-inter">Loading QuarkfinAI Platform...</span>
        </div>
      </div>
    </div>
  )
}
// Bitbucket deployment test
// Auto-deployment test
