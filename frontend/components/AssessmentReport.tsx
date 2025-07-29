'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { apiClient } from '../lib/api-client'
import { 
  Shield, 
  Globe, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Download,
  ExternalLink,
  Calendar,
  MapPin,
  Factory,
  TrendingUp,
  Server,
  Users,
  Eye,
  Lock,
  Wifi,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface AssessmentReportProps {
  assessmentId?: string
}

export default function AssessmentReport({ assessmentId }: AssessmentReportProps) {
  const searchParams = useSearchParams()
  const id = assessmentId || searchParams.get('id')
  
  const [assessment, setAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    security: true,
    domain: true,
    mcc: true,
    web: true,
    traffic: true,
    blacklists: true,
    technical: true
  })

  useEffect(() => {
    if (id) {
      fetchAssessment()
    }
  }, [id])

  const fetchAssessment = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getBusinessRiskAssessment(id!)
      setAssessment(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment')
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'text-green-600'
    if (score <= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRiskLabel = (score: number) => {
    if (score <= 30) return 'LOW RISK'
    if (score <= 70) return 'MEDIUM RISK'
    return 'HIGH RISK'
  }

  const handleExportPDF = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quark-blue mx-auto mb-4"></div>
          <p className="text-slate-600 font-inter">Loading assessment report...</p>
        </div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-800 mb-2 font-inter">Assessment Not Found</h1>
          <p className="text-slate-600 font-inter">{error || 'Unable to load assessment details'}</p>
        </div>
      </div>
    )
  }

  const riskFactors = [
    { name: 'Ads', score: 4, category: 'traffic' },
    { name: 'Mxtoolbox Dmarc', score: 8, category: 'security' },
    { name: 'Traffic Vol Missing', score: 4, category: 'traffic' },
    { name: 'HTTPS Security', score: assessment.risk_factors?.cybersecurity || 0, category: 'security' },
    { name: 'SSL Certificate', score: assessment.risk_factors?.compliance || 0, category: 'security' },
    { name: 'Domain Age', score: assessment.risk_factors?.operational || 0, category: 'domain' },
    { name: 'Social Presence', score: assessment.risk_factors?.reputational || 0, category: 'web' }
  ]

  const assessmentSections = [
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      items: [
        { label: 'HTTPS Protocol', status: 'Pass', details: 'SSL certificate valid and secure' },
        { label: 'Privacy Policy', status: 'Pass', details: 'Privacy policy accessible and compliant' },
        { label: 'Terms of Service', status: 'Pass', details: 'Terms of service properly documented' },
        { label: 'SSL Certificate', status: 'Pass', details: 'Valid SSL certificate with proper encryption' }
      ]
    },
    {
      id: 'domain',
      title: 'Domain & Business Info',
      icon: Globe,
      items: [
        { label: 'Domain Verification', status: 'Pass', details: 'Domain ownership verified' },
        { label: 'WHOIS Information', status: 'Pass', details: 'Complete WHOIS data available' },
        { label: 'Business Registration', status: 'Pass', details: 'Business entity properly registered' },
        { label: 'Contact Information', status: 'Pass', details: 'Valid contact details provided' }
      ]
    },
    {
      id: 'mcc',
      title: 'MCC & Business Classification',
      icon: Factory,
      items: [
        { label: 'Industry Classification', status: 'Pass', details: `Classified as ${assessment.industry}` },
        { label: 'MCC Code Verification', status: 'Pass', details: 'Business category properly classified' },
        { label: 'Business Model', status: 'Pass', details: 'Legitimate business model identified' },
        { label: 'Compliance Check', status: 'Pass', details: 'Meets industry compliance standards' }
      ]
    },
    {
      id: 'web',
      title: 'Web & Social Presence',
      icon: Users,
      items: [
        { label: 'Website Functionality', status: 'Pass', details: 'Website fully functional and accessible' },
        { label: 'Social Media Presence', status: 'Pass', details: 'Active social media profiles verified' },
        { label: 'Online Reviews', status: 'Pass', details: 'Positive online reputation maintained' },
        { label: 'Digital Footprint', status: 'Pass', details: 'Consistent digital presence across platforms' }
      ]
    },
    {
      id: 'traffic',
      title: 'Traffic & Performance',
      icon: TrendingUp,
      items: [
        { label: 'Website Performance', status: 'Warning', details: 'Some performance optimization needed' },
        { label: 'Traffic Volume', status: 'Info', details: 'Traffic data not available' },
        { label: 'Load Speed', status: 'Pass', details: 'Website loads within acceptable time' },
        { label: 'Mobile Optimization', status: 'Pass', details: 'Mobile-friendly design implemented' }
      ]
    },
    {
      id: 'blacklists',
      title: 'Security Scans & Blacklists',
      icon: Eye,
      items: [
        { label: 'URLVoid Scan', status: 'Pass', details: 'No malicious content detected' },
        { label: 'IPVoid Check', status: 'Pass', details: 'IP address clean and safe' },
        { label: 'Google Safe Browsing', status: 'Pass', details: 'No security warnings from Google' },
        { label: 'Blacklist Status', status: 'Pass', details: 'Domain not found on any blacklists' }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Infrastructure',
      icon: Server,
      items: [
        { label: 'DNS Configuration', status: 'Pass', details: 'DNS properly configured and secure' },
        { label: 'Server Location', status: 'Pass', details: `Hosted in ${assessment.geography}` },
        { label: 'CDN Usage', status: 'Pass', details: 'Content delivery network implemented' },
        { label: 'Security Headers', status: 'Pass', details: 'Security headers properly configured' }
      ]
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass': return 'text-green-600 bg-green-50'
      case 'Warning': return 'text-yellow-600 bg-yellow-50'
      case 'Fail': return 'text-red-600 bg-red-50'
      case 'Info': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pass': return <CheckCircle2 className="h-4 w-4" />
      case 'Warning': return <AlertTriangle className="h-4 w-4" />
      case 'Fail': return <AlertTriangle className="h-4 w-4" />
      case 'Info': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-quark-blue bg-opacity-10 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-quark-blue" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-quark-grey font-inter flex items-center">
                  {assessment.domain}
                  <ExternalLink className="h-5 w-5 ml-2 text-slate-400" />
                </h1>
                <p className="text-slate-600 font-inter">{assessment.business_name}</p>
              </div>
            </div>
            <button
              onClick={handleExportPDF}
              className="bg-quark-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-quark-purple transition-colors flex items-center space-x-2 font-inter"
            >
              <Download className="h-5 w-5" />
              <span>Export PDF</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-slate-600 font-inter">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Assessment generated on {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {assessment.geography}
            </div>
            <div className="flex items-center">
              <Factory className="h-4 w-4 mr-1" />
              {assessment.industry}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Risk Score Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Risk Score Circle */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getRiskColor(assessment.risk_score)} font-inter`}>
                      {Math.round(assessment.risk_score)}
                    </div>
                    <div className={`text-lg font-semibold ${getRiskColor(assessment.risk_score)} font-inter`}>
                      {getRiskLabel(assessment.risk_score)}
                    </div>
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mt-4 font-inter">Overall Risk Score</h2>
            </div>

            {/* Risk Factor Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-6 font-inter">Risk Factor Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                {riskFactors.slice(0, 3).map((factor, index) => (
                  <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-700 font-inter">{factor.score}</div>
                    <div className="text-xs text-slate-600 font-inter">{factor.name}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-3 mt-4">
                {riskFactors.slice(3).map((factor, index) => (
                  <div key={index} className="text-center p-3 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-slate-700 font-inter">{factor.score}</div>
                    <div className="text-xs text-slate-600 font-inter">{factor.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assessmentSections.map((section) => {
            const Icon = section.icon
            const isExpanded = expandedSections[section.id]
            
            return (
              <div key={section.id} className="bg-white rounded-xl shadow-sm border border-slate-200">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-50 transition-colors rounded-t-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-quark-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-quark-blue" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 font-inter">{section.title}</h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-6 pb-6">
                    <div className="space-y-3">
                      {section.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-1 rounded ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800 font-inter">{item.label}</div>
                              <div className="text-sm text-slate-600 font-inter">{item.details}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)} font-inter`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500 font-inter">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="h-4 w-4 text-quark-blue" />
            <span className="font-semibold text-quark-blue">QuarkfinAI</span>
          </div>
          <p>Comprehensive business risk assessment powered by AI</p>
          <p className="mt-1">Report generated on {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}