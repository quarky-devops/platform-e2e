'use client'

import { useState } from 'react'
import { apiClient } from '../lib/api-client'
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'

interface TestResult {
  test: string
  status: 'pending' | 'success' | 'error'
  message: string
  duration?: number
}

export function APITestComponent() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    setTests([])

    const testSuite: Array<{
      name: string
      fn: () => Promise<any>
    }> = [
      {
        name: 'Health Check',
        fn: () => apiClient.healthCheck()
      },
      {
        name: 'List Business Risk Assessments',
        fn: () => apiClient.listBusinessRiskAssessments()
      },
      {
        name: 'Get Business Risk Insights',
        fn: () => apiClient.getBusinessRiskInsights()
      }
    ]

    for (const test of testSuite) {
      const testResult: TestResult = {
        test: test.name,
        status: 'pending',
        message: 'Running...'
      }

      setTests(prev => [...prev, testResult])

      const startTime = Date.now()
      
      try {
        const result = await test.fn()
        const duration = Date.now() - startTime

        setTests(prev => prev.map(t => 
          t.test === test.name 
            ? { ...t, status: 'success', message: 'Success', duration }
            : t
        ))
      } catch (error: any) {
        const duration = Date.now() - startTime

        setTests(prev => prev.map(t => 
          t.test === test.name 
            ? { 
                ...t, 
                status: 'error', 
                message: error.message || 'Failed', 
                duration 
              }
            : t
        ))
      }
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-quark-grey">API Connection Test</h2>
            <p className="text-slate-600">Test connection to production backend</p>
          </div>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="bg-quark-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-quark-purple transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isRunning ? 'Testing...' : 'Run Tests'}</span>
          </button>
        </div>

        {tests.length > 0 && (
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <span className="font-medium">{test.test}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <span>{test.message}</span>
                  {test.duration && (
                    <span className="text-xs">({test.duration}ms)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isRunning && tests.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
            <p>Click "Run Tests" to verify backend connection</p>
          </div>
        )}

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="text-blue-800">
            <strong>Backend URL:</strong> https://platform-e2e.onrender.com
          </p>
        </div>
      </div>
    </div>
  )
}

export default APITestComponent
