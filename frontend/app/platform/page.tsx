'use client'

import { 
  Users, 
  Building2, 
  CreditCard, 
  Eye, 
  Loader2,
  Shield,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useBusinessRiskAssessments } from '../../hooks/useAPI'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../components/AuthProvider'

export default function PlatformPage() {
  const router = useRouter()
  const { userProfile } = useAuth()
  const { assessments, loading: assessmentsLoading, error: assessmentsError, refreshAssessments } = useBusinessRiskAssessments()

  const services = [
    {
      title: 'Customer Fraud Prevention',
      description: 'Protect your D2C business from fraudulent customers, fake returns, and suspicious behavior patterns',
      icon: Users,
      status: 'Coming Soon',
      features: [
        'Real-time fraud detection',
        'Behavioral pattern analysis',
        'Account takeover prevention',
        'Synthetic identity detection'
      ],
      href: '/platform/customer-risk'
    },
    {
      title: 'Business Risk Assessment',
      description: 'Comprehensive risk evaluation for partners, vendors, and business relationships',
      icon: Building2,
      status: 'Available',
      features: [
        'Website risk scoring',
        'Compliance assessment',
        'Geopolitical risk analysis',
        'Security vulnerability scanning'
      ],
      href: '/platform/business-risk'
    },
    {
      title: 'Lending Risk Analysis',
      description: 'Advanced creditworthiness evaluation and lending protection for financial products',
      icon: CreditCard,
      status: 'Coming Soon',
      features: [
        'Credit risk assessment',
        'Income verification',
        'Default probability modeling',
        'Portfolio risk analysis'
      ],
      href: '/platform/lending-risk'
    }
  ]

  const handleServiceClick = (service: typeof services[0]) => {
    router.push(service.href)
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-quark-grey mb-3 font-inter">QuarkfinAI Platform</h1>
        <p className="text-slate-600 text-xl font-inter max-w-3xl mx-auto">
          Protect Commerce, Enable Growth - AI-powered fraud prevention for D2C brands
        </p>
        
        {/* Welcome Message */}
        {userProfile && (
          <div className="mt-6 bg-quark-blue bg-opacity-10 rounded-lg p-4 inline-block">
            <p className="text-quark-blue font-medium font-inter">
              Welcome back, {userProfile.full_name || userProfile.email}! 
              {userProfile.credits && (
                <span className="ml-2">
                  You have {userProfile.credits.available_credits} credits available.
                </span>
              )}
            </p>
          </div>
        )}
      </div>

    {/* Services Overview */}
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-quark-grey mb-8 text-center font-inter">AI-Powered Risk Prevention Services</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {services.map((service, index) => {
          const Icon = service.icon
          const isAvailable = service.status === 'Available'
          
          return (
            <div 
              key={index} 
              className="modern-card p-8 hover:card-shadow-xl transition-all cursor-pointer group"
              onClick={() => handleServiceClick(service)}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-quark-light-blue bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-quark-blue" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium font-inter ${
                  isAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {service.status}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold text-quark-grey mb-3 font-inter group-hover:text-quark-blue transition-colors">{service.title}</h3>
              <p className="text-slate-600 mb-4 font-inter">{service.description}</p>
              
              <ul className="space-y-2">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-slate-600 font-inter">
                    <div className="w-1.5 h-1.5 bg-quark-blue rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button 
                className={`w-full mt-6 py-3 px-4 rounded-lg font-medium font-inter transition-colors ${
                  isAvailable
                    ? 'bg-quark-blue text-white hover:bg-quark-purple'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                disabled={!isAvailable}
              >
                {isAvailable ? 'Access Service' : 'Coming Soon'}
              </button>
            </div>
          )
        })}
      </div>
    </div>

    {/* Recent Assessments */}
    <div className="modern-card p-8 mt-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-quark-grey font-inter">Recent Risk Assessments</h3>
        <button 
          onClick={() => router.push('/platform/business-risk')}
          className="text-quark-blue hover:text-quark-purple font-medium font-inter"
        >
          View All Assessments
        </button>
      </div>
      
      {assessmentsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-quark-blue animate-spin mr-2" />
          <span className="text-slate-600 font-inter">Loading assessments...</span>
        </div>
      ) : assessmentsError ? (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-red-600 mb-2 font-inter">Failed to load assessments</h4>
          <p className="text-slate-500 mb-4 font-inter">
            {assessmentsError.message || 'Unable to connect to the database. Please try again.'}
          </p>
          <button 
            onClick={refreshAssessments}
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors font-inter inline-flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-600 mb-2 font-inter">No assessments yet</h4>
          <p className="text-slate-500 mb-4 font-inter">Create your first business risk assessment to get started with fraud prevention</p>
          <button 
            onClick={() => router.push('/platform/business-risk')}
            className="bg-quark-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-quark-purple transition-colors font-inter"
          >
            Create First Assessment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.slice(0, 5).map((assessment) => (
            <div 
              key={assessment.id} 
              className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              onClick={() => {
                const reportUrl = `/assessment-report?id=${assessment.id}`
                window.open(reportUrl, '_blank', 'noopener,noreferrer')
              }}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <h4 className="font-medium text-quark-grey font-inter">{assessment.business_name}</h4>
                  <p className="text-sm text-slate-600 font-inter">
                    {assessment.domain} • {(() => {
                      try {
                        const date = new Date(assessment.last_updated)
                        return isNaN(date.getTime()) ? 'Recent' : date.toLocaleDateString()
                      } catch {
                        return 'Recent'
                      }
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-semibold text-quark-grey font-inter">Score: {Math.round(assessment.risk_score)}</div>
                  <div className={`text-sm font-medium font-inter ${
                    assessment.risk_level === 'Low' ? 'text-green-600' :
                    assessment.risk_level === 'Medium' ? 'text-orange-600' : 
                    assessment.risk_level === 'High' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {assessment.risk_level} Risk
                  </div>
                </div>
                <button className="text-quark-blue hover:text-quark-purple">
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  )
}
