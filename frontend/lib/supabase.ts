import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url') {
  throw new Error('Missing Supabase environment variables. Please update your .env file with real Supabase credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const auth = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },

  // Sign up with email and password
  async signUp(email: string, password: string, metadata?: { [key: string]: any }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    
    if (error) throw error
    // Return the data object which contains session and user
    return data
  },

  // Sign in with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/platform`
      }
    })
    
    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) throw error
  },

  // Send OTP to phone using our AWS SNS backend
  async sendPhoneOTP(phone: string) {
    console.log('Sending phone verification via AWS SNS backend:', phone)
    
    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('User must be signed in to verify phone')
      }

      // Use our production AWS SNS API
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8082'  // Using 8082 due to port conflict
        : process.env.NEXT_PUBLIC_API_URL

      const response = await fetch(`${apiUrl}/api/auth/send-phone-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ phone })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to send verification code')
      }

      console.log('✅ SMS sent successfully via AWS SNS:', result)
      return result
      
    } catch (error) {
      console.error('❌ Phone verification error:', error)
      throw error
    }
  },

  // Verify phone OTP using our AWS SNS backend
  async verifyPhoneOTP(phone: string, token: string) {
    console.log('Verifying phone code via AWS SNS backend:', phone, 'Code:', token)
    
    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('User must be signed in to verify phone')
      }

      // Use our production AWS SNS API
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8082'  // Using 8082 due to port conflict
        : process.env.NEXT_PUBLIC_API_URL

      const response = await fetch(`${apiUrl}/api/auth/verify-phone-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ phone, code: token })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to verify phone code')
      }

      console.log('✅ Phone verified successfully via AWS SNS:', result)
      return result
      
    } catch (error) {
      console.error('❌ Phone verification error:', error)
      throw error
    }
  }
}
