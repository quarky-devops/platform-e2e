import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '../lib/api-client'
import {
  Assessment,
  CreateAssessmentRequest,
  BusinessRiskAssessment,
  CreateBusinessRiskAssessmentRequest,
  BusinessRiskInsights,
  APIError
} from '../lib/types'

// Common hook state type
interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: APIError | null
}

// Generic async hook
function useAsyncState<T>(initialData: T | null = null): [
  AsyncState<T>,
  {
    setLoading: (loading: boolean) => void
    setData: (data: T | null) => void
    setError: (error: APIError | null) => void
    reset: () => void
  }
] {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null
  })

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }))
  }, [])

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data, loading: false, error: null }))
  }, [])

  const setError = useCallback((error: APIError | null) => {
    setState(prev => ({ ...prev, error, loading: false }))
  }, [])

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null })
  }, [initialData])

  return [state, { setLoading, setData, setError, reset }]
}

// Website Risk Assessment Hooks
export function useAssessments() {
  const [state, { setLoading, setData, setError }] = useAsyncState<Assessment[]>([])

  const fetchAssessments = useCallback(async (params?: {
    limit?: number
    offset?: number
    status?: 'pending' | 'processing' | 'completed' | 'failed'
    country_code?: string
    risk_category?: 'low_risk' | 'med_risk' | 'high_risk'
  }) => {
    try {
      setLoading(true)
      const assessments = await apiClient.listAssessments(params)
      setData(assessments)
    } catch (error) {
      setError(error as APIError)
    }
  }, [setLoading, setData, setError])

  const refreshAssessments = useCallback(() => {
    fetchAssessments()
  }, [fetchAssessments])

  // Auto-fetch on mount
  useEffect(() => {
    fetchAssessments()
  }, [fetchAssessments])

  return {
    assessments: state.data || [],
    loading: state.loading,
    error: state.error,
    fetchAssessments,
    refreshAssessments
  }
}

export function useAssessment(id: number | null) {
  const [state, { setLoading, setData, setError }] = useAsyncState<Assessment>()

  const fetchAssessment = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      const assessment = await apiClient.getAssessment(id)
      setData(assessment)
    } catch (error) {
      setError(error as APIError)
    }
  }, [id, setLoading, setData, setError])

  useEffect(() => {
    fetchAssessment()
  }, [fetchAssessment])

  return {
    assessment: state.data,
    loading: state.loading,
    error: state.error,
    refetch: fetchAssessment
  }
}

export function useCreateAssessment() {
  const [state, { setLoading, setData, setError, reset }] = useAsyncState<Assessment>()

  const createAssessment = useCallback(async (data: CreateAssessmentRequest) => {
    try {
      setLoading(true)
      const assessment = await apiClient.createAssessment(data)
      setData(assessment)
      return assessment
    } catch (error) {
      setError(error as APIError)
      throw error
    }
  }, [setLoading, setData, setError])

  return {
    assessment: state.data,
    loading: state.loading,
    error: state.error,
    createAssessment,
    reset
  }
}

// Assessment Polling Hook
export function useAssessmentPolling(id: number | null) {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<APIError | null>(null)
  const pollingRef = useRef<boolean>(false)

  const startPolling = useCallback(async () => {
    if (!id || pollingRef.current) return

    try {
      pollingRef.current = true
      setLoading(true)
      setError(null)

      const finalAssessment = await apiClient.pollAssessmentStatus(
        id,
        (updatedAssessment) => {
          setAssessment(updatedAssessment)
        }
      )

      setAssessment(finalAssessment)
    } catch (err) {
      setError(err as APIError)
    } finally {
      setLoading(false)
      pollingRef.current = false
    }
  }, [id])

  const stopPolling = useCallback(() => {
    pollingRef.current = false
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pollingRef.current = false
    }
  }, [])

  return {
    assessment,
    loading,
    error,
    startPolling,
    stopPolling,
    isPolling: pollingRef.current
  }
}

// Business Risk Assessment Hooks
export function useBusinessRiskAssessments() {
  const [state, { setLoading, setData, setError }] = useAsyncState<BusinessRiskAssessment[]>([])

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true)
      const assessments = await apiClient.listBusinessRiskAssessments()
      setData(assessments)
    } catch (error) {
      console.error('Failed to fetch business risk assessments:', error)
      setError(error as APIError)
      // Don't set empty array on error - let the UI handle the error state
    }
  }, [setLoading, setData, setError])

  const refreshAssessments = useCallback(() => {
    fetchAssessments()
  }, [fetchAssessments])

  useEffect(() => {
    fetchAssessments()
  }, [fetchAssessments])

  return {
    assessments: state.data || [],
    loading: state.loading,
    error: state.error,
    fetchAssessments,
    refreshAssessments
  }
}

export function useBusinessRiskAssessment(id: string | null) {
  const [state, { setLoading, setData, setError }] = useAsyncState<BusinessRiskAssessment>()

  const fetchAssessment = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      const assessment = await apiClient.getBusinessRiskAssessment(id)
      setData(assessment)
    } catch (error) {
      setError(error as APIError)
    }
  }, [id, setLoading, setData, setError])

  useEffect(() => {
    fetchAssessment()
  }, [fetchAssessment])

  return {
    assessment: state.data,
    loading: state.loading,
    error: state.error,
    refetch: fetchAssessment
  }
}

export function useCreateBusinessRiskAssessment() {
  const [state, { setLoading, setData, setError, reset }] = useAsyncState<BusinessRiskAssessment>()

  const createAssessment = useCallback(async (data: CreateBusinessRiskAssessmentRequest) => {
    try {
      setLoading(true)
      const assessment = await apiClient.createBusinessRiskAssessment(data)
      setData(assessment)
      return assessment
    } catch (error) {
      setError(error as APIError)
      throw error
    }
  }, [setLoading, setData, setError])

  return {
    assessment: state.data,
    loading: state.loading,
    error: state.error,
    createAssessment,
    reset
  }
}

export function useBusinessRiskInsights() {
  const [state, { setLoading, setData, setError }] = useAsyncState<BusinessRiskInsights>()

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true)
      const insights = await apiClient.getBusinessRiskInsights()
      setData(insights)
    } catch (error) {
      setError(error as APIError)
    }
  }, [setLoading, setData, setError])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  return {
    insights: state.data,
    loading: state.loading,
    error: state.error,
    refetch: fetchInsights
  }
}

// Health Check Hook
export function useAPIHealth() {
  const [state, { setLoading, setData, setError }] = useAsyncState<{ message: string; status: string }>()

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true)
      const health = await apiClient.healthCheck()
      setData(health)
    } catch (error) {
      setError(error as APIError)
    }
  }, [setLoading, setData, setError])

  return {
    health: state.data,
    loading: state.loading,
    error: state.error,
    checkHealth
  }
}

// Export Hooks
export function useExportCSV() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<APIError | null>(null)

  const exportCSV = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const blob = await apiClient.exportBusinessRiskAssessmentsCSV()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `business-risk-assessments-${new Date().toISOString().split('T')[0]}.csv`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (err) {
      setError(err as APIError)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    exportCSV,
    loading,
    error
  }
}

export function useExportPDF() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<APIError | null>(null)

  const exportPDF = useCallback(async (id: string, filename?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const blob = await apiClient.exportBusinessRiskAssessmentPDF(id)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename || `business-risk-assessment-${id}.pdf`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (err) {
      setError(err as APIError)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    exportPDF,
    loading,
    error
  }
}
