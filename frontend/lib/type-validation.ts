// Type validation for production deployment
// This file ensures all interfaces are properly defined and consistent

import type { 
  UserProfile, 
  UserCredits, 
  SubscriptionPlan,
  PhoneVerificationRequest,
  PhoneVerificationResponse 
} from './types'

// Compile-time type checks
type RequiredUserProfileFields = Pick<UserProfile, 'id' | 'email' | 'full_name' | 'phone_verified' | 'email_verified' | 'onboarding_completed'>
type OptionalUserProfileFields = Pick<UserProfile, 'phone' | 'company_name' | 'company_size' | 'industry' | 'country'>

// Ensure UserProfile has all required fields for settings page
export type SettingsUserProfile = RequiredUserProfileFields & OptionalUserProfileFields

// Type guards for runtime validation
export const isValidUserProfile = (obj: any): obj is UserProfile => {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.full_name === 'string' &&
    typeof obj.phone_verified === 'boolean' &&
    typeof obj.email_verified === 'boolean' &&
    typeof obj.onboarding_completed === 'boolean' &&
    (obj.phone === undefined || typeof obj.phone === 'string') &&
    (obj.company_name === undefined || typeof obj.company_name === 'string') &&
    (obj.company_size === undefined || ['startup', 'small', 'medium', 'enterprise'].includes(obj.company_size)) &&
    (obj.industry === undefined || typeof obj.industry === 'string') &&
    (obj.country === undefined || typeof obj.country === 'string')
  )
}

// Runtime assertion for development
export const assertUserProfile = (obj: any, context: string = 'unknown'): UserProfile => {
  if (!isValidUserProfile(obj)) {
    console.error(`Invalid UserProfile in ${context}:`, obj)
    throw new Error(`Invalid UserProfile structure in ${context}`)
  }
  return obj
}

// Company size validation
export const VALID_COMPANY_SIZES = ['startup', 'small', 'medium', 'enterprise'] as const
export type CompanySize = typeof VALID_COMPANY_SIZES[number]

export const isValidCompanySize = (size: string): size is CompanySize => {
  return VALID_COMPANY_SIZES.includes(size as CompanySize)
}

// Production-ready defaults
export const getDefaultUserProfile = (): Partial<UserProfile> => ({
  phone: '',
  company_name: '',
  company_size: undefined,
  industry: '',
  country: '',
  phone_verified: false,
  email_verified: false,
  onboarding_completed: false,
  signup_method: 'email',
  status: 'active'
})

// For settings page specifically
export const getUserProfileForSettings = (profile: UserProfile | null): SettingsUserProfile | null => {
  if (!profile) return null
  
  // Ensure all expected fields exist
  return {
    ...profile,
    phone: profile.phone || '',
    company_name: profile.company_name || '',
    company_size: profile.company_size || undefined,
    industry: profile.industry || '',
    country: profile.country || ''
  }
}
