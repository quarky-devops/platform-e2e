// Supported countries for business risk assessments
export const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'IE', name: 'Ireland' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'NZ', name: 'New Zealand' }
] as const

// Request interface for creating business risk assessments
export interface CreateBusinessRiskAssessmentRequest {
  business_name: string
  domain: string
  industry: string
  geography: string
  assessment_type: 'Comprehensive' | 'Quick Scan'
  description?: string
}

// Business risk assessment interface
export interface BusinessRiskAssessment {
  id: string
  business_name: string
  domain: string
  industry: string
  geography: string
  assessment_type: 'Comprehensive' | 'Quick Scan'
  status: 'Completed' | 'In Progress' | 'Failed' | 'Pending'
  risk_level: 'Low' | 'Medium' | 'High' | 'Pending'
  risk_score: number
  findings: {
    critical_issues: number
    warnings: number
    recommendations: number
  }
  date_created: string
  last_updated: string
  description?: string
}

// Customer profile interface
export interface CustomerProfile {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  risk_score: number
  risk_level: 'Low' | 'Medium' | 'High'
  status: 'Active' | 'Flagged' | 'Blocked' | 'Pending'
  created_at: string
  last_assessment?: string
  order_history?: CustomerOrder[]
}

// Customer order interface
export interface CustomerOrder {
  id: string
  order_number: string
  amount: number
  currency: string
  status: 'Completed' | 'Pending' | 'Cancelled' | 'Refunded'
  created_at: string
  risk_indicators: string[]
}

// Business insights interface
export interface BusinessRiskInsights {
  total_assessments: number
  high_risk_businesses: number
  average_risk_score: number
  risk_trends: Array<{
    month: string
    score: number
  }>
  top_risk_categories: Array<{
    category: string
    count: number
    percentage: number
  }>
  success_rate: number
  processing_time_avg: number
}

// API response wrapper
export interface APIResponse<T> {
  data: T
  status: 'success' | 'error'
  message?: string
  error?: string
  code?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Website Risk Assessment types
export interface Assessment {
  id: number
  website: string
  country_code: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  risk_category?: 'low_risk' | 'med_risk' | 'high_risk'
  risk_score?: number
  results?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateAssessmentRequest {
  website: string
  country_code: string
  description?: string
}

// Error types for API responses
export interface APIError {
  code: string
  message: string
  status?: number
  details?: Record<string, any>
}

// Risk assessment categories
export const RISK_CATEGORIES = [
  'Financial Compliance',
  'Regulatory Issues', 
  'Business Verification',
  'Payment History',
  'Industry Risk',
  'Geographic Risk',
  'Operational Risk',
  'Legal Risk',
  'Reputational Risk',
  'Cybersecurity Risk'
] as const

// Assessment status types
export type AssessmentStatus = 'Completed' | 'In Progress' | 'Failed' | 'Pending'

// Risk level types
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Pending'

// Customer status types
export type CustomerStatus = 'Active' | 'Flagged' | 'Blocked' | 'Pending'

// Industries supported
export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Retail',
  'Manufacturing',
  'Education',
  'Real Estate',
  'Transportation',
  'Energy',
  'Media',
  'Telecommunications',
  'Agriculture',
  'Construction',
  'Professional Services',
  'Government',
  'Non-profit',
  'Other'
] as const

// Assessment types
export const ASSESSMENT_TYPES = [
  'Comprehensive',
  'Quick Scan'
] as const

// Lending risk assessment types
export interface LendingRiskAssessment {
  id: string
  borrower_name: string
  loan_amount: number
  loan_purpose: string
  credit_score?: number
  debt_to_income_ratio?: number
  employment_status: string
  annual_income: number
  risk_score: number
  risk_level: RiskLevel
  status: AssessmentStatus
  recommendation: 'Approve' | 'Reject' | 'Review'
  conditions?: string[]
  created_at: string
  updated_at: string
}

// Transaction monitoring types
export interface TransactionMonitoring {
  id: string
  transaction_id: string
  customer_id: string
  amount: number
  currency: string
  merchant: string
  transaction_type: string
  risk_score: number
  risk_flags: string[]
  status: 'Approved' | 'Declined' | 'Under Review' | 'Flagged'
  processed_at: string
  location?: {
    country: string
    city: string
    ip_address: string
  }
}

// Security log types
export interface SecurityLog {
  id: string
  event_type: 'Login' | 'Failed Login' | 'Assessment Created' | 'Data Access' | 'API Call' | 'System Alert'
  user_id?: string
  ip_address: string
  user_agent?: string
  details: Record<string, any>
  risk_level: 'Info' | 'Warning' | 'Critical'
  timestamp: string
}

// User Management & Multi-Tenant Types
export interface UserProfile {
  id: string
  email: string
  phone?: string  // Optional since users may not have added phone yet
  full_name: string
  company_name?: string
  company_size?: 'startup' | 'small' | 'medium' | 'enterprise'
  industry?: string
  country?: string
  timezone?: string
  avatar_url?: string
  phone_verified: boolean
  email_verified: boolean
  onboarding_completed: boolean
  signup_method: 'email' | 'google' | 'phone'
  created_at: string
  updated_at: string
  last_login_at?: string
  status: 'active' | 'suspended' | 'deleted'
  current_plan?: SubscriptionPlan
  credits?: UserCredits
}

export interface UserCredits {
  id: string
  user_id: string
  monthly_allocation: number
  subscription_credits: number
  recharged_credits: number
  bonus_credits: number
  used_credits: number
  total_credits: number
  available_credits: number
  last_reset_date?: string
  next_reset_date?: string
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: number
  plan_name: 'Free' | 'Startup' | 'Pro' | 'Enterprise'
  plan_type: 'free' | 'paid'
  monthly_credits: number
  yearly_credits?: number
  monthly_price: number
  yearly_price?: number
  overage_price_per_credit: number
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserSubscription {
  id: string
  user_id: string
  plan_id: number
  billing_cycle: 'monthly' | 'yearly'
  status: 'active' | 'cancelled' | 'expired' | 'suspended'
  start_date: string
  end_date?: string
  next_billing_date?: string
  auto_renew: boolean
  cancellation_reason?: string
  cancelled_at?: string
  created_at: string
  updated_at: string
}

// Phone Verification Types
export interface PhoneVerificationRequest {
  phone: string
}

export interface VerifyPhoneCodeRequest {
  phone: string
  code: string
}

export interface PhoneVerificationResponse {
  message: string
  code_sent: boolean
  expires_at: string
}

export interface PhoneVerificationResult {
  message: string
  phone_verified: boolean
  onboarding_completed: boolean
}

// Credit Transaction Types
export interface CreditTransaction {
  id: string
  user_id: string
  transaction_type: 'subscription_allocation' | 'recharge_purchase' | 'assessment_usage' | 'refund' | 'bonus' | 'monthly_reset'
  credit_change: number
  balance_before: number
  balance_after: number
  description: string
  assessment_id?: number
  metadata?: Record<string, any>
  created_at: string
}

// Onboarding Steps
export const ONBOARDING_STEPS = [
  { id: 'signup', name: 'Create Account', completed: false },
  { id: 'email_verify', name: 'Verify Email', completed: false },
  { id: 'phone_add', name: 'Add Phone Number', completed: false },
  { id: 'phone_verify', name: 'Verify Phone', completed: false },
  { id: 'profile_complete', name: 'Complete Profile', completed: false },
  { id: 'plan_select', name: 'Choose Plan', completed: false }
] as const

// Company Size Options
export const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small (11-50 employees)' },
  { value: 'medium', label: 'Medium (51-200 employees)' },
  { value: 'enterprise', label: 'Enterprise (200+ employees)' }
] as const
