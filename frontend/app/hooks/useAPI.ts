'use client'

import { useState, useEffect, useCallback } from 'react'

// Types
interface BusinessRiskInsights {
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
}

interface BusinessRiskAssessment {
  id: string
  business_name: string
  domain: string
  industry: string
  geography: string
  assessment_type: 'Comprehensive' | 'Quick Scan' | 'Focused'
  status: 'Completed' | 'In Progress' | 'Failed' | 'Pending'
  risk_level: 'Low' | 'Medium' | 'High'
  risk_score: number
  findings: {
    critical_issues: number
    warnings: number
    recommendations: number
  }
  last_updated: string
  created_at: string
}

interface CustomerProfile {
  id: string
  name: string
  email: string
  phone: string
  risk_score: number
  risk_level: 'Low' | 'Medium' | 'High'
  status: 'Active' | 'Flagged' | 'Blocked'
  created_at: string
}

interface APIResponse<T> {
  data: T
  status: 'success' | 'error'
  message?: string
}

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://platform-e2e.onrender.com'

// Generic API hook
function useAPI<T>(endpoint: string, dependencies: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`)
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      
      // Handle different response formats
      if (result.status === 'error') {
        throw new Error(result.message || 'API request failed')
      }
      
      // If result has data property, use it, otherwise use result directly
      setData(result.data || result)
    } catch (err) {
      console.error(`API Error for ${endpoint}:`, err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      
      // Provide mock data for development
      if (endpoint === '/api/business-risk-prevention/insights') {
        setData(getMockInsights() as T)
      } else if (endpoint === '/api/business-risk-prevention/assessments') {
        setData(getMockAssessments() as T)
      } else if (endpoint === '/api/customers') {
        setData(getMockCustomers() as T)
      }
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    fetchData()
  }, dependencies)

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

// Mock data generators for development
function getMockInsights(): BusinessRiskInsights {
  return {
    total_assessments: 1247,
    high_risk_businesses: 89,
    average_risk_score: 42.7,
    risk_trends: [
      { month: 'Jan 2025', score: 38.2 },
      { month: 'Feb 2025', score: 41.5 },
      { month: 'Mar 2025', score: 39.8 },
      { month: 'Apr 2025', score: 44.1 },
      { month: 'May 2025', score: 42.7 },
      { month: 'Jun 2025', score: 40.3 },
    ],
    top_risk_categories: [
      { category: 'Financial Compliance', count: 234, percentage: 28.5 },
      { category: 'Regulatory Issues', count: 186, percentage: 22.7 },
      { category: 'Business Verification', count: 145, percentage: 17.7 },
      { category: 'Payment History', count: 112, percentage: 13.6 },
      { category: 'Industry Risk', count: 89, percentage: 10.9 },
    ]
  }
}

function getMockAssessments(): BusinessRiskAssessment[] {
  return [
    {
      id: '1',
      business_name: 'TechStart Solutions Inc.',
      domain: 'techstart-solutions.com',
      industry: 'Technology',
      geography: 'US',
      assessment_type: 'Comprehensive',
      status: 'Completed',
      risk_level: 'Low',
      risk_score: 23.5,
      findings: {
        critical_issues: 0,
        warnings: 2,
        recommendations: 8
      },
      last_updated: '2024-12-15T11:45:00Z',
      created_at: '2024-12-15T10:30:00Z'
    },
    {
      id: '2',
      business_name: 'Global Commerce Ltd.',
      domain: 'globalcommerce.co.uk',
      industry: 'Retail',
      geography: 'GB',
      assessment_type: 'Comprehensive',
      status: 'Completed',
      risk_level: 'High',
      risk_score: 78.2,
      findings: {
        critical_issues: 4,
        warnings: 8,
        recommendations: 12
      },
      last_updated: '2024-12-14T16:10:00Z',
      created_at: '2024-12-14T14:20:00Z'
    },
    {
      id: '3',
      business_name: 'Digital Marketing Pro',
      domain: 'digitalmarketing-pro.com',
      industry: 'Media',
      geography: 'CA',
      assessment_type: 'Quick Scan',
      status: 'In Progress',
      risk_level: 'Medium',
      risk_score: 45.8,
      findings: {
        critical_issues: 1,
        warnings: 3,
        recommendations: 6
      },
      last_updated: '2024-12-13T09:15:00Z',
      created_at: '2024-12-13T09:15:00Z'
    },
    {
      id: '4',
      business_name: 'Retail Express Co.',
      domain: 'retailexpress.com',
      industry: 'Retail',
      geography: 'AU',
      assessment_type: 'Focused',
      status: 'Failed',
      risk_level: 'High',
      risk_score: 0,
      findings: {
        critical_issues: 0,
        warnings: 0,
        recommendations: 0
      },
      last_updated: '2024-12-12T16:47:00Z',
      created_at: '2024-12-12T16:45:00Z'
    },
    {
      id: '5',
      business_name: 'Innovation Labs',
      domain: 'innovation-labs.io',
      industry: 'Technology',
      geography: 'US',
      assessment_type: 'Comprehensive',
      status: 'Completed',
      risk_level: 'Medium',
      risk_score: 52.3,
      findings: {
        critical_issues: 2,
        warnings: 5,
        recommendations: 9
      },
      last_updated: '2024-12-11T12:20:00Z',
      created_at: '2024-12-11T11:30:00Z'
    },
    {
      id: '6',
      business_name: 'Secure Finance Group',
      domain: 'securefinancegroup.com',
      industry: 'Financial Services',
      geography: 'US',
      assessment_type: 'Comprehensive',
      status: 'Completed',
      risk_level: 'Low',
      risk_score: 18.9,
      findings: {
        critical_issues: 0,
        warnings: 1,
        recommendations: 5
      },
      last_updated: '2024-12-10T09:30:00Z',
      created_at: '2024-12-10T08:45:00Z'
    }
  ]
}

function getMockCustomers(): CustomerProfile[] {
  return [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-0123',
      risk_score: 15.2,
      risk_level: 'Low',
      status: 'Active',
      created_at: '2024-12-01T10:00:00Z'
    },
    {
      id: '2', 
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1-555-0456',
      risk_score: 72.8,
      risk_level: 'High',
      status: 'Flagged',
      created_at: '2024-12-02T14:30:00Z'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike.wilson@email.com', 
      phone: '+1-555-0789',
      risk_score: 43.5,
      risk_level: 'Medium',
      status: 'Active',
      created_at: '2024-12-03T09:15:00Z'
    },
    {
      id: '4',
      name: 'Emma Davis',
      email: 'emma.davis@email.com',
      phone: '+1-555-0321',
      risk_score: 89.1,
      risk_level: 'High', 
      status: 'Blocked',
      created_at: '2024-12-04T16:45:00Z'
    }
  ]
}

// Specific API hooks
export function useBusinessRiskInsights() {
  const { data: insights, loading, error, refetch } = useAPI<BusinessRiskInsights>('/api/business-risk-prevention/insights')
  
  return {
    insights,
    loading,
    error,
    refetch
  }
}

export function useBusinessRiskAssessments() {
  const { data: assessments, loading, error, refetch } = useAPI<BusinessRiskAssessment[]>('/api/business-risk-prevention/assessments')
  
  return {
    assessments: assessments || [],
    loading,
    error,
    refreshAssessments: refetch
  }
}

export function useCustomerProfiles() {
  const { data: customers, loading, error, refetch } = useAPI<CustomerProfile[]>('/api/customers')
  
  return {
    customers: customers || [],
    loading,
    error,
    refreshCustomers: refetch
  }
}

// Assessment creation hook
export function useCreateAssessment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createAssessment = useCallback(async (data: {
    business_name: string
    domain: string
    industry: string
    geography: string
    assessment_type: 'Comprehensive' | 'Quick Scan' | 'Focused'
  }) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/business-risk-prevention/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`Failed to create assessment: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (err) {
      console.error('Assessment creation error:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      
      // Mock response for development
      return {
        id: Date.now().toString(),
        ...data,
        status: 'In Progress',
        risk_level: 'Medium',
        risk_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createAssessment,
    loading,
    error
  }
}

// Customer risk assessment hook
export function useAssessCustomer() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const assessCustomer = useCallback(async (customerData: {
    name: string
    email: string
    phone: string
    address?: string
    order_history?: any[]
  }) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/customer-risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      })

      if (!response.ok) {
        throw new Error(`Customer assessment failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data
    } catch (err) {
      console.error('Customer assessment error:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      
      // Mock response for development
      const mockRiskScore = Math.random() * 100
      return {
        id: Date.now().toString(),
        ...customerData,
        risk_score: mockRiskScore,
        risk_level: mockRiskScore > 70 ? 'High' : mockRiskScore > 40 ? 'Medium' : 'Low',
        status: 'Active',
        created_at: new Date().toISOString()
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    assessCustomer,
    loading,
    error
  }
}

// Business risk assessment creation hook
export function useCreateBusinessRiskAssessment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createAssessment = useCallback(async (data: {
    business_name: string
    domain: string
    industry: string
    geography: string
    assessment_type: 'Comprehensive' | 'Quick Scan' | 'Focused'
  }) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/business-risk-prevention/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`Failed to create business assessment: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data || result
    } catch (err) {
      console.error('Business assessment creation error:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
      
      // Mock response for development
      const mockRiskScore = Math.random() * 100
      return {
        id: Date.now().toString(),
        business_name: data.business_name,
        domain: data.domain,
        industry: data.industry,
        geography: data.geography,
        assessment_type: data.assessment_type,
        status: 'In Progress',
        risk_level: mockRiskScore > 70 ? 'High' : mockRiskScore > 40 ? 'Medium' : 'Low',
        risk_score: mockRiskScore,
        findings: {
          critical_issues: Math.floor(Math.random() * 5),
          warnings: Math.floor(Math.random() * 10),
          recommendations: Math.floor(Math.random() * 15)
        },
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createAssessment,
    loading,
    error
  }
}
