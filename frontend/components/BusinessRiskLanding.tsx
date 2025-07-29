'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api-client'
import { CreateBusinessRiskAssessmentRequest } from '../lib/types'
import { useAuth } from './AuthProvider'
import { 
  Eye, 
  Shield, 
  Globe, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  Save,
  Settings,
  Download,
  Trash2,
  Filter,
  Search,
  Plus,
  Edit,
  Link,
  X,
  TrendingUp,
  Users,
  Phone,
  ChevronRight
} from 'lucide-react'


interface BusinessRiskLandingProps {
  onStartAssessment?: () => void
}

interface Assessment {
  id: string
  domain: string
  legalName: string
  riskCategory: 'Low' | 'Medium' | 'High'
  score: number
  status: 'Completed' | 'In Progress' | 'Failed' | 'Pending'
  createdAt: string
}

interface Configuration {
  id: string
  name: string
  value: string
  displayValue: string
}

export default function BusinessRiskLanding({ onStartAssessment }: BusinessRiskLandingProps) {
  const { userProfile, refreshUserProfile, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<'landing' | 'assessments' | 'customizations'>('landing')
  const [salesforceId, setSalesforceId] = useState('')
  const [requestParameters, setRequestParameters] = useState([
    { 
      id: '1', 
      variableName: 'salesforce_id',
      displayName: 'Salesforce ID', 
      dataType: 'string',
      value: '' 
    },
    { 
      id: '2', 
      variableName: 'country_code',
      displayName: 'Country Code', 
      dataType: 'string',
      value: '' 
    }
  ])
  const [quickReferenceLink, setQuickReferenceLink] = useState('https://docs.adyen.com/development-resources/restricted-and-prohibited-items')
  const [showSettings, setShowSettings] = useState(false)
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // State for fetched assessment results
  const [fetchedAssessment, setFetchedAssessment] = useState<any>(null)
  const [fetchingResults, setFetchingResults] = useState(false)
  
  // Assessments from backend
  const [assessments, setAssessments] = useState<Assessment[]>([])

  // Mock data for configurations
  const [configurations, setConfigurations] = useState<Configuration[]>([
    {
      id: '1',
      name: 'Quick Reference List',
      value: 'https://docs.adyen.com/development-resources/restricted-and-prohibited-items',
      displayValue: 'Adyen Prohibited Items'
    }
  ])

  // Load saved variables and assessments on component mount
  useEffect(() => {
    const savedSalesforceId = localStorage.getItem('business-risk-salesforce-id')
    const savedQuickReferenceLink = localStorage.getItem('business-risk-quick-reference-link')
    const savedConfigurations = localStorage.getItem('business-risk-configurations')
    const savedRequestParameters = localStorage.getItem('business-risk-request-parameters')
    
    if (savedSalesforceId) setSalesforceId(savedSalesforceId)
    if (savedQuickReferenceLink) setQuickReferenceLink(savedQuickReferenceLink)
    
    // Load saved configurations
    if (savedConfigurations) {
      try {
        const parsedConfigurations = JSON.parse(savedConfigurations)
        setConfigurations(parsedConfigurations)
      } catch (error) {
        console.error('Error parsing saved configurations:', error)
      }
    }
    
    // Load saved request parameters
    if (savedRequestParameters) {
      try {
        const parsedParameters = JSON.parse(savedRequestParameters)
        // Ensure parameters have the new structure
        const updatedParameters = parsedParameters.map((param: any) => ({
          id: param.id || Date.now().toString(),
          variableName: param.variableName || param.displayValue?.replace(/\s+/g, '_').toLowerCase() || 'parameter',
          displayName: param.displayName || param.displayValue || 'Parameter',
          dataType: param.dataType || 'string',
          value: param.value || ''
        }))
        setRequestParameters(updatedParameters)
      } catch (error) {
        console.error('Error parsing saved request parameters:', error)
      }
    }
    
    // Load assessments from backend
    loadAssessments()
    
    // Try to refresh user profile on mount
    if (refreshUserProfile) {
      console.log('BusinessRiskLanding: Refreshing user profile on mount')
      refreshUserProfile()
    }
  }, [])
  
  // Add effect to listen for userProfile changes
  useEffect(() => {
    console.log('BusinessRiskLanding: userProfile changed:', userProfile)
  }, [userProfile])

  const loadAssessments = async () => {
    try {
      const backendAssessments = await apiClient.listBusinessRiskAssessments()
      const mappedAssessments: Assessment[] = backendAssessments.map(assessment => {
        // Safe date parsing with fallback
        const parseDate = (dateValue: any): string => {
          try {
            const date = new Date(dateValue)
            if (isNaN(date.getTime())) {
              // If date is invalid, use current date
              return new Date().toISOString().split('T')[0]
            }
            return date.toISOString().split('T')[0]
          } catch {
            // If parsing fails, use current date
            return new Date().toISOString().split('T')[0]
          }
        }

        return {
          id: assessment.id,
          domain: assessment.domain,
          legalName: assessment.business_name,
          riskCategory: assessment.risk_level === 'High' ? 'High' : assessment.risk_level === 'Medium' ? 'Medium' : 'Low',
          score: assessment.risk_score || 0,
          status: assessment.status === 'Completed' ? 'Completed' : assessment.status === 'In Progress' ? 'In Progress' : 'Pending',
          createdAt: parseDate(assessment.date_created)
        }
      })
      setAssessments(mappedAssessments)
      console.log(`✅ Successfully loaded ${mappedAssessments.length} assessments from backend`)
    } catch (error) {
      console.error('Error loading assessments:', error)
      // Keep empty array if loading fails
    }
  }

  const handleSaveVariables = () => {
    // Save all configurations and parameters
    localStorage.setItem('business-risk-salesforce-id', salesforceId)
    localStorage.setItem('business-risk-quick-reference-link', quickReferenceLink)
    localStorage.setItem('business-risk-configurations', JSON.stringify(configurations))
    localStorage.setItem('business-risk-request-parameters', JSON.stringify(requestParameters))
    alert('Variables and configurations saved successfully!')
  }

  const handleSelectAssessment = (id: string) => {
    setSelectedAssessments(prev => 
      prev.includes(id) 
        ? prev.filter(assessmentId => assessmentId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAllAssessments = () => {
    if (selectedAssessments.length === filteredAssessments.length) {
      setSelectedAssessments([])
    } else {
      setSelectedAssessments(filteredAssessments.map(a => a.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedAssessments.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedAssessments.length} assessment(s)?`)) {
      try {
        await apiClient.bulkDeleteBusinessRiskAssessments(selectedAssessments)
        setAssessments(prev => prev.filter(a => !selectedAssessments.includes(a.id)))
        setSelectedAssessments([])
        alert(`✅ Successfully deleted ${selectedAssessments.length} assessment(s)`)
      } catch (error) {
        console.error('Error deleting assessments:', error)
        alert(`❌ Failed to delete assessments: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleFetchAnalysis = async () => {
    let originalText = ''
    try {
      const websiteInput = document.querySelector('input[placeholder="e.g., chargebee.com"]') as HTMLInputElement
      const website = websiteInput?.value || ''
      
      if (!website) {
        alert('Please enter a website first')
        return
      }
      
      // Show loading state
      const button = event?.target as HTMLButtonElement
      if (button) {
        originalText = button.innerHTML
        button.innerHTML = 'Fetching Analysis...'
        button.disabled = true
      }
      
      setFetchingResults(true)
      setFetchedAssessment(null)
      
      // Call backend to get existing assessment
      const existingAssessments = await apiClient.listBusinessRiskAssessments()
      const existingAssessment = existingAssessments.find(a => a.domain === website)
      
      if (existingAssessment) {
        // Get detailed assessment data
        const detailedAssessment = await apiClient.getBusinessRiskAssessment(existingAssessment.id)
        setFetchedAssessment({
          ...detailedAssessment,
          domain: website,
          business_name: detailedAssessment.business_name || website
        })
        
        // Also try to get from Website Risk Assessment API for more details
        try {
          const websiteRiskResponse = await apiClient.getWebsiteRiskAssessment({ website })
          if (websiteRiskResponse) {
            setFetchedAssessment((prev: any) => ({ ...prev, websiteRiskData: websiteRiskResponse }))
          }
        } catch (error) {
          console.log('No additional website risk data available')
        }
        
        // No need for alert popup - data now shows in right panel
      } else {
        alert(`❌ No existing assessment found for ${website}.\n\nPlease use "Start New Assessment" to create one.`)
      }
      
    } catch (error) {
      console.error('Error fetching analysis:', error)
      alert(`❌ Failed to fetch analysis: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setFetchingResults(false)
      // Restore button state
      const button = event?.target as HTMLButtonElement
      if (button) {
        button.innerHTML = originalText || 'Fetch Analysis'
        button.disabled = false
      }
    }
  }

  const handleDownloadPDF = async (assessment: Assessment) => {
    try {
      const blob = await apiClient.exportBusinessRiskAssessmentPDF(assessment.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `assessment-${assessment.domain}-${assessment.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert(`❌ Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleViewAssessment = async (assessment: Assessment) => {
    // Open assessment report in new tab
    const reportUrl = `/assessment-report?id=${assessment.id}`
    window.open(reportUrl, '_blank', 'noopener,noreferrer')
  }

  const handleNewAssessment = async (assessmentType: 'quick' | 'full') => {
    // Check if user has verified phone number
    if (!userProfile?.phone || !userProfile?.phone_verified) {
      const result = confirm('📱 Phone verification required!\n\nPlease update and verify your phone number in Settings before creating assessments.\n\nClick OK to go to Settings now, or Cancel to stay here.')
      if (result) {
        // Navigate to settings
        window.location.href = '/platform/settings'
      }
      return
    }

    let originalText = ''
    try {
      // Get the website from the input field
      const websiteInput = document.querySelector('input[placeholder="e.g., chargebee.com"]') as HTMLInputElement
      const website = websiteInput?.value || ''
      
      if (!website) {
        alert('Please enter a website first')
        return
      }
      
      // Show loading state
      const button = event?.target as HTMLButtonElement
      if (button) {
        originalText = button.innerHTML
        button.innerHTML = 'Starting Assessment...'
        button.disabled = true
      }
      
      // Get parameter values for the assessment
      const parameterData: any = {}
      requestParameters.forEach(param => {
        if (param.value) {
          parameterData[param.variableName] = param.value
        }
      })
      
      // Create assessment data for the Business Risk Prevention API (the correct one)
      const assessmentData: CreateBusinessRiskAssessmentRequest = {
        business_name: website, // Use domain as business name for now
        domain: website,
        industry: parameterData.industry || 'Technology',
        geography: parameterData.country_code || 'US',
        assessment_type: assessmentType === 'quick' ? 'Quick Scan' as const : 'Comprehensive' as const,
        description: `${assessmentType === 'quick' ? 'Quick Scan' : 'Comprehensive'} assessment for ${website}`
      }
      
      console.log('Creating business risk assessment:', assessmentData)
      
      // Call the correct Business Risk Prevention API
      const result = await apiClient.createBusinessRiskAssessment(assessmentData)
      
      console.log('Assessment created:', result)
      
      // Show success message
      alert(`✅ ${assessmentType === 'quick' ? 'Quick Scan' : 'Comprehensive'} assessment initiated for ${website}!\n\nAssessment ID: ${result.id}\nStatus: ${result.status}`)
      
      // Refresh the assessments list to show the new one
      await loadAssessments()
      
    } catch (error) {
      console.error('Error creating assessment:', error)
      alert(`❌ Failed to create assessment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      // Restore button state
      const button = event?.target as HTMLButtonElement
      if (button) {
        button.innerHTML = originalText || 'Start Assessment'
        button.disabled = false
      }
    }
  }

  // Helper to check if phone verification is required
  const isPhoneVerificationRequired = () => {
    // Debug: Log auth state
    console.log('Debug - Auth State:', {
      loading,
      userProfile,
      phone: userProfile?.phone,
      phone_verified: userProfile?.phone_verified,
      email: userProfile?.email
    })
    
    // If still loading, assume verification is required (safe default)
    if (loading) {
      console.log('Debug - Auth still loading, assuming verification required')
      return true
    }
    
    // If userProfile is null/undefined after loading, assume verification is required
    if (!userProfile) {
      console.log('Debug - No userProfile after loading, assuming verification required')
      return true
    }
    
    // User needs phone verification if:
    // 1. No phone number at all
    // 2. Phone is not verified
    // 3. Phone is empty/null
    const needsVerification = !userProfile.phone || 
           !userProfile.phone_verified || 
           userProfile.phone === '' || 
           userProfile.phone === null
           
    console.log('Debug - Final decision - Needs phone verification:', needsVerification)
    return needsVerification
  }

  const handleAssessmentCreated = (newAssessment: Assessment) => {
    setAssessments(prev => [newAssessment, ...prev])
  }

  const handleAddQuickReference = () => {
    const newId = (configurations.length + 1).toString()
    const newQuickReference = {
      id: newId,
      name: 'Quick Reference List',
      value: '',
      displayValue: `Reference ${newId}`
    }
    setConfigurations(prev => [...prev, newQuickReference])
  }

  const handleRemoveConfiguration = (id: string) => {
    // Allow deletion of all configurations, including the last one
    setConfigurations(prev => prev.filter(config => config.id !== id))
  }

  const handleAddParameter = () => {
    const newId = (requestParameters.length + 1).toString()
    const newParameter = {
      id: newId,
      variableName: `parameter_${newId}`,
      displayName: `Parameter ${newId}`,
      dataType: 'string',
      value: ''
    }
    setRequestParameters(prev => [...prev, newParameter])
  }

  const handleRemoveParameter = (id: string) => {
    // Allow deletion of all parameters, including the last one
    setRequestParameters(prev => prev.filter(param => param.id !== id))
  }

  const handleUpdateParameter = (id: string, field: 'variableName' | 'displayName' | 'dataType' | 'value', newValue: string) => {
    setRequestParameters(prev => prev.map(param => 
      param.id === id ? { ...param, [field]: newValue } : param
    ))
  }

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.legalName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || assessment.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getRiskCategoryColor = (category: string) => {
    switch (category) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200'
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'High': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'In Progress': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case 'Failed': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'Pending': return <Clock className="h-4 w-4 text-gray-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const assessmentCategories = [
    {
      icon: Shield,
      title: 'Business Verification',
      description: 'Company registration and compliance checks',
      status: 'Completed',
      color: 'text-green-600'
    },
    {
      icon: Globe,
      title: 'Digital Presence',
      description: 'Online footprint and web presence analysis',
      status: 'Completed',
      color: 'text-green-600'
    },
    {
      icon: Building2,
      title: 'Industry Classification',
      description: 'Business category and sector analysis',
      status: 'Completed',
      color: 'text-green-600'
    },
    {
      icon: AlertTriangle,
      title: 'Online Reputation',
      description: 'Brand consistency and digital reputation',
      status: 'In Progress',
      color: 'text-yellow-600'
    },
    {
      icon: Clock,
      title: 'Performance Metrics',
      description: 'Operational efficiency and engagement analysis',
      status: 'Pending',
      color: 'text-gray-600'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-quark-grey mb-6 font-inter">Business Risk Prevention</h1>
        
        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('landing')}
              className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
                activeTab === 'landing'
                  ? 'border-quark-blue text-quark-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Analysis Hub
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
                activeTab === 'assessments'
                  ? 'border-quark-blue text-quark-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Recent Assessments
            </button>
            <button
              onClick={() => setActiveTab('customizations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
                activeTab === 'customizations'
                  ? 'border-quark-blue text-quark-blue'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Configurations
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'landing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Assessment Hub */}
          <div className="lg:col-span-1">
            <div className="modern-card p-6">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-quark-blue mr-2" />
                <h2 className="text-xl font-semibold text-quark-grey font-inter">Business Analysis Hub</h2>
                {/* Debug: Add refresh button */}
                <button 
                  onClick={() => {
                    console.log('Manual refresh triggered')
                    if (refreshUserProfile) {
                      refreshUserProfile()
                    }
                  }}
                  className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                >
                  Refresh Profile
                </button>
              </div>
              <p className="text-slate-600 mb-6 font-inter">Fetch or Initiate New Risk Analysis.</p>

              {/* Website Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                  Website*
                </label>
                <input
                  type="text"
                  placeholder="e.g., chargebee.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter transition-all"
                />
              </div>

              {/* Fetch Analysis Button */}
              <button 
                onClick={handleFetchAnalysis}
                className="w-full bg-gradient-to-r from-quark-blue to-quark-purple text-white px-4 py-3 rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center space-x-2 mb-6 font-inter"
              >
                <Eye className="h-5 w-5" />
                <span>Fetch Analysis</span>
              </button>

              {/* Separator */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500 font-inter">For New Analysis</span>
                </div>
              </div>

              {/* Request Body Parameters Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                  Request Body Parameters
                </label>
                {requestParameters.length > 0 ? (
                  <div className="space-y-3">
                    {requestParameters.map((param, index) => (
                      <div key={param.id}>
                        <label className="block text-xs font-medium text-slate-600 mb-1 font-inter">
                          {param.displayName}
                        </label>
                        <input
                          type={param.dataType === 'number' ? 'number' : 'text'}
                          value={param.value}
                          onChange={(e) => handleUpdateParameter(param.id, 'value', e.target.value)}
                          placeholder={`Enter ${param.displayName?.toLowerCase() || 'value'}`}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter transition-all"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={salesforceId}
                    onChange={(e) => setSalesforceId(e.target.value)}
                    placeholder="e.g., 006TS..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter transition-all"
                  />
                )}
              </div>

              {/* Start New Assessment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3 font-inter">
                  Start New Assessment
                </label>
                {/* Phone Verification Warning */}
                {isPhoneVerificationRequired() && (
                  <a 
                    href="/platform/settings"
                    className="block mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center text-amber-800">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="text-sm font-inter">Update phone in Settings to create assessments</span>
                      <ChevronRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </a>
                )}
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      handleNewAssessment('quick')
                    }}
                    className={`relative group w-full px-6 py-4 rounded-lg transition-all text-left shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                      isPhoneVerificationRequired()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                          <Clock className={`h-4 w-4 ${
                            isPhoneVerificationRequired() ? 'text-gray-400' : 'text-white'
                          }`} />
                        </div>
                        <div>
                          <h4 className={`font-bold font-inter text-lg ${
                            isPhoneVerificationRequired() ? 'text-gray-500' : 'text-white'
                          }`}>Quick Start</h4>
                          <p className={`text-sm font-inter ${
                            isPhoneVerificationRequired() ? 'text-gray-400' : 'text-green-100'
                          }`}>15-30 seconds</p>
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold font-inter ${
                        isPhoneVerificationRequired() ? 'bg-gray-200 text-gray-400' : 'bg-white bg-opacity-20 text-white'
                      }`}>1 credit</span>
                    </div>
                    <p className={`text-sm font-inter ${
                      isPhoneVerificationRequired() ? 'text-gray-400' : 'text-green-100'
                    }`}>Basic risk assessment for quick results</p>
                    
                    {/* Hover Information */}
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-inter">
                      <div className="font-semibold mb-1">Quick Assessment Features:</div>
                      <ul className="space-y-1">
                        <li>• Basic security checks</li>
                        <li>• Domain verification</li>
                        <li>• Quick risk scoring</li>
                        <li>• Essential compliance review</li>
                      </ul>
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      handleNewAssessment('full')
                    }}
                    className={`relative group w-full px-6 py-4 rounded-lg transition-all text-left shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                      isPhoneVerificationRequired()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-quark-blue to-quark-purple text-white hover:from-quark-purple hover:to-quark-blue'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                          <Shield className={`h-4 w-4 ${
                            isPhoneVerificationRequired() ? 'text-gray-400' : 'text-white'
                          }`} />
                        </div>
                        <div>
                          <h4 className={`font-bold font-inter text-lg ${
                            isPhoneVerificationRequired() ? 'text-gray-500' : 'text-white'
                          }`}>Comprehensive Analysis</h4>
                          <p className={`text-sm font-inter ${
                            isPhoneVerificationRequired() ? 'text-gray-400' : 'text-blue-100'
                          }`}>60-90 seconds</p>
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-bold font-inter ${
                        isPhoneVerificationRequired() ? 'bg-gray-200 text-gray-400' : 'bg-white bg-opacity-20 text-white'
                      }`}>3 credits</span>
                    </div>
                    <p className={`text-sm font-inter ${
                      isPhoneVerificationRequired() ? 'text-gray-400' : 'text-blue-100'
                    }`}>Deep analysis with detailed insights</p>
                    
                    {/* Hover Information */}
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-inter">
                      <div className="font-semibold mb-1">Full Assessment Features:</div>
                      <ul className="space-y-1">
                        <li>• Comprehensive security audit</li>
                        <li>• Deep business analysis</li>
                        <li>• Advanced risk modeling</li>
                        <li>• Detailed compliance report</li>
                        <li>• Industry benchmarking</li>
                        <li>• Custom recommendations</li>
                      </ul>
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Reference Section */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <h3 className="text-sm font-medium text-quark-grey font-inter">Quick Reference</h3>
                </div>
                
                <p className="text-xs text-slate-600 mb-3 font-inter">
                  {configurations.length > 0 
                    ? `Check ${configurations.length} configured reference${configurations.length !== 1 ? 's' : ''} for manual validation.`
                    : 'No quick references configured. Add references in the Configurations tab.'}
                </p>
                
                {configurations.length > 0 ? (
                  <div className="space-y-2">
                    {configurations.slice(0, 3).map((config) => (
                      <a
                        key={config.id}
                        href={config.value || quickReferenceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-sm text-yellow-600 hover:text-yellow-700 font-inter block"
                      >
                        <span>{config.displayValue || 'Quick Reference'}</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ))}
                    {configurations.length > 3 && (
                      <p className="text-xs text-slate-500 font-inter">+{configurations.length - 3} more in Configurations</p>
                    )}
                  </div>
                ) : (
                  <a
                    href={quickReferenceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-sm text-yellow-600 hover:text-yellow-700 font-inter"
                  >
                    <span>View Default Reference</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Results Panel */}
          <div className="lg:col-span-2">
            <div className="modern-card p-8 h-full flex flex-col">
              {fetchingResults ? (
                /* Loading State */
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-quark-light-blue bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-quark-blue"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-quark-grey mb-2 font-inter">Fetching Assessment</h2>
                  <p className="text-slate-600 font-inter">Loading business analysis results...</p>
                </div>
              ) : fetchedAssessment ? (
                /* Results State */
                <div>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-quark-light-blue bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-quark-blue" />
                    </div>
                    <h2 className="text-2xl font-bold text-quark-grey mb-2 font-inter">{fetchedAssessment.domain}</h2>
                    <p className="text-slate-600 font-inter">{fetchedAssessment.business_name}</p>
                    <div className="mt-4 flex items-center justify-center space-x-6">
                      <div className="text-center">
                        <div className={`text-3xl font-bold font-inter ${
                          fetchedAssessment.risk_score <= 30 ? 'text-green-600' :
                          fetchedAssessment.risk_score <= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {Math.round(fetchedAssessment.risk_score || 0)}
                        </div>
                        <div className="text-sm text-slate-600 font-inter">Risk Score</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-semibold font-inter px-3 py-1 rounded-full ${
                          fetchedAssessment.risk_level === 'Low' ? 'text-green-600 bg-green-50' :
                          fetchedAssessment.risk_level === 'Medium' ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'
                        }`}>
                          {fetchedAssessment.risk_level} Risk
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Analysis Categories */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-quark-grey mb-4 font-inter">Analysis Results</h3>
                    <div className="space-y-4">
                      {[
                        {
                          icon: Shield,
                          title: 'Security & Privacy',
                          description: 'HTTPS, SSL certificates, and privacy compliance',
                          status: fetchedAssessment.websiteRiskData?.https_check?.has_https ? 'Completed' : 'Warning',
                          details: `HTTPS: ${fetchedAssessment.websiteRiskData?.https_check?.has_https ? 'Secure' : 'Not Secure'}`
                        },
                        {
                          icon: Globe,
                          title: 'Domain & Business Info', 
                          description: 'Domain verification and business registration',
                          status: 'Completed',
                          details: `Domain verified for ${fetchedAssessment.domain}`
                        },
                        {
                          icon: Building2,
                          title: 'Industry Classification',
                          description: 'Business category and MCC classification',
                          status: fetchedAssessment.websiteRiskData?.mcc_details?.mcc_restricted ? 'Warning' : 'Completed',
                          details: `Industry: ${fetchedAssessment.industry || 'Technology'}`
                        },
                        {
                          icon: Users,
                          title: 'Social Media Presence',
                          description: 'LinkedIn, Facebook, and social verification',
                          status: fetchedAssessment.websiteRiskData?.social_presence?.social_presence?.linkedin?.presence ? 'Completed' : 'Warning',
                          details: `Social presence: ${fetchedAssessment.websiteRiskData?.social_presence?.social_presence?.linkedin?.presence ? 'Verified' : 'Limited'}`
                        },
                        {
                          icon: TrendingUp,
                          title: 'Performance Metrics',
                          description: 'Website performance and traffic analysis',
                          status: 'Completed',
                          details: `Performance analyzed`
                        },
                        {
                          icon: Eye,
                          title: 'Security Scans',
                          description: 'URLVoid, IPVoid, and blacklist checks',
                          status: (fetchedAssessment.websiteRiskData?.urlvoid?.detections_counts?.detected || 0) === 0 ? 'Completed' : 'Warning',
                          details: `Threats detected: ${fetchedAssessment.websiteRiskData?.urlvoid?.detections_counts?.detected || 0}`
                        }
                      ].map((category, index) => {
                        const Icon = category.icon
                        const statusColor = category.status === 'Completed' ? 'text-green-600' : 
                                          category.status === 'Warning' ? 'text-yellow-600' : 'text-red-600'
                        return (
                          <div key={index} className="flex items-center p-4 bg-slate-50 rounded-lg">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm">
                              <Icon className="h-5 w-5 text-quark-blue" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-quark-grey font-inter">{category.title}</h4>
                              <p className="text-sm text-slate-600 font-inter">{category.description}</p>
                              <p className="text-xs text-slate-500 font-inter mt-1">{category.details}</p>
                            </div>
                            <div className={`flex items-center space-x-2 ${statusColor} font-inter`}>
                              {category.status === 'Completed' && <CheckCircle2 className="h-4 w-4" />}
                              {category.status === 'Warning' && <AlertTriangle className="h-4 w-4" />}
                              {category.status === 'In Progress' && <Clock className="h-4 w-4" />}
                              {category.status === 'Pending' && <Clock className="h-4 w-4" />}
                              <span className="text-sm font-medium">{category.status}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Assessment Summary */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-700 mb-2 font-inter">
                        {fetchedAssessment.risk_level === 'Low' ? '✓' : fetchedAssessment.risk_level === 'Medium' ? '⚠️' : '❌'}
                      </div>
                      <div className="text-lg font-semibold text-blue-800 font-inter">
                        {fetchedAssessment.risk_level === 'Low' ? 'VERIFIED' : 
                         fetchedAssessment.risk_level === 'Medium' ? 'REVIEW REQUIRED' : 'HIGH RISK'}
                      </div>
                      <p className="text-sm text-blue-700 mt-2 font-inter">
                        Risk assessment completed - Score: {Math.round(fetchedAssessment.risk_score || 0)}
                      </p>
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            const reportUrl = `/assessment-report?id=${fetchedAssessment.id}`
                            window.open(reportUrl, '_blank', 'noopener,noreferrer')
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors font-inter"
                        >
                          View Detailed Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Default State */
                <div>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-quark-light-blue bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-quark-blue" />
                    </div>
                    <h2 className="text-2xl font-bold text-quark-grey mb-2 font-inter">Business Overview</h2>
                    <p className="text-slate-600 font-inter">Enter a website and fetch analysis to see comprehensive results.</p>
                  </div>

                  {/* Business Analysis Categories - Default */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-quark-grey mb-4 font-inter">Analysis Categories</h3>
                    <div className="space-y-4">
                      {assessmentCategories.map((category, index) => {
                        const Icon = category.icon
                        return (
                          <div key={index} className="flex items-center p-4 bg-slate-50 rounded-lg">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-4 shadow-sm">
                              <Icon className="h-5 w-5 text-quark-blue" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-quark-grey font-inter">{category.title}</h4>
                              <p className="text-sm text-slate-600 font-inter">{category.description}</p>
                            </div>
                            <div className={`flex items-center space-x-2 ${category.color} font-inter`}>
                              {category.status === 'Completed' && <CheckCircle2 className="h-4 w-4" />}
                              {category.status === 'In Progress' && <Clock className="h-4 w-4" />}
                              {category.status === 'Pending' && <Clock className="h-4 w-4" />}
                              <span className="text-sm font-medium">{category.status}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Business Status Summary - Default */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-700 mb-2 font-inter">✓</div>
                      <div className="text-lg font-semibold text-blue-800 font-inter">READY FOR ANALYSIS</div>
                      <p className="text-sm text-blue-700 mt-2 font-inter">
                        Enter a website above and click "Fetch Analysis" to see results
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assessments' && (
        <div className="space-y-6">
          {/* Assessment Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
              >
                <option value="all">All Status</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              {selectedAssessments.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-inter"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Selected ({selectedAssessments.length})</span>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  // For the Recent Assessments tab, default to quick assessment
                  handleNewAssessment('quick')
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-quark-blue text-white rounded-lg hover:bg-quark-purple transition-colors font-inter"
              >
                <Plus className="h-4 w-4" />
                <span>New Assessment</span>
              </button>
            </div>
          </div>

          {/* Assessments Table */}
          <div className="modern-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedAssessments.length === filteredAssessments.length && filteredAssessments.length > 0}
                        onChange={handleSelectAllAssessments}
                        className="rounded border-slate-300 text-quark-blue focus:ring-quark-blue"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-inter">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-inter">
                      Legal Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-inter">
                      Risk Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-inter">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-inter">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider font-inter">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredAssessments.map((assessment) => (
                    <tr key={assessment.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedAssessments.includes(assessment.id)}
                          onChange={() => handleSelectAssessment(assessment.id)}
                          className="rounded border-slate-300 text-quark-blue focus:ring-quark-blue"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-quark-grey font-inter">{assessment.domain}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 font-inter">{assessment.legalName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskCategoryColor(assessment.riskCategory)} font-inter`}>
                          {assessment.riskCategory}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-quark-grey font-inter">{assessment.score}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(assessment.status)}
                          <span className="text-sm text-slate-900 font-inter">{assessment.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewAssessment(assessment)}
                            className="text-quark-blue hover:text-quark-purple font-inter"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(assessment)}
                            className="text-slate-600 hover:text-slate-900 font-inter"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customizations' && (
        <div className="space-y-6">
          <div className="modern-card p-6">
            <h2 className="text-xl font-semibold text-quark-grey mb-6 font-inter">Configuration Settings</h2>
            
            {/* Quick Reference Lists Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-quark-grey font-inter">Quick Reference Lists</h3>
                <button
                  onClick={handleAddQuickReference}
                  className="flex items-center space-x-2 px-4 py-2 bg-quark-blue text-white rounded-lg hover:bg-quark-purple transition-colors font-inter"
                >
                  <Link className="h-4 w-4" />
                  <span>Add Quick Reference</span>
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4 font-inter">
                Update the link list which you want to have reference for manual check from the tool
              </p>
              
              <div className="space-y-4">
                {configurations.filter(config => config.name === 'Quick Reference List').map((config) => (
                  <div key={config.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-quark-grey font-inter">Quick Reference List</h4>
                      <button
                        onClick={() => handleRemoveConfiguration(config.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">URL</label>
                        <input
                          type="url"
                          value={config.value}
                          onChange={(e) => {
                            const newConfigs = configurations.map(c => 
                              c.id === config.id ? { ...c, value: e.target.value } : c
                            )
                            setConfigurations(newConfigs)
                          }}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                          placeholder="https://example.com/reference"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">Display Name</label>
                        <input
                          type="text"
                          value={config.displayValue}
                          onChange={(e) => {
                            const newConfigs = configurations.map(c => 
                              c.id === config.id ? { ...c, displayValue: e.target.value } : c
                            )
                            setConfigurations(newConfigs)
                          }}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                          placeholder="Reference Name"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Body Parameters Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-quark-grey font-inter">Request Body Parameters</h3>
                <button
                  onClick={handleAddParameter}
                  className="flex items-center space-x-2 px-4 py-2 bg-quark-blue text-white rounded-lg hover:bg-quark-purple transition-colors font-inter"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Parameter</span>
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4 font-inter">
                Configure parameters that will be included in the JSON request body for API calls
              </p>
              
              <div className="space-y-4">
                {requestParameters.map((param) => (
                  <div key={param.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-quark-grey font-inter">{param.displayName}</h4>
                      <button
                        onClick={() => handleRemoveParameter(param.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">Variable Name (JSON key)</label>
                        <input
                          type="text"
                          value={param.variableName}
                          onChange={(e) => handleUpdateParameter(param.id, 'variableName', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                          placeholder="variable_name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">Display Name</label>
                        <input
                          type="text"
                          value={param.displayName}
                          onChange={(e) => handleUpdateParameter(param.id, 'displayName', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                          placeholder="Display Name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">Data Type</label>
                        <select
                          value={param.dataType}
                          onChange={(e) => handleUpdateParameter(param.id, 'dataType', e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="email">Email</option>
                          <option value="url">URL</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-slate-100 rounded text-xs text-slate-600 font-inter">
                      JSON: <code>"{param.variableName}": "{param.dataType === 'number' ? '123' : param.dataType === 'boolean' ? 'true' : 'value'}"</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Configurations */}
            <div className="space-y-6">
              {configurations.filter(config => config.name !== 'Quick Reference List' && config.name !== 'Request Body Parameters').map((config) => (
                <div key={config.id} className="border-b border-slate-200 pb-6 last:border-b-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-quark-grey font-inter">{config.name}</h3>
                    <button className="p-2 hover:bg-slate-100 rounded-lg">
                      <Edit className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">Value</label>
                      <input
                        type="text"
                        value={config.value}
                        onChange={(e) => {
                          const newConfigs = configurations.map(c => 
                            c.id === config.id ? { ...c, value: e.target.value } : c
                          )
                          setConfigurations(newConfigs)
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">Display Value</label>
                      <input
                        type="text"
                        value={config.displayValue}
                        onChange={(e) => {
                          const newConfigs = configurations.map(c => 
                            c.id === config.id ? { ...c, displayValue: e.target.value } : c
                          )
                          setConfigurations(newConfigs)
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveVariables}
                className="flex items-center space-x-2 px-6 py-3 bg-quark-blue text-white rounded-lg hover:bg-quark-purple transition-colors font-inter"
              >
                <Save className="h-4 w-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
  )
} 