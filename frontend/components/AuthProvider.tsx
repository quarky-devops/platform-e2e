'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { auth, supabase } from '../lib/supabase'
import type { UserProfile, SubscriptionPlan, UserCredits } from '../lib/types'

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

  // Get API URL based on environment
  const getApiUrl = () => {
    if (process.env.NODE_ENV === 'development') {
      return process.env.NEXT_PUBLIC_API_URL?.includes('localhost') 
        ? process.env.NEXT_PUBLIC_API_URL 
        : 'http://localhost:8082'  // Use port 8082 for local backend
    }
    return process.env.NEXT_PUBLIC_API_URL || 'https://platform-e2e.onrender.com'
  }

  // Fetch user profile from backend
  const fetchUserProfile = async (currentSession: Session) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
        console.log('✅ User profile loaded:', profile.email)
      } else if (response.status === 404) {
        // User exists in Supabase but not in our backend - needs setup
        if (process.env.NODE_ENV === 'development') {
          console.log('ℹ️ User profile not found in backend, needs setup')
        }
        setUserProfile(null)
      } else {
        console.error('Failed to fetch user profile:', response.status)
        setUserProfile(null)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching user profile:', error)
      }
      setUserProfile(null)
    }
  }

  // Setup new user in backend
  const setupUserInBackend = async (userId: string, email: string, phone: string, fullName: string, currentSession: Session) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/users`, {
        method: 'POST',
        headers: {
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
        console.log('✅ User setup in backend successful')
        await fetchUserProfile(currentSession)
        return { success: true }
      } else {
        const errorData = await response.json()
        console.error('Failed to setup user in backend:', errorData)
        return { success: false, error: errorData.error || 'Failed to setup user account' }
      }
    } catch (error) {
      console.error('Error setting up user in backend:', error)
      return { success: false, error: 'Network error during account setup' }
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const session = await auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        // Fetch user profile if session exists
        if (session) {
          await fetchUserProfile(session)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session && session.user) {
          // For any sign-in, check if user exists in backend
          console.log('🔍 User sign-in detected, checking backend profile...')
          
          try {
            const response = await fetch(`${getApiUrl()}/api/auth/profile`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (response.ok) {
              // User exists, fetch profile
              const profile = await response.json()
              setUserProfile(profile)
              console.log('✅ User profile loaded:', profile.email)
            } else if (response.status === 404) {
              // User doesn't exist in backend, create them
              console.log('🔧 User not found in backend, creating profile...')
              const setupResult = await setupUserInBackend(
                session.user.id,
                session.user.email!,
                '', // Empty phone, will be NULL in database
                session.user.user_metadata?.full_name || 
                session.user.user_metadata?.name || 
                session.user.email?.split('@')[0] || 'User',
                session
              )
              
              if (setupResult.success) {
                console.log('✅ User profile created successfully')
              } else {
                console.error('❌ Failed to create user profile:', setupResult.error)
                setUserProfile(null)
              }
            } else {
              console.error('Failed to fetch user profile:', response.status)
              setUserProfile(null)
            }
          } catch (error) {
            console.error('Error during user profile setup:', error)
            setUserProfile(null)
          }
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await auth.signIn(email, password)
      return result
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, phone: string, fullName: string) => {
    setLoading(true)
    try {
      // Sign up with Supabase - auth.signUp returns AuthResponse with data property
      const response = await auth.signUp(email, password, {
        full_name: fullName,
        phone: phone
      })
      
      // The response has session and user directly (not under data)
      if (response.session && response.user) {
        await setupUserInBackend(
          response.user.id, 
          email, 
          phone, 
          fullName, 
          response.session
        )
      }
      
      return response
    } catch (error) {
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
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await auth.signOut()
      setUserProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await auth.resetPassword(email)
    } catch (error) {
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

      const response = await fetch(`${getApiUrl()}/api/auth/profile`, {
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
      return { error: 'An unexpected error occurred' }
    }
  }

  const setupNewUser = async (phone: string, fullName: string) => {
    try {
      if (!session || !user) {
        return { error: 'Not authenticated' }
      }

      // First try to create the user profile
      const result = await setupUserInBackend(user.id, user.email!, phone, fullName, session)
      return result.error ? { error: result.error } : {}
    } catch (error) {
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
