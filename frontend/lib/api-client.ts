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

// API Configuration - supports both local development and production
const getApiUrl = () => {
  // For development, use local backend if available
  if (process.env.NODE_ENV === 'development') {
    // Check if we're explicitly configured for production backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && !apiUrl.includes('localhost')) {
      return apiUrl; // Use production backend URL from .env
    }
    return 'http://localhost:8082'; // Use local backend for development
  }
  
  // For production, use the environment variable or fallback
  return process.env.NEXT_PUBLIC_API_URL || 'https://platform-e2e.onrender.com'
}

// Get authentication token from AWS Cognito
const getAuthToken = async () => {
  if (typeof window === 'undefined') return null
  
  try {
    // For now, return null until Cognito is fully implemented
    // TODO: Implement Cognito token retrieval
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

class ProductionAPIClient {
  private client: AxiosInstance
  private requestQueue: Map<string, Promise<any>> = new Map()

  constructor() {
    this.client = axios.create({
      baseURL: getApiUrl(),
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        // Removed User-Agent header as browsers don't allow setting it manually
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token to all requests
    this.client.interceptors.request.use(
      async (config) => {
        // Add authentication token to requests
        const token = await getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
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
          console.log(`✅ API Response: ${response.status}`)
        }
        
        return response
      },
      (error: AxiosError) => {
        console.error(`❌ API Error: ${error.response?.status || 'Network Error'}`)
        
        return Promise.reject(this.formatError(error))
      }
    )
  }

  private formatError(error: AxiosError | Error): APIError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIResponse<any>>
      
      // Handle different error types
      if (!error.response) {
        // Network error
        return {
          message: 'Network error - please check your internet connection',
          code: 'NETWORK_ERROR',
          status: 0,
          details: { error: error.message }
        }
      }
      
      if (error.code === 'ECONNABORTED') {
        // Timeout error
        return {
          message: 'Request timed out - please try again',
          code: 'TIMEOUT_ERROR',
          status: 0,
          details: { error: 'Request exceeded 30 second timeout' }
        }
      }
      
      // API error response
      const response = axiosError.response
      const data = response?.data as any
      
      return {
        message: data?.error || data?.message || `HTTP ${response?.status} Error`,
        code: data?.code || `HTTP_${response?.status}`,
        status: response?.status,
        details: data
      }
    }
    
    // Generic error
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
        console.warn(`🔄 Retrying request... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`)
        await this.delay(RETRY_DELAY * (MAX_RETRIES - retries + 1)) // Exponential backoff
        return this.retryRequest(requestFn, retries - 1)
      }
      
      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Deduplication for identical requests
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
    return this.retryRequest(() => this.client.get('/ping'))
  }

  // Website Risk Assessment API
  async createAssessment(data: CreateAssessmentRequest): Promise<Assessment> {
    const requestKey = `assessment-${data.website}-${data.country_code}`
    
    return this.deduplicateRequest(requestKey, () => 
      this.retryRequest(() => this.client.post<Assessment>('/api/v1/assessments', data))
    )
  }

  async getAssessment(id: number): Promise<Assessment> {
    return this.retryRequest(() => this.client.get<Assessment>(`/api/v1/assessments/${id}`))
  }

  async listAssessments(params?: {
    limit?: number
    offset?: number
    status?: 'pending' | 'processing' | 'completed' | 'failed'
    country_code?: string
    risk_category?: 'low_risk' | 'med_risk' | 'high_risk'
  }): Promise<Assessment[]> {
    return this.retryRequest(() => this.client.get<Assessment[]>('/api/v1/assessments', { params }))
  }

  // Business Risk Prevention API
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

  async updateBusinessRiskAssessment(id: string, data: Partial<CreateBusinessRiskAssessmentRequest>): Promise<BusinessRiskAssessment> {
    return this.retryRequest(() => this.client.put<BusinessRiskAssessment>(`/api/business-risk-prevention/assessments/${id}`, data))
  }

  async deleteBusinessRiskAssessment(id: string): Promise<void> {
    await this.retryRequest(() => this.client.delete(`/api/business-risk-prevention/assessments/${id}`))
  }

  async bulkDeleteBusinessRiskAssessments(ids: string[]): Promise<void> {
    await this.retryRequest(() => this.client.delete('/api/business-risk-prevention/assessments/bulk', { data: { ids } }))
  }

  async rerunBusinessRiskAssessment(id: string): Promise<BusinessRiskAssessment> {
    return this.retryRequest(() => this.client.post<BusinessRiskAssessment>(`/api/business-risk-prevention/assessments/${id}/rerun`))
  }

  async getBusinessRiskInsights(): Promise<BusinessRiskInsights> {
    return this.retryRequest(() => this.client.get<BusinessRiskInsights>('/api/business-risk-prevention/insights'))
  }

  // Export Functions
  async exportBusinessRiskAssessmentsCSV(): Promise<Blob> {
    const response = await this.retryRequest(() => 
      this.client.get('/api/business-risk-prevention/export/csv', {
        responseType: 'blob'
      })
    )
    return response as unknown as Blob
  }

  async exportBusinessRiskAssessmentPDF(id: string): Promise<Blob> {
    const response = await this.retryRequest(() =>
      this.client.get(`/api/business-risk-prevention/assessments/${id}/export/pdf`, {
        responseType: 'blob'
      })
    )
    return response as unknown as Blob
  }

  // Website Risk Assessment API (migrated from Python/JS)
  async doWebsiteRiskAssessment(data: WebsiteRiskAssessmentRequest): Promise<WebsiteRiskAssessmentResponse> {
    const requestKey = `website-risk-${data.Website}-${data.BillingCountryCode}`
    
    return this.deduplicateRequest(requestKey, () => 
      this.retryRequest(() => this.client.post<WebsiteRiskAssessmentResponse>('/api/website-risk-assessment/do-assessment', data))
    )
  }

  async getWebsiteRiskAssessment(data: GetWebsiteRiskAssessmentRequest): Promise<any> {
    return this.retryRequest(() => this.client.post('/api/website-risk-assessment/get-assessment', data))
  }

  async updateWebsiteRiskQualification(data: ManualQualificationUpdateRequest): Promise<any> {
    return this.retryRequest(() => this.client.post('/api/website-risk-assessment/manual-update', data))
  }

  async listWebsiteRiskAssessments(): Promise<any[]> {
    return this.retryRequest(() => this.client.get('/api/website-risk-assessment/assessments'))
  }

  async getWebsiteRiskAssessmentById(id: string): Promise<any> {
    return this.retryRequest(() => this.client.get(`/api/website-risk-assessment/assessments/${id}`))
  }

  // User Management & Authentication API
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

  // Phone Verification API
  async sendPhoneVerification(phone: string): Promise<{ message: string; code_sent: boolean; expires_at: string }> {
    return this.retryRequest(() => this.client.post('/api/auth/send-phone-verification', { phone }))
  }

  async verifyPhoneCode(phone: string, code: string): Promise<{ message: string; phone_verified: boolean; onboarding_completed: boolean }> {
    return this.retryRequest(() => this.client.post('/api/auth/verify-phone-code', { phone, code }))
  }

  async updatePhoneNumber(phone: string): Promise<{ message: string; phone: string; phone_verified: boolean }> {
    return this.retryRequest(() => this.client.put('/api/auth/phone', { phone }))
  }

  // User Setup (for post-Supabase auth)
  async createUser(data: { user_id: string; email: string; phone?: string; full_name: string }): Promise<{ message: string; user_id: string; email: string }> {
    return this.retryRequest(() => this.client.post('/api/auth/users', data))
  }

  async verifyToken(): Promise<{ valid: boolean; user_id?: string; email?: string }> {
    return this.retryRequest(() => this.client.get('/api/auth/verify'))
  }

  // Utility Methods
  getRiskCategoryLabel(category: string): string {
    switch (category) {
      case 'low_risk':
        return 'Low Risk'
      case 'med_risk':
        return 'Medium Risk'  
      case 'high_risk':
        return 'High Risk'
      default:
        return 'Unknown'
    }
  }

  getRiskCategoryColor(category: string): string {
    switch (category) {
      case 'low_risk':
        return 'green'
      case 'med_risk':
        return 'yellow'
      case 'high_risk':
        return 'red'
      default:
        return 'gray'
    }
  }

  getBusinessRiskLevelColor(level: string): string {
    switch (level) {
      case 'Low':
        return 'green'
      case 'Medium':
        return 'yellow'
      case 'High':
        return 'red'
      case 'Pending':
        return 'gray'
      default:
        return 'gray'
    }
  }

  // Assessment Status Polling
  async pollAssessmentStatus(
    id: number, 
    onUpdate?: (assessment: Assessment) => void,
    maxAttempts: number = 60, // 2 minutes max
    intervalMs: number = 2000 // 2 seconds
  ): Promise<Assessment> {
    let attempts = 0
    
    while (attempts < maxAttempts) {
      try {
        const assessment = await this.getAssessment(id)
        
        if (onUpdate) {
          onUpdate(assessment)
        }
        
        if (assessment.status === 'completed' || assessment.status === 'failed') {
          return assessment
        }
        
        await this.delay(intervalMs)
        attempts++
      } catch (error) {
        console.warn(`Polling attempt ${attempts + 1} failed:`, error)
        attempts++
        
        if (attempts < maxAttempts) {
          await this.delay(intervalMs)
        } else {
          throw error
        }
      }
    }
    
    throw new Error('Assessment polling timed out after 2 minutes')
  }
}

// Export singleton instance
export const apiClient = new ProductionAPIClient()
export { ProductionAPIClient }
