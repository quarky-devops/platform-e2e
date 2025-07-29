'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Clock, AlertCircle, Loader2, RefreshCw } from 'lucide-react'

interface AssessmentStatusProps {
  website: string
  assessmentId?: string
  onComplete?: (result: any) => void
}

export function AssessmentStatus({ website, assessmentId, onComplete }: AssessmentStatusProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  const checkStatus = async () => {
    try {
      const response = await fetch('https://platform-e2e.onrender.com/api/website-risk-assessment/get-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ website })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setLastChecked(new Date())
      
      if (data.status === 'completed') {
        setStatus('completed')
        setResult(data)
        onComplete?.(data)
      } else if (data.status === 'failed') {
        setStatus('failed')
        setError('Assessment failed')
      } else {
        setStatus('processing')
        // Continue polling
        setTimeout(checkStatus, 5000) // Check again in 5 seconds
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('failed')
    }
  }

  useEffect(() => {
    if (website) {
      checkStatus()
    }
  }, [website])

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Assessment submitted, waiting to start...'
      case 'processing':
        return 'Assessment in progress...'
      case 'completed':
        return 'Assessment completed!'
      case 'failed':
        return 'Assessment failed'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'processing':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800'
    }
  }

  return (
    <div className={`p-4 border rounded-lg ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold">Assessment Status</h3>
            <p className="text-sm">{getStatusText()}</p>
            <p className="text-xs opacity-75">
              Website: {website}
            </p>
            {lastChecked && (
              <p className="text-xs opacity-75">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        
        {status === 'processing' && (
          <button
            onClick={checkStatus}
            className="flex items-center space-x-1 text-sm hover:opacity-75"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {result && status === 'completed' && (
        <div className="mt-4 p-3 bg-white border rounded">
          <h4 className="font-semibold mb-2">Assessment Results</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Risk Score:</span> {result.risk_score || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Status:</span> {result.status}
            </div>
            <div>
              <span className="font-medium">MCC Code:</span> {result.mcc_details?.mcc_code || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Country Supported:</span> {result.merchant_business?.country_supported ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 