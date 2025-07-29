// Force TypeScript to rebuild - Frontend Deployment Fix
// This file forces TypeScript to recognize updated types

import { UserProfile } from '../lib/types'

// Ensure UserProfile includes all required fields for settings page
type SettingsUserProfile = UserProfile & {
  company_size?: 'startup' | 'small' | 'medium' | 'enterprise'
  company_name?: string
  industry?: string
  country?: string
}

export type { SettingsUserProfile }

// This export ensures the types are properly recognized
export const ensureUserProfileFields = (profile: UserProfile): SettingsUserProfile => {
  return {
    ...profile,
    company_size: profile.company_size || undefined,
    company_name: profile.company_name || undefined,
    industry: profile.industry || undefined,
    country: profile.country || undefined,
  }
}
