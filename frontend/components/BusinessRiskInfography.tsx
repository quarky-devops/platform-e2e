'use client'

import { useState, useEffect } from 'react'
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
  X
} from 'lucide-react'
import NewAssessmentForm from './NewAssessmentForm'

interface BusinessRiskInfographyProps {
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

export default function BusinessRiskInfography({ onStartAssessment }: BusinessRiskInfographyProps) {
  const [activeTab, setActiveTab] = useState<'assessments' | 'customizations'>('assessments')
  const [salesforceId, setSalesforceId] = useState('')
  const [billingCountryCode, setBillingCountryCode] = useState('US')
  const [quickReferenceLink, setQuickReferenceLink] = useState('https://docs.adyen.com/development-resources/restricted-and-prohibited-items')
  const [showSettings, setShowSettings] = useState(false)
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showNewAssessmentForm, setShowNewAssessmentForm] = useState(false)
  const [showAddQuickReference, setShowAddQuickReference] = useState(false)

  // Mock data for assessments
  const [assessments, setAssessments] = useState<Assessment[]>([
    {
      id: '1',
      domain: 'verticacp.com',
      legalName: 'Vertica Capital Partners',
      riskCategory: 'Medium',
      score: 39,
      status: 'Completed',
      createdAt: '2025-01-23'
    },
    {
      id: '2',
      domain: 'chargebee.com',
      legalName: 'Chargebee Inc',
      riskCategory: 'Low',
      score: 15,
      status: 'Completed',
      createdAt: '2025-01-22'
    },
    {
      id: '3',
      domain: 'stripe.com',
      legalName: 'Stripe Inc',
      riskCategory: 'Low',
      score: 8,
      status: 'Completed',
      createdAt: '2025-01-21'
    }
  ])

  // Mock data for configurations
  const [configurations, setConfigurations] = useState<Configuration[]>([
    {
      id: '1',
      name: 'Quick Reference List',
      value: 'https://docs.adyen.com/development-resources/restricted-and-prohibited-items',
      displayValue: 'Adyen Prohibited Items'
    },
    {
      id: '2',
      name: 'Request Body Parameters',
      value: '',
      displayValue: 'Enter optional request parameters'
    },
    {
      id: '3',
      name: 'Default Billing Country',
      value: 'US',
      displayValue: 'United States'
    }
  ])

  // Load saved variables on component mount
  useEffect(() => {
    const savedSalesforceId = localStorage.getItem('business-risk-salesforce-id')
    const savedBillingCountry = localStorage.getItem('business-risk-billing-country')
    const savedQuickReferenceLink = localStorage.getItem('business-risk-quick-reference-link')
    
    if (savedSalesforceId) setSalesforceId(savedSalesforceId)
    if (savedBillingCountry) setBillingCountryCode(savedBillingCountry)
    if (savedQuickReferenceLink) setQuickReferenceLink(savedQuickReferenceLink)
  }, [])

  const handleSaveVariables = () => {
    localStorage.setItem('business-risk-salesforce-id', salesforceId)
    localStorage.setItem('business-risk-billing-country', billingCountryCode)
    localStorage.setItem('business-risk-quick-reference-link', quickReferenceLink)
    alert('Variables saved successfully!')
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

  const handleDeleteSelected = () => {
    if (selectedAssessments.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedAssessments.length} assessment(s)?`)) {
      setAssessments(prev => prev.filter(a => !selectedAssessments.includes(a.id)))
      setSelectedAssessments([])
    }
  }

  const handleDownloadPDF = (assessment: Assessment) => {
    // Mock PDF download
    alert(`Downloading PDF for ${assessment.domain}`)
  }

  const handleViewAssessment = (assessment: Assessment) => {
    // Mock view assessment
    alert(`Viewing assessment for ${assessment.domain}`)
  }

  const handleNewAssessment = () => {
    setShowNewAssessmentForm(true)
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
      displayValue: ''
    }
    setConfigurations(prev => [...prev, newQuickReference])
    setShowAddQuickReference(false)
  }

  const handleRemoveConfiguration = (id: string) => {
    if (configurations.length > 1) {
      setConfigurations(prev => prev.filter(config => config.id !== id))
    }
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

    return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-quark-grey mb-6 font-inter">Business Risk Prevention</h1>
        
        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
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
              Customizations
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
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
                onClick={handleNewAssessment}
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
                  onClick={() => setShowAddQuickReference(true)}
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

            {/* Other Configurations */}
            <div className="space-y-6">
              {configurations.filter(config => config.name !== 'Quick Reference List').map((config) => (
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

      {/* Add Quick Reference Modal */}
      {showAddQuickReference && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-quark-grey font-inter">Add Quick Reference</h2>
              <button
                onClick={() => setShowAddQuickReference(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4 font-inter">
              Update the link list which you want to have reference for manual check from the tool
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/reference"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">Display Name</label>
                <input
                  type="text"
                  placeholder="Reference Name"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowAddQuickReference(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-inter"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuickReference}
                className="px-4 py-2 bg-quark-blue text-white rounded-lg hover:bg-quark-purple transition-all font-inter"
              >
                Add Reference
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Assessment Form Modal */}
      {showNewAssessmentForm && (
        <NewAssessmentForm
          onClose={() => setShowNewAssessmentForm(false)}
          onAssessmentCreated={handleAssessmentCreated}
        />
      )}
    </div>
  )
} 