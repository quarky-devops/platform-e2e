'use client'

import { useState } from 'react'
import { 
  X, 
  Eye, 
  Clock, 
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface NewAssessmentFormProps {
  onClose: () => void
  onAssessmentCreated: (assessment: any) => void
}

export default function NewAssessmentForm({ onClose, onAssessmentCreated }: NewAssessmentFormProps) {
  const [formData, setFormData] = useState({
    website: '',
    businessName: '',
    salesforceId: '',
    billingCountryCode: 'US',
    industry: 'Technology',
    assessmentType: 'Quick Scan'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const industries = [
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
    'Other'
  ]

  const assessmentTypes = [
    { value: 'Quick Scan', label: 'Quick Assessment', description: 'Basic risk assessment (15-30 seconds)', credits: 1 },
    { value: 'Comprehensive', label: 'Full Assessment', description: 'Comprehensive analysis (60-90 seconds)', credits: 3 }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newAssessment = {
        id: Date.now().toString(),
        domain: formData.website,
        legalName: formData.businessName,
        riskCategory: 'Pending' as const,
        score: 0,
        status: 'In Progress' as const,
        createdAt: new Date().toISOString().split('T')[0]
      }

      onAssessmentCreated(newAssessment)
      onClose()
    } catch (err) {
      setError('Failed to create assessment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-quark-grey font-inter">New Risk Assessment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-inter">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                Website *
              </label>
              <input
                type="text"
                required
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value.replace(/^https?:\/\//, ''))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter transition-all"
                placeholder="example.com"
                disabled={loading}
              />
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter transition-all"
                placeholder="Enter business name"
                disabled={loading}
              />
            </div>

            {/* Salesforce ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                Salesforce ID
              </label>
              <input
                type="text"
                value={formData.salesforceId}
                onChange={(e) => handleInputChange('salesforceId', e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter transition-all"
                placeholder="e.g., 006TS..."
                disabled={loading}
              />
            </div>

            {/* Billing Country Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                Billing Country Code
              </label>
              <input
                type="text"
                value={formData.billingCountryCode}
                onChange={(e) => handleInputChange('billingCountryCode', e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter transition-all"
                placeholder="US"
                disabled={loading}
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter transition-all"
                disabled={loading}
              >
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assessment Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-4 font-inter">
              Assessment Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessmentTypes.map(type => (
                <label key={type.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="assessmentType"
                    value={type.value}
                    checked={formData.assessmentType === type.value}
                    onChange={(e) => handleInputChange('assessmentType', e.target.value)}
                    className="sr-only"
                    disabled={loading}
                  />
                  <div className={`p-6 rounded-xl transition-all ${
                    formData.assessmentType === type.value
                      ? 'ring-2 ring-quark-blue bg-quark-light-blue bg-opacity-5 shadow-md'
                      : 'bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold text-quark-grey font-inter">{type.label}</h4>
                      <span className="text-sm font-semibold bg-gradient-to-r from-quark-blue to-quark-purple text-white px-3 py-1 rounded-full">
                        {type.credits} {type.credits === 1 ? 'credit' : 'credits'}
                      </span>
                    </div>
                    <p className="text-base text-slate-600 font-inter leading-relaxed">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-inter"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-quark-blue text-white rounded-lg font-semibold hover:bg-quark-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-inter"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              <span>{loading ? 'Creating...' : 'Create Assessment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 