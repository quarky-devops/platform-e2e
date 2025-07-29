'use client'

import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Building2, 
  Shield, 
  DollarSign, 
  Settings, 
  Scale, 
  Star,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Globe,
  Calendar,
  Factory
} from 'lucide-react'
import { useBusinessRiskAssessment, useExportPDF } from '../../../../hooks/useAPI'

export default function BusinessRiskAssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const { assessment, loading, error, refetch } = useBusinessRiskAssessment(id)
  const { exportPDF, loading: exportLoading } = useExportPDF()

  const handleExport = () => {
    if (assessment) {
      exportPDF(assessment.id, `${assessment.business_name}-risk-assessment.pdf`)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200'
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'High': return 'text-red-600 bg-red-50 border-red-200'
      case 'Pending': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-50'
      case 'In Progress': return 'text-blue-600 bg-blue-50'
      case 'Failed': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getRiskFactorIcon = (factor: string) => {
    switch (factor) {
      case 'cybersecurity': return <Shield className="h-5 w-5" />
      case 'financial': return <DollarSign className="h-5 w-5" />
      case 'operational': return <Settings className="h-5 w-5" />
      case 'compliance': return <Scale className="h-5 w-5" />
      case 'reputational': return <Star className="h-5 w-5" />
      default: return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getRiskFactorColor = (score: number) => {
    if (score <= 40) return 'text-green-600'
    if (score <= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-slate-600 hover:text-quark-blue transition-colors font-inter"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </button>
        </div>
        
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-quark-blue animate-spin" />
          <span className="ml-3 text-slate-600 font-inter">Loading assessment...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-slate-600 hover:text-quark-blue transition-colors font-inter"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2 font-inter">Failed to Load Assessment</h2>
          <p className="text-red-600 mb-4 font-inter">{error.message}</p>
          <button
            onClick={refetch}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-inter"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-slate-600 hover:text-quark-blue transition-colors font-inter"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </button>
        </div>
        
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2 font-inter">Assessment Not Found</h2>
          <p className="text-slate-500 font-inter">This assessment may have been deleted or does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center text-slate-600 hover:text-quark-blue transition-colors font-inter"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assessments
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={refetch}
            className="p-2 text-slate-600 hover:text-quark-blue transition-colors"
            title="Refresh Assessment"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="bg-quark-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-quark-purple transition-colors flex items-center space-x-2 disabled:opacity-50 font-inter"
          >
            {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>{exportLoading ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Assessment Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-quark-light-blue bg-opacity-20 rounded-xl flex items-center justify-center">
              <Building2 className="h-8 w-8 text-quark-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-quark-grey font-inter">{assessment.business_name}</h1>
              <div className="flex items-center space-x-4 text-slate-600 mt-2">
                <div className="flex items-center font-inter">
                  <Globe className="h-4 w-4 mr-1" />
                  {assessment.domain}
                </div>
                <div className="flex items-center font-inter">
                  <Factory className="h-4 w-4 mr-1" />
                  {assessment.industry}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium font-inter ${getRiskLevelColor(assessment.risk_level)}`}>
              {assessment.risk_level} Risk
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 font-inter ${getStatusColor(assessment.status)}`}>
              {assessment.status === 'In Progress' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {assessment.status === 'Completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {assessment.status === 'Failed' && <AlertCircle className="h-3 w-3 mr-1" />}
              {assessment.status}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-quark-blue font-inter">{Math.round(assessment.risk_score)}</div>
            <div className="text-sm text-slate-600 font-inter">Overall Risk Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 font-inter">{assessment.findings.critical_issues}</div>
            <div className="text-sm text-slate-600 font-inter">Critical Issues</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 font-inter">{assessment.findings.warnings}</div>
            <div className="text-sm text-slate-600 font-inter">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 font-inter">{assessment.findings.recommendations}</div>
            <div className="text-sm text-slate-600 font-inter">Recommendations</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 font-inter">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Created: {new Date(assessment.date_created).toLocaleString()}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Updated: {new Date(assessment.last_updated).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Risk Score Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
        <h2 className="text-xl font-semibold text-quark-grey mb-6 font-inter">Risk Analysis</h2>
        
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-slate-50 rounded-full flex items-center justify-center">
            <div className={`text-4xl font-bold ${getRiskFactorColor(assessment.risk_score)}`}>
              {Math.round(assessment.risk_score)}
            </div>
          </div>
          <h3 className="text-lg font-medium text-quark-grey mb-2 font-inter">Overall Risk Score</h3>
          <p className="text-slate-600 font-inter">
            {assessment.risk_score <= 40 ? 'Low Risk' : 
             assessment.risk_score <= 70 ? 'Medium Risk' : 'High Risk'}
          </p>
        </div>
      </div>

      {/* Assessment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assessment Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-quark-grey mb-4 font-inter">Assessment Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600 font-inter">Assessment Type:</span>
              <span className="font-medium font-inter">{assessment.assessment_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-inter">Geography:</span>
              <span className="font-medium font-inter">{assessment.geography}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-inter">Industry:</span>
              <span className="font-medium font-inter">{assessment.industry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-inter">Assessment ID:</span>
              <span className="font-mono text-sm font-inter">{assessment.id}</span>
            </div>
          </div>
        </div>

        {/* Risk Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-quark-grey mb-4 font-inter">Risk Summary</h3>
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-700 mb-1">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="font-medium font-inter">Critical Issues ({assessment.findings.critical_issues})</span>
              </div>
              <p className="text-sm text-red-600 font-inter">Immediate attention required</p>
            </div>
            
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center text-yellow-700 mb-1">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="font-medium font-inter">Warnings ({assessment.findings.warnings})</span>
              </div>
              <p className="text-sm text-yellow-600 font-inter">Areas for improvement</p>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center text-blue-700 mb-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span className="font-medium font-inter">Recommendations ({assessment.findings.recommendations})</span>
              </div>
              <p className="text-sm text-blue-600 font-inter">Suggested enhancements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
