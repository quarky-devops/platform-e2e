// AWS Cognito Authentication System - Production Grade
// Complete replacement for Supabase auth with proper error handling

import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserAttribute } from 'amazon-cognito-identity-js'
import { config, isDevelopmentMode } from './config'

// Initialize Cognito User Pool
let userPool: CognitoUserPool | null = null

const getUserPool = () => {
  if (!userPool && config.aws.cognitoUserPoolId && config.aws.cognitoClientId) {
    userPool = new CognitoUserPool({
      UserPoolId: config.aws.cognitoUserPoolId,
      ClientId: config.aws.cognitoClientId
    })
  }
  return userPool
}

// AWS Cognito Auth Client
export const auth = {
  async signIn(email: string, password: string) {
    console.log('🔐 AWS Cognito Sign In:', email)
    
    if (isDevelopmentMode) {
      console.warn('⚠️ Development mode: Auth not configured')
      throw new Error('Authentication not configured. Please set AWS Cognito environment variables.')
    }

    const pool = getUserPool()
    if (!pool) {
      throw new Error('AWS Cognito not initialized. Check environment configuration.')
    }

    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: email,
        Pool: pool
      })

      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password
      })

      user.authenticateUser(authDetails, {
        onSuccess: (session) => {
          console.log('✅ Cognito sign in successful')
          resolve({
            user: {
              id: session.getIdToken().payload.sub,
              email: session.getIdToken().payload.email
            },
            session: {
              access_token: session.getAccessToken().getJwtToken(),
              id_token: session.getIdToken().getJwtToken(),
              refresh_token: session.getRefreshToken().getToken()
            }
          })
        },
        onFailure: (error) => {
          console.error('❌ Cognito sign in failed:', error)
          reject(error)
        }
      })
    })
  },

  async signUp(email: string, password: string, metadata?: { [key: string]: any }) {
    console.log('📝 AWS Cognito Sign Up:', email)
    
    if (isDevelopmentMode) {
      throw new Error('Authentication not configured. Please set AWS Cognito environment variables.')
    }

    const pool = getUserPool()
    if (!pool) {
      throw new Error('AWS Cognito not initialized. Check environment configuration.')
    }

    const attributes = [
      new CognitoUserAttribute({ Name: 'email', Value: email })
    ]

    if (metadata?.phone) {
      attributes.push(new CognitoUserAttribute({ Name: 'phone_number', Value: metadata.phone }))
    }

    if (metadata?.full_name) {
      attributes.push(new CognitoUserAttribute({ Name: 'name', Value: metadata.full_name }))
    }

    return new Promise((resolve, reject) => {
      pool.signUp(email, password, attributes, [], (error, result) => {
        if (error) {
          console.error('❌ Cognito sign up failed:', error)
          reject(error)
          return
        }

        console.log('✅ Cognito sign up successful')
        resolve({
          user: result?.user ? {
            id: result.userSub,
            email: email
          } : null,
          session: null // User needs to confirm email first
        })
      })
    })
  },

  async signInWithGoogle() {
    console.log('🔗 AWS Cognito Google OAuth')
    
    if (isDevelopmentMode) {
      throw new Error('Google OAuth not available in development mode')
    }
    
    // Redirect to Cognito hosted UI for Google OAuth
    const hostedUIUrl = `https://auth.${config.aws.region}.amazoncognito.com/login?client_id=${config.aws.cognitoClientId}&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback')}`
    
    window.location.href = hostedUIUrl
    return { url: hostedUIUrl }
  },

  async signOut() {
    console.log('👋 AWS Cognito Sign Out')
    
    const pool = getUserPool()
    if (!pool) return

    const user = pool.getCurrentUser()
    if (user) {
      user.signOut()
    }
  },

  async getUser() {
    console.log('👤 Getting current user from Cognito')
    
    const pool = getUserPool()
    if (!pool) return null

    const user = pool.getCurrentUser()
    if (!user) return null

    return new Promise((resolve, reject) => {
      user.getSession((error: any, session: any) => {
        if (error) {
          resolve(null)
          return
        }

        user.getUserAttributes((error, attributes) => {
          if (error) {
            resolve(null)
            return
          }

          const userInfo = {
            id: session.getIdToken().payload.sub,
            email: session.getIdToken().payload.email,
            email_verified: session.getIdToken().payload.email_verified,
            phone_number: session.getIdToken().payload.phone_number
          }

          resolve(userInfo)
        })
      })
    })
  },

  async getSession(): Promise<{
    access_token: string;
    id_token: string;
    refresh_token: string;
    user: {
      id: string;
      email: string;
    };
  } | null> {
    console.log('🎫 Getting current session from Cognito')
    
    const pool = getUserPool()
    if (!pool) return null

    const user = pool.getCurrentUser()
    if (!user) return null

    return new Promise((resolve) => {
      user.getSession((error: any, session: any) => {
        if (error || !session) {
          resolve(null)
          return
        }

        resolve({
          access_token: session.getAccessToken().getJwtToken(),
          id_token: session.getIdToken().getJwtToken(),
          refresh_token: session.getRefreshToken().getToken(),
          user: {
            id: session.getIdToken().payload.sub,
            email: session.getIdToken().payload.email
          }
        })
      })
    })
  },

  async resetPassword(email: string) {
    console.log('🔄 AWS Cognito Password Reset:', email)
    
    if (isDevelopmentMode) {
      throw new Error('Password reset not available in development mode')
    }

    const pool = getUserPool()
    if (!pool) {
      throw new Error('AWS Cognito not initialized')
    }

    const user = new CognitoUser({
      Username: email,
      Pool: pool
    })

    return new Promise((resolve, reject) => {
      user.forgotPassword({
        onSuccess: (data) => {
          console.log('✅ Password reset code sent')
          resolve(data)
        },
        onFailure: (error) => {
          console.error('❌ Password reset failed:', error)
          reject(error)
        }
      })
    })
  },

  // AWS SNS Phone Verification (via backend API)
  async sendPhoneOTP(phone: string) {
    console.log('📱 Sending phone OTP via AWS SNS:', phone)
    
    try {
      const apiUrl = config.api.baseUrl === '/api' && process.env.NODE_ENV === 'development'
        ? 'http://localhost:8080'
        : config.api.baseUrl

      const response = await fetch(`${apiUrl}/auth/send-phone-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone })
      })

      if (!response.ok) {
        throw new Error('Failed to send verification code')
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Phone verification error:', error)
      throw error
    }
  },

  async verifyPhoneOTP(phone: string, token: string) {
    console.log('✅ Verifying phone OTP via AWS SNS:', phone)
    
    try {
      const apiUrl = config.api.baseUrl === '/api' && process.env.NODE_ENV === 'development'
        ? 'http://localhost:8080'
        : config.api.baseUrl

      const response = await fetch(`${apiUrl}/auth/verify-phone-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code: token })
      })

      if (!response.ok) {
        throw new Error('Failed to verify phone code')
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Phone verification error:', error)
      throw error
    }
  }
}

// Placeholder supabase export to prevent import errors
export const supabase = {
  auth: {
    onAuthStateChange: () => ({ 
      data: { 
        subscription: {
          unsubscribe: () => {}
        }
      } 
    }),
    getSession: () => Promise.resolve({ data: { session: null } })
  }
}

// Export configuration for compatibility
export const cognitoConfig = config.aws
