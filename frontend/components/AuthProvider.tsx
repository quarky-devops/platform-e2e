// AWS Cognito Auth Provider - Complete AWS Integration
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { auth, cognitoConfig } from '../lib/supabase'
import type { UserProfile, SubscriptionPlan, UserCredits } from '../lib/types'

// AWS Cognito Types
interface User {
  id: string
  email?: string
  email_verified?: boolean
  phone_number?: string
  user_metadata?: { [key: string]: any }
}

interface Session {
  access_token: string
  id_token: string
  refresh_token: string
  user: User
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, phone: string, fullName: string) => Promise<any>
  signInWithGoogle: () => Promise<any>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshUserProfile: () => Promise<void>
  updateProfile: (data: any) => Promise<{ error?: string }>
  setupNewUser: (phone: string, fullName: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Get API URL for backend communication
  const getApiUrl = () => {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:8080'
    }
    return '/api'
  }

  // Fetch user profile from AWS backend
  const fetchUserProfile = async (currentSession: Session) => {
    try {
      const response = await fetch(`${getApiUrl()}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
        console.log('✅ AWS: User profile loaded:', profile.email)
      } else if (response.status === 404) {
        console.log('ℹ️ AWS: User profile not found, needs setup')
        setUserProfile(null)
      } else {
        console.error('AWS: Failed to fetch user profile:', response.status)
        setUserProfile(null)
      }
    } catch (error) {
      console.error('AWS: Error fetching user profile:', error)
      setUserProfile(null)
    }
  }

  // Setup new user in AWS backend
  const setupUserInBackend = async (userId: string, email: string, phone: string, fullName: string, currentSession: Session) => {
    try {
      const response = await fetch(`${getApiUrl()}/auth/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          email: email,
          phone: phone,
          full_name: fullName
        })
      })

      if (response.ok) {
        console.log('✅ AWS: User setup in backend successful')
        await fetchUserProfile(currentSession)
        return { success: true }
      } else {
        const errorData = await response.json()
        console.error('AWS: Failed to setup user in backend:', errorData)
        return { success: false, error: errorData.error || 'Failed to setup user account' }
      }
    } catch (error) {
      console.error('AWS: Error setting up user in backend:', error)
      return { success: false, error: 'Network error during account setup' }
    }
  }

  useEffect(() => {
    // Initialize AWS Cognito session
    const initializeAuth = async () => {
      try {
        // Check if Cognito is configured
        if (!cognitoConfig.userPoolId || !cognitoConfig.userPoolWebClientId) {
          console.warn('⚠️ AWS Cognito not configured. Using development mode.')
          setLoading(false)
          return
        }

        // Try to get existing session
        const existingSession = await auth.getSession()
        if (existingSession) {
          setSession(existingSession as Session)
          setUser(existingSession.user)
          await fetchUserProfile(existingSession as Session)
        }
      } catch (error) {
        console.error('AWS: Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await auth.signIn(email, password)
      
      if (result.session) {
        setSession(result.session)
        setUser(result.user)
        await fetchUserProfile(result.session)
      }
      
      return result
    } catch (error) {
      console.error('AWS: Sign in error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, phone: string, fullName: string) => {
    setLoading(true)
    try {
      const result = await auth.signUp(email, password, {
        full_name: fullName,
        phone: phone
      })
      
      // AWS Cognito signup requires email confirmation
      console.log('✅ AWS: Signup successful, email confirmation required')
      return result
    } catch (error) {
      console.error('AWS: Sign up error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const result = await auth.signInWithGoogle()
      return result
    } catch (error) {
      console.error('AWS: Google sign in error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await auth.signOut()
      setUser(null)
      setSession(null)
      setUserProfile(null)
    } catch (error) {
      console.error('AWS: Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await auth.resetPassword(email)
    } catch (error) {
      console.error('AWS: Reset password error:', error)
      throw error
    }
  }

  const refreshUserProfile = async () => {
    if (session) {
      await fetchUserProfile(session)
    }
  }

  const updateProfile = async (data: any) => {
    try {
      if (!session) {
        return { error: 'Not authenticated' }
      }

      const response = await fetch(`${getApiUrl()}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await refreshUserProfile()
        return {}
      } else {
        const errorData = await response.json()
        return { error: errorData.error || 'Failed to update profile' }
      }
    } catch (error) {
      console.error('AWS: Update profile error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const setupNewUser = async (phone: string, fullName: string) => {
    try {
      if (!session || !user) {
        return { error: 'Not authenticated' }
      }

      const result = await setupUserInBackend(user.id, user.email!, phone, fullName, session)
      return result.error ? { error: result.error } : {}
    } catch (error) {
      console.error('AWS: Setup new user error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    refreshUserProfile,
    updateProfile,
    setupNewUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
