'use client'

import { useState } from 'react'
import { ArrowRight, Phone, User, Building2, CheckCircle2, Loader2, Coins } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'

interface OnboardingFlowProps {
  onComplete?: () => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user, setupNewUser, updateProfile } = useAuth()
  const router = useRouter()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form data - pre-fill with user data if available
  const [formData, setFormData] = useState({
    phone: '',
    full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
    company_name: '',
    company_size: '',
    industry: '',
    country: 'US'
  })
  
  // Phone verification
  const [verificationCode, setVerificationCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handlePhoneSubmit = async () => {
    if (!formData.phone || !formData.full_name) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Setup user in backend
      const result = await setupNewUser(formData.phone, formData.full_name)
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // For now, simulate phone verification (in production, you'd integrate with SMS service)
      setCodeSent(true)
      setCurrentStep(2)
    } catch (error) {
      setError('Failed to setup account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSubmit = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      return
    }

    setLoading(true)
    setError('')

    try {
      // In production, verify the code with your SMS service
      // For demo, accept any 6-digit code
      if (verificationCode === '123456' || verificationCode.length === 6) {
        setCurrentStep(3)
      } else {
        setError('Invalid verification code. Use 123456 for demo.')
      }
    } catch (error) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyInfoSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      // Update profile with company information
      const result = await updateProfile({
        company_name: formData.company_name,
        company_size: formData.company_size,
        industry: formData.industry,
        country: formData.country,
        phone_verified: true,
        onboarding_completed: true
      })

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setCurrentStep(4)
      
      // Complete onboarding after a brief delay
      setTimeout(() => {
        if (onComplete) {
          onComplete()
        } else {
          router.push('/platform')
        }
      }, 2000)
    } catch (error) {
      setError('Failed to save company information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const companyOptions = [
    'startup',
    'small',
    'medium',
    'enterprise'
  ]

  const industryOptions = [
    'Technology',
    'Healthcare',
    'Financial Services',
    'Retail',
    'Manufacturing',
    'Education',
    'Real Estate',
    'Other'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-quark-blue to-quark-purple flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-quark-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-quark-blue" />
          </div>
          <h1 className="text-2xl font-bold text-quark-grey font-inter">Welcome to QuarkfinAI</h1>
          <p className="text-slate-600 font-inter mt-2">Let's set up your account</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-quark-blue text-white' 
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {currentStep > step ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div className={`w-8 h-0.5 ${
                    currentStep > step ? 'bg-quark-blue' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Phone & Name */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-quark-grey mb-4 font-inter">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => updateFormData('full_name', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                    placeholder="+1 (555) 123-4567"
                  />
                  <p className="text-xs text-slate-500 mt-1 font-inter">
                    We'll send a verification code to this number
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-inter">{error}</p>
              </div>
            )}

            <button
              onClick={handlePhoneSubmit}
              disabled={loading}
              className="w-full bg-quark-blue text-white py-3 px-4 rounded-lg font-semibold hover:bg-quark-purple transition-colors flex items-center justify-center space-x-2 font-inter"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Phone Verification */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-quark-grey mb-4 font-inter">Verify Phone Number</h2>
              
              <div className="text-center mb-6">
                <Phone className="h-12 w-12 text-quark-blue mx-auto mb-3" />
                <p className="text-sm text-slate-600 font-inter">
                  We've sent a verification code to
                </p>
                <p className="text-sm font-semibold text-slate-800 font-inter">
                  {formData.phone}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter text-center text-lg tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                />
                <p className="text-xs text-slate-500 mt-1 font-inter text-center">
                  Enter the 6-digit code sent to your phone (Use 123456 for demo)
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-inter">{error}</p>
              </div>
            )}

            <button
              onClick={handleVerificationSubmit}
              disabled={loading}
              className="w-full bg-quark-blue text-white py-3 px-4 rounded-lg font-semibold hover:bg-quark-purple transition-colors flex items-center justify-center space-x-2 font-inter"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Verify</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Company Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-quark-grey mb-4 font-inter">Company Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                    Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => updateFormData('company_name', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                    placeholder="Your company name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                    Company Size
                  </label>
                  <select
                    value={formData.company_size}
                    onChange={(e) => updateFormData('company_size', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                  >
                    <option value="">Select company size</option>
                    {companyOptions.map(option => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => updateFormData('industry', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                  >
                    <option value="">Select industry</option>
                    {industryOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-inter">{error}</p>
              </div>
            )}

            <button
              onClick={handleCompanyInfoSubmit}
              disabled={loading}
              className="w-full bg-quark-blue text-white py-3 px-4 rounded-lg font-semibold hover:bg-quark-purple transition-colors flex items-center justify-center space-x-2 font-inter"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Complete Setup</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 4 && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-quark-grey mb-2 font-inter">Welcome aboard!</h2>
              <p className="text-slate-600 font-inter">
                Your account is set up and ready to use. You've received 500 free credits to get started.
              </p>
            </div>

            <div className="bg-quark-blue bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <Coins className="h-5 w-5 text-quark-blue" />
                <span className="text-lg font-bold text-quark-blue font-inter">500 Free Credits</span>
              </div>
              <p className="text-sm text-slate-600 font-inter mt-1">
                Start creating risk assessments right away
              </p>
            </div>

            <p className="text-xs text-slate-500 font-inter">
              Redirecting to platform...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
