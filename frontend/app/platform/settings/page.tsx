'use client'

import { useState, useEffect } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Edit,
  Shield,
  Bell,
  CreditCard,
  Trash2,
  Settings,
  Monitor,
  Sun,
  Moon,
  Globe
} from 'lucide-react'
import { useAuth } from '../../../components/AuthProvider'
import { auth } from '../../../lib/supabase'

export default function ProfileSettingsPage() {
  const { userProfile, updateProfile, refreshUserProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'platform' | 'security' | 'notifications' | 'billing'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')

  // Platform settings state
  const [platformSettings, setPlatformSettings] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'auto',
    notifications: true,
    autoSave: true
  })

  // Phone input state
  const [phoneInput, setPhoneInput] = useState({
    countryCode: '+91',
    number: ''
  })

  // Form data
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    company_size: '',
    industry: '',
    country: ''
  })

  // Load user profile data and platform settings
  useEffect(() => {
    if (userProfile) {
      // Parse existing phone number if it exists
      let countryCode = '+91'
      let number = ''
      
      if (userProfile.phone) {
        // Try to extract country code and number
        const phoneMatch = userProfile.phone.match(/^(\+\d{1,4})(\d+)$/)
        if (phoneMatch) {
          countryCode = phoneMatch[1]
          number = phoneMatch[2]
        } else {
          // If no country code, assume it's just the number
          number = userProfile.phone.replace(/^\+/, '')
        }
      }
      
      setPhoneInput({ countryCode, number })
      
      setFormData({
        full_name: userProfile.full_name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        company_name: userProfile.company_name || '',
        company_size: userProfile.company_size || '',
        industry: userProfile.industry || '',
        country: userProfile.country || ''
      })
    }

    // Load platform settings from localStorage
    const savedPlatformSettings = localStorage.getItem('platform-settings')
    if (savedPlatformSettings) {
      try {
        const parsedSettings = JSON.parse(savedPlatformSettings)
        setPlatformSettings(parsedSettings)
      } catch (error) {
        console.error('Error parsing platform settings:', error)
      }
    }
  }, [userProfile])

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await updateProfile(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Profile updated successfully!')
        setIsEditing(false)
        await refreshUserProfile()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneVerification = async () => {
    if (!phoneInput.number || phoneInput.number.length < 10) {
      setError('Please enter a valid phone number (min 10 digits)')
      return
    }

    setPhoneVerificationLoading(true)
    setError('')

    try {
      // Combine country code and number for Supabase
      const fullPhoneNumber = phoneInput.countryCode + phoneInput.number
      
      console.log('Sending OTP to:', fullPhoneNumber)

      // Send OTP via Supabase
      await auth.sendPhoneOTP(fullPhoneNumber)
      setShowPhoneVerification(true)
      
      // Show appropriate success message
      if (phoneInput.countryCode === '+91' && phoneInput.number === '1234567890') {
        setSuccess('Test mode: Verification code sent! Use OTP: 123456')
      } else {
        setSuccess(`Verification code sent to ${fullPhoneNumber}!`)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send verification code')
      console.error('Phone verification error:', error)
    } finally {
      setPhoneVerificationLoading(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      return
    }

    setPhoneVerificationLoading(true)
    setError('')

    try {
      // Use the combined phone number for verification
      const fullPhoneNumber = phoneInput.countryCode + phoneInput.number
      
      console.log('Verifying OTP for:', fullPhoneNumber, 'with code:', verificationCode)

      // Verify OTP with Supabase
      await auth.verifyPhoneOTP(fullPhoneNumber, verificationCode)
      
      // Update profile to mark phone as verified
      await updateProfile({
        phone: fullPhoneNumber, // Store the full international format
        phone_verified: true
      })

      await refreshUserProfile()
      setShowPhoneVerification(false)
      setVerificationCode('')
      setSuccess('Phone number verified successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message || 'Verification failed. Please check your code and try again.')
      console.error('OTP verification error:', error)
    } finally {
      setPhoneVerificationLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
    setSuccess('')
  }

  // Helper to check if profile is complete
  const isProfileComplete = () => {
    const requiredFields = [
      formData.full_name,
      formData.phone,
      formData.company_name,
      formData.company_size,
      formData.industry,
      formData.country
    ]
    
    // Check if all required fields are filled and phone is verified
    return requiredFields.every(field => field && field.trim() !== '') && 
           isPhoneVerified && 
           !hasPlaceholderPhone
  }

  // Check if user has placeholder phone
  const hasPlaceholderPhone = !userProfile?.phone || userProfile.phone === '' || userProfile.phone?.startsWith('+1000')
  const isPhoneVerified = userProfile?.phone_verified && userProfile?.phone && !userProfile.phone.startsWith('+1000')

  const companyOptions = ['startup', 'small', 'medium', 'enterprise']
  const industryOptions = ['Technology', 'Healthcare', 'Financial Services', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Transportation', 'Energy', 'Media', 'Telecommunications', 'Agriculture', 'Construction', 'Professional Services', 'Government', 'Non-profit', 'Other']
  const countries = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'BE', 'IE', 'LU', 'SG', 'HK', 'JP', 'KR', 'NZ', 'IN']

  // Country codes for phone verification
  const countryCodes = [
    { code: '+1', country: 'US', name: 'United States' },
    { code: '+1', country: 'CA', name: 'Canada' },
    { code: '+44', country: 'GB', name: 'United Kingdom' },
    { code: '+61', country: 'AU', name: 'Australia' },
    { code: '+49', country: 'DE', name: 'Germany' },
    { code: '+33', country: 'FR', name: 'France' },
    { code: '+31', country: 'NL', name: 'Netherlands' },
    { code: '+46', country: 'SE', name: 'Sweden' },
    { code: '+47', country: 'NO', name: 'Norway' },
    { code: '+45', country: 'DK', name: 'Denmark' },
    { code: '+358', country: 'FI', name: 'Finland' },
    { code: '+41', country: 'CH', name: 'Switzerland' },
    { code: '+43', country: 'AT', name: 'Austria' },
    { code: '+32', country: 'BE', name: 'Belgium' },
    { code: '+353', country: 'IE', name: 'Ireland' },
    { code: '+352', country: 'LU', name: 'Luxembourg' },
    { code: '+65', country: 'SG', name: 'Singapore' },
    { code: '+852', country: 'HK', name: 'Hong Kong' },
    { code: '+81', country: 'JP', name: 'Japan' },
    { code: '+82', country: 'KR', name: 'South Korea' },
    { code: '+64', country: 'NZ', name: 'New Zealand' },
    { code: '+91', country: 'IN', name: 'India' },
    { code: '+91', country: 'TEST', name: 'Test (India)' }
  ]

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-quark-blue" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-quark-grey mb-2 font-inter">Settings</h1>
        <p className="text-slate-600 font-inter">Manage your account settings and preferences</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-sm text-green-700 font-inter">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-700 font-inter">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
              activeTab === 'profile'
                ? 'border-quark-blue text-quark-blue'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('platform')}
            className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
              activeTab === 'platform'
                ? 'border-quark-blue text-quark-blue'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Platform
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
              activeTab === 'security'
                ? 'border-quark-blue text-quark-blue'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Security
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
              activeTab === 'notifications'
                ? 'border-quark-blue text-quark-blue'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Bell className="h-4 w-4 inline mr-2" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm font-inter ${
              activeTab === 'billing'
                ? 'border-quark-blue text-quark-blue'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <CreditCard className="h-4 w-4 inline mr-2" />
            Billing
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          {/* Profile Section */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-quark-grey font-inter">Profile Information</h2>
                <p className="text-sm text-slate-600 font-inter mt-1">
                  Update your personal and company information
                </p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-inter"
              >
                <Edit className="h-4 w-4" />
                <span>{isEditing ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => updateFormData('full_name', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter ${
                    !isEditing ? 'bg-slate-50 text-slate-600' : ''
                  }`}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    disabled={true}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 font-inter"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-inter">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Phone Number with Country Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                  Phone Number *
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    {/* Country Code Selector */}
                    <select
                      value={phoneInput.countryCode}
                      onChange={(e) => {
                        const newCountryCode = e.target.value
                        setPhoneInput(prev => ({ ...prev, countryCode: newCountryCode }))
                        const fullPhone = newCountryCode + phoneInput.number
                        updateFormData('phone', fullPhone)
                      }}
                      disabled={!isEditing}
                      className={`px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter ${
                        !isEditing ? 'bg-slate-50 text-slate-600' : ''
                      }`}
                      style={{ minWidth: '120px' }}
                    >
                      {countryCodes.map((country, index) => (
                        <option key={index} value={country.code}>
                          {country.code} {country.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* Phone Number Input */}
                    <div className="flex-1 relative">
                      <input
                        type="tel"
                        value={phoneInput.number}
                        onChange={(e) => {
                          const newNumber = e.target.value.replace(/\D/g, '')
                          setPhoneInput(prev => ({ ...prev, number: newNumber }))
                          const fullPhone = phoneInput.countryCode + newNumber
                          updateFormData('phone', fullPhone)
                        }}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter ${
                          !isEditing ? 'bg-slate-50 text-slate-600' : ''
                        }`}
                        placeholder="1234567890 (for testing)"
                        maxLength={15}
                      />
                      {isPhoneVerified && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Phone Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {isPhoneVerified ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600 font-inter">Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span className="text-sm text-amber-600 font-inter">Not verified</span>
                        </>
                      )}
                    </div>
                    
                    {isEditing && !isPhoneVerified && phoneInput.number && (
                      <button
                        onClick={handlePhoneVerification}
                        disabled={phoneVerificationLoading}
                        className="text-sm text-quark-blue hover:text-quark-purple font-inter flex items-center space-x-1"
                      >
                        {phoneVerificationLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Verify Phone'
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Helper Text */}
                  <div className="text-xs text-slate-500 font-inter">
                    {phoneInput.countryCode === '+91' && phoneInput.number === '1234567890' ? (
                      userProfile?.email === 'bidya271@gmail.com' ? (
                        <span className="text-blue-600">📱 Test number authorized - Use OTP: 123456</span>
                      ) : (
                        <span className="text-red-600">⚠️ Test number not authorized for this account</span>
                      )
                    ) : (
                      <span>Select country code and enter your phone number</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => updateFormData('company_name', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter ${
                    !isEditing ? 'bg-slate-50 text-slate-600' : ''
                  }`}
                  placeholder="Your company name"
                />
              </div>

              {/* Company Size */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                  Company Size
                </label>
                <select
                  value={formData.company_size}
                  onChange={(e) => updateFormData('company_size', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter ${
                    !isEditing ? 'bg-slate-50 text-slate-600' : ''
                  }`}
                >
                  <option value="">Select company size</option>
                  {companyOptions.map(option => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                  Industry
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => updateFormData('industry', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter ${
                    !isEditing ? 'bg-slate-50 text-slate-600' : ''
                  }`}
                >
                  <option value="">Select industry</option>
                  {industryOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => updateFormData('country', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter ${
                    !isEditing ? 'bg-slate-50 text-slate-600' : ''
                  }`}
                >
                  <option value="">Select country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-inter"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-quark-blue text-white px-6 py-2 rounded-lg hover:bg-quark-purple transition-colors font-inter flex items-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platform Settings Tab */}
      {activeTab === 'platform' && (
        <div className="space-y-8">
          {/* Display Settings */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-quark-grey font-inter mb-4">Display Settings</h2>
            
            <div className="space-y-6">
              {/* Theme Setting */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-slate-900 font-inter">Theme</h3>
                    <p className="text-sm text-slate-600 font-inter">Choose your preferred interface theme</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPlatformSettings(prev => ({ ...prev, theme: 'light' }))}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                      platformSettings.theme === 'light'
                        ? 'bg-quark-blue text-white border-quark-blue'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    <span className="text-sm font-inter">Light</span>
                  </button>
                  <button
                    onClick={() => setPlatformSettings(prev => ({ ...prev, theme: 'dark' }))}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                      platformSettings.theme === 'dark'
                        ? 'bg-quark-blue text-white border-quark-blue'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    <span className="text-sm font-inter">Dark</span>
                  </button>
                </div>
              </div>

              {/* Language Setting */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-slate-900 font-inter">Language</h3>
                    <p className="text-sm text-slate-600 font-inter">Select your preferred language</p>
                  </div>
                </div>
                <select
                  value={platformSettings.language}
                  onChange={(e) => setPlatformSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                </select>
              </div>

              {/* Timezone Setting */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-slate-900 font-inter">Timezone</h3>
                    <p className="text-sm text-slate-600 font-inter">Set your timezone for accurate timestamps</p>
                  </div>
                </div>
                <select
                  value={platformSettings.timezone}
                  onChange={(e) => setPlatformSettings(prev => ({ ...prev, timezone: e.target.value }))}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter"
                >
                  <option value="auto">Auto-detect</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (US)</option>
                  <option value="America/Chicago">Central Time (US)</option>
                  <option value="America/Denver">Mountain Time (US)</option>
                  <option value="America/Los_Angeles">Pacific Time (US)</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Shanghai">Shanghai</option>
                  <option value="Asia/Kolkata">Mumbai</option>
                </select>
              </div>
            </div>
          </div>

          {/* Application Settings */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-quark-grey font-inter mb-4">Application Settings</h2>
            
            <div className="space-y-4">
              {/* Auto-save Setting */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-slate-900 font-inter">Auto-save</h3>
                  <p className="text-sm text-slate-600 font-inter">Automatically save your work as you type</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={platformSettings.autoSave}
                  onChange={(e) => setPlatformSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
                  className="rounded border-slate-300 text-quark-blue focus:ring-quark-blue" 
                />
              </div>

              {/* Desktop Notifications */}
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-slate-900 font-inter">Desktop Notifications</h3>
                  <p className="text-sm text-slate-600 font-inter">Show browser notifications for important updates</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={platformSettings.notifications}
                  onChange={(e) => setPlatformSettings(prev => ({ ...prev, notifications: e.target.checked }))}
                  className="rounded border-slate-300 text-quark-blue focus:ring-quark-blue" 
                />
              </div>

              {/* Save Platform Settings Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => {
                    localStorage.setItem('platform-settings', JSON.stringify(platformSettings))
                    setSuccess('Platform settings saved successfully!')
                    setTimeout(() => setSuccess(''), 3000)
                  }}
                  className="bg-quark-blue text-white px-6 py-2 rounded-lg hover:bg-quark-purple transition-colors font-inter flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security, Notifications, and Billing tabs remain the same... */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-quark-grey font-inter mb-4">Security Settings</h2>
          <p className="text-slate-600 font-inter mb-6">Manage your account security and authentication preferences</p>
          
          <div className="space-y-6">
            <div className="p-4 border border-slate-200 rounded-lg">
              <h3 className="font-medium text-slate-900 font-inter mb-2">Password</h3>
              <p className="text-sm text-slate-600 font-inter mb-4">You're signed in with Google. To change your password, please use Google's account settings.</p>
              <button className="text-sm text-quark-blue hover:text-quark-purple font-inter">Manage Google Account →</button>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <h3 className="font-medium text-slate-900 font-inter mb-2">Two-Factor Authentication</h3>
              <p className="text-sm text-slate-600 font-inter mb-4">Phone verification serves as an additional security layer for your account.</p>
              <div className="flex items-center space-x-2">
                {isPhoneVerified ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-inter">Phone-based 2FA enabled</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-600 font-inter">Phone verification required</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-quark-grey font-inter mb-4">Notification Preferences</h2>
          <p className="text-slate-600 font-inter mb-6">Choose how you want to be notified about account activity and updates</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div>
                <h3 className="font-medium text-slate-900 font-inter">Assessment Completed</h3>
                <p className="text-sm text-slate-600 font-inter">Get notified when risk assessments finish</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-quark-blue focus:ring-quark-blue" />
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div>
                <h3 className="font-medium text-slate-900 font-inter">Low Credit Balance</h3>
                <p className="text-sm text-slate-600 font-inter">Alert when credits are running low</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-quark-blue focus:ring-quark-blue" />
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div>
                <h3 className="font-medium text-slate-900 font-inter">Security Alerts</h3>
                <p className="text-sm text-slate-600 font-inter">Important security and login notifications</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-quark-blue focus:ring-quark-blue" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-quark-grey font-inter mb-4">Billing & Subscription</h2>
          <p className="text-slate-600 font-inter mb-6">Manage your subscription plan and billing information</p>
          
          <div className="space-y-6">
            <div className="p-4 border border-slate-200 rounded-lg">
              <h3 className="font-medium text-slate-900 font-inter mb-2">Current Plan</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-inter">{userProfile.current_plan?.plan_name || 'Free'} Plan</p>
                  <p className="text-xs text-slate-500 font-inter">{userProfile.current_plan?.monthly_credits || 500} credits per month</p>
                </div>
                <button className="text-sm text-quark-blue hover:text-quark-purple font-inter">Upgrade Plan</button>
              </div>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg">
              <h3 className="font-medium text-slate-900 font-inter mb-2">Credit Balance</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-inter">{userProfile.credits?.available_credits || 0} credits remaining</p>
                  <p className="text-xs text-slate-500 font-inter">{userProfile.credits?.used_credits || 0} credits used this month</p>
                </div>
                <button className="text-sm text-quark-blue hover:text-quark-purple font-inter">Buy Credits</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Verification Modal */}
      {showPhoneVerification && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowPhoneVerification(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="px-6 py-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-quark-blue bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                    <Phone className="h-5 w-5 text-quark-blue" />
                  </div>
                  <h3 className="text-lg font-semibold text-quark-grey font-inter">Verify Phone Number</h3>
                </div>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-sm text-slate-600 font-inter">We've sent a verification code via SMS to</p>
                    <p className="text-sm font-semibold text-slate-800 font-inter">{phoneInput.countryCode} {phoneInput.number}</p>
                    {phoneInput.countryCode === '+91' && phoneInput.number === '1234567890' && userProfile?.email === 'bidya271@gmail.com' && (
                      <p className="text-xs text-blue-600 font-inter mt-2">📱 Test mode authorized - Use OTP: 123456</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 font-inter">Verification Code</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-quark-blue focus:border-transparent font-inter text-center text-lg tracking-widest"
                      placeholder="123456"
                      maxLength={6}
                    />
                    <p className="text-xs text-slate-500 mt-1 font-inter text-center">Enter the 6-digit code sent via SMS</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowPhoneVerification(false)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-inter"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVerifyPhone}
                      disabled={phoneVerificationLoading}
                      className="flex-1 bg-quark-blue text-white px-4 py-2 rounded-lg hover:bg-quark-purple transition-colors font-inter flex items-center justify-center"
                    >
                      {phoneVerificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Phone'}
                    </button>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={handlePhoneVerification}
                      disabled={phoneVerificationLoading}
                      className="text-sm text-quark-blue hover:text-quark-purple font-inter"
                    >
                      Didn't receive the code? Send again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
