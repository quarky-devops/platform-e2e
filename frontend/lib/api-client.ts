// AWS-Based API Client for QuarkfinAI Platform
// Complete AWS integration - no Supabase, no Render.com

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios'
import {
  APIResponse,
  APIError,
  Assessment,
  CreateAssessmentRequest,
  BusinessRiskAssessment,
  CreateBusinessRiskAssessmentRequest,
  BusinessRiskInsights,
  UserProfile,
  UserCredits,
  SubscriptionPlan
} from './types'

// AWS API Configuration - Production ready
const getApiUrl = () => {
  // Development: Use local backend
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  }
  
  // Production: Use CloudFront distribution for API
  return process.env.NEXT_PUBLIC_API_URL || '/api'
}

// Get authentication token from AWS Cognito
const getAuthToken = async () => {
  if (typeof window === 'undefined') return null
  
  try {
    // TODO: Implement AWS Cognito token retrieval
    // For now, return mock token for development
    if (process.env.NODE_ENV === 'development') {
      return 'mock-dev-token'
    }
    
    // Production: Get from Cognito session
    // const token = await getCognitoAccessToken()
    return null
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

const API_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Website Risk Assessment types
interface WebsiteRiskAssessmentRequest {
  Website: string
  Id: string
  BillingCountryCode: string
  Description?: string
  Annual_Revenue__c?: string
  CB_SIC_Code__c?: string
  CB_Pay_Method__c?: string
}

interface WebsiteRiskAssessmentResponse {
  status: string
  website: string
  id: string
}

interface GetWebsiteRiskAssessmentRequest {
  website: string
}

interface ManualQualificationUpdateRequest {
  website: string
  qualification_status: 'Qualified' | 'Not Qualified'
}

class AWSAPIClient {
  private client: AxiosInstance
  private requestQueue: Map<string, Promise<any>> = new Map()

  constructor() {
    this.client = axios.create({
      baseURL: getApiUrl(),
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Platform': 'QuarkfinAI-Web'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token to all requests
    this.client.interceptors.request.use(
      async (config) => {
        // Add AWS Cognito authentication token
        const token = await getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Add AWS request headers
        config.headers['X-Requested-With'] = 'XMLHttpRequest'
        
        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 AWS API Request: ${config.method?.toUpperCase()} ${config.url}`)
        }
        
        return config
      },
      (error) => {
        console.error('❌ Request Error:', error)
        return Promise.reject(this.formatError(error))
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ AWS API Response: ${response.status}`)
        }
        
        return response
      },
      (error: AxiosError) => {
        console.error(`❌ AWS API Error: ${error.response?.status || 'Network Error'}`)
        
        return Promise.reject(this.formatError(error))
      }
    )
  }

  private formatError(error: AxiosError | Error): APIError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIResponse<any>>
      
      // Handle different error types
      if (!error.response) {
        return {
          message: 'Network error - please check your internet connection',
          code: 'NETWORK_ERROR',
          status: 0,
          details: { error: error.message }
        }
      }
      
      if (error.code === 'ECONNABORTED') {
        return {
          message: 'Request timed out - please try again',
          code: 'TIMEOUT_ERROR',
          status: 0,
          details: { error: 'Request exceeded 30 second timeout' }
        }
      }
      
      // AWS API error response
      const response = axiosError.response
      const data = response?.data as any
      
      return {
        message: data?.error || data?.message || `HTTP ${response?.status} Error`,
        code: data?.code || `HTTP_${response?.status}`,
        status: response?.status,
        details: data
      }
    }
    
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      details: { error: error.message }
    }
  }

  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retries: number = MAX_RETRIES
  ): Promise<T> {
    try {
      const response = await requestFn()
      return response.data
    } catch (error) {
      const apiError = error as APIError
      
      // Don't retry client errors (4xx) or specific server errors
      const shouldRetry = retries > 0 && 
        apiError.status !== 400 && 
        apiError.status !== 401 && 
        apiError.status !== 403 && 
        apiError.status !== 404 &&
        apiError.code !== 'TIMEOUT_ERROR'
      
      if (shouldRetry) {
        console.warn(`🔄 Retrying AWS API request... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`)
        await this.delay(RETRY_DELAY * (MAX_RETRIES - retries + 1))
        return this.retryRequest(requestFn, retries - 1)
      }
      
      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key) as Promise<T>
    }

    const request = requestFn().finally(() => {
      this.requestQueue.delete(key)
    })

    this.requestQueue.set(key, request)
    return request
  }

  // Health Check
  async healthCheck(): Promise<{ message: string; status: string }> {
    return this.retryRequest(() => this.client.get('/health'))
  }

  // Business Risk Assessment API (Primary Product)
  async createBusinessRiskAssessment(data: CreateBusinessRiskAssessmentRequest): Promise<BusinessRiskAssessment> {
    const requestKey = `business-risk-${data.domain}-${data.assessment_type}`
    
    return this.deduplicateRequest(requestKey, () =>
      this.retryRequest(() => this.client.post<BusinessRiskAssessment>('/api/business-risk-prevention/assessments', data))
    )
  }

  async getBusinessRiskAssessment(id: string): Promise<BusinessRiskAssessment> {
    return this.retryRequest(() => this.client.get<BusinessRiskAssessment>(`/api/business-risk-prevention/assessments/${id}`))
  }

  async listBusinessRiskAssessments(): Promise<BusinessRiskAssessment[]> {
    return this.retryRequest(() => this.client.get<BusinessRiskAssessment[]>('/api/business-risk-prevention/assessments'))
  }

  async rerunBusinessRiskAssessment(id: string): Promise<BusinessRiskAssessment> {
    return this.retryRequest(() => this.client.post<BusinessRiskAssessment>(`/api/business-risk-prevention/assessments/${id}/rerun`))
  }

  async getBusinessRiskInsights(): Promise<BusinessRiskInsights> {
    return this.retryRequest(() => this.client.get<BusinessRiskInsights>('/api/business-risk-prevention/insights'))
  }

  // AWS Cognito Authentication API
  async getUserProfile(): Promise<UserProfile> {
    return this.retryRequest(() => this.client.get<UserProfile>('/api/auth/profile'))
  }

  async updateUserProfile(data: Partial<UserProfile>): Promise<{ message: string }> {
    return this.retryRequest(() => this.client.put<{ message: string }>('/api/auth/profile', data))
  }

  async getUserCredits(): Promise<UserCredits> {
    return this.retryRequest(() => this.client.get<UserCredits>('/api/auth/credits'))
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.retryRequest(() => this.client.get<SubscriptionPlan[]>('/api/auth/plans'))
  }

  // AWS SNS Phone Verification
  async sendPhoneVerification(phone: string): Promise<{ message: string; code_sent: boolean; expires_at: string }> {
    return this.retryRequest(() => this.client.post('/api/auth/send-phone-verification', { phone }))
  }

  async verifyPhoneCode(phone: string, code: string): Promise<{ message: string; phone_verified: boolean; onboarding_completed: boolean }> {
    return this.retryRequest(() => this.client.post('/api/auth/verify-phone-code', { phone, code }))
  }

  // PayU Payment Integration
  async createPayment(data: { plan_id: string; billing_cycle: 'monthly' | 'yearly' }): Promise<{ payment_url: string; order_id: string }> {
    return this.retryRequest(() => this.client.post('/api/payments/create', data))
  }

  async verifyPayment(order_id: string): Promise<{ status: string; credits_added: number }> {
    return this.retryRequest(() => this.client.post('/api/payments/verify', { order_id }))
  }

  // Utility Methods for AWS-based platform
  getRiskCategoryLabel(category: string): string {
    switch (category) {
      case 'low_risk': return 'Low Risk'
      case 'med_risk': return 'Medium Risk'  
      case 'high_risk': return 'High Risk'
      default: return 'Unknown'
    }
  }

  getRiskCategoryColor(category: string): string {
    switch (category) {
      case 'low_risk': return 'green'
      case 'med_risk': return 'yellow'
      case 'high_risk': return 'red'
      default: return 'gray'
    }
  }
}

// Export singleton instance
export const apiClient = new AWSAPIClient()
export { AWSAPIClient }
